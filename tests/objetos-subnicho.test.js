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
['data-mercados.js', 'data-audiencias.js', 'data-bancos.js', 'banco-global.js', 'banco-gospel-es.js', 'data-estilos.js',
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

/* --- 8) El concepto del banco es el ANCLA de toda la series --- */
baseState();
MOTOR_STATE.motifVariationMode = 'same';
MOTOR_STATE.market = 'colombia';
MOTOR_STATE.region = 'todas';
MOTOR_STATE.product = 'CAMISETA SOFT';
MOTOR_STATE.subniche = 'humor_costeno';
MOTOR_STATE.dominio = 'auto';
MOTOR_STATE.dominioDetectado = 'auto';
MOTOR_STATE.concept = 'puesto de fritanga donde el calor firma la conversación';
MOTOR_STATE.message = '';
/* El concepto tiene 8+ palabras: el auto-score penaliza SOLO_TEXTO hasta casi
   no aparecer. Se fuerza una ficha tipográfica por lock para verificar identidad. */
['A', 'B', 'C'].forEach(function (k) {
  setLockValue('colombia|todas', 'CAMISETA SOFT', 'jerarquia', k,
    { A: 'OBJETO_DOMINANTE', B: 'SOLO_TEXTO' }[k] || 'Auto');
});
const familyBankHC = getBankForSubniche('humor_costeno', 'todas', 'colombia');
const escena = 'puesto de fritanga donde el calor firma la conversación';
let escenaDibujada = false;
let motivoAjeno = false;
let conflictosFalsos = 0;
let fichasDibujadas = 0;
let soloConIdentidad = [];
let promptConDominante = false;
let promptConPrioridad = false;
let promptConIdentidadSerie = false;
for (let i = 0; i < 5; i++) {
  const r = buildCandidate(resolveAudiences(), null);
  conflictosFalsos += (r.objectConflicts || []).length;
  ['A', 'B', 'C'].forEach(function (k) {
    const v = r[k];
    if (!v) return;
    if (v.jerarquiaVisual === 'SOLO_TEXTO') {
      if (String(v.objeto).indexOf(escena) !== -1) soloConIdentidad.push(k + i);
    } else {
      fichasDibujadas++;
      if (v.objeto === escena) escenaDibujada = true;
      if (v.objeto !== escena) motivoAjeno = true;
    }
  });
  const prompt = formatPrompt(asResult(r));
  if (prompt.indexOf('ARQUITECTURA DOMINANTE') !== -1) promptConDominante = true;
  if (prompt.indexOf('PRIORIDAD DE IDENTIDAD') !== -1) promptConPrioridad = true;
  if (prompt.indexOf('Identidad conceptual de la serie') !== -1) promptConIdentidadSerie = true;
}
['A', 'B', 'C'].forEach(function (k) {
  setLockValue('colombia|todas', 'CAMISETA SOFT', 'jerarquia', k, 'Auto');
});
ok(fichasDibujadas > 0 && escenaDibujada, 'las fichas que dibujan deben mantener el ancla (la escena concebida), no un sustituto por afinidad');
ok(!motivoAjeno, 'ninguna ficha puede dibujar un motivo distinto del ancla (sin «calor»→fuego, sin «limonada», sin banco común)');
ok(!conflictosFalsos, 'no debe declararse conflicto cuando el concepto ya es motivo del banco');
ok(soloConIdentidad.length > 0, 'la ficha SOLO_TEXTO debe conservar la identidad de la serie aunque no dibuje el ancla');
ok(promptConDominante, 'cada ficha debe declarar UNA arquitectura dominante');
ok(promptConPrioridad, 'cada ficha debe declarar la prioridad de identidad (fijas vs adaptables)');
ok(promptConIdentidadSerie, 'SOLO_TEXTO debe declarar la identidad conceptual compartida en el prompt');
const planAncla = _planExploreMotifs(familyBankHC, [], escena, '', '');
ok(planAncla.list.length === 1 && planAncla.list[0] === escena,
  'concepto literal del banco: plan con UN solo motivo (el ancla), sin sustituciones');

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

/* --- 10) Concepto textual (versículo/cita): símbolo del mensaje, sin conflicto falso --- */
const famVerso = ['manos que oran junto a la ventana', 'cruz sobre la colina al alba', 'ancla firme en fondo movedizo'];

const planV = _planExploreMotifs(famVerso, famVerso, 'jeremias 3. 33', 'jeremias 3. 33', 'Clamé y me respondió');
ok(planV.conflict === '', 'un versículo NO genera conflicto falso de motivos');
ok(planV.list.length === 1 && planV.list[0].indexOf('Clamé y me respondió') !== -1,
  'el símbolo se deriva del MENSAJE literal (obtenido: ' + planV.list[0] + ')');
ok(planV.list[0].indexOf('motivos ajenos') !== -1, 'la instrucción prohíbe motivos ajenos al concepto');
ok(planV.anchor === 'jeremias 3. 33', 'el ancla conserva el concepto literal del usuario');
ok(_isVerseReference('jeremias 3. 33') && _isVerseReference('salmo 23') && _isVerseReference('1 corintios 13, 4'),
  'detección de referencias numeradas (libro + capítulo[:versículo])');
ok(!_isVerseReference('zzz qqq vvv uuu') && !_isVerseReference('camisa 3d') && !_isVerseReference(''),
  'la detección no se come conceptos basura ni palabras con números incrustados');

const planV2 = _planExploreMotifs(famVerso, famVerso, 'salmo 23', 'salmo 23', '');
ok(planV2.conflict === '' && planV2.list[0].indexOf('salmo 23') !== -1,
  'versículo sin mensaje deriva el símbolo del propio concepto, sin conflicto');

const planMsg = _planExploreMotifs(famVerso, famVerso, 'concepto qq zz vv', 'concepto qq zz vv', 'manos que oran junto a la ventana');
ok(planMsg.conflict === '' && planMsg.list[0] === 'manos que oran junto a la ventana',
  'mensaje afín a un motivo de familia resuelve el motivo sin conflicto');

const planBasura = _planExploreMotifs(famVerso, famVerso, 'zzz qqq vvv', 'zzz qqq vvv', '');
ok(planBasura.conflict !== '', 'concepto basura SIN mensaje sigue declarando conflicto (provisional controlado)');
ok(famVerso.indexOf(planBasura.list[0]) !== -1, 'el motivo provisional sigue saliendo de la familia');

/* --- Fase 1 (Red Team): concepto con mensaje NO debe sustituirse por motivo
      provisional al azar del banco (regresión «Puro vacilé efectivo» → «calor que une al barrio»). --- */
baseState();
MOTOR_STATE.market = 'colombia';
MOTOR_STATE.region = 'costa_caribe';
MOTOR_STATE.product = 'CAMISETA SOFT';
MOTOR_STATE.subniche = 'humor_costeno';
MOTOR_STATE.dominio = 'auto';
MOTOR_STATE.dominioDetectado = 'auto';
MOTOR_STATE.concept = 'Puro vacilé efectivo';
MOTOR_STATE.message = 'Puro vacilé efectivo';
const humorBank = getBankForSubniche('humor_costeno', 'costa_caribe', 'colombia');
const planHumor = _planExploreMotifs(humorBank, humorBank, 'Puro vacilé efectivo', 'Puro vacilé efectivo', 'Puro vacilé efectivo');
ok(String(planHumor.list[0]).indexOf('calor que une al barrio') === -1,
  'F1: «Puro vacilé efectivo» no debe reemplazarse por el motivo provisional «calor que une al barrio»');
ok(String(planHumor.list[0]).indexOf('Puro vacilé efectivo') !== -1,
  'F1: la propuesta debe derivarse del concepto/mensaje y no de un motivo del banco al azar');
ok(planHumor.conflict !== '', 'F1: la derivación sigue declarando conflicto con motivo derivado, no sustituto arbitrario');

/* --- 11) E2E exploración gospel: versículo + mensaje literal → sin AVISO OBJETO --- */
baseState();
MOTOR_STATE.market = 'gospel_es';
MOTOR_STATE.region = 'universal';
MOTOR_STATE.product = 'CAMISETA SOFT';
MOTOR_STATE.subniche = 'gospel_es';
MOTOR_STATE.dominio = 'auto';
MOTOR_STATE.dominioDetectado = 'auto';
MOTOR_STATE.concept = 'jeremias 3. 33';
MOTOR_STATE.message = 'Clamé y me respondió';
const rVerso = buildCandidate(resolveAudiences(), null);
ok(!(rVerso.objectConflicts || []).length,
  'versículo gospel en exploración: cero conflictos de motivo (obtenido: ' + JSON.stringify(rVerso.objectConflicts || []) + ')');
const promptVerso = formatPrompt(asResult(rVerso));
ok(promptVerso.indexOf('AVISO OBJETO (conflicto)') === -1, 'el prompt NO declara conflicto falso (sin AVISO OBJETO)');
ok(promptVerso.indexOf('símbolo derivado del mensaje') !== -1, 'el prompt instruye el símbolo derivado del mensaje');
ok(promptVerso.indexOf('«Clamé y me respondió»') !== -1, 'la instrucción cita el mensaje literal del usuario');
ok(promptVerso.indexOf('jeremias 3. 33') !== -1, 'la instrucción conserva el concepto literal del usuario');

/* --- 12) E2E patrón gospel: mismo caso, también sin conflicto --- */
baseState();
MOTOR_STATE.market = 'gospel_es';
MOTOR_STATE.region = 'universal';
MOTOR_STATE.product = 'MOCHILA';
MOTOR_STATE.subniche = 'gospel_es';
MOTOR_STATE.dominio = 'auto';
MOTOR_STATE.dominioDetectado = 'auto';
MOTOR_STATE.designMode = 'patron';
MOTOR_STATE.workflowMode = 'new';
MOTOR_STATE.concept = 'jeremias 3. 33';
MOTOR_STATE.message = 'Clamé y me respondió';
const rPatVerso = buildCandidate(resolveAudiences(), null);
ok(!(rPatVerso.objectConflicts || []).length,
  'versículo gospel en patrón: cero conflictos (obtenido: ' + JSON.stringify(rPatVerso.objectConflicts || []) + ')');
const promptPatVerso = formatPrompt(asResult(rPatVerso));
ok(promptPatVerso.indexOf('AVISO OBJETO (conflicto)') === -1, 'patrón: el prompt sin AVISO OBJETO falso');
ok(promptPatVerso.indexOf('símbolo derivado del mensaje') !== -1, 'patrón: el símbolo se deriva del mensaje');

/* --- Red Team: coincidencia de motivos exacta y selector de objetos conectado --- */
ok(_rankCompatibleMotifs(['mar en calma', 'amar con paciencia'], 'mar').indexOf('amar con paciencia') === -1,
  'la coincidencia de motivos no debe aceptar subcadenas dentro de palabras distintas');
ok(_rankCompatibleMotifs(['corazón restaurado', 'camino nuevo'], 'corazón renovado').indexOf('corazón restaurado') !== -1,
  'una palabra distintiva exacta del concepto/mensaje sí puede proponer motivo de familia');
const planApproved = _planExploreMotifs(['camino nuevo', 'corazón restaurado'], ['camino nuevo', 'corazón restaurado'], 'Él hace nuevas todas las cosas', 'Él hace nuevas todas las cosas', 'Corazón renovado', 'corazón restaurado');
ok(planApproved.list.length === 1 && planApproved.list[0] === 'corazón restaurado' && planApproved.conflict === '',
  'el motivo explícitamente autorizado debe prevalecer sobre las inferencias de familia');
MOTOR_STATE.concept = 'Él hace nuevas todas las cosas';
MOTOR_STATE.message = 'Corazón renovado';
MOTOR_STATE.approvedMotifMaster = 'corazón restaurado';
const identityApproved = _resolveContactIdentity([]);
ok(identityApproved.ok && identityApproved.symbol === 'corazón restaurado' && identityApproved.identityMode === 'user-approved-motif',
  'el selector de motivo autorizado debe fijar la identidad de contacto');
ok(identityApproved.guiaSimbolo.includes('no lo reemplaces') && identityApproved.guiaSimbolo.includes('texto impreso'),
  'el contrato del motivo autorizado debe bloquear sustituciones y copy accidental');
MOTOR_STATE.objectMode = 'simple';
const promptOneObject = formatPrompt(asResult(rVerso));
ok(promptOneObject.includes('MODO DE OBJETOS: UNO POR DISEÑO'),
  'el selector «Un objeto por diseño» debe llegar al prompt');
MOTOR_STATE.objectMode = 'mixto';
const promptMixedObjects = formatPrompt(asResult(rVerso));
ok(promptMixedObjects.includes('MODO DE OBJETOS: COMBINACIÓN SELECTIVA'),
  'el selector «A veces combinar dos» debe llegar al prompt');
MOTOR_STATE.objectMode = 'forzar_combinacion';
const promptForcedObjects = formatPrompt(asResult(rVerso));
ok(promptForcedObjects.includes('MODO DE OBJETOS: COMBINAR DOS') && promptForcedObjects.includes('no inventes el segundo'),
  'la combinación forzada debe exigir dos motivos justificados sin autorizar objetos inventados');
const rMotifApproved = buildCandidate(resolveAudiences(), null);
const promptMotifApproved = formatPrompt(asResult(rMotifApproved));
ok(promptMotifApproved.includes('OBJETO/SÍMBOLO FIJADO POR EL USUARIO: «corazón restaurado»'),
  'el motivo explícito se debe conservar en el prompt final');
symbols(rMotifApproved).forEach(function (symbol) {
  ok(symbol === 'corazón restaurado', 'todas las fichas que dibujan deben respetar el motivo autorizado: ' + symbol);
});

function finish() {
  const passed = failures.length === 0;
  console.log((passed ? 'PASS' : 'FAIL') + '  objetos-subnicho  (' + checks + ' aserciones, ' + failures.length + ' fallos)');
  failures.slice(0, 12).forEach(function (f) { console.log('  X ' + f); });
  process.exit(passed ? 0 : 1);
}
finish();
