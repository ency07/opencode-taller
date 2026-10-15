/* Rotación de layouts entre generaciones (rama fix/layout-rotacion).
   El bias de producto (4 layouts) + prefs de audiencia acaparaban: los mismos
   3–4 layouts en loop aunque el catálogo tiene 16. Black-box: genera 10 sets
   por mercado registrando cada set (misma cadencia que generateSet) y exige
   cobertura del catálogo sin que uno solo domine. Intra-set sigue estricto.

   Ejecutar:  node tests/layout-rotation.test.js
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
Math.random = mulberry32(4242);

function shortLayout(value) { return String(value || '').split(':')[0].trim(); }

function runBlock(mode, market, seedBase) {
  MOTOR_STATE.workflowMode = mode;
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
    MOTOR_STATE.message = mode === 'new' ? 'MENSAJE LARGO DE PRUEBA PARA ROTACIÓN ' + g : '';
    const auds = resolveAudiences();
    let fixedIdentity = null;
    if (mode === 'new') {
      const ident = _resolveContactIdentity(getObjectPool());
      fixedIdentity = (ident && ident.ok) ? ident : null;
    }
    const set = buildCandidate(auds, fixedIdentity);
    _recordLayoutSet(set);
    const ls = ['A', 'B', 'C'].map(function (k) { return shortLayout(set[k].layout); });
    if (new Set(ls).size !== 3) intraRepeat++;
    ls.forEach(function (l) { seen[l] = (seen[l] || 0) + 1; });
  }
  return { seen: seen, intraRepeat: intraRepeat };
}

[['explore', 'colombia'], ['explore', 'global_en'], ['new', 'colombia']].forEach(function (cfg) {
  const r = runBlock(cfg[0], cfg[1], 'rotacion-' + cfg[0] + '-' + cfg[1]);
  const keys = Object.keys(r.seen);
  const top = keys.sort(function (a, b) { return r.seen[b] - r.seen[a]; })[0];
  ok(r.intraRepeat === 0, cfg[0] + '/' + cfg[1] + ': layouts repetidos intra-set en 10 generaciones');
  ok(keys.length >= 12, cfg[0] + '/' + cfg[1] + ': solo ' + keys.length + '/16 layouts en 10 sets (mín 12)');
  ok(r.seen[top] <= 6, cfg[0] + '/' + cfg[1] + ': «' + top + '» acapara ' + r.seen[top] + '/30 slots (máx 6)');
});

/* La rotación es peso, nunca exclusión: el catálogo completo sigue elegible */
const motorSrc = fs.readFileSync(path.join(JS, 'motor-nucleo.js'), 'utf8');
ok(/base \* 0\.35/.test(motorSrc), 'los layouts recientes deben pesar menos sin excluirse');
ok(/layoutRecentSets/.test(motorSrc), 'debe existir memoria de layouts recientes por mercado/producto');

const passed = failures.length === 0;
console.log((passed ? 'PASS' : 'FAIL') + '  layout-rotation  (' + checks + ' aserciones, ' + failures.length + ' fallos)');
failures.forEach(function (f) { console.log('  X ' + f); });
process.exit(passed ? 0 : 1);
