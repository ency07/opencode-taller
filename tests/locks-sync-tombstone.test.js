'use strict';

// Regression: clearing locks must survive bidirectional merge with stale devices.
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

const key = 'POD2|locks|gospel_es|CAMISETA';
const stale = JSON.stringify({ estilo: { A: 'Grunge' }, layout: { A: 'Emblema' } });
const deleted = JSON.stringify({ __podDeleted: true, deletedAt: '2026-11-14T20:00:00.000Z' });

let merged = context.mergeMemoryObjects({ [key]: deleted }, { [key]: stale });
assert.strictEqual(JSON.parse(merged[key]).__podDeleted, true, 'local lock deletion must beat stale remote data');
merged = context.mergeMemoryObjects({ [key]: stale }, { [key]: deleted });
assert.strictEqual(JSON.parse(merged[key]).__podDeleted, true, 'remote lock deletion must beat stale local data');

context.saveLocks('gospel_es', 'CAMISETA', { estilo: { A: 'Grunge' } });
assert.strictEqual(context.clearLocks('gospel_es', 'CAMISETA'), true, 'clearLocks must persist a deletion marker');
assert.strictEqual(context.loadLocks('gospel_es', 'CAMISETA').estilo.A, 'Auto', 'deleted locks must load as defaults');

context.setLockValue('gospel_es', 'CAMISETA', 'estilo', 'A', 'Minimal');
assert.strictEqual(context.loadLocks('gospel_es', 'CAMISETA').estilo.A, 'Minimal', 'a new explicit lock must replace the deletion marker');

console.log('PASS locks-sync-tombstone (5 assertions, 0 failures)');
