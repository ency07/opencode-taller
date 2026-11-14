'use strict';

// Approved-direction deletions must survive stale device snapshots.
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

const key = 'POD2|approvedDirections';
const stale = JSON.stringify([{ id: 'dir_old', value: 'stale direction' }, { id: 'dir_keep', value: 'keep direction' }]);
const deleted = JSON.stringify({ items: [], deleted: { dir_old: '2026-11-14T20:00:00.000Z' } });

let merged = context.mergeMemoryObjects({ [key]: deleted }, { [key]: stale });
assert.deepStrictEqual(JSON.parse(merged[key]).items.map(x => x.id).join(','), 'dir_keep', 'local tombstone must filter stale remote item');
assert.ok(JSON.parse(merged[key]).deleted.dir_old, 'local tombstone must survive merge');

merged = context.mergeMemoryObjects({ [key]: stale }, { [key]: deleted });
assert.deepStrictEqual(JSON.parse(merged[key]).items.map(x => x.id).join(','), 'dir_keep', 'remote tombstone must filter stale local item');
assert.ok(JSON.parse(merged[key]).deleted.dir_old, 'remote tombstone must survive merge');

context.saveApprovedDirections([{ id: 'dir_old', value: 'old' }, { id: 'dir_keep', value: 'keep' }]);
context.removeApprovedDirection('dir_old');
assert.deepStrictEqual(context.loadApprovedDirections().map(x => x.id).join(','), 'dir_keep', 'removed direction must disappear from public loader');
const stored = JSON.parse(context.getRaw(key));
assert.ok(stored.deleted.dir_old, 'removeApprovedDirection must persist an ID tombstone');

merged = context.mergeMemoryObjects({ [key]: context.getRaw(key) }, { [key]: stale });
assert.deepStrictEqual(JSON.parse(merged[key]).items.map(x => x.id), ['dir_keep'], 'persisted tombstone must prevent resurrection after sync');

context.addApprovedDirection({ id: 'dir_new', market: 'gospel_es', value: 'new direction' });
assert.ok(context.loadApprovedDirections().some(x => x.id === 'dir_new'), 'new direction must remain addable');

console.log('PASS approved-directions-sync-tombstone (8 assertions, 0 failures)');
