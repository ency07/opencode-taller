'use strict';

// Regression: deleted templates must not reappear when devices merge stale snapshots.
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const store = Object.create(null);
const localStorage = {
  setItem: function (key, value) { store[key] = String(value); },
  getItem: function (key) { return Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null; },
  removeItem: function (key) { delete store[key]; }
};
const document = {
  readyState: 'loading',
  addEventListener: function () {},
  getElementById: function () { return null; },
  createElement: function () { return {}; }
};
const context = { console, localStorage, document, confirm: function () { return true; }, alert: function () {}, prompt: function () { return null; } };
context.window = context;
vm.createContext(context);
const source = fs.readFileSync(path.join(__dirname, '..', 'js', 'memoria-local.js'), 'utf8');
vm.runInContext(source, context, { filename: 'memoria-local.js' });

const key = 'POD2|templateBank';
const staleTemplate = { id: 'tpl_deleted', nombre: 'Old', producto: 'MOCHILA', updatedAt: '2026-11-01T10:00:00.000Z' };
const staleSnapshot = JSON.stringify({ templates: { tpl_deleted: staleTemplate }, active: { MOCHILA: 'tpl_deleted' } });
const tombstoneSnapshot = JSON.stringify({ templates: {}, active: {}, deleted: { tpl_deleted: '2026-11-14T20:00:00.000Z' } });

let merged = context.mergeMemoryObjects({ [key]: tombstoneSnapshot }, { [key]: staleSnapshot });
let data = JSON.parse(merged[key]);
assert.strictEqual(data.templates.tpl_deleted, undefined, 'local tombstone must beat a stale remote template');
assert.strictEqual(data.active.MOCHILA, undefined, 'active pointer to deleted template must be removed');
assert.ok(data.deleted.tpl_deleted, 'local tombstone must survive the merge');

merged = context.mergeMemoryObjects({ [key]: staleSnapshot }, { [key]: tombstoneSnapshot });
data = JSON.parse(merged[key]);
assert.strictEqual(data.templates.tpl_deleted, undefined, 'remote tombstone must beat a stale local template');
assert.strictEqual(data.active.MOCHILA, undefined, 'remote deletion must clear stale active pointer');

context.saveTemplate({ nombre: 'Temporary', producto: 'MOCHILA' });
const created = context.listTemplates('MOCHILA')[0];
assert.ok(created && created.id, 'template fixture must be created');
assert.strictEqual(context.deleteTemplate(created.id).ok, true, 'template deletion must succeed');
const persisted = JSON.parse(context.POD_LS.getItem(key));
assert.ok(persisted.deleted[created.id], 'deletion must persist a replicable tombstone');

console.log('PASS template-sync-tombstone (9 assertions, 0 failures)');
