document.addEventListener('DOMContentLoaded', function() {
    if (
        'MozAppearance' in document.documentElement.style /* Target Firefox */
        ||
        /^((?!chrome|android).)*safari/i.test(navigator.userAgent) /* Target Safari */
    ) {
        document.querySelectorAll('.hdrjpg[data-mp4-src]').forEach((element) => {
            element.querySelector('img').remove();
            let video = document.createElement('video');
            video.src = element.dataset.mp4Src;
            video.muted = true;
            element.appendChild(video);
        });
    }
});
