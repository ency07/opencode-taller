/* Rotación de arquitectura textual entre generaciones (rama feat/arquitectura-rotacion).
   El banco tiene 20 arquitecturas, pero se barajaba al azar sin memoria: una misma
   arquitectura podía repetirse en corridas consecutivas. Ahora los últimos sets
   pesan ×0.35 (peso, nunca exclusión), como layout y estilos.
   Black-box: genera 10 sets por mercado registrando cada set (misma cadencia que
   generateSet) y exige cobertura del catálogo sin que una domine. Intra-set: 3 distintas.

   Ejecutar:  node tests/arquitectura-rotacion.test.js
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

function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
Math.random = mulberry32(90210);

function runBlock(market, seedBase) {
  MOTOR_STATE.workflowMode = 'explore';
  MOTOR_STATE.designMode = 'contacto';
  MOTOR_STATE.market = market;
  MOTOR_STATE.region = 'global';
  MOTOR_STATE.product = 'CAMISETA SOFT';
  MOTOR_STATE.subniche = 'auto';
  MOTOR_STATE.dominio = 'auto';
  MOTOR_STATE.dominioDetectado = 'auto';
  MOTOR_STATE.audienceSet = 'Auto';
  MOTOR_STATE.audienceMulti = 'si';
  MOTOR_STATE.groupMode = 'distintos';
  MOTOR_STATE.support = '';
  MOTOR_STATE.explorationBrief = null;
  const seen = {};
  let intraRepeat = 0;
  const GENS = 10;
  for (let g = 0; g < GENS; g++) {
    MOTOR_STATE.concept = seedBase + '-' + g;
    MOTOR_STATE.message = '';
    const set = buildCandidate(resolveAudiences(), null);
    _recordArchitectureSet(set);
    const as = ['A', 'B', 'C'].map(function (k) { return String(set[k].distribucionTexto || ''); });
    if (new Set(as).size !== 3 || as.indexOf('') !== -1) intraRepeat++;
    as.forEach(function (a) { seen[a] = (seen[a] || 0) + 1; });
  }
  return { seen: seen, intraRepeat: intraRepeat };
}

['colombia', 'global_en'].forEach(function (market) {
  const r = runBlock(market, 'arq-' + market);
  const keys = Object.keys(r.seen);
  const top = keys.sort(function (a, b) { return r.seen[b] - r.seen[a]; })[0];
  ok(r.intraRepeat === 0, market + ': arquitecturas repetidas o vacías intra-set en 10 generaciones');
  ok(keys.length >= 12, market + ': solo ' + keys.length + '/20 arquitecturas en 10 sets (mín 12)');
  ok(r.seen[top] <= 6, market + ': una arquitectura acapara ' + r.seen[top] + '/30 slots (máx 6)');
});

/* La rotación es peso, nunca exclusión; debe haber memoria por mercado/región/producto */
const motorSrc = fs.readFileSync(path.join(JS, 'motor-nucleo.js'), 'utf8');
ok(/archRecentSets/.test(motorSrc), 'debe existir memoria de arquitecturas recientes por mercado/región/producto');
ok(/recent\.has\(a\) \? 0\.35 : 1/.test(motorSrc), 'las arquitecturas recientes deben pesar ×0.35 sin excluirse');
ok(/function _recordArchitectureSet\(/.test(motorSrc), 'debe registrarse el set aceptado (misma cadencia que layouts)');
ok(/_recordArchitectureSet\(best\)/.test(motorSrc), 'generateSet debe registrar las arquitecturas del set aceptado');

const passed = failures.length === 0;
console.log((passed ? 'PASS' : 'FAIL') + '  arquitectura-rotacion  (' + checks + ' aserciones, ' + failures.length + ' fallos)');
failures.forEach(function (f) { console.log('  X ' + f); });
process.exit(passed ? 0 : 1);
