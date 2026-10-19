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

/* --- 2) El OBJETO es un motivo CONCRETO de la FAMILIA, nunca el mensaje ni el banco común --- */
baseState();
MOTOR_STATE.market = 'global_es';
MOTOR_STATE.region = 'global';
MOTOR_STATE.product = 'CAMISETA SOFT';
MOTOR_STATE.subniche = 'skate_culture';
MOTOR_STATE.dominio = 'auto';
MOTOR_STATE.dominioDetectado = 'auto';
const MENSAJE = 'SILUETA EMPUJANDO CONTRA TRÁFICO';
const CONCEPTO = 'silueta empujando contra tráfico';
MOTOR_STATE.concept = CONCEPTO;
MOTOR_STATE.message = MENSAJE;
const commonBank = _commonBankForMarket();
const skateBank = getBankForSubniche('skate_culture', 'global', 'global_es');
let vistos = 0;
for (let i = 0; i < 15; i++) {
  const syms = symbols(buildCandidate(resolveAudiences(), null));
  syms.forEach(function (s) {
    vistos++;
    ok(skateBank.indexOf(s) !== -1, 'el OBJETO debe ser un motivo concreto de la familia Skate: "' + s + '"');
    ok(commonBank.indexOf(s) === -1, 'el OBJETO nunca debe ser un objeto del banco común genérico: "' + s + '"');
    ok(s !== MENSAJE, 'el OBJETO nunca debe ser el mensaje: "' + s + '"');
    ok(s !== CONCEPTO, 'el OBJETO no debe ser la frase del concepto (debe ser una cosa concreta): "' + s + '"');
  });
}
ok(vistos > 0, 'debe haber generado al menos un símbolo');

/* --- 2b) Patrón repetido: un motivo CONCRETO de la familia, nunca el mensaje --- */
baseState();
MOTOR_STATE.market = 'colombia';
MOTOR_STATE.region = 'todas';
MOTOR_STATE.product = 'MOCHILA';   // producto que admite patrón
MOTOR_STATE.subniche = 'humor_costeno';
MOTOR_STATE.dominio = 'auto';
MOTOR_STATE.dominioDetectado = 'auto';
MOTOR_STATE.designMode = 'patron';
MOTOR_STATE.workflowMode = 'new';
MOTOR_STATE.concept = 'motivo costeño';
MOTOR_STATE.message = 'EL SOL NO ESPERA';
const patronBank = getBankForSubniche('humor_costeno', 'todas', 'colombia');
let patronVistos = 0;
for (let i = 0; i < 10; i++) {
  const syms = symbols(buildCandidate(resolveAudiences(), null));
  syms.forEach(function (s) {
    patronVistos++;
    ok(patronBank.indexOf(s) !== -1, 'en Patrón el motivo debe ser de la familia (no aleatorio ni mensaje): "' + s + '"');
    ok(commonBank.indexOf(s) === -1, 'en Patrón el motivo no debe salir del banco común genérico: "' + s + '"');
    ok(s !== 'EL SOL NO ESPERA', 'en Patrón el motivo nunca debe ser el mensaje: "' + s + '"');
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

/* --- 4) Sin familia con banco: el OBJETO es el concepto como ancla, nunca un objeto de biblioteca --- */
baseState();
MOTOR_STATE.market = 'colombia';
MOTOR_STATE.region = 'todas';
MOTOR_STATE.product = 'CAMISETA SOFT';
MOTOR_STATE.subniche = 'auto';
MOTOR_STATE.dominio = 'auto';
MOTOR_STATE.dominioDetectado = 'auto';
MOTOR_STATE.concept = 'amo a mi perro y lo cuido';
MOTOR_STATE.message = '';
let sinFamilia = 0;
for (let i = 0; i < 10; i++) {
  const syms = symbols(buildCandidate(resolveAudiences(), null));
  syms.forEach(function (s) {
    sinFamilia++;
    ok(s === 'amo a mi perro y lo cuido', 'sin familia, el OBJETO debe ser el concepto como ancla: "' + s + '"');
    ok(commonBank.indexOf(s) === -1, 'sin familia, el OBJETO no debe ser un objeto de biblioteca (banco común): "' + s + '"');
  });
}
ok(sinFamilia > 0, 'debe producir al menos un objeto-ancla');

function finish() {
  const passed = failures.length === 0;
  console.log((passed ? 'PASS' : 'FAIL') + '  objetos-subnicho  (' + checks + ' aserciones, ' + failures.length + ' fallos)');
  failures.slice(0, 12).forEach(function (f) { console.log('  X ' + f); });
  process.exit(passed ? 0 : 1);
}
finish();
