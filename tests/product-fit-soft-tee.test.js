/* RT-04 — fit de producto para CAMISETA SOFT.
   Verifica que las tres arquitecturas estructurales permitidas por el contrato
   HEAVY/SOFT/MODERN no sean penalizadas por preferencias incompletas del producto.
   No reduce umbrales ni modifica requisitos técnicos de impresión. */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ROOT = path.join(__dirname, '..');
global.window = global;
global.document = {
  getElementById: function () { return null; },
  querySelectorAll: function () { return []; },
  createElement: function () { return { className: '', innerHTML: '', appendChild: function () {}, addEventListener: function () {} }; }
};
const JS = path.join(ROOT, 'js');
[
  'data-mercados.js', 'data-audiencias.js', 'data-bancos.js', 'data-estilos.js',
  'dominios.js', 'data-productos.js', 'memoria-local.js', 'motor-nucleo.js'
].forEach(function (file) {
  vm.runInThisContext(fs.readFileSync(path.join(JS, file), 'utf8'), { filename: file });
});
let checks = 0;
const failures = [];
function ok(value, message) { checks++; if (!value) failures.push(message); }
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
MOTOR_STATE.market = 'gospel_es';
MOTOR_STATE.region = 'universal_es';
MOTOR_STATE.product = 'CAMISETA SOFT';
MOTOR_STATE.subniche = 'auto';
MOTOR_STATE.dominio = 'auto';
MOTOR_STATE.dominioDetectado = 'auto';
MOTOR_STATE.workflowMode = 'explore';
MOTOR_STATE.designMode = 'contacto';
MOTOR_STATE.groupMode = 'distintos';
MOTOR_STATE.audienceSet = 'Auto';
MOTOR_STATE.audienceMulti = 'si';
MOTOR_STATE.concept = 'la gracia de Dios se recibe como don';
MOTOR_STATE.message = 'LA GRACIA DE DIOS SE RECIBE COMO DON';
MOTOR_STATE.support = '';
MOTOR_STATE.serie = '';
MOTOR_STATE.explorationBrief = null;
const bias = getProductBias('CAMISETA SOFT');
const originalLog = console.log;
console.log = function () {};
try {
  for (let seed = 1; seed <= 24; seed++) {
    Math.random = mulberry32(seed);
    MOTOR_STATE._rerollNonce = seed;
    const set = buildCandidate(resolveAudiences(), null);
    ['A', 'B', 'C'].forEach(function (key) {
      const card = set[key];
      ok(card.fitProducto === 100,
        'seed ' + seed + ' / ' + key + ' (' + card.perfilEstructural + '): fitProducto esperado 100; recibido ' +
        card.fitProducto + ' | layout=' + card.layout + ' | jerarquía=' + card.jerarquiaVisual +
        ' | densidad=' + card.densidad);
      ok(bias.layout.some(function (layout) { return String(card.layout).startsWith(layout); }),
        'seed ' + seed + ' / ' + key + ': layout generado debe estar en las preferencias del producto');
      ok(bias.hierarchy.indexOf(card.jerarquiaVisual) !== -1,
        'seed ' + seed + ' / ' + key + ': jerarquía del perfil debe estar admitida por CAMISETA SOFT');
    });
  }
} finally {
  console.log = originalLog;
}
ok(bias.scale.indexOf('pecho medio FRONTAL') !== -1, 'RT-04 no debe alterar placement/escala de pecho medio frontal');
ok(bias.scale.indexOf('cero microtexto') !== -1, 'RT-04 conserva la prohibición de microtexto');
ok(bias.safeMargin.indexOf('costuras') !== -1, 'RT-04 conserva márgenes de costuras');
ok(getPrintPrepRule('CAMISETA SOFT', 'dtf').indexOf('sin halos') !== -1, 'RT-04 no debilita los requisitos DTF');
const passed = failures.length === 0;
console.log((passed ? 'PASS' : 'FAIL') + ' RT-04 product fit (' + checks + ' assertions, ' + failures.length + ' failures)');
failures.forEach(function (failure) { console.log('  X ' + failure); });
process.exit(passed ? 0 : 1);
