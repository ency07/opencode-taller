/* Objetos coherentes con el concepto y el subnicho (rama fix/objetos-subnicho).
   - region 'todas' es superconjunto de las regiones del subnicho (no solo 'nacional').
   - OBJETO = motivo CONCRETO del banco de la FAMILIA, resuelto a nivel de SERIE
     (un plan para A/B/C, no una negociación por ficha).
   - Si el concepto ya es un motivo del banco (los bancos describen escenas), ese
     motivo SE DIBUJA; nunca un motivo ajeno al concepto ni un conflicto falso.
   - CONFLICTO: solo el concepto incompatible sin objeto del usuario; UN aviso por
     serie y UN motivo provisional compartido por todas las fichas.
   - Sin familia con banco, el concepto queda como ancla.

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

/* buildCandidate devuelve el SET (con los conflictos adjuntos). formatPrompt
   espera la forma { set, objectConflicts }. */
function asResult(r) {
  return { set: r, objectConflicts: r.objectConflicts, score: 0, passed: true };
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

/* --- 5) Conflicto declarado: concepto que no encaja con ningún motivo de familia --- */
baseState();
MOTOR_STATE.market = 'global_es';
MOTOR_STATE.region = 'global';
MOTOR_STATE.product = 'CAMISETA SOFT';
MOTOR_STATE.subniche = 'skate_culture';
MOTOR_STATE.dominio = 'auto';
MOTOR_STATE.dominioDetectado = 'auto';
MOTOR_STATE.concept = 'zzz qqq vvv uuu';
MOTOR_STATE.message = '';
const skateBankES = getBankForSubniche('skate_culture', 'global', 'global_es');
let foundConflict = false;
let conflictoFueraDeFamilia = false;
let conflictoSinAviso = false;
for (let i = 0; i < 20 && !foundConflict; i++) {
  const r = buildCandidate(resolveAudiences(), null);
  if (r.objectConflicts && r.objectConflicts.length) {
    foundConflict = true;
    symbols(r).forEach(function (s) {
      if (skateBankES.indexOf(s) === -1) conflictoFueraDeFamilia = true;
    });
    if (formatPrompt(asResult(r)).indexOf('AVISO OBJETO (conflicto)') === -1) conflictoSinAviso = true;
  }
}
ok(foundConflict, 'debe declarar conflicto cuando ningún motivo de la familia encaja con el concepto');
ok(!conflictoFueraDeFamilia, 'en conflicto sin objeto del usuario, el OBJETO debe caer a un motivo de la familia');
ok(!conflictoSinAviso, 'el prompt debe mostrar el aviso de conflicto');

/* --- 6) Preservar el objeto que el usuario nombró, aunque no sea de la familia --- */
baseState();
MOTOR_STATE.market = 'global_es';
MOTOR_STATE.region = 'global';
MOTOR_STATE.product = 'CAMISETA SOFT';
MOTOR_STATE.subniche = 'skate_culture';
MOTOR_STATE.dominio = 'auto';
MOTOR_STATE.dominioDetectado = 'auto';
const comObjs = _commonBankForMarket();
const userObj = comObjs[0];
MOTOR_STATE.concept = userObj;
MOTOR_STATE.message = '';
let preservado = false;
for (let i = 0; i < 20 && !preservado; i++) {
  const syms = symbols(buildCandidate(resolveAudiences(), null));
  if (syms.indexOf(userObj) !== -1) preservado = true;
}
ok(preservado, 'debe preservar el objeto nombrado por el usuario aunque no sea de la familia: "' + userObj + '"');

/* --- 7) Unidad: _userNamedObject detecta el objeto nombrado y no inventa --- */
ok(_userNamedObject('quiero una tabla rota', ['tabla rota', 'otra cosa']) === 'tabla rota',
  '_userNamedObject debe detectar el objeto nombrado en el texto');
ok(_userNamedObject('nada que ver aquí', ['tabla rota']) === '',
  '_userNamedObject no debe inventar objetos ausentes del pool');

/* --- 8) El concepto que ya es motivo del banco se dibuja como OBJETO (coherencia de serie) --- */
baseState();
MOTOR_STATE.market = 'colombia';
MOTOR_STATE.region = 'todas';
MOTOR_STATE.product = 'CAMISETA SOFT';
MOTOR_STATE.subniche = 'humor_costeno';
MOTOR_STATE.dominio = 'auto';
MOTOR_STATE.dominioDetectado = 'auto';
MOTOR_STATE.concept = 'puesto de fritanga donde el calor firma la conversación';
MOTOR_STATE.message = '';
const familyBankHC = getBankForSubniche('humor_costeno', 'todas', 'colombia');
const escena = 'puesto de fritanga donde el calor firma la conversación';
const permitidos = [escena].concat(_rankCompatibleMotifs(familyBankHC, escena));
let escenaDibujada = false;
let motivoAjeno = false;
let conflictosFalsos = 0;
let fichasVistas = 0;
for (let i = 0; i < 12; i++) {
  const r = buildCandidate(resolveAudiences(), null);
  conflictosFalsos += (r.objectConflicts || []).length;
  symbols(r).forEach(function (s) {
    fichasVistas++;
    if (s === escena) escenaDibujada = true;
    if (permitidos.indexOf(s) === -1) motivoAjeno = true;
    ok(familyBankHC.indexOf(s) !== -1, 'cada ficha debe dibujar un motivo de la familia Humor Costeño: "' + s + '"');
  });
}
ok(fichasVistas > 0, 'la serie debe producir al menos una ficha con objeto');
ok(escenaDibujada, 'el concepto-motivo del banco debe dibujarse como OBJETO en la serie');
ok(!motivoAjeno, 'ningún OBJETO puede ser ajeno al concepto (solo el motivo del banco y sus compatibles)');
ok(conflictosFalsos === 0, 'no debe declararse conflicto cuando el concepto ya es motivo del banco');

/* --- 9) Conflicto resuelto a nivel de SERIE: un solo aviso, un motivo provisional único --- */
baseState();
MOTOR_STATE.market = 'global_es';
MOTOR_STATE.region = 'global';
MOTOR_STATE.product = 'CAMISETA SOFT';
MOTOR_STATE.subniche = 'skate_culture';
MOTOR_STATE.dominio = 'auto';
MOTOR_STATE.dominioDetectado = 'auto';
MOTOR_STATE.concept = 'zzz qqq vvv uuu';
MOTOR_STATE.message = '';
const skateBankES2 = getBankForSubniche('skate_culture', 'global', 'global_es');
let serieMismoMotivo = '';
let motivosDistintosEnConflicto = false;
let avisosEnSerie = 0;
for (let i = 0; i < 8; i++) {
  const r = buildCandidate(resolveAudiences(), null);
  if (!(r.objectConflicts || []).length) continue;
  const prompt = formatPrompt(asResult(r));
  avisosEnSerie = prompt.split('AVISO OBJETO (conflicto)').length - 1;
  const motivoSerie = '';
  const distintos = {};
  symbols(r).forEach(function (s) {
    distintos[s] = 1;
    ok(skateBankES2.indexOf(s) !== -1, 'en conflicto, el motivo provisional debe ser de la familia: "' + s + '"');
  });
  if (Object.keys(distintos).length > 1) motivosDistintosEnConflicto = true;
  break;
}
if (avisosEnSerie) {
  ok(motivosDistintosEnConflicto === false, 'en conflicto, toda la serie debe compartir UN motivo provisional (no historias distintas por ficha)');
  ok(avisosEnSerie === 1, 'el prompt debe contener UN solo aviso de conflicto por serie');
}

/* --- Unidad: _planExploreMotifs --- */
baseState();
const plan1 = _planExploreMotifs(
  ['puesto de fritanga donde el calor firma la conversación', 'hamaca de la familia', 'limonada de coco rule'],
  [...['puesto de fritanga donde el calor firma la conversación', 'hamaca de la familia', 'limonada de coco rule'], 'árbol de biblioteca'],
  'puesto de fritanga donde el calor firma la conversación', '', '');
ok(plan1.conflict === '', 'concepto que es motivo del banco no genera conflicto');
ok(plan1.list[0] === 'puesto de fritanga donde el calor firma la conversación', 'el concepto-motivo debe ser el objeto base de la serie');
const plan2 = _planExploreMotifs(['sombra que agrupa', 'otra cosa'],
  ['sombra que agrupa', 'otra cosa', 'arbol de biblioteca'], 'una sombra que agrupa', '', '');
ok(plan2.conflict === '' && plan2.list[0] === 'sombra que agrupa', 'concepto compatible debe elegir el motivo afín sin conflicto');

function finish() {
  const passed = failures.length === 0;
  console.log((passed ? 'PASS' : 'FAIL') + '  objetos-subnicho  (' + checks + ' aserciones, ' + failures.length + ' fallos)');
  failures.slice(0, 12).forEach(function (f) { console.log('  X ' + f); });
  process.exit(passed ? 0 : 1);
}
finish();
