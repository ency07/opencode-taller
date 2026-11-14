'use strict';

// Proposal discard/accept operations must survive stale personal-bank snapshots.
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

const key = 'POD2|personalBank|global';
const proposal = { id: 'prop_stale', tipo: 'objeto', texto: 'objeto de prueba', mercado: 'global_es', subniche: 'comun' };
const staleBank = JSON.stringify({ __propuestas_banco_global__: [proposal] });
const deletedBank = JSON.stringify({ __propuestas_banco_global__: { items: [], deleted: { prop_stale: '2026-11-14T20:00:00.000Z' } } });

let merged = context.mergeMemoryObjects({ [key]: deletedBank }, { [key]: staleBank });
assert.strictEqual(JSON.parse(merged[key]).__propuestas_banco_global__.items.length, 0, 'local tombstone must beat stale remote proposal');
assert.ok(JSON.parse(merged[key]).__propuestas_banco_global__.deleted.prop_stale, 'local proposal tombstone must survive merge');

merged = context.mergeMemoryObjects({ [key]: staleBank }, { [key]: deletedBank });
assert.strictEqual(JSON.parse(merged[key]).__propuestas_banco_global__.items.length, 0, 'remote tombstone must beat stale local proposal');
assert.ok(JSON.parse(merged[key]).__propuestas_banco_global__.deleted.prop_stale, 'remote proposal tombstone must survive merge');

context.proponerEnBanco('objeto', 'propuesta descartable', { mercado: 'global_es', subniche: 'comun' });
const discardable = context.getPropuestasBanco()[0];
context.descartarPropuestaBanco(discardable.id);
assert.strictEqual(context.getPropuestasBanco().some(p => p.id === discardable.id), false, 'discarded proposal must disappear from loader');
const saved = JSON.parse(context.getRaw(key));
assert.ok(saved.__propuestas_banco_global__.deleted[discardable.id], 'discard must persist proposal tombstone');

context.proponerEnBanco('objeto', 'propuesta aceptable', { mercado: 'global_es', subniche: 'comun' });
const acceptable = context.getPropuestasBanco()[0];
context.aceptarPropuestaBanco(acceptable.id);
assert.strictEqual(context.getPropuestasBanco().some(p => p.id === acceptable.id), false, 'accepted proposal must disappear from loader');
const afterAccept = JSON.parse(context.getRaw(key));
assert.ok(afterAccept.__propuestas_banco_global__.deleted[acceptable.id], 'accept must persist proposal tombstone');

console.log('PASS proposals-bank-sync-tombstone (8 assertions, 0 failures)');
