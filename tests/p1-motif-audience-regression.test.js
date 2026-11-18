/* Regresión P1: exclusión de motivos repetidos y audiencia Auto amplia.
   Ejecutar: node tests/p1-motif-audience-regression.test.js
   Valida el contrato de código/prompt; no certifica imágenes de proveedores. */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const motor = fs.readFileSync(path.join(__dirname, '..', 'js/motor-nucleo.js'), 'utf8');
new Function(motor); // sintaxis completa

function extract(startMarker, endMarker) {
  const start = motor.indexOf(startMarker);
  const end = motor.indexOf(endMarker, start);
  assert.ok(start >= 0 && end > start, 'bloque encontrado: ' + startMarker);
  return motor.slice(start, end);
}

const audienceSource = extract('function _preferredBroadAudience(pool)', 'function resolveAudiences()');
const audienceContext = {
  _AUD_PROFILES: {
    kids: { genero: 'infantil', edad: 'infantil' },
    broad: { genero: 'unisex', edad: 'todas' }
  }
};
vm.runInNewContext(audienceSource, audienceContext);
assert.equal(audienceContext._preferredBroadAudience(['kids', 'broad']), 'broad');
assert.equal(audienceContext._preferredBroadAudience(['gospel_infantil', 'gospel_comunidad']), 'gospel_comunidad');
assert.equal(audienceContext._preferredBroadAudience(['kids']), 'kids');

const motifSource = extract('function _motifExpressionDirective(key, concept)', 'function _pickFresh(biasPool, fullPool, used)');
const motifContext = {};
vm.runInNewContext(motifSource, motifContext);
const concept = 'Walk by Faith';
const routes = ['A', 'B', 'C'].map(key => motifContext._motifExpressionDirective(key, concept));
assert.equal(new Set(routes).size, 3, 'cada ficha debe recibir una representación propia');
assert.match(routes[0], /huellas\/pasos/);
assert.match(routes[1], /línea continua de recorrido/);
assert.match(routes[2], /tipografía con ritmo de avance/);
assert.ok(routes[0].includes('Sin calzado gigante, cruz, persona, montaña, mar, olas, árboles, sol, estrellas ni paisaje.'));
assert.ok(routes[1].includes('Prohibido dibujar huellas, pisadas, calzado'));
assert.ok(routes[2].includes('ninguna ilustración ni icono independiente'));
assert.match(motifContext._motifExpressionDirective('A', 'Grace is Enough'), /forma focal directamente nombrada/);
assert.match(motifContext._motifExpressionDirective('B', 'Grace is Enough'), /gesto gráfico abstracto/);
assert.match(motifContext._motifExpressionDirective('C', 'Grace is Enough'), /tipografía, contraformas y espacio negativo/);

assert.match(motor, /sharedAudience = _preferredBroadAudience\(pool\)/);
assert.match(motor, /v\.motivoVisual = \(MOTOR_STATE\.workflowMode === 'explore'/);
assert.match(motor, /MOTIVO \/ REPRESENTACIÓN EXCLUSIVA/);
assert.match(motor, /no construyas una escena ni añadas objetos físicos por asociación libre/);

console.log('PASS p1-motif-audience-regression: motif separation and broad Auto audience');
