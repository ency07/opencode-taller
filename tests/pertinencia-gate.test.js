/* Gate de pertinencia alcanzable (rama feat/unified-banks).
   El umbral 50/40 solo mide EJES LIBRES: un eje impuesto por el contrato de la
   serie (tratamiento fijo 01A HEAVY → 01B SOFT → 01C MODERN) o inalcanzable
   (intersección vacía entre el pool del perfil y la preferencia) no se puntúa,
   porque sumaría un fallo inevitable y haría el umbral imposible de superar.
   La firma de anti-repetición excluye el tratamiento fijo por la misma razón.

   Ejecutar:  node tests/pertinencia-gate.test.js
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
global.document = {
  getElementById: function () { return null; },
  querySelectorAll: function () { return []; },
  createElement: function () { return { className: '', innerHTML: '', appendChild: function () {}, addEventListener: function () {} }; }
};

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

/* Contexto de una serie Gospel real (mercado + 3 audiencias + explore) con la
   memoria de patrones de 4 sets recientes ya llena: el escenario donde el gate
   histórico devolvía passed=false en TODOS los candidatos. */
function seedContext(seed) {
  Math.random = mulberry32(seed);
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

  const patKey = memKey(['patterns', 'gospel_es|universal_es|auto', 'CAMISETA SOFT']);
  const estilos = ['Stencil Urbano', 'Grunge / DIY', 'Bordado / Puntada', 'Cómic / Halftone'];
  const formas = ['silueta sólida a una tinta', 'contorno lineal calibrado', 'construido por retícula visible'];
  const lays = ['Axial centrado', 'Sello descentrado', 'Tarjeta interior'];
  const cols = ['industrial', 'tinta / ritual', 'dorado / premium'];
  const mem = [];
  for (let s = 0; s < 4; s++) {
    ['HEAVY', 'SOFT', 'MODERN'].forEach(function (t, i) {
      mem.push({
        t: '2026-10-28T20:00:0' + s + '.000Z',
        pattern: {
          estilo: estilos[(s + i) % estilos.length],
          formaSimbolo: formas[i],
          tratamiento: t,
          layout: lays[(s + i) % lays.length],
          familiaColor: cols[(s + i) % cols.length]
        },
        meta: { serie: '', subniche: 'auto' }
      });
    });
  }
  setJSON(patKey, mem);
  return patKey;
}

function probe(seed, n) {
  const patKey = seedContext(seed);
  const auds = resolveAudiences();
  const res = {
    n: n, passed: 0, umbral: 0, patrones: 0,
    audMinBajo: 0, heavyProd: {}, productMinVals: {}
  };
  for (let i = 0; i < n; i++) {
    const cand = buildCandidate(auds, null);
    const ev = evaluaSetOk(cand);
    const d = ev.detalle || [];
    const has = function (p) { return d.some(function (x) { return x.indexOf(p) !== -1; }); };
    if (ev.passed) res.passed++;
    if (has('Por debajo del umbral')) res.umbral++;
    if (has('patrones recientes repetidos')) res.patrones++;
    if (ev.score.fitAudienciaMin < UMBRAL_AUDIENCIA_MIN) res.audMinBajo++;
    res.heavyProd[cand.A.fitProducto] = (res.heavyProd[cand.A.fitProducto] || 0) + 1;
    res.productMinVals[ev.score.fitProductoMin] = (res.productMinVals[ev.score.fitProductoMin] || 0) + 1;
  }
  removeRaw(patKey);
  return res;
}

const runs = [probe(1, 400), probe(7, 400)];

runs.forEach(function (r, idx) {
  ok(r.passed >= 40, 'seed ' + (idx + 1) + ': el gate debe ser alcanzable (pasan ' + r.passed + '/' + r.n + ', mín 40)');
  ok(r.patrones < r.n, 'seed ' + (idx + 1) + ': la memoria de patrones no debe bloquear todos los candidatos (bloquea ' + r.patrones + '/' + r.n + ')');
  ok(r.audMinBajo === 0, 'seed ' + (idx + 1) + ': ninguna serie debe bajar de audiencia mín ' + UMBRAL_AUDIENCIA_MIN + ' (' + r.audMinBajo + ' casos)');
});

/* La ficha HEAVY puntúa solo los ejes libres de producto (layout y jerarquía):
   tratamiento y densidad los fija el perfil, así que su fit no puede caer a
   25/75 (1 o 3 de 4) sino solo a 0/50/100 (0, 1 o 2 de 2). */
runs.forEach(function (r, idx) {
  const claves = Object.keys(r.heavyProd);
  ok(claves.length > 0, 'seed ' + (idx + 1) + ': la ficha HEAVY debe tener fit de producto');
  ok(claves.every(function (c) { return Number(c) % 50 === 0; }),
    'seed ' + (idx + 1) + ': la ficha HEAVY solo puntúa ejes libres (valores ' + claves.join(', ') + ')');
  ok(Object.keys(r.productMinVals).some(function (c) { return Number(c) >= UMBRAL_PRODUCTO_MIN; }),
    'seed ' + (idx + 1) + ': debe existir series con producto mínimo ≥ ' + UMBRAL_PRODUCTO_MIN);
});

/* El tratamiento fijo no entra a la firma de anti-repetición (no discrimina),
   pero una serie con tratamientos libres sí lo conserva. */
const motorSrc = fs.readFileSync(path.join(JS, 'motor-nucleo.js'), 'utf8');
ok(/const tratFijo = K\.every/.test(motorSrc), 'la firma de patrón debe detectar el tratamiento fijo de la serie');
ok(/tratamiento: tratFijo \? '' :/.test(motorSrc), 'la firma debe excluir el tratamiento cuando está fijo por contrato');
ok(/SOLO puntúa ejes LIBRES|Solo puntúa ejes LIBRES/.test(motorSrc), 'el fit debe documentar que solo puntúa ejes libres');

const passed = failures.length === 0;
console.log((passed ? 'PASS' : 'FAIL') + '  pertinencia-gate  (' + checks + ' aserciones, ' + failures.length + ' fallos)');
failures.forEach(function (f) { console.log('  X ' + f); });
process.exit(passed ? 0 : 1);
