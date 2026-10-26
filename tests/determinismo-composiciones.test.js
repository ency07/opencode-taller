/* Fase 3 (Red Team): determinismo de composiciones textuales y modos jerárquicos.
   - _assignTextCompositions debe ser reproducible con las mismas entradas.
   - resolveTextImageModes debe producir la misma jerarquía con las mismas entradas.
   Ejecutar:  node tests/determinismo-composiciones.test.js
   Sale con código 1 si falla cualquier aserción. */

'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
let checks = 0;
const failures = [];
function ok(cond, msg) { checks++; if (!cond) failures.push(msg); }

global.window = global;
global.document = { getElementById: function () { return null; }, querySelectorAll: function () { return []; } };

const JS = path.join(ROOT, 'js');
['data-mercados.js', 'data-audiencias.js', 'data-bancos.js', 'banco-global.js', 'banco-gospel-es.js', 'data-estilos.js',
 'dominios.js', 'data-productos.js', 'memoria-local.js', 'motor-nucleo.js'
].forEach(function (f) { vm.runInThisContext(fs.readFileSync(path.join(JS, f), 'utf8'), { filename: f }); });

function baseState() {
  MOTOR_STATE.designMode = 'contacto';
  MOTOR_STATE.audienceSet = 'Auto';
  MOTOR_STATE.audienceMulti = 'si';
  MOTOR_STATE.groupMode = 'distintos';
  MOTOR_STATE.support = '';
  MOTOR_STATE.explorationBrief = null;
  MOTOR_STATE.stampSide = 'auto';
  MOTOR_STATE.workflowMode = 'explore';
  MOTOR_STATE.message = '';
  MOTOR_STATE.concept = '';
}

/* F3-1: composiciones textuales deterministas entre ejecuciones idénticas. */
baseState();
const compA = _assignTextCompositions();
const compB = _assignTextCompositions();
ok(JSON.stringify(compA) === JSON.stringify(compB), 'F3: _assignTextCompositions debe ser determinista con las mismas entradas');
ok([compA.A, compA.B, compA.C].every(function (x) { return _TEXT_COMPOSITION_BANK.indexOf(x) !== -1; }), 'F3: las composiciones deben proceder del banco registrado');
ok(new Set([compA.A, compA.B, compA.C]).size === 3, 'F3: composiciones A/B/C distintas (diversidad no eliminada)');

/* F3-2: la jerarquía (modo) es determinista con las mismas entradas. */
const modos1 = resolveTextImageModes({}, {}, Object.assign({}, _CONTACT_TREATMENT_ORDER));
const modos2 = resolveTextImageModes({}, {}, Object.assign({}, _CONTACT_TREATMENT_ORDER));
ok(JSON.stringify(modos1) === JSON.stringify(modos2), 'F3: resolveTextImageModes debe ser determinista con las mismas entradas');

/* F3-3: el seed de composicion deriva de los inputs pertinentes (concepto/mensaje),
   asi un cambio de concepto/config puede producir decisiones distintas. */
const seedA1 = _stableUnit([MOTOR_STATE.market, MOTOR_STATE.region, MOTOR_STATE.product, MOTOR_STATE.concept, MOTOR_STATE.message, 'A', 'text-composition'].join('|'));
const seedA2 = _stableUnit([MOTOR_STATE.market, MOTOR_STATE.region, MOTOR_STATE.product, 'Concepto-Distinto-Para-Probador', MOTOR_STATE.message, 'A', 'text-composition'].join('|'));
ok(seedA1 !== seedA2, 'F3: el seed de composicion debe variar con el concepto/mensaje de entrada');

if (failures.length) {
  failures.forEach(function (f) { console.error('FAIL: ' + f); });
  process.exit(1);
}
console.log('PASS determinismo-composiciones (' + checks + ' aserciones, 0 fallos)');
