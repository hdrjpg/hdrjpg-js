import {test} from 'node:test';
import assert from 'node:assert/strict';
import {needsVideo} from '../src/hdrjpg.js';

const agents = {
    chromeMac: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36',
    edgeWindows: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0',
    chromeAndroid: 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36',
    firefoxWindows: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:144.0) Gecko/20100101 Firefox/144.0',
    safariMac: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Safari/605.1.15',
    safariIphone: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Mobile/15E148 Safari/604.1',
    chromeIphone: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/141.0.7390.41 Mobile/15E148 Safari/604.1',
    firefoxIphone: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) FxiOS/144.0 Mobile/15E148 Safari/605.1.15',
};

const hdr = (userAgent, extra = {}) => ({userAgent, maxTouchPoints: 0, isHdrScreen: true, isDynamicRangeLimitSupported: false, ...extra});

test('Chromium browsers keep the picture', () => {
    assert.equal(needsVideo(hdr(agents.chromeMac, {isDynamicRangeLimitSupported: true})), false);
    assert.equal(needsVideo(hdr(agents.edgeWindows)), false);
    assert.equal(needsVideo(hdr(agents.chromeAndroid)), false);
});

test('Firefox gets the video', () => {
    assert.equal(needsVideo(hdr(agents.firefoxWindows)), true);
});

test('Safari on a Mac gets the video, whatever its version', () => {
    assert.equal(needsVideo(hdr(agents.safariMac)), true);
    assert.equal(needsVideo(hdr(agents.safariMac, {isDynamicRangeLimitSupported: true})), true);
});

test('iOS 26 keeps the picture in every browser, older iOS gets the video', () => {
    for (const agent of [agents.safariIphone, agents.chromeIphone, agents.firefoxIphone]) {
        assert.equal(needsVideo(hdr(agent, {isDynamicRangeLimitSupported: true})), false);
        assert.equal(needsVideo(hdr(agent, {isDynamicRangeLimitSupported: false})), true);
    }
});

test('an iPad asking for desktop sites is told apart from a Mac', () => {
    assert.equal(needsVideo(hdr(agents.safariMac, {maxTouchPoints: 5, isDynamicRangeLimitSupported: true})), false);
});

test('a standard screen always keeps the picture', () => {
    for (const agent of Object.values(agents)) {
        assert.equal(needsVideo({userAgent: agent, maxTouchPoints: 0, isHdrScreen: false, isDynamicRangeLimitSupported: false}), false);
    }
});
