/* Anti-repetición estricta intra-set (rama fix/anti-repeticion-estricta).
   Black-box: ejecuta buildCandidate() de verdad en 2 modos × 25 generaciones
   y exige 3 valores distintos por eje en cada set A/B/C. El objeto se excluye:
   en explore/contacto se comparte por diseño (no es eje de diversidad).

   Ejecutar:  node tests/anti-repeticion.test.js
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
Math.random = mulberry32(20261015);

function distinct3(set, field, fmt) {
  const vals = ['A', 'B', 'C'].map(function (k) { return fmt ? fmt(set[k][field]) : set[k][field]; });
  return new Set(vals).size === 3 ? null : field + ' repite [' + vals.join(' | ') + ']';
}

const AXES = [
  ['estilo', null],
  ['layout', null],
  ['tipografia', null],
  ['formaSimbolo', null],
  ['tratamiento', null],
  ['tratamiento', _treatmentKey],
  ['integracionTexto', null],
  ['distribucionTexto', null],
  ['familiaColor', null],
  ['tecnica', null],
  ['jerarquiaVisual', null],
  ['densidad', null],
  ['negativeSpace', null]
];

function runBlock(mode, seedConcept, seedMessage) {
  let violations = 0;
  const GENS = 25;
  for (let g = 0; g < GENS; g++) {
    MOTOR_STATE.workflowMode = mode;
    MOTOR_STATE.designMode = 'contacto';
    MOTOR_STATE.market = g % 2 ? 'colombia' : 'global_en';
    MOTOR_STATE.region = 'global';
    MOTOR_STATE.product = 'CAMISETA SOFT';
    MOTOR_STATE.subniche = 'auto';
    MOTOR_STATE.dominio = 'auto';
    MOTOR_STATE.dominioDetectado = 'auto';
    MOTOR_STATE.audienceSet = 'Auto';
    MOTOR_STATE.audienceMulti = 'si';
    MOTOR_STATE.groupMode = 'distintos';
    MOTOR_STATE.concept = seedConcept + '-' + g;
    MOTOR_STATE.message = seedMessage ? seedMessage + ' ' + g : '';
    MOTOR_STATE.support = '';
    MOTOR_STATE.explorationBrief = null;
    const auds = resolveAudiences();
    let fixedIdentity = null;
    if (mode === 'new') {
      const ident = _resolveContactIdentity(getObjectPool());
      fixedIdentity = (ident && ident.ok) ? ident : null;
    }
    const set = buildCandidate(auds, fixedIdentity);
    AXES.forEach(function (ax) {
      const bad = distinct3(set, ax[0], ax[1]);
      if (bad) { violations++; failures.push(mode + ' gen' + g + ': ' + bad); checks++; }
      else checks++;
    });
  }
  return violations;
}

const vExplore = runBlock('explore', 'fogata pequeña para conversar', '');
const vNew = runBlock('new', 'cruz y roca firme', 'DIOS ES MI ROCA Y MI SALVACIÓN');
ok(vExplore === 0, 'explore: ' + vExplore + ' repeticiones intra-set en 25 generaciones');
ok(vNew === 0, 'new: ' + vNew + ' repeticiones intra-set en 25 generaciones');

/* El gate duro de generateSet debe cubrir los 2 ejes nuevos (con excepción
   documentada para conservarPaleta en variación). */
const motorSrc = fs.readFileSync(path.join(JS, 'motor-nucleo.js'), 'utf8');
ok(/cand\[k\]\.tecnica; \}\)\)\.size === 3/.test(motorSrc), 'ejesOk debe exigir 3 técnicas distintas');
ok(/cand\.A\.familiaColor === '\(paleta de la imagen\)'/.test(motorSrc), 'ejesOk debe exigir 3 fondos distintos salvo conservarPaleta');

const passed = failures.length === 0;
console.log((passed ? 'PASS' : 'FAIL') + '  anti-repeticion  (' + checks + ' aserciones, ' + failures.length + ' fallos)');
failures.slice(0, 12).forEach(function (f) { console.log('  X ' + f); });
if (failures.length > 12) console.log('  ... y ' + (failures.length - 12) + ' más');
process.exit(passed ? 0 : 1);
