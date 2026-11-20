/* Regresión P0: el concepto semántico no equivale a un objeto físico autorizado. */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.join(__dirname, '..');

global.window = global;
const elements = {};
global.document = {
  getElementById: id => elements[id] || null,
  querySelectorAll: () => [],
  createElement: () => ({ style: {}, appendChild() {}, setAttribute() {} })
};

const js = path.join(root, 'js');
[
  'data-mercados.js', 'data-audiencias.js', 'data-bancos.js',
  'banco-gospel-es.js', 'banco-gospel-en.js', 'banco-global.js',
  'dominios.js', 'data-estilos.js', 'data-territorios.js',
  'data-productos.js', 'memoria-local.js', 'diversidad-saturacion.js',
  'inteligencia-mercado.js', 'motor-nucleo.js'
].forEach(file => {
  const full = path.join(js, file);
  if (fs.existsSync(full)) vm.runInThisContext(fs.readFileSync(full, 'utf8'), { filename: file });
});

MOTOR_STATE.market = 'gospel_en';
MOTOR_STATE.region = 'global';
MOTOR_STATE.product = 'CAMISETA SOFT';
MOTOR_STATE.subniche = 'auto';
MOTOR_STATE.audienceSet = 'Auto';
MOTOR_STATE.audienceMulti = 'no';
MOTOR_STATE.groupMode = 'distintos';
MOTOR_STATE.designMode = 'contacto';
MOTOR_STATE.support = 'EVERY KNEE SHALL BOW';
MOTOR_STATE.explorationBrief = null;
MOTOR_STATE.workflowMode = 'new';
MOTOR_STATE.serie = '';
MOTOR_STATE.concept = 'The King reigns';
MOTOR_STATE.message = 'THE KING REIGNS FOREVER';

const identity = _resolveContactIdentity([]);
assert.equal(identity.ok, true);
assert.equal(identity.semantic.anchor, MOTOR_STATE.concept);
assert.equal(identity.semantic.type, 'abstract_or_verbal');
assert.equal(identity.semantic.namedObject, null);
assert.equal(identity.semantic.approvedRepresentation, 'abstract_geometry');
assert.deepEqual(identity.semantic.physicalObjects, [], 'un concepto abstracto no autoriza un objeto físico');
assert.deepEqual(identity.semantic.authorization.namedObjects, []);
assert.ok(identity.semantic.authorization.text.indexOf(MOTOR_STATE.concept) !== -1);

const candidate = buildCandidate(resolveAudiences(), null);
assert.ok(candidate.semantic, 'el conjunto debe transportar la identidad semántica');
assert.equal(candidate.semantic.anchor, MOTOR_STATE.concept);
assert.equal(candidate.semantic.type, 'abstract_or_verbal');
assert.equal(candidate.semantic.approvedRepresentation, 'abstract_geometry');
assert.deepEqual(candidate.semantic.physicalObjects, []);
assert.deepEqual(candidate.semantic.authorization.decorativeElements, []);
assert.ok(Array.isArray(candidate.creativeContractDiagnostics), 'el conjunto debe transportar diagnósticos finales');
assert.ok(Array.isArray(candidate.creativeContractChanges), 'el conjunto debe transportar los cambios de reconciliación');
assert.ok(Array.isArray(candidate.creativeContractUnresolved), 'el conjunto debe transportar los conflictos no resueltos');
assert.equal(_validateCreativeContract(candidate, {}).ok, true, 'el contrato de identidad semántica no debe romper una ficha válida');

console.log('PASS semantic-authorization-contract: concept is transported as an authorized anchor, not as an invented physical object');