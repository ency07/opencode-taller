'use strict';

/* RT-BRAND-01 — aislamiento de memoria y territorios entre BERESHITH CO. y Cross & Lamp Co. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.join(__dirname, '..');
const store = Object.create(null);
global.localStorage = {
  getItem: key => Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null,
  setItem: (key, value) => { store[key] = String(value); },
  removeItem: key => { delete store[key]; }
};
global.window = global;
global.document = { getElementById: () => null, querySelectorAll: () => [], addEventListener: () => {} };
const js = path.join(root, 'js');
['data-mercados.js','data-audiencias.js','data-bancos.js','data-estilos.js','dominios.js',
 'data-productos.js','data-territorios.js','memoria-local.js','diversidad-saturacion.js','motor-nucleo.js']
  .forEach(file => vm.runInThisContext(fs.readFileSync(path.join(js, file), 'utf8'), { filename: file }));

MOTOR_STATE.market = 'gospel_es';
MOTOR_STATE.region = 'global';
MOTOR_STATE.product = 'CAMISETA SOFT';
MOTOR_STATE.brand = 'auto';
assert.equal(_activeBrandId(), 'BERESHITH_CO');
const spanishLockKey = memKey(['locks', memLocksMarket(), MOTOR_STATE.product]);
const spanishPatternKey = memKey(['patterns', memPatternMarket(), MOTOR_STATE.product]);
assert.match(spanishLockKey, /locks\|BERESHITH_CO\|/);
assert.match(spanishPatternKey, /patterns\|BERESHITH_CO\|/);

setLockValue(memLocksMarket(), MOTOR_STATE.product, 'estilo', 'A', 'Grabado / Linóleo');
setVisualIdentity('Identidad exclusiva BERESHITH');
setCreativeTerritory('SACRED_EDITORIAL');
setDecisionMode('manual');
recordPattern({ objeto: 'ancla', formaSimbolo: 'ancla vertical' }, memPatternMarket(), MOTOR_STATE.product, { brand: 'BERESHITH_CO' });

MOTOR_STATE.brand = 'CrossLampCo';
assert.equal(_activeBrandId(), 'CrossLampCo');
assert.notEqual(memKey(['locks', memLocksMarket(), MOTOR_STATE.product]), spanishLockKey);
assert.equal(loadLocks(memLocksMarket(), MOTOR_STATE.product).estilo.A, 'Auto');
assert.equal(loadVisualIdentity(), '');
assert.equal(loadCreativeTerritory(), 'auto');
assert.equal(loadDecisionMode(), 'assisted');
assert.equal(loadPatternMemory(memPatternMarket(), MOTOR_STATE.product).length, 0);

setLockValue(memLocksMarket(), MOTOR_STATE.product, 'estilo', 'A', 'Brutalist');
setVisualIdentity('Cross & Lamp visual identity');
setCreativeTerritory('FAITH_WORKWEAR');
setDecisionMode('auto');
recordPattern({ objeto: 'farol', formaSimbolo: 'farol vertical' }, memPatternMarket(), MOTOR_STATE.product, { brand: 'CrossLampCo' });

MOTOR_STATE.brand = 'BERESHITH_CO';
assert.equal(loadLocks(memLocksMarket(), MOTOR_STATE.product).estilo.A, 'Grabado / Linóleo');
assert.equal(loadVisualIdentity(), 'Identidad exclusiva BERESHITH');
assert.equal(loadCreativeTerritory(), 'SACRED_EDITORIAL');
assert.equal(loadDecisionMode(), 'manual');
assert.equal(loadPatternMemory(memPatternMarket(), MOTOR_STATE.product).length, 1);

MOTOR_STATE.brand = 'CrossLampCo';
assert.equal(loadLocks(memLocksMarket(), MOTOR_STATE.product).estilo.A, 'Brutalist');
assert.equal(loadVisualIdentity(), 'Cross & Lamp visual identity');
assert.equal(loadCreativeTerritory(), 'FAITH_WORKWEAR');
assert.equal(loadDecisionMode(), 'auto');
assert.equal(loadPatternMemory(memPatternMarket(), MOTOR_STATE.product).length, 1);

MOTOR_STATE.market = 'gospel_es';
MOTOR_STATE.brand = 'CrossLampCo';
assert.equal(_creativeTerritoryCompatibleWithMarket('CHRISTIAN_HERITAGE'), 'auto');
MOTOR_STATE.brand = 'BERESHITH_CO';
assert.equal(_creativeTerritoryCompatibleWithMarket('CHRISTIAN_HERITAGE'), 'CHRISTIAN_HERITAGE');

// Legacy unbranded data is migrated only to its market's deterministic default brand.
MOTOR_STATE.brand = 'auto';
const scoped = memKey(['visualIdentity', 'gospel_es', 'CAMISETA SOFT']);
const legacy = scoped.replace('|BERESHITH_CO|', '|');
store[legacy] = JSON.stringify({ value: 'legacy BERESHITH identity' });
assert.equal(loadVisualIdentity(), 'legacy BERESHITH identity');
assert.equal(store[scoped], store[legacy]);
MOTOR_STATE.brand = 'CrossLampCo';
assert.equal(loadVisualIdentity(), '');

console.log('PASS brand-isolation (brand-scoped locks, identity, territory, decision mode, pattern memory, territory guard and safe legacy migration)');
