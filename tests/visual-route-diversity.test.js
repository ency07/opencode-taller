/* Regresión P1: rutas de representación visual exclusivas A/B/C.
   Ejecutar: node tests/visual-route-diversity.test.js
   Valida el contrato del prompt; NO certifica imágenes generadas. */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const motor = fs.readFileSync(path.join(__dirname, '..', 'js/motor-nucleo.js'), 'utf8');
const start = motor.indexOf('const _VISUAL_EXPRESSION_ROUTES = {');
const end = motor.indexOf('function _pickFresh(biasPool, fullPool, used)', start);
assert.ok(start >= 0 && end > start, 'debe existir el catálogo de rutas visuales antes de _pickFresh');

const routeSource = motor.slice(start, end);
const context = {};
vm.runInNewContext(routeSource, context);
const routes = ['A', 'B', 'C'].map(key => context._visualExpressionRoute(key));
assert.equal(new Set(routes).size, 3, 'A/B/C deben recibir rutas distintas');
assert.match(routes[0], /SOLID FORM \/ MASS/);
assert.match(routes[1], /GESTURE \/ DIRECTION/);
assert.match(routes[2], /GRID \/ NEGATIVE SPACE/);
assert.ok(routes.every(route => /same authorized concept/.test(route)), 'las tres rutas deben conservar el mismo concepto');
assert.ok(routes.every(route => /do not add a scene or a new physical object/.test(route)), 'las rutas no deben autorizar objetos o escenas nuevos');

const patternStart = motor.indexOf('function _isPatternModeActive() {');
const patternEnd = motor.indexOf('function _isLockedContactSet()', patternStart);
assert.ok(patternStart >= 0 && patternEnd > patternStart, 'debe existir _isPatternModeActive antes de _isLockedContactSet');
const patternSource = motor.slice(patternStart, patternEnd);
const patternCases = [
  { product: 'CAMISETA SOFT', designMode: 'patron', workflowMode: 'new', expected: false },
  { product: 'MOCHILA', designMode: 'patron', workflowMode: 'new', expected: true },
  { product: 'TOTE BAG', designMode: 'patron', workflowMode: 'new', expected: true },
  { product: 'FUNDA MÓVIL', designMode: 'patron', workflowMode: 'new', expected: true },
  { product: 'MOCHILA', designMode: 'contacto', workflowMode: 'new', expected: false },
  { product: 'GORRA', designMode: 'patron', workflowMode: 'new', expected: false },
  { product: 'MOCHILA', designMode: 'patron', workflowMode: 'variation', expected: false }
];
patternCases.forEach((scenario, index) => {
  const context = { MOTOR_STATE: Object.assign({}, scenario) };
  vm.runInNewContext(patternSource, context);
  assert.equal(context._isPatternModeActive(), scenario.expected,
    'caso ' + (index + 1) + ': _isPatternModeActive debe respetar producto, modo y diseño');
});

assert.match(motor, /v\.rutaVisual = \(!isVar && !_isPatternModeActive\(\)\) \? _visualExpressionRoute\(k\) : ''/);
assert.match(motor, /v\.motivoVisual = \(!isVar && !_isPatternModeActive\(\)\)/);
assert.match(motor, /RUTA VISUAL EXCLUSIVA DE ESTA FICHA/);
assert.match(motor, /DIVERSIDAD DE MOTIVO: A\/B\/C conservan el mismo concepto y ancla semántica/);
assert.match(motor, /no queda autorizado por el estilo: solo se usa si está nombrado o se deriva directamente del significado literal del concepto/);
assert.match(motor, /if \(v\.rutaVisual\) o \+=/);
assert.match(motor, /const options = \(setMotifPlan && setMotifPlan\.list\) \|\| \[\]/, 'la selección del ancla semántica existente debe mantenerse');
assert.match(motor, /v\.objeto = obj \|\|/, 'la ruta visual no debe sustituir el objeto/ancla');

console.log('PASS visual-route-diversity: three exclusive routes, shared semantic anchor, no unauthorized objects');
