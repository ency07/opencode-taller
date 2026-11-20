/* Regresión P3: integrity pipeline contract between construction and recompilation.
   Guarantees that preservation/reconciliation cannot silently accept an invalid final set. */
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
MOTOR_STATE.styleLockToken = '';
MOTOR_STATE.serie = '';
MOTOR_STATE.concept = 'The King reigns';
MOTOR_STATE.message = 'THE KING REIGNS FOREVER';

const candidate = buildCandidate(resolveAudiences(), null);
assert.ok(candidate.semantic, 'el set generado debe transportar identidad semántica');
assert.ok(Array.isArray(candidate.creativeContractDiagnostics), 'el set generado debe transportar diagnósticos finales');
assert.ok(Array.isArray(candidate.creativeContractChanges), 'el set generado debe transportar cambios de reconciliación');
assert.ok(Array.isArray(candidate.creativeContractUnresolved), 'el set generado debe transportar conflictos sin resolver');
assert.equal(_validateCreativeContract(candidate, {}).ok, true, 'el set generado debe cumplir el contrato integral');
assert.equal(candidate.creativeContractVisuals, undefined, 'no debe filtrar campos internos fuera del contrato');

const preservationLocks = {};
ROOT_FIELDS.forEach(field => {
  preservationLocks[field] = { A: 'PRESERVE', B: 'PRESERVE', C: 'PRESERVE' };
});

const preserved = buildCandidate(resolveAudiences(), null, {
  prevSet: candidate,
  effectiveLocks: preservationLocks,
  targetKey: 'C'
});
assert.equal(preserved.A.estilo, candidate.A.estilo, 'la preservación no debe reemplazar una decisión ya fijada en A');
assert.equal(preserved.B.estilo, candidate.B.estilo, 'la preservación no debe reemplazar una decisión ya fijada en B');
assert.equal(preserved.semantic.anchor, 'The King reigns');
assert.ok(Array.isArray(preserved.creativeContractDiagnostics), 'la preservación debe devolver diagnósticos finales');
assert.equal(_validateCreativeContract(preserved, {}).ok, true, 'la preservación debe respetar el contrato integral');

const invalidPrevSet = JSON.parse(JSON.stringify(candidate));
invalidPrevSet.A.tratamiento = 'HEAVY: contornos gruesos y masas sólidas dominantes; contraste alto; letras grandes legibles';
invalidPrevSet.A.tecnica = 'Hand-Drawn línea fina';
const invalidPreserved = buildCandidate(resolveAudiences(), null, {
  prevSet: invalidPrevSet,
  effectiveLocks: JSON.parse(JSON.stringify(preservationLocks)),
  targetKey: 'C'
});
const invalidPreservedResult = _validateCreativeContract(invalidPreserved, {});
assert.equal(invalidPreservedResult.ok, false, 'una decisión restaurada incompatible no puede pasar silenciosamente');
assert.ok(invalidPreservedResult.errors.some(error => /\[INCOMPATIBLE_TREATMENT_TECHNIQUE\]/.test(error)), invalidPreservedResult.errors.join(' | '));

console.log('PASS creative-pipeline-contract: construction, preservation and final validation agree on the contract');