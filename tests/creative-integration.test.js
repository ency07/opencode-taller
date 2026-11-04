'use strict';
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');

const compositions = require('../js/data-composiciones.js');
const techniques = require('../js/data-tecnicas.js');
const treatments = require('../js/data-tratamientos.js');
const diversity = require('../js/diversidad-saturacion.js');
const secular = require('../secular-engine/secular-engine.js');
const shared = require('../shared/shared-infra.js');

assert.equal(compositions.compositionDirections.length, 10);
assert.equal(compositions.colorModes.length, 10);
assert.equal(techniques.illustrationTechniques.length, 24);
assert.equal(treatments.structuralTreatments.length, 3);
assert.equal(treatments.visualTreatments.length, 10);
assert.equal(treatments.textIntegrations.length, 10);

assert.equal(secular.SECULAR_MARKETS.length, 9);
assert.equal(secular.SECULAR_RULES.qaType, 'commercial');
assert.equal(secular.initSecularEngine({ market: 'sports' }).market, 'sports');
assert.equal(secular.initSecularEngine({ market: 'unknown' }).market, 'streetwear');
assert.ok(Array.isArray(secular.initSecularEngine({ market: 'sports' }).brandBenchmark));
assert.equal(shared.SHARED_STORAGE_PREFIX, 'POD2|');
assert.ok(shared.SHARED_PRINT_METHODS.includes('DTF'));

const original = ['HEAVY', 'HEAVY', 'HEAVY', 'HEAVY', 'SOFT'];
assert.deepEqual(diversity.aplicarDiversidad(original, 0.4), original);
const diversified = diversity.aplicarDiversidad(original, 0.4, ['HEAVY', 'SOFT', 'MODERN']);
assert.equal(diversified.length, original.length);
assert.notDeepEqual(diversified, original);
assert.equal(diversity.estaSaturado(diversified, 0.4), false);
assert.deepEqual(diversity.contarEstilos(['HEAVY', 'SOFT', 'HEAVY']), { HEAVY: 2, SOFT: 1 });
assert.equal(diversity.estaSaturado([], 0.4), false);
assert.equal(diversity.estaSaturado(['HEAVY'], 0.4), false);
assert.deepEqual(diversity.aplicarDiversidad(['HEAVY'], 0.4, ['HEAVY', 'SOFT']), ['HEAVY']);
const impossible = ['HEAVY', 'HEAVY', 'HEAVY', 'HEAVY'];
assert.deepEqual(diversity.aplicarDiversidad(impossible, 0.4, ['HEAVY', 'SOFT']), impossible);
assert.equal(diversity.estaSaturado(impossible, 0.4), true);
assert.deepEqual(diversity.aplicarDiversidad(['HEAVY', 'SOFT'], 1.5, ['HEAVY', 'SOFT']), ['HEAVY', 'SOFT']);

// Cargar todos los catálogos como scripts clásicos junto al banco autoritativo.
const browser = { window: {} };
vm.createContext(browser);
[
  'js/data-estilos.js',
  'js/data-composiciones.js',
  'js/data-tecnicas.js',
  'js/data-tratamientos.js',
  'js/diversidad-saturacion.js',
  'secular-engine/secular-engine.js',
  'shared/shared-infra.js'
].forEach(file => vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), browser, { filename: file }));
assert.equal(browser.window.LAYOUTS.length, 16);
assert.equal(browser.window.COLOR_MODES.length, 6);
assert.equal(browser.window.PODCreativeCatalogs.compositions.compositionDirections.length, 10);
assert.equal(browser.window.PODCreativeCatalogs.techniques.illustrationTechniques.length, 24);
assert.equal(browser.window.PODCreativeCatalogs.treatments.textIntegrations.length, 10);
assert.ok(browser.window.PODCreativeCatalogs.diversity);
assert.ok(browser.window.PODCreativeCatalogs.secularEngine);
assert.ok(browser.window.PODCreativeCatalogs.sharedInfra);

const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const motor = fs.readFileSync(path.join(root, 'js/motor-nucleo.js'), 'utf8');
const ia = fs.readFileSync(path.join(root, 'js/ia-analisis.js'), 'utf8');
const nav = fs.readFileSync(path.join(root, 'js/pod-nav.js'), 'utf8');
assert.doesNotMatch(index, /id="creativeTerritory"/, 'no mostrar selector de territorio sin catálogo ni efecto real');
assert.match(motor, /MOTOR_STATE\.creativeTerritory = v\('creativeTerritory'/);
assert.match(motor, /clearSetHistory/);
assert.match(motor, /clearCreativeMemory/);
assert.match(ia, /formatPrompt\(LAST_RESULT\)/);
assert.match(nav, /\['product', \['product', 'productSelect'\]\]/);
assert.match(nav, /\['language', \['language', 'selLanguage'\]\]/);
assert.doesNotMatch(motor, /SECULAR_MARKETS|secular-engine/);

console.log('PASS creative-integration: source catalogs, namespace isolation and P5 boundaries');
