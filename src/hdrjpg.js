/**
 * hdrjpg-js
 *
 * Shows HDRJPG embeds in HDR in browsers that can play an HDR video but cannot show an HDR image.
 * An embed is the markup HDRJPG gives you: a <div class="hdrjpg" data-mp4-src="..."> around a <picture>
 * whose <img> is a gain map JPEG. Browsers that show gain map JPEGs in HDR keep the picture untouched;
 * in the others, on an HDR screen, the picture is replaced by the silent HDR MP4 of the same photo.
 * With a data-mp4-hevc-src too (the mp4-hevc output), browsers that play 10-bit HEVC get that one instead:
 * smooth gradients, like skies, stay free of banding.
 *
 * https://hdrjpg.com/documentation/embedding
 */

/**
 * Whether a browser needs the MP4 to show the photo in HDR.
 *
 * @param {object} environment
 * @param {string} environment.userAgent navigator.userAgent
 * @param {number} environment.maxTouchPoints navigator.maxTouchPoints, to tell an iPad asking for desktop sites from a Mac
 * @param {boolean} environment.isHdrScreen Whether the screen reports a high dynamic range
 * @param {boolean} environment.isDynamicRangeLimitSupported Whether CSS dynamic-range-limit is supported, which WebKit added in the version that shows HDR images
 * @returns {boolean}
 */
export function needsVideo({userAgent, maxTouchPoints, isHdrScreen, isDynamicRangeLimitSupported}) {
    // On a standard screen the JPEG shows its own standard version, made for that screen; a video gains nothing
    if (!isHdrScreen) {
        return false;
    }

    // Firefox shows no image format in HDR, but plays HDR video
    if (/\bFirefox\//.test(userAgent) && !/\bSeamonkey\//.test(userAgent)) {
        return true;
    }

    // Every browser on iPhone and iPad uses the system's WebKit, and their user agents name Safari, Chrome, Firefox or Edge
    const isIos = /\b(iPhone|iPad|iPod)\b/.test(userAgent) || (/\bMacintosh\b/.test(userAgent) && maxTouchPoints > 1);
    const isWebKitOnly = /\bAppleWebKit\//.test(userAgent) && !/\b(Chrome|Chromium|Edg|OPR|SamsungBrowser)\//.test(userAgent);

    if (isIos) {
        // WebKit ships with the system there, so WebKit 26 means iOS or iPadOS 26, which shows HDR images
        return !isDynamicRangeLimitSupported;
    }

    if (isWebKitOnly) {
        // Safari on a Mac shows HDR images only on macOS 26 or later, and Safari's user agent does not tell the macOS version.
        // Safari 26 also runs on macOS Sequoia and Sonoma, so the video is the one that shows HDR on all of them.
        return true;
    }

    // Chromium browsers show gain map JPEGs in HDR
    return false;
}

/**
 * Reads the current browser's environment for needsVideo().
 *
 * @returns {object}
 */
export function currentEnvironment() {
    return {
        userAgent: navigator.userAgent,
        maxTouchPoints: navigator.maxTouchPoints || 0,
        isHdrScreen: window.matchMedia('(dynamic-range: high)').matches,
        isDynamicRangeLimitSupported: !!(window.CSS && CSS.supports('dynamic-range-limit', 'no-limit')),
    };
}

/**
 * The type of the mp4-hevc output: HEVC Main 10 (profile 2), up to level 5.1, the 4K level phones decode.
 */
export const HEVC_VIDEO_TYPE = 'video/mp4; codecs="hvc1.2.4.L153.B0"';

/**
 * Which video an embed plays: the HEVC one when the embed has it and the browser can play it, else the H.264 one.
 *
 * @param {object} sources
 * @param {string} sources.mp4Src data-mp4-src
 * @param {string} [sources.mp4HevcSrc] data-mp4-hevc-src
 * @param {function(string): string} canPlayType HTMLMediaElement.canPlayType
 * @returns {string|undefined}
 */
export function chooseVideoSource({mp4Src, mp4HevcSrc}, canPlayType) {
    if (mp4HevcSrc && canPlayType(HEVC_VIDEO_TYPE) !== '') {
        return mp4HevcSrc;
    }
    return mp4Src;
}

/**
 * The video to try after the one at failedSrc could not be played: the H.264 one after the HEVC one, and none after
 * the H.264 one (the embed then shows its picture again).
 *
 * @param {object} sources
 * @param {string} sources.mp4Src data-mp4-src
 * @param {string} [sources.mp4HevcSrc] data-mp4-hevc-src
 * @param {string} failedSrc The source that failed, as chooseVideoSource or this function returned it
 * @returns {string|undefined}
 */
export function fallbackVideoSource({mp4Src, mp4HevcSrc}, failedSrc) {
    if (mp4HevcSrc && failedSrc === mp4HevcSrc && mp4Src && mp4Src !== mp4HevcSrc) {
        return mp4Src;
    }
    return undefined;
}

/**
 * Replaces the picture with its HDR video in one embed.
 *
 * @param {HTMLElement} element The .hdrjpg element
 */
export function replaceWithVideo(element) {
    const picture = element.querySelector('picture');
    if (!picture || !element.dataset.mp4Src) {
        return;
    }
    const img = picture.querySelector('img');

    const video = document.createElement('video');
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    video.autoplay = true;
    video.preload = 'auto';
    video.disablePictureInPicture = true;
    video.disableRemotePlayback = true;
    video.setAttribute('muted', '');
    video.setAttribute('playsinline', '');

    if (img) {
        // The video stands in for the image: same description, size and styling
        if (img.alt) {
            video.setAttribute('role', 'img');
            video.setAttribute('aria-label', img.alt);
        }
        for (const attribute of ['width', 'height', 'class', 'style', 'draggable']) {
            if (img.hasAttribute(attribute)) {
                video.setAttribute(attribute, img.getAttribute(attribute));
            }
        }
    }

    // A browser can say it plays HEVC and still fail to decode it (on Windows without an HEVC decoder, for example).
    // The video's error event is the browser's own report of that: try the H.264 video, then give the picture back
    let src = chooseVideoSource(element.dataset, (type) => video.canPlayType(type));
    video.addEventListener('error', () => {
        src = fallbackVideoSource(element.dataset, src);
        if (src) {
            video.src = src;
        } else {
            video.replaceWith(picture);
            element.dataset.hdrjpgVideo = 'failed';
        }
    });
    video.src = src;
    picture.replaceWith(video);
    element.dataset.hdrjpgVideo = '';
}

/**
 * Applies the video fallback to every HDRJPG embed under root that still shows its picture.
 * Call it again after adding embeds to the page; embeds already handled are left alone.
 *
 * @param {ParentNode} root
 * @param {object} environment See needsVideo(); the current browser's by default
 * @returns {number} The number of embeds switched to video
 */
export function apply(root = document, environment = currentEnvironment()) {
    if (!needsVideo(environment)) {
        return 0;
    }
    let count = 0;
    root.querySelectorAll('.hdrjpg[data-mp4-src]:not([data-hdrjpg-video])').forEach((element) => {
        replaceWithVideo(element);
        count++;
    });
    return count;
}

if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => apply());
    } else {
        apply();
    }
}
