import { test } from 'node:test';
import assert from 'node:assert/strict';
import './register-typescript.mjs';
const { parseTOTPQRCode } = await import('../src/utils/otp-uri.ts');
const secret = 'JBSWY3DPEHPK3PXP';
const uri = `otpauth://totp/Example:alice?secret=${secret}`;

test('QR secrets are normalized', () => {
  const spaced = 'jbsw y3dp ehpk 3pxp';
  assert.equal(parseTOTPQRCode(`otpauth://totp/alice?secret=${encodeURIComponent(spaced)}`).secret, secret);
});

test('default and explicitly supported QR parameters work', () => {
  assert.deepEqual(parseTOTPQRCode(uri), { account: 'alice', issuer: 'Example', secret });
  assert.deepEqual(parseTOTPQRCode(`${uri}&algorithm=SHA1&digits=6&period=30`), parseTOTPQRCode(uri));
});

test('HOTP and unsupported or repeated QR parameters fail explicitly', () => {
  assert.throws(() => parseTOTPQRCode(uri.replace('/totp/', '/hotp/')), /HOTP/);
  for (const suffix of ['&algorithm=SHA256', '&digits=8', '&period=60', '&period=', '&digits=invalid']) {
    assert.throws(() => parseTOTPQRCode(uri + suffix), /不受支持/);
  }
  assert.throws(() => parseTOTPQRCode(`${uri}&secret=${secret}`), /重复/);
  assert.throws(() => parseTOTPQRCode('otpauth://totp/alice'), /密钥/);
  assert.throws(() => parseTOTPQRCode(`otpauth://totp/?secret=${secret}`), /账户/);
});

test('labels are decoded once, retaining colons and literal percent signs', () => {
  const parsed = parseTOTPQRCode(`otpauth://totp/Brand%3Aalice%3Awork%2520?secret=${secret}&issuer=100%25`);
  assert.equal(parsed.account, 'alice:work%20');
  assert.equal(parsed.issuer, '100%');
});
