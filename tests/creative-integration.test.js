'use strict';
const assert = require('node:assert/strict');
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

console.log('PASS creative-integration: 26 assertions');
