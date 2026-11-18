/* Regresión del contrato creativo: debe ejecutarse después de diversidad y preservación. */
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
MOTOR_STATE.support = '';
MOTOR_STATE.explorationBrief = null;
MOTOR_STATE.stampSide = 'auto';
MOTOR_STATE.workflowMode = 'new';
MOTOR_STATE.serie = '';
MOTOR_STATE.concept = 'Walk by Faith';
MOTOR_STATE.message = 'WALK BY FAITH';

const candidate = buildCandidate(resolveAudiences(), null);
const baseline = _validateCreativeContract(candidate, {});
assert.equal(baseline.ok, true, 'un candidato normal debe cumplir el contrato: ' + baseline.errors.join(' | '));

const badArchitecture = JSON.parse(JSON.stringify(candidate));
badArchitecture.A.layout = 'Columna apilada';
badArchitecture.A.distribucionTexto = 'DIAGONAL ascendente izquierda-derecha; texto sobre un eje diagonal.';
assert.equal(_validateCreativeContract(badArchitecture, {}).ok, false,
  'el contrato debe rechazar arquitectura incompatible con layout');

const repaired = JSON.parse(JSON.stringify(badArchitecture));
const repair = _reconcileCreativeStructure(repaired);
assert.ok(repair.changes.some(change => change.ficha === 'A' && change.eje === 'arquitectura'),
  'la reconciliación final debe reparar arquitectura derivada');
assert.equal(_validateCreativeContract(repaired, {}).ok, true,
  'la ficha reparada debe volver a cumplir el contrato');

const duplicateArchitecture = JSON.parse(JSON.stringify(candidate));
duplicateArchitecture.B.distribucionTexto = duplicateArchitecture.A.distribucionTexto;
const duplicateRepair = _reconcileCreativeStructure(duplicateArchitecture);
assert.ok(duplicateRepair.changes.some(change => change.ficha === 'B' && change.eje === 'arquitectura'),
  'la reconciliación debe separar arquitecturas repetidas cuando existe alternativa compatible');
assert.equal(new Set(['A', 'B', 'C'].map(key => duplicateArchitecture[key].distribucionTexto)).size, 3,
  'la reparación no debe clonar arquitectura textual entre fichas');
assert.equal(_validateCreativeContract(duplicateArchitecture, {}).ok, true,
  'el set con arquitectura repetida reparada debe cumplir el contrato');

const badIntegration = JSON.parse(JSON.stringify(candidate));
badIntegration.A.layout = 'Columna apilada';
badIntegration.A.integracionTexto = 'una cinta que envuelve el texto y el símbolo';
assert.equal(_validateCreativeContract(badIntegration, {}).ok, false,
  'el contrato debe detectar integración incompatible');

const brokenLock = _validateCreativeContract(candidate, { estilo: { A: 'ESTILO DISTINTO' } });
assert.equal(brokenLock.ok, false, 'un lock explícito no puede alterarse silenciosamente');

const missingSoloObject = JSON.parse(JSON.stringify(candidate));
missingSoloObject.A.jerarquiaVisual = 'SOLO_OBJETO';
missingSoloObject.A.objeto = '';
assert.equal(_validateCreativeContract(missingSoloObject, {}).ok, false,
  'SOLO_OBJETO requiere un motivo autorizado aunque no imprima texto');

const incomplete = JSON.parse(JSON.stringify(candidate));
incomplete.B.tipografia = '';
assert.equal(_validateCreativeContract(incomplete, {}).ok, false,
  'una ficha incompleta no puede aprobar');

const prompt = formatPrompt({ set: candidate });
assert.ok(prompt, 'un contrato válido debe producir prompt');
assert.equal(prompt.includes('Cross & Lamp Co.'), false,
  'el nombre de marca no debe enviarse como texto al generador');
assert.equal(prompt.includes('BERESHITH CO.'), false,
  'el nombre de otra marca tampoco debe filtrarse al generador');
assert.ok(prompt.includes('metadato interno únicamente'),
  'el prompt debe conservar la regla de aislamiento sin exponer el nombre');
assert.equal(prompt.includes('ELEMENTOS SECUNDARIOS ADMITIDOS'), false,
  'SOLO_OBJETO no debe autorizar adornos decorativos por defecto');

console.log('PASS creative-contract-guard: reconciliation, locks, required fields, prompt brand isolation and decorative restrictions');
