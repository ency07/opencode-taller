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
  'js/data-territorios.js',
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

/* Tarea 2 (Stage 1 closure): el catalogo de territorios separa ejes y usa ids de catalogo. */
const territories = vm.runInContext('POD_CREATIVE_TERRITORIES', browser);
const styleIds = browser.window.ESTILOS_LIST || [];
const expectedTerritoryIds = [
  'SACRED_EDITORIAL', 'BIBLICAL_BOTANICAL', 'BIBLICAL_ARCHAEOLOGY',
  'THEOLOGICAL_ABSTRACTION', 'CHRISTIAN_HERITAGE', 'NARRATIVE_ILLUSTRATION',
  'EVERYDAY_FAITH', 'FAITH_WORKWEAR', 'CONTRAST_ART', 'LOCAL_FAITH_CULTURE',
  'URBAN_STREETWEAR', 'NATURE_ORGANIC', 'MINIMAL_MODERN', 'PET_LOVERS',
  'PROFESSION_PRIDE', 'SARCASM_HUMOR', 'HOBBY_MICRO', 'RETRO_VINTAGE',
  'TECH_DIGITAL'
].sort();
assert.deepEqual(Object.keys(territories).sort(), expectedTerritoryIds,
  'el catalogo debe declarar los 19 territorios registrados (10 gospel y 9 comerciales)');
Object.keys(territories).forEach(function (territoryId) {
  const t = territories[territoryId];
  assert.ok(Array.isArray(t.compatibleTreatments), 'el territorio ' + territoryId + ' requiere compatibleTreatments');
  t.compatibleTreatments.forEach(function (treatmentId) {
    assert.ok(['HEAVY', 'SOFT', 'MODERN'].indexOf(treatmentId) !== -1, 'compatibleTreatments con id invalido en ' + territoryId + ': ' + treatmentId);
  });
  (t.compatibleStyles || []).forEach(function (styleId) {
    assert.ok(styleIds.indexOf(styleId) !== -1, 'compatibleStyles con id invalido en ' + territoryId + ': ' + styleId);
  });
});

const _expectedCounts = Object.create(null);
_expectedCounts.HEAVY = 2;
_expectedCounts.SOFT = 1;
const _actualCounts = diversity.contarEstilos(['HEAVY', 'SOFT', 'HEAVY']);
assert.deepEqual(_actualCounts, _expectedCounts);
assert.equal(Object.getPrototypeOf(_actualCounts), null, 'contarEstilos debe devolver un objeto con prototipo nulo (seguridad contra contaminación de prototipo)');

const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const motor = fs.readFileSync(path.join(root, 'js/motor-nucleo.js'), 'utf8');
const ia = fs.readFileSync(path.join(root, 'js/ia-analisis.js'), 'utf8');
const nav = fs.readFileSync(path.join(root, 'js/pod-nav.js'), 'utf8');
assert.match(index, /id="creativeTerritory"/, 'Stage 1 closure: selector de territorio activo con catálogo y efecto real');
assert.match(motor, /MOTOR_STATE\.creativeTerritory = v\('creativeTerritory'/);
assert.match(motor, /clearSetHistory/);
assert.match(motor, /clearCreativeMemory/);
assert.match(motor, /ANCLA CONCEPTO:/, 'RED TEAM corrective: el territorio inyecta la ancla al concepto');
assert.match(ia, /formatPrompt\(LAST_RESULT\)/);
assert.match(nav, /\['product', \['product', 'productSelect'\]\]/);
assert.match(nav, /\['language', \['language', 'selLanguage'\]\]/);
assert.doesNotMatch(motor, /SECULAR_MARKETS|secular-engine/);

console.log('PASS creative-integration: source catalogs, namespace isolation and P5 boundaries');
