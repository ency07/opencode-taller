'use strict';

// Regression: cleared memory families must not be restored from stale device snapshots.
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

const cases = [
  ['patterns', 'POD2|patterns|gospel_es|CAMISETA', JSON.stringify([{ t: '2026-11-01T10:00:00.000Z', pattern: { estilo: 'Grunge' } }]), () => context.clearPatternMemory('gospel_es', 'CAMISETA'), () => context.loadPatternMemory('gospel_es', 'CAMISETA')],
  ['creative', 'POD2|creative|gospel_es|CAMISETA', JSON.stringify({ archetypes: ['A'], motifs: ['M'] }), () => context.clearCreativeMemory('gospel_es', 'CAMISETA'), () => context.loadCreativeMemory('gospel_es', 'CAMISETA')],
  ['history', 'POD2|history|gospel_es|auto|CAMISETA|new|SERIE|CONCEPTO', JSON.stringify({ history: ['old'], usedObjects: ['old-object'] }), () => context.clearSetHistory('POD2|history|gospel_es|auto|CAMISETA|new|SERIE|CONCEPTO'), () => context.loadSetHistory('POD2|history|gospel_es|auto|CAMISETA|new|SERIE|CONCEPTO')],
  ['styleUsage', 'POD2|styleUsage|gospel_es|CAMISETA', JSON.stringify({ Grunge: 3 }), () => context.clearStyleUsage('gospel_es', 'CAMISETA'), () => context.getStyleUsageCounter('gospel_es', 'CAMISETA')]
];

for (const [name, key, stale, clear, load] of cases) {
  const marker = JSON.stringify({ __podDeleted: true, deletedAt: '2026-11-14T20:00:00.000Z' });
  let merged = context.mergeMemoryObjects({ [key]: marker }, { [key]: stale });
  assert.strictEqual(JSON.parse(merged[key]).__podDeleted, true, name + ': local deletion beats stale remote');
  merged = context.mergeMemoryObjects({ [key]: stale }, { [key]: marker });
  assert.strictEqual(JSON.parse(merged[key]).__podDeleted, true, name + ': remote deletion beats stale local');
  context.setRaw(key, stale);
  assert.strictEqual(clear(), true, name + ': clear persists marker');
  const value = load();
  if (name === 'patterns') assert.deepStrictEqual(Array.from(value), [], name + ': loader returns empty array');
  if (name === 'creative') assert.strictEqual(value.archetypes.length + value.motifs.length, 0, name + ': loader returns empty memory');
  if (name === 'history') assert.strictEqual(value.history.length + value.usedObjects.length, 0, name + ': loader returns empty history');
  if (name === 'styleUsage') assert.strictEqual(Object.keys(value).length, 0, name + ': loader returns empty counter');
}
context.savePatternMemory('gospel_es', 'CAMISETA', [{ t: '2026-11-14T21:00:00.000Z', pattern: { estilo: 'Minimal' } }]);
assert.strictEqual(context.loadPatternMemory('gospel_es', 'CAMISETA').length, 1, 'new pattern data replaces deletion marker');

console.log('PASS memory-family-sync-tombstone (17 assertions, 0 failures)');
