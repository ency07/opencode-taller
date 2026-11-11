/* Regression tests for applying merged memory to local persistence. */
'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
const memorySource = fs.readFileSync(path.join(root, 'js/memoria-local.js'), 'utf8');
const syncSource = fs.readFileSync(path.join(root, 'js/sync-supabase.js'), 'utf8');

function createRuntime(failingKey) {
  const values = Object.create(null);
  const localStorage = {
    getItem: function (key) {
      return Object.prototype.hasOwnProperty.call(values, key) ? values[key] : null;
    },
    setItem: function (key, value) {
      if (key === failingKey) throw new Error('simulated quota failure');
      values[key] = String(value);
    },
    removeItem: function (key) {
      delete values[key];
    }
  };
  const window = { localStorage: localStorage };
  vm.runInNewContext(memorySource, { window: window }, { filename: 'memoria-local.js' });
  return window;
}

const healthy = createRuntime(null);
const healthyResult = healthy.applyMergedMemoryObject({ 'POD2|test|healthy': '{"ok":true}' });
assert.strictEqual(healthyResult.ok, true, 'successful local writes must be reported as successful');
assert.deepStrictEqual(Array.from(healthyResult.failedKeys), [], 'successful apply must not report failed keys');

const failingKey = 'POD2|test|quota';
const constrained = createRuntime(failingKey);
const failedResult = constrained.applyMergedMemoryObject({ [failingKey]: '{"ok":true}' });
assert.strictEqual(failedResult.ok, false, 'a failed localStorage write must not be reported as successful');
assert.ok(Array.from(failedResult.failedKeys).includes(failingKey), 'the failed key must be reported');

assert.ok(
  /var applyResult = applyMergedMemoryObject\(merged\)[\s\S]*?applyResult\.ok !== true/.test(syncSource),
  'Supabase sync must stop and surface local persistence failures'
);
assert.ok(
  /LOCAL_PERSISTENCE_FAILED/.test(syncSource),
  'local persistence failures must have a distinguishable error code'
);
assert.ok(
  /e\.code === 'LOCAL_PERSISTENCE_FAILED'[\s\S]*?statusMsg\(e\.message/.test(syncSource),
  'the sync UI must show the persistence error without a misleading RLS/network hint'
);

console.log('PASS sync-persistence (7 assertions, 0 failures)');
