import './register-typescript.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
const { getOTPTime, applyTimeSample } = await import('../src/utils/otp-clock.ts');
const { getTimeRemainingToNextCycle } = await import('../src/utils/time.ts');
const { watchTOTPCycle } = await import('../src/utils/totp-cycle.ts');
const { synchronizeOTPClock } = await import('../src/utils/api.ts');

test('offline cold start uses local time immediately', (t) => {
  t.mock.method(Date, 'now', () => 29_000);
  assert.equal(getOTPTime(), 29_000);
  assert.equal(getTimeRemainingToNextCycle(), 1);
});

test('midpoint correction drives both countdown and cycle refresh', (t) => {
  let now = 29_000;
  t.mock.method(Date, 'now', () => now);
  applyTimeSample(new Date(now).toISOString(), now, now);
  const target = new EventTarget();
  target.visibilityState = 'visible';
  Object.defineProperty(globalThis, 'document', { configurable: true, value: target });
  t.mock.method(globalThis, 'setInterval', () => 123);
  t.mock.method(globalThis, 'clearInterval', () => {});
  let refreshes = 0;
  const stop = watchTOTPCycle(() => refreshes++);
  t.after(() => { stop(); delete globalThis.document; });
  assert.equal(refreshes, 1);
  // 200 ms RTT, server timestamp 31,100: estimated offset is +2,000 ms.
  assert.equal(applyTimeSample(new Date(31_100).toISOString(), 29_000, 29_200), true);
  assert.equal(getOTPTime(), 31_000);
  assert.equal(getTimeRemainingToNextCycle(), 29);
  assert.equal(refreshes, 2);
  now += 1000;
  assert.equal(getOTPTime(), 32_000);
  assert.equal(getTimeRemainingToNextCycle(), 28);
});

test('invalid and slow samples leave the existing correction unchanged', (t) => {
  t.mock.method(Date, 'now', () => 100_000);
  applyTimeSample(new Date(102_000).toISOString(), 100_000, 100_000);
  for (const [time, start, end] of [
    ['bad', 100_000, 100_100],
    [new Date(200_000).toISOString(), 100_000, 103_000],
    [new Date(200_000).toISOString(), 100_000, 99_000],
  ]) assert.equal(applyTimeSample(time, start, end), false);
  assert.equal(getOTPTime(), 102_000);
});

test('network failure, stale cache reply and cancellation preserve offline clock', async (t) => {
  t.mock.method(Date, 'now', () => 100_000);
  applyTimeSample(new Date(100_000).toISOString(), 100_000, 100_000);
  t.mock.method(globalThis, 'fetch', async () => { throw new TypeError('offline'); });
  assert.equal(await synchronizeOTPClock(), false);
  assert.equal(getOTPTime(), 100_000);
  t.mock.method(globalThis, 'fetch', async () => ({ ok: true, json: async () => ({ time: new Date(1).toISOString(), nonce: 'old' }) }));
  assert.equal(await synchronizeOTPClock(), false);
  assert.equal(getOTPTime(), 100_000);
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    assert.equal(options.cache, 'no-store');
    return { ok: true, json: async () => ({ time: new Date(105_000).toISOString(), nonce: new URL(url, 'https://example.com').searchParams.get('nonce') }) };
  });
  assert.equal(await synchronizeOTPClock(AbortSignal.abort()), false);
  assert.equal(getOTPTime(), 100_000);
  assert.equal(await synchronizeOTPClock(), true);
  assert.equal(getOTPTime(), 105_000);
  t.mock.method(globalThis, 'fetch', async () => { throw new TypeError('offline again'); });
  assert.equal(await synchronizeOTPClock(), false);
  assert.equal(getOTPTime(), 105_000);
});
