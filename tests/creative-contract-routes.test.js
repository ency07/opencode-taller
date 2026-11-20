/* Regresión P0: el validador central debe exigir las representaciones visuales
   A/B/C del contactsheet antes de permitir generar/copiar el prompt. */
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
MOTOR_STATE.workflowMode = 'new';
MOTOR_STATE.serie = '';
MOTOR_STATE.concept = 'Walk by Faith';
MOTOR_STATE.message = 'WALK BY FAITH';

const candidate = buildCandidate(resolveAudiences(), null);
const baseline = _validateCreativeContract(candidate, {});
assert.equal(baseline.ok, true, 'un contactsheet normal debe validar: ' + baseline.errors.join(' | '));

const missingRoute = JSON.parse(JSON.stringify(candidate));
missingRoute.A.rutaVisual = '';
const missingRouteResult = _validateCreativeContract(missingRoute, {});
assert.equal(missingRouteResult.ok, false, 'una ruta visual vacía debe impedir generar');
assert.ok(missingRouteResult.errors.some(error => /ruta visual/.test(error)), missingRouteResult.errors.join(' | '));
assert.equal(formatPrompt({ set: missingRoute }), '', 'formatPrompt debe bloquear un contrato inválido');

const missingMotif = JSON.parse(JSON.stringify(candidate));
missingMotif.B.motivoVisual = '';
const missingMotifResult = _validateCreativeContract(missingMotif, {});
assert.equal(missingMotifResult.ok, false, 'un motivo visual vacío debe impedir generar');
assert.ok(missingMotifResult.errors.some(error => /motivo visual/.test(error)), missingMotifResult.errors.join(' | '));

const duplicateRoutes = JSON.parse(JSON.stringify(candidate));
duplicateRoutes.B.rutaVisual = duplicateRoutes.A.rutaVisual;
const duplicateRoutesResult = _validateCreativeContract(duplicateRoutes, {});
assert.equal(duplicateRoutesResult.ok, false, 'las rutas visuales A/B/C no pueden repetirse');
assert.ok(duplicateRoutesResult.errors.some(error => /rutas visuales/.test(error)), duplicateRoutesResult.errors.join(' | '));

const missingTechnique = JSON.parse(JSON.stringify(candidate));
missingTechnique.A.tecnica = '';
const missingTechniqueResult = _validateCreativeContract(missingTechnique, {});
assert.equal(missingTechniqueResult.ok, false, 'una técnica vacía debe impedir generar');
assert.ok(missingTechniqueResult.errors.some(error => /falta técnica|técnica/.test(error)), missingTechniqueResult.errors.join(' | '));

const objectTechnique = JSON.parse(JSON.stringify(candidate));
objectTechnique.A.tecnica = 'Filacteria tallada';
const objectTechniqueResult = _validateCreativeContract(objectTechnique, {});
assert.equal(objectTechniqueResult.ok, false, 'una técnica que introduce objetos anexos debe impedir generar');
assert.ok(objectTechniqueResult.errors.some(error => /objetos anexos/.test(error)), objectTechniqueResult.errors.join(' | '));

const duplicateMotifs = JSON.parse(JSON.stringify(candidate));
duplicateMotifs.C.motivoVisual = duplicateMotifs.A.motivoVisual;
const duplicateMotifsResult = _validateCreativeContract(duplicateMotifs, {});
assert.equal(duplicateMotifsResult.ok, false, 'los motivos visuales A/B/C no pueden repetirse');
assert.ok(duplicateMotifsResult.errors.some(error => /motivos visuales/.test(error)), duplicateMotifsResult.errors.join(' | '));

const unresolved = JSON.parse(JSON.stringify(candidate));
unresolved.creativeContractUnresolved = ['Ficha C: no existe estructura compatible'];
const unresolvedResult = _validateCreativeContract(unresolved, {});
assert.equal(unresolvedResult.ok, false, 'una reconciliación sin resolver debe impedir generar');
assert.ok(unresolvedResult.errors.some(error => /sin resolver/.test(error)), unresolvedResult.errors.join(' | '));

console.log('PASS creative-contract-routes: visual routes validated, duplicated routes rejected, unresolved contracts blocked');