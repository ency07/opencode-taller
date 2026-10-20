/* Gate de ejes (DEBT-002): jerarquía/densidad/espacio negativo únicos en Auto;
   locks manuales permiten repetir. Ejecutar: node tests/gate-axes.test.js */

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

MOTOR_STATE.market = 'colombia';
MOTOR_STATE.region = 'todas';
MOTOR_STATE.product = 'CAMISETA SOFT';
MOTOR_STATE.subniche = 'celebracion_col';
MOTOR_STATE.audienceSet = 'Auto';
MOTOR_STATE.audienceMulti = 'si';
MOTOR_STATE.groupMode = 'distintos';
MOTOR_STATE.designMode = 'contacto';
MOTOR_STATE.explorationBrief = null;
MOTOR_STATE.stampSide = 'auto';
MOTOR_STATE.workflowMode = 'new';
MOTOR_STATE.concept = 'aventura al amanecer';
MOTOR_STATE.message = 'Comienza hoy';

/* --- 1) generación real: densidad y espacio negativo distintos --- */
let success = 0;
for (let ronda = 0; ronda < 12; ronda++) {
  clearLocks(memLocksMarket(), 'CAMISETA SOFT');
  MOTOR_STATE._rerollNonce = ronda;
  const res = buildCandidate(resolveAudiences(), null);
  if (new Set([res.A.densidad, res.B.densidad, res.C.densidad]).size === 3) success++;
  if (new Set([res.A.negativeSpace, res.B.negativeSpace, res.C.negativeSpace]).size === 3) success++;
}
ok(success === 24, 'en 12 rondas reales: densidad y espacio negativo SIEMPRE distintos (' + success + '/24)');

/* --- 2) evaluaSetOk marca densidad repetida --- */
function ficha(over) {
  const base = {
    jerarquiaVisual: 'BALANCEADO', estilo: 'Folk Popular', objeto: 'sombrero', audiencia: 'nacional_gen',
    tratamiento: 'HEAVY: masas', perfilEstructural: 'HEAVY', layout: 'diagonal: bloque arriba',
    tipografia: 'Slab A', formaSimbolo: 'silueta A', integracionTexto: 'integración A',
    densidad: 'media equilibrada', negativeSpace: 'aire A', cara: 'frente', distribucionTexto: 'bloque A',
    familiaColor: 'sepia', tecnica: 'Tinta A', textoPrincipal: 'x / y / z',
    fitAudiencia: 90, fitProducto: 90
  };
  return Object.assign({}, base, over || {});
}
let resEv = evaluaSetOk({
  A: ficha({}),
  B: ficha({ densidad: 'media equilibrada', jerarquiaVisual: 'TEXTO_DOMINANTE', layout: 'zócalo: texto abajo' }),
  C: ficha({ densidad: 'baja suave', jerarquiaVisual: 'OBJETO_DOMINANTE', layout: 'central: símbolo solo' })
});
ok(resEv.detalle.indexOf('densidad repetida') !== -1, 'evaluaSetOk marca densidad repetida');

/* --- 3) jerarquía repetida entre tarjetas Auto → rechazo --- */
resEv = evaluaSetOk({
  A: ficha({ jerarquiaVisual: 'BALANCEADO' }),
  B: ficha({ jerarquiaVisual: 'BALANCEADO', layout: 'zócalo: texto abajo' }),
  C: ficha({ jerarquiaVisual: 'OBJETO_DOMINANTE', layout: 'central: símbolo solo', densidad: 'alta core' })
});
ok(resEv.detalle.indexOf('jerarquía repetida entre tarjetas Auto') !== -1, 'debe marcar jerarquía repetida entre Auto');
ok(resEv.detalle.indexOf('espacio negativo repetido') === -1 || resEv.passed === false, 'cosistente con el detalle de ejes');

/* --- 4) lock manual: repetir jerarquía es decisión del usuario --- */
setLockValue(memLocksMarket(), 'CAMISETA SOFT', 'jerarquia', 'A', 'SOLO_TEXTO');
setLockValue(memLocksMarket(), 'CAMISETA SOFT', 'jerarquia', 'B', 'SOLO_TEXTO');
resEv = evaluaSetOk({
  A: ficha({ jerarquiaVisual: 'SOLO_TEXTO' }),
  B: ficha({ jerarquiaVisual: 'SOLO_TEXTO', layout: 'zócalo: texto abajo' }),
  C: ficha({ jerarquiaVisual: 'OBJETO_DOMINANTE', layout: 'central: símbolo solo', densidad: 'alta core' })
});
ok(resEv.detalle.indexOf('jerarquía repetida entre tarjetas Auto') === -1, 'con locks manuales repetidos NO se marca fallo de jerarquía');
clearLocks(memLocksMarket(), 'CAMISETA SOFT');

console.log((failures.length ? 'FAIL' : 'PASS') + ' gate-axes (' + checks + ' aserciones, ' + failures.length + ' fallos)');
failures.forEach(function (msg) { console.error(' - ' + msg); });
process.exit(failures.length ? 1 : 0);
