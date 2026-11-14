'use strict';

// A local edit made while the cloud request is pending must survive local apply.
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const root = path.join(__dirname, '..');
const memorySource = fs.readFileSync(path.join(root, 'js', 'memoria-local.js'), 'utf8');
const syncSource = fs.readFileSync(path.join(root, 'js', 'sync-supabase.js'), 'utf8');
const store = Object.create(null);
const context = {
  console,
  localStorage: {
    getItem: key => Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null,
    setItem: (key, value) => { store[key] = String(value); },
    removeItem: key => { delete store[key]; }
  },
  document: {
    readyState: 'loading',
    addEventListener: function () {},
    getElementById: function () { return null; },
    createElement: function () { return {}; }
  },
  confirm: function () { return true; },
  alert: function () {},
  prompt: function () { return null; }
};
context.window = context;
vm.createContext(context);
vm.runInContext(memorySource, context, { filename: 'memoria-local.js' });

const match = syncSource.match(/function mergeLocalChangesBeforeApply\(cloudMerged, latestLocal\) \{[\s\S]*?\n  \}/);
assert.ok(match, 'sync module must expose the local re-merge helper internally');
vm.runInContext(match[0], context, { filename: 'sync-helper.js' });

const changedDuringRequest = {
  'POD2|locks|gospel_es|CAMISETA': JSON.stringify({ estilo: { A: 'Cambio reciente' } }),
  'POD2|personalBanks|gospel_es': JSON.stringify({ banks: { newBank: { name: 'Creado durante sync', objects: [], phrases: [] } }, active: {}, deleted: {} })
};
const cloudMerged = {
  'POD2|locks|gospel_es|CAMISETA': JSON.stringify({ estilo: { A: 'Valor antiguo' } }),
  'POD2|approvedDirections|gospel_es': JSON.stringify(['dirección nube'])
};
const result = context.mergeLocalChangesBeforeApply(cloudMerged, changedDuringRequest);

const lock = JSON.parse(result['POD2|locks|gospel_es|CAMISETA']);
assert.strictEqual(lock.estilo.A, 'Cambio reciente', 'local edit must win over the pre-request snapshot');
assert.strictEqual(result['POD2|approvedDirections|gospel_es'], cloudMerged['POD2|approvedDirections|gospel_es'],
  'cloud-only keys must remain in the result');
assert.ok(result['POD2|personalBanks|gospel_es'], 'new local key created during request must remain');

const snapshotAtStart = syncSource.indexOf('var localPayload =');
const cloudWrite = syncSource.indexOf('status(\'Guardando copia fusionada en nube...\')');
const freshSnapshot = syncSource.indexOf('var latestLocalPayload =');
const localApply = syncSource.indexOf('Object.keys(localMerged)');
assert.ok(snapshotAtStart < cloudWrite && cloudWrite < freshSnapshot && freshSnapshot < localApply,
  'fresh local snapshot and re-merge must occur after cloud request and before local apply');

console.log('PASS sync-preserve-concurrent-local-edits (5 assertions, 0 failures)');
