import { test } from 'node:test';
import assert from 'node:assert/strict';
import './register-typescript.mjs';
const { validateImportData } = await import('../src/utils/import-validation.ts');
const secret = 'JBSWY3DPEHPK3PXP';
const entry = { id: 'one', title: '账户', secret };

test('legacy backups get defaults; explicit order zero is preserved', () => {
  assert.deepEqual(validateImportData([{ ...entry, order: 0 }, { ...entry, id: 'two' }]), [
    { ...entry, order: 0, description: '' },
    { ...entry, id: 'two', order: 1, description: '' },
  ]);
  assert.equal(validateImportData([{ ...entry, order: 42 }])[0].order, 42);
});

test('all items are validated, including invalid entries after a valid first item', () => {
  for (const bad of [null, {}, { ...entry, id: 'two', secret: '1234' },
    { ...entry, id: 'two', title: ' ' }, { ...entry, id: 'two', order: -1 },
    { ...entry, id: 'two', description: {} }, { ...entry, id: 'two', order: 1.5 }]) {
    assert.throws(() => validateImportData([entry, bad]));
  }
  assert.throws(() => validateImportData([]));
  assert.throws(() => validateImportData({}));
});

test('duplicate IDs and unsupported backup parameters are rejected', () => {
  assert.throws(() => validateImportData([entry, entry]), /重复/);
  for (const extra of [{ algorithm: 'SHA256' }, { digits: 8 }, { period: 60 }, { type: 'hotp' }]) {
    assert.throws(() => validateImportData([{ ...entry, ...extra }]), /仅支持/);
  }
});

test('import secrets are normalized', () => {
  const spaced = 'jbsw y3dp ehpk 3pxp';
  assert.equal(validateImportData([{ ...entry, secret: spaced }])[0].secret, secret);
});
