'use strict';

// Legacy personal-bank subniche deletion must beat stale device snapshots.
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

const key = 'POD2|personalBank|gospel_es';
const stale = JSON.stringify({
  comun: ['objeto comun'],
  'camiseta': ['objeto camiseta'],
  '__concept__camiseta': ['concepto camiseta'],
  '__phrase__camiseta': ['frase camiseta']
});
const deleted = JSON.stringify({
  comun: ['objeto comun'],
  __podDeletedEntries: {
    camiseta: '2026-11-14T20:00:00.000Z',
    '__concept__camiseta': '2026-11-14T20:00:00.000Z',
    '__phrase__camiseta': '2026-11-14T20:00:00.000Z'
  }
});

let merged = context.mergeMemoryObjects({ [key]: deleted }, { [key]: stale });
let bank = JSON.parse(merged[key]);
assert.strictEqual(bank.camiseta, undefined, 'local deletion must remove stale subniche objects');
assert.strictEqual(bank.__concept__camiseta, undefined, 'local deletion must remove stale concepts');
assert.strictEqual(bank.__phrase__camiseta, undefined, 'local deletion must remove stale phrases');
assert.strictEqual(bank.comun.join(','), 'objeto comun', 'unrelated common bank data must remain');

merged = context.mergeMemoryObjects({ [key]: stale }, { [key]: deleted });
bank = JSON.parse(merged[key]);
assert.strictEqual(bank.camiseta, undefined, 'remote deletion must remove stale subniche objects');
assert.strictEqual(bank.__concept__camiseta, undefined, 'remote deletion must remove stale concepts');
assert.strictEqual(bank.__phrase__camiseta, undefined, 'remote deletion must remove stale phrases');

context.savePersonalBank('gospel_es', {
  camiseta: ['objeto camiseta'],
  '__concept__camiseta': ['concepto camiseta'],
  '__phrase__camiseta': ['frase camiseta'],
  comun: ['objeto comun']
});
context.removePersonalBank('gospel_es', 'camiseta');
const loaded = context.loadPersonalBank('gospel_es');
assert.strictEqual(loaded.camiseta, undefined, 'deleted subniche objects must not load');
assert.strictEqual(loaded.__concept__camiseta, undefined, 'deleted subniche concepts must not load');
assert.strictEqual(loaded.__phrase__camiseta, undefined, 'deleted subniche phrases must not load');
assert.strictEqual(loaded.comun.join(','), 'objeto comun', 'deleting one subniche must preserve common data');

const persisted = JSON.parse(context.getRaw(key));
assert.ok(persisted.__podDeletedEntries.camiseta, 'subniche deletion marker must persist');
assert.ok(persisted.__podDeletedEntries.__concept__camiseta, 'concept deletion marker must persist');
assert.ok(persisted.__podDeletedEntries.__phrase__camiseta, 'phrase deletion marker must persist');

const marketDelete = JSON.stringify({ __podDeleted: true, deletedAt: '2026-11-14T20:00:00.000Z' });
merged = context.mergeMemoryObjects({ [key]: marketDelete }, { [key]: stale });
assert.strictEqual(JSON.parse(merged[key]).__podDeleted, true, 'whole-market deletion must beat stale remote bank');
context.removePersonalBank('gospel_es');
assert.strictEqual(context.loadPersonalBank('gospel_es').camiseta, undefined, 'whole-market deletion must load as empty bank');
assert.strictEqual(JSON.parse(context.getRaw(key)).__podDeleted, true, 'whole-market deletion marker must persist');

console.log('PASS legacy-personal-bank-sync-tombstone (17 assertions, 0 failures)');
