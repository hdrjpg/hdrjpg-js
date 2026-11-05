# hdrjpg-js

Shows HDR photos converted with [HDRJPG](https://hdrjpg.com) in HDR in every current browser.

An HDRJPG embed is a gain map JPEG inside a `<picture>`, with silent HDR MP4 videos of the same photo next to it.
Chrome, Edge and the other Chromium browsers show the gain map JPEG in HDR, and so does every browser on
iOS 26 and iPadOS 26. Firefox and Safari on a Mac show its standard version instead. This script finds those
browsers and, on an HDR screen, plays the HDR MP4 in place of the picture. Everywhere else it leaves the page alone.

The video comes in two codecs. The script plays the 10-bit HEVC one where the browser can play HEVC, and the H.264
one everywhere else.

| Browser | What the visitor sees |
|---|---|
| Chrome, Edge and the other Chromium browsers | The gain map JPEG, in HDR |
| Any browser on iOS 26 or iPadOS 26 | The gain map JPEG, in HDR |
| Safari on a Mac | The HDR MP4 (Safari shows HDR images only on macOS 26, and its user agent does not say which macOS it runs on) |
| Firefox | The HDR MP4 (Firefox shows no image format in HDR; it plays HDR video on macOS and Windows) |
| Any browser on iOS or iPadOS before 26 | The HDR MP4 |
| Any browser on a standard screen | The gain map JPEG's standard version |

## The markup

Convert your photo with the HDRJPG API or at [hdrjpg.com](https://hdrjpg.com), then embed it like this:

```html
<div class="hdrjpg" data-mp4-src="photo.mp4" data-mp4-hevc-src="photo.hevc.mp4">
    <picture>
        <source srcset="photo.avif" media="all and (min--moz-device-pixel-ratio:0) and (min-resolution: 3e1dpcm) {}" type="image/avif" />
        <img src="photo.jpg" alt="Describe the photo" width="1600" height="1200" loading="lazy" decoding="async" style="image-rendering: -webkit-optimize-contrast;">
    </picture>
</div>
```

`photo.jpg` is the `jpeg-xt` output (a gain map JPEG), `photo.avif` the `avif` output, `photo.mp4` the `mp4` output
(H.264) and `photo.hevc.mp4` the `mp4-hevc` output (10-bit HEVC). The video takes the image's `alt` text (as its
accessible name), its `width`, `height`, `class` and `style`.

The HEVC video keeps smooth gradients, like skies, free of banding, and its colors are closer to the original. Not every
browser plays HEVC, so the script asks the browser first and falls back to `photo.mp4`. If a browser says it plays HEVC
but then fails to, the script switches to `photo.mp4`, and if that fails too, it shows the picture again. `data-mp4-hevc-src` is optional:
without it, the script plays `photo.mp4` as version 1.2.0 did.

## Install

With npm:

```bash
npm install hdrjpg-js
```

```js
import 'hdrjpg-js';
```

Or with a script tag, without a build step:

```html
<script src="https://cdn.jsdelivr.net/npm/hdrjpg-js@1.3.0/dist/hdrjpg.min.js" defer></script>
```

Either way it runs once the page has loaded.

## Embeds added later

If your page adds embeds after it loads, call `apply()` on the new content. Embeds already switched to video are skipped.

```js
import {apply} from 'hdrjpg-js';

apply(container); // or hdrjpg.apply(container) with the script tag
```

`needsVideo(environment)` tells you the decision without changing anything, and `currentEnvironment()` reads it from
the current browser.

## Licence

MIT
