'use strict';

// Global memory clear must suppress stale cloud-only keys and preserve later writes.
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const store = Object.create(null);
const localStorage = {
  setItem: (key, value) => { store[key] = String(value); },
  getItem: key => Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null,
  removeItem: key => { delete store[key]; }
};
const document = { readyState: 'loading', addEventListener: function () {}, getElementById: function () { return null; }, createElement: function () { return {}; } };
const context = { console, localStorage, document, confirm: () => true, alert: function () {}, prompt: () => null };
context.window = context;
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'js', 'memoria-local.js'), 'utf8'), context, { filename: 'memoria-local.js' });

const localKey = 'POD2|personalBank|gospel_es';
const cloudOnlyKey = 'POD2|locks|secular_en|CAMISETA';
const staleLocal = JSON.stringify({ camiseta: ['dato local antiguo'] });
const staleCloud = JSON.stringify({ estilo: { A: 'Grunge' } });

context.setRaw(localKey, staleLocal);
const result = context.clearAllMemory();
assert.ok(result && result.clearedKeys >= 1, 'clearAllMemory must report cleared keys');
assert.strictEqual(context.loadPersonalBank('gospel_es').camiseta, undefined, 'locally cleared bank must load empty');
assert.deepStrictEqual(context.getJSON(localKey, { fallback: true }), { fallback: true }, 'generic JSON loaders must treat tombstones as absent');

const localAfterClear = context.exportMemoryObject();
const merged = context.mergeMemoryObjects(localAfterClear, { [localKey]: staleLocal, [cloudOnlyKey]: staleCloud });
assert.strictEqual(JSON.parse(merged[localKey]).__podDeleted, true, 'local stale bank must remain deleted');
assert.strictEqual(JSON.parse(merged[cloudOnlyKey]).__podDeleted, true, 'cloud-only stale key must be tombstoned');
const globalMarker = JSON.parse(merged['POD2|__globalClear']);
assert.strictEqual(globalMarker.__podGlobalClear, true, 'global clear marker must replicate');

const remoteClear = context.mergeMemoryObjects(
  { [cloudOnlyKey]: staleCloud },
  { 'POD2|__globalClear': JSON.stringify(globalMarker), [cloudOnlyKey]: staleCloud }
);
assert.strictEqual(JSON.parse(remoteClear[cloudOnlyKey]).__podDeleted, true, 'remote global marker must suppress stale local data');

context.setJSON('POD2|personalBank|gospel_es', { camiseta: ['dato nuevo'] });
const afterWrite = context.exportMemoryObject();
const postWriteMerge = context.mergeMemoryObjects(afterWrite, { [localKey]: staleLocal, [cloudOnlyKey]: staleCloud });
assert.strictEqual(JSON.parse(postWriteMerge[localKey]).camiseta.join(','), 'dato nuevo', 'explicit write after global clear must survive');
assert.strictEqual(JSON.parse(postWriteMerge[cloudOnlyKey]).__podDeleted, true, 'unrelated stale cloud key must stay deleted');
assert.ok(JSON.parse(postWriteMerge['POD2|__globalClear']).preservedKeys[localKey], 'post-clear write timestamp must be tracked');

context.clearAllMemory();
const imported = JSON.stringify({ [localKey]: JSON.stringify({ camiseta: ['dato importado'] }) });
context.importMemoryJSON(imported, 'overwrite');
const importedSnapshot = context.exportMemoryObject();
const importedMerge = context.mergeMemoryObjects(importedSnapshot, { [localKey]: staleLocal });
assert.strictEqual(JSON.parse(importedMerge[localKey]).camiseta.join(','), 'dato importado', 'explicit overwrite import after clear must survive sync');
assert.ok(JSON.parse(importedMerge['POD2|__globalClear']).preservedKeys[localKey], 'successful import must be recorded as post-clear write');

console.log('PASS clear-all-memory-sync-tombstone (13 assertions, 0 failures)');
