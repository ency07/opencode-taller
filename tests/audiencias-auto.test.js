/* Audiencias Auto: en Auto nada se repite; locks intocables; pool corto = avenida.
   Ejecutar: node tests/audiencias-auto.test.js
   Sale con código 1 si algo falla. */

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

function baseState() {
  MOTOR_STATE.market = 'colombia';
  MOTOR_STATE.region = 'todas';
  MOTOR_STATE.product = 'CAMISETA SOFT';
  MOTOR_STATE.subniche = 'celebracion_col';
  MOTOR_STATE.audienceSet = 'Auto';
  MOTOR_STATE.audienceMulti = 'no';
  MOTOR_STATE.groupMode = 'distintos';
  MOTOR_STATE.designMode = 'contacto';
  MOTOR_STATE.support = '';
  MOTOR_STATE.explorationBrief = null;
  MOTOR_STATE.stampSide = 'auto';
  MOTOR_STATE.workflowMode = 'new';
  MOTOR_STATE.concept = 'águila calva sobre el cañón';
  MOTOR_STATE.message = 'Aguanta firme';
  MOTOR_STATE._rerollNonce = 0;
}

/* --- 1) Auto sin multi: 3 audiencias distintas --- */
baseState();
let auds = resolveAudiences();
ok(new Set(Object.values(auds)).size === 3, 'en Auto, A/B/C deben tener audiencias distintas');
let set = buildCandidate(auds, null);
let prompt = formatPrompt({ set: set });
ok(prompt.indexOf('AUDIENCIA (AVISO)') === -1, 'con pool grande no debe avisar');

/* --- 2) Lock manual: A fija, B/C Auto siguen sin repetirse ni con A --- */
baseState();
setLockValue(memLocksMarket(), 'CAMISETA SOFT', 'audiencia', 'A', 'infantil_col');
auds = resolveAudiences();
ok(auds.A === 'infantil_col', 'el lock manual de A se respeta');
ok(auds.B !== auds.A && auds.C !== auds.A && auds.B !== auds.C, 'B/C Auto no repiten la audiencia bloqueada ni entre sí');
clearLocks(memLocksMarket(), 'CAMISETA SOFT');

/* --- 3) Determinismo estable: mismo estado, misma respuesta (sin nonce) --- */
baseState();
const primero = resolveAudiences();
const segundo = resolveAudiences();
ok(primero.A === segundo.A && primero.B === segundo.B && primero.C === segundo.C, 'mismo estado → misma asignación (estable, estable)');

/* --- 4) Audiencia elegida por el usuario se comparte (decisión explícita) --- */
baseState();
MOTOR_STATE.audienceSet = 'infantil_col';
auds = resolveAudiences();
ok(Object.values(auds).every(function (v) { return v === 'infantil_col'; }), 'audiencia específica elegida se cumple en todas las fichas');

/* --- 5) Pool corto: AVISO válido, nada se bloquea --- */
baseState();
const poolReal = getCurrentAudiencePool();
const poolCorto = poolReal.slice(0, 2);
const original = getCurrentAudiencePool;
getCurrentAudiencePool = function () { return poolCorto; };
try {
  auds = resolveAudiences();
  ok(Object.keys(auds).length === 3, 'todas las fichas reciben audiencia aunque el pool sea corto');
  ok(!!MOTOR_STATE._audsShort, 'pool corto queda marcado como aviso');
  set = buildCandidate(auds, null);
  prompt = formatPrompt({ set: set });
  ok(prompt.indexOf('AUDIENCIA (AVISO)') !== -1, 'el prompt incluye el aviso de pool corto');
  ok(prompt.indexOf('no bloquea la hoja') !== -1, 'el aviso declara que no bloquea');
} finally {
  getCurrentAudiencePool = original;
  MOTOR_STATE._audsShort = null;
}

console.log((failures.length ? 'FAIL' : 'PASS') + ' audiencias-auto (' + checks + ' aserciones, ' + failures.length + ' fallos)');
failures.forEach(function (msg) { console.error(' - ' + msg); });
process.exit(failures.length ? 1 : 0);
