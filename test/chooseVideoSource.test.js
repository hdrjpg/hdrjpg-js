import {test} from 'node:test';
import assert from 'node:assert/strict';
import {chooseVideoSource, fallbackVideoSource, HEVC_VIDEO_TYPE} from '../src/hdrjpg.js';

const playsHevc = (type) => (type === HEVC_VIDEO_TYPE ? 'maybe' : '');
const playsNoHevc = () => '';

test('the HEVC video is played where the browser plays HEVC Main 10', () => {
    assert.equal(chooseVideoSource({mp4Src: 'photo.mp4', mp4HevcSrc: 'photo.hevc.mp4'}, playsHevc), 'photo.hevc.mp4');
});

test('the H.264 video is played where the browser does not play HEVC', () => {
    assert.equal(chooseVideoSource({mp4Src: 'photo.mp4', mp4HevcSrc: 'photo.hevc.mp4'}, playsNoHevc), 'photo.mp4');
});

test('embeds without an HEVC video keep playing the H.264 one', () => {
    assert.equal(chooseVideoSource({mp4Src: 'photo.mp4'}, playsHevc), 'photo.mp4');
});

test('when the HEVC video fails, the H.264 one is tried', () => {
    assert.equal(fallbackVideoSource({mp4Src: 'photo.mp4', mp4HevcSrc: 'photo.hevc.mp4'}, 'photo.hevc.mp4'), 'photo.mp4');
});

test('when the H.264 video fails, nothing else is tried and the picture comes back', () => {
    assert.equal(fallbackVideoSource({mp4Src: 'photo.mp4', mp4HevcSrc: 'photo.hevc.mp4'}, 'photo.mp4'), undefined);
    assert.equal(fallbackVideoSource({mp4Src: 'photo.mp4'}, 'photo.mp4'), undefined);
});

test('an embed whose two sources are the same file does not loop', () => {
    assert.equal(fallbackVideoSource({mp4Src: 'photo.mp4', mp4HevcSrc: 'photo.mp4'}, 'photo.mp4'), undefined);
});
