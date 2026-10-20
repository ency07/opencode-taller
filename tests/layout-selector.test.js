/* Selector de Layout por ficha (rama feat/layout-selector).
   1) Lock de layout: existe en el almacén de locks y buildCandidate lo respeta
      por encima del sesgo de producto/audiencia.
   2) El prompt emite 'LAYOUT (ubicación):' en TODAS las jerarquías (antes solo
      el modo BALANCEADO recibía el layout).
   3) El sesgo de producto es suave (1.5:1), no acapara.

   Ejecutar:  node tests/layout-selector.test.js
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

function resetMotor() {
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
  MOTOR_STATE.concept = 'prueba layout';
  MOTOR_STATE.message = '';
  MOTOR_STATE.support = '';
  MOTOR_STATE.imageReference = null;
  MOTOR_STATE.explorationBrief = null;
}

/* ---------- 1. Lock presente en el almacén ---------- */
resetMotor();
const inicial = loadLocks(memLocksMarket(), MOTOR_STATE.product);
ok(inicial.layout && inicial.layout.A === 'Auto' && inicial.layout.B === 'Auto' && inicial.layout.C === 'Auto',
  'el almacén de locks debe incluir layout Auto por tarjeta');

const emblema = LAYOUTS.filter(function (x) { return x.indexOf('Emblema circular') === 0; })[0];
const tarjeta = LAYOUTS.filter(function (x) { return x.indexOf('Tarjeta interior') === 0; })[0];
ok(!!emblema && !!tarjeta, 'el catálogo debe conservar los layouts usados en el test');

/* ---------- 2. buildCandidate respeta el lock ---------- */
clearLocks(memLocksMarket(), MOTOR_STATE.product);
setLockValue(memLocksMarket(), MOTOR_STATE.product, 'layout', 'A', emblema);
setLockValue(memLocksMarket(), MOTOR_STATE.product, 'layout', 'B', tarjeta);
resetMotor();
const setLocked = buildCandidate(resolveAudiences(), null);
ok(setLocked.A.layout === emblema, 'buildCandidate debe fijar el layout bloqueado de 01A (obtenido: ' + setLocked.A.layout + ')');
ok(setLocked.B.layout === tarjeta, 'buildCandidate debe fijar el layout bloqueado de 01B (obtenido: ' + setLocked.B.layout + ')');
ok(setLocked.C.layout !== emblema && setLocked.C.layout !== tarjeta, 'la ficha sin lock debe conservar un layout distinto');

/* El lock sobrevive a un reroll del catálogo (no depende del azar). */
let lockEstable = true;
for (let i = 0; i < 6; i++) {
  resetMotor();
  MOTOR_STATE.concept = 'lock-estable-' + i;
  const s = buildCandidate(resolveAudiences(), null);
  if (s.A.layout !== emblema || s.B.layout !== tarjeta) lockEstable = false;
}
ok(lockEstable, 'el layout bloqueado debe ser estable en cada generación');
clearLocks(memLocksMarket(), MOTOR_STATE.product);

/* ---------- 3. El prompt emite LAYOUT en todas las jerarquías ---------- */
function ficha(jerarquia) {
  return {
    estilo: 'Minimal Modern', audiencia: 'global_adult_en', jerarquiaVisual: jerarquia,
    objeto: 'faro pequeño', arquitectura: 'a', composicion: 'b', layout: 'Columna apilada',
    perfilEstructural: 'MODERN', placement: 'pecho centrado', escalaProducto: 'media',
    formaSimbolo: 'c', tecnica: 'd', tratamiento: 'MODERN: geometría limpia',
    textoPrincipal: 'T', textoApoyo: 'A', textoTerciario: 'S',
    tipografia: 'Sans humanista limpia', paleta: 'pal (modo: X)', familiaColor: 'f',
    fitAudiencia: 70, fitProducto: 60, densidad: 'Minimal', negativeSpace: 'aire',
    distribucionTexto: 'texto en diagonal ascendente', integracionTexto: 'w', relacion: 'r',
    cara: 'frente', funcionSimbolica: 'f', intencionEmocional: 'i'
  };
}
function count(out, sub) { return out.split(sub).length - 1; }

resetMotor();
MOTOR_STATE.workflowMode = 'new';
MOTOR_STATE.message = 'MENSAJE DE PRUEBA';
const outMix = formatPrompt({ set: { A: ficha('BALANCEADO'), B: ficha('TEXTO_DOMINANTE'), C: ficha('OBJETO_DOMINANTE') } });
ok(count(outMix, 'LAYOUT (ubicación):') === 3, 'LAYOUT debe aparecer en BALANCEADO, TEXTO_DOMINANTE y OBJETO_DOMINANTE (hay ' + count(outMix, 'LAYOUT (ubicación):') + ')');
ok(outMix.indexOf('LAYOUT (ubicación): Columna apilada') !== -1, 'LAYOUT debe citar el layout asignado a la ficha');
ok(outMix.indexOf('no cambia tamaño, área ni jerarquía') !== -1, 'LAYOUT debe declarar que rige ubicación, no jerarquía');

const outSolo = formatPrompt({ set: { A: ficha('SOLO_TEXTO'), B: ficha('TEXTO_DOMINANTE'), C: ficha('BALANCEADO') } });
ok(count(outSolo, 'LAYOUT (ubicación):') === 3, 'LAYOUT también debe aparecer cuando hay SOLO_TEXTO');

/* ---------- 4. Sesgo suave 1.5:1, no lista cerrada ---------- */
const motorSrc = fs.readFileSync(path.join(JS, 'motor-nucleo.js'), 'utf8');
ok(/preferredLayouts\.has\(layout\) \? 1\.5 : 1/.test(motorSrc), 'el sesgo de producto/audiencia debe ser suave (1.5:1)');
ok(/base \* 0\.35/.test(motorSrc), 'la rotación entre corridas debe conservarse');
ok(/data-lock="layout"/.test(motorSrc), 'debe existir el selector de Layout por ficha');

const passed = failures.length === 0;
console.log((passed ? 'PASS' : 'FAIL') + '  layout-selector  (' + checks + ' aserciones, ' + failures.length + ' fallos)');
failures.forEach(function (f) { console.log('  X ' + f); });
process.exit(passed ? 0 : 1);
