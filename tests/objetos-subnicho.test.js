/* Objetos coherentes con el concepto y el subnicho (rama fix/objetos-subnicho).
   - region 'todas' es superconjunto de las regiones del subnicho (no solo 'nacional').
   - TRAZABILIDAD: si el usuario da concepto/mensaje, el símbolo se deriva de él;
     la familia solo sesga estilo y nunca sustituye el concepto por un objeto ajeno
     (concepto "silueta empujando contra tráfico" + familia Skate no debe dibujar
     "lija negra" ni el banco común "árbol de biblioteca").
   - Sin concepto del usuario (exploración pura de familia), el símbolo sale del
     banco de la familia y nunca del banco común genérico.

   Ejecutar:  node tests/objetos-subnicho.test.js
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
['data-mercados.js', 'data-audiencias.js', 'data-bancos.js', 'banco-global.js', 'data-estilos.js',
 'dominios.js', 'data-productos.js', 'memoria-local.js', 'motor-nucleo.js'
].forEach(function (f) {
  vm.runInThisContext(fs.readFileSync(path.join(JS, f), 'utf8'), { filename: f });
});

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

function symbols(set) {
  return ['A', 'B', 'C'].map(function (k) {
    const v = set[k];
    return (!v || v.jerarquiaVisual === 'SOLO_TEXTO') ? '' : String(v.objeto || '');
  }).filter(function (s) { return s; });
}

/* --- 1) region 'todas' debe ser superconjunto del banco regional --- */
const bankTodas = getBankForSubniche('humor_costeno', 'todas', 'colombia');
const bankCosta = getBankForSubniche('humor_costeno', 'costa_caribe', 'colombia');
ok(bankTodas.length >= bankCosta.length,
  "'todas' debe traer al menos tantos objetos como la region concreta (" + bankTodas.length + ' vs ' + bankCosta.length + ')');
bankCosta.forEach(function (o) {
  ok(bankTodas.indexOf(o) !== -1, "'todas' debe incluir el objeto regional: " + o);
});

/* --- 2) TRAZABILIDAD: el símbolo sigue al concepto aunque no quepa en el banco --- */
baseState();
MOTOR_STATE.market = 'global_es';
MOTOR_STATE.region = 'global';
MOTOR_STATE.product = 'CAMISETA SOFT';
MOTOR_STATE.subniche = 'skate_culture';
MOTOR_STATE.dominio = 'auto';
MOTOR_STATE.dominioDetectado = 'auto';
const CONCEPTO = 'silueta empujando contra tráfico';
MOTOR_STATE.concept = CONCEPTO;
MOTOR_STATE.message = 'SILUETA EMPUJANDO CONTRA TRÁFICO';
const commonBank = _commonBankForMarket();
let vistos = 0;
for (let i = 0; i < 15; i++) {
  const syms = symbols(buildCandidate(resolveAudiences(), null));
  syms.forEach(function (s) {
    vistos++;
    ok(s === CONCEPTO, 'el símbolo debe ser el concepto del usuario (trazable), no un objeto distinto del banco: "' + s + '"');
    ok(commonBank.indexOf(s) === -1, 'el símbolo nunca debe ser un objeto del banco común genérico: "' + s + '"');
  });
}
ok(vistos > 0, 'debe haber generado al menos un símbolo');

/* --- 2b) TRAZABILIDAD en modo Patrón repetido (antes elegía al azar del banco) --- */
baseState();
MOTOR_STATE.market = 'colombia';
MOTOR_STATE.region = 'todas';
MOTOR_STATE.product = 'MOCHILA';   // producto que admite patrón
MOTOR_STATE.subniche = 'auto';
MOTOR_STATE.dominio = 'auto';
MOTOR_STATE.dominioDetectado = 'auto';
MOTOR_STATE.designMode = 'patron';
MOTOR_STATE.workflowMode = 'new';
MOTOR_STATE.concept = 'amo a mi perro y lo cuido';
MOTOR_STATE.message = '';
let patronVistos = 0;
for (let i = 0; i < 10; i++) {
  const syms = symbols(buildCandidate(resolveAudiences(), null));
  syms.forEach(function (s) {
    patronVistos++;
    ok(s === 'amo a mi perro y lo cuido', 'en Patrón el motivo debe derivar del concepto (no aleatorio del banco): "' + s + '"');
    ok(commonBank.indexOf(s) === -1, 'en Patrón el motivo no debe salir del banco común genérico: "' + s + '"');
  });
}
ok(patronVistos > 0, 'el modo Patrón debe producir al menos un motivo');

/* --- 3) Exploración pura de familia (sin concepto del usuario): usa el banco de familia --- */
baseState();
MOTOR_STATE.market = 'colombia';
MOTOR_STATE.region = 'todas';
MOTOR_STATE.product = 'CAMISETA SOFT';
MOTOR_STATE.subniche = 'humor_costeno';
MOTOR_STATE.dominio = 'auto';
MOTOR_STATE.dominioDetectado = 'auto';
const familyBank = getBankForSubniche('humor_costeno', 'todas', 'colombia');
let genFamilia = 0;
for (let i = 0; i < 15; i++) {
  const syms = symbols(buildCandidate(resolveAudiences(), null));
  syms.forEach(function (s) {
    genFamilia++;
    ok(familyBank.indexOf(s) !== -1, 'sin concepto, el símbolo debe venir del banco de la familia: "' + s + '"');
    ok(commonBank.indexOf(s) === -1, 'sin concepto, el símbolo no debe venir del banco común genérico: "' + s + '"');
  });
}
ok(genFamilia > 0, 'la exploración de familia debe producir símbolos del banco');

function finish() {
  const passed = failures.length === 0;
  console.log((passed ? 'PASS' : 'FAIL') + '  objetos-subnicho  (' + checks + ' aserciones, ' + failures.length + ' fallos)');
  failures.slice(0, 12).forEach(function (f) { console.log('  X ' + f); });
  process.exit(passed ? 0 : 1);
}
finish();
