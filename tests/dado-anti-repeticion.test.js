/* Anti-repetición del dado por ficha (rama fix/dado-anti-repeticion).
   El dado solo puntuaba (soft): la ganadora duplicaba a las conservadas en
   tipografía 24%, jerarquía 22%, fondo 19%... Ahora la exclusión es dura:
   lo que repite cualquier eje con las conservadas no entra.
   - Unitario: _ejesRepetidosConConservadas detecta cada eje.
   - Integración: selección con exclusión sobre candidatos reales → 0 choques.
   - Cableado: rerollSingle excluye, registra layout y recalcula score/passed.

   Ejecutar:  node tests/dado-anti-repeticion.test.js
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
['data-mercados.js', 'data-audiencias.js', 'data-bancos.js', 'data-estilos.js',
 'dominios.js', 'data-productos.js', 'memoria-local.js', 'motor-nucleo.js'
].forEach(function (f) {
  vm.runInThisContext(fs.readFileSync(path.join(JS, f), 'utf8'), { filename: f });
});

function ficha(vals) {
  const base = {
    estilo: 'E0', layout: 'L0', tipografia: 'T0', formaSimbolo: 'F0',
    integracionTexto: 'I0', distribucionTexto: 'D0', familiaColor: 'C0',
    tecnica: 'X0', jerarquiaVisual: 'BALANCEADO', tratamiento: 'HEAVY: x'
  };
  if (vals) Object.keys(vals).forEach(function (k) { base[k] = vals[k]; });
  return base;
}

/* Unitario: 10 ejes detectados cuando todo coincide */
const allClash = _ejesRepetidosConConservadas(ficha(), [ficha(), ficha()]);
ok(allClash.length === 10, 'todo igual debe reportar 10 ejes (reporta ' + allClash.length + ')');

/* Unitario: 0 cuando todo difiere */
const noneClash = _ejesRepetidosConConservadas(ficha(), [ficha({ estilo: 'E1', layout: 'L1', tipografia: 'T1', formaSimbolo: 'F1', integracionTexto: 'I1', distribucionTexto: 'D1', familiaColor: 'C1', tecnica: 'X1', jerarquiaVisual: 'TEXTO_DOMINANTE', tratamiento: 'SOFT: y' })]);
ok(noneClash.length === 0, 'todo distinto debe reportar 0 ejes');

/* Unitario: nombra el eje exacto en colisión simple (todo lo demás difiere) */
['estilo', 'layout', 'tipografia', 'formaSimbolo', 'integracionTexto', 'distribucionTexto', 'familiaColor', 'tecnica', 'jerarquiaVisual', 'tratamiento'].forEach(function (ax) {
  const va = { estilo: 'EA', layout: 'LA', tipografia: 'TA', formaSimbolo: 'FA', integracionTexto: 'IA', distribucionTexto: 'DA', familiaColor: 'CA', tecnica: 'XA', jerarquiaVisual: 'BALANCEADO', tratamiento: 'HEAVY: a' };
  const wb = { estilo: 'EB', layout: 'LB', tipografia: 'TB', formaSimbolo: 'FB', integracionTexto: 'IB', distribucionTexto: 'DB', familiaColor: 'CB', tecnica: 'XB', jerarquiaVisual: 'TEXTO_DOMINANTE', tratamiento: 'SOFT: b' };
  wb[ax] = va[ax];
  const r = _ejesRepetidosConConservadas(va, [wb]);
  ok(r.length === 1 && r[0] === ax, 'colisión simple debe nombrar [' + ax + '] (dio ' + JSON.stringify(r) + ')');
});

/* Excepción: paleta conservada en variación no bloquea */
const palClash = _ejesRepetidosConConservadas(
  ficha({ familiaColor: '(paleta de la imagen)' }),
  [ficha({ familiaColor: '(paleta de la imagen)' })]
);
ok(palClash.indexOf('familiaColor') === -1, 'paleta conservada no debe contar como choque');

/* Integración: exclusión sobre candidatos reales → 0 choques + no es vacua */
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
Math.random = mulberry32(6060);
MOTOR_STATE.workflowMode = 'explore';
MOTOR_STATE.designMode = 'contacto';
MOTOR_STATE.market = 'colombia';
MOTOR_STATE.region = 'global';
MOTOR_STATE.product = 'CAMISETA SOFT';
MOTOR_STATE.subniche = 'auto';
MOTOR_STATE.dominio = 'auto';
MOTOR_STATE.dominioDetectado = 'auto';
MOTOR_STATE.audienceSet = 'Auto';
MOTOR_STATE.audienceMulti = 'si';
MOTOR_STATE.groupMode = 'distintos';
MOTOR_STATE.message = '';
MOTOR_STATE.support = '';
MOTOR_STATE.explorationBrief = null;
MOTOR_STATE.concept = 'fogata para dado';
const keptSet = buildCandidate(resolveAudiences(), null);
const keptOthers = ['B', 'C'].map(function (k) { return keptSet[k]; });
let filtrados = 0, probados = 0, choques = 0;
for (let i = 0; i < 200; i++) {
  const cand = buildCandidate(resolveAudiences(), null);
  const v = cand && cand.A;
  if (!v) continue;
  probados++;
  const cl = _ejesRepetidosConConservadas(v, keptOthers);
  if (cl.length) { filtrados++; continue; }
  const resto = _ejesRepetidosConConservadas(v, keptOthers);
  if (resto.length) choques++;
}
ok(probados > 150, 'se probaron suficientes candidatos (' + probados + ')');
ok(filtrados > 0, 'la exclusión debe filtrar candidatos reales (filtró ' + filtrados + ')');
ok(choques === 0, 'ningún aceptado debe chocar con las conservadas');

/* evaluaSetOk comparte fuente con generateSet */
const ev = evaluaSetOk(keptSet);
ok(ev && ev.score && typeof ev.passed === 'boolean', 'evaluaSetOk debe devolver {score, passed}');
ok(typeof ev.score.total === 'number', 'el score debe traer total numérico');

/* Cableado en rerollSingle y generateSet */
const motorSrc = fs.readFileSync(path.join(JS, 'motor-nucleo.js'), 'utf8');
ok(/_ejesRepetidosConConservadas\(v, keptCards\)/.test(motorSrc), 'el dado debe excluir contra las conservadas');
ok(/if \(clashes\.length\) continue;/.test(motorSrc), 'el choque debe descartar al candidato');
ok(/_recordLayoutSet\(LAST_RESULT\.set\)/.test(motorSrc), 'el dado debe registrar layouts en memoria');
ok(/LAST_RESULT\.score = freshEval\.score/.test(motorSrc), 'el dado debe recalcular score');
ok(/LAST_RESULT\.passed = freshEval\.passed/.test(motorSrc), 'el dado debe recalcular passed');
ok(/10\/10 verificado/.test(motorSrc), 'el status debe mostrar la verificación');
ok(/const ev = evaluaSetOk\(cand\)/.test(motorSrc), 'generateSet debe usar la fuente compartida');

const passed = failures.length === 0;
console.log((passed ? 'PASS' : 'FAIL') + '  dado-anti-repeticion  (' + checks + ' aserciones, ' + failures.length + ' fallos)');
failures.forEach(function (f) { console.log('  X ' + f); });
process.exit(passed ? 0 : 1);
