/**
 * hdrjpg-js
 *
 * Shows HDRJPG embeds in HDR in browsers that can play an HDR video but cannot show an HDR image.
 * An embed is the markup HDRJPG gives you: a <div class="hdrjpg" data-mp4-src="..."> around a <picture>
 * whose <img> is a gain map JPEG. Browsers that show gain map JPEGs in HDR keep the picture untouched;
 * in the others, on an HDR screen, the picture is replaced by the silent HDR MP4 of the same photo.
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

    video.src = element.dataset.mp4Src;
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
