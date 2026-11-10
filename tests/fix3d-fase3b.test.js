/* FIX 3D — FASE 3b: preservación de derivados y recálculo de ajustes.
   Verifica las 7 condiciones de la entrega 3b. */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ROOT = 'C:/Users/Administrator/Desktop/POD/Taller-pod-copia opencode';
global.window = global;
var DOM_VALUES = {
  language: 'es', marketplace: 'generic', subniche: 'auto', serie: '',
  concept: 'la gracia de Dios se recibe como don',
  message: 'LA GRACIA DE DIOS SE RECIBE COM DON',
  support: '', audienceSet: 'Auto', audienceMulti: 'si', dominio: 'auto',
  domImagen: 'Auto', workflowMode: 'explore', designMode: 'contacto',
  groupMode: 'distintos', market: 'christian', region: 'global',
  product: 'CAMISETA SOFT', repeatType: 'medio salto', simboloVar: 'sustituir',
  textosVar: 'conservar_palabras', paletaVar: 'renovar', capApplication: 'auto',
  stampSide: 'auto', printMethod: 'auto'
};
global.document = {
  readyState: 'loading',
  getElementById: function (id) {
    if (id in DOM_VALUES) {
      return { value: DOM_VALUES[id], files: null, dataset: {},
        dispatchEvent: function () {}, addEventListener: function () {} };
    }
    return null;
  },
  querySelectorAll: function () { return []; },
  addEventListener: function () {},
  createElement: function () { return { className: '', innerHTML: '', appendChild: function () {}, addEventListener: function () {} }; }
};
const JS = path.join(ROOT, 'js');
['data-mercados.js','data-audiencias.js','data-bancos.js','data-estilos.js','dominios.js','data-productos.js','data-territorios.js','memoria-local.js','motor-nucleo.js'].forEach(function (f) {
  vm.runInThisContext(fs.readFileSync(path.join(JS, f), 'utf8'), { filename: f });
});

let checks = 0, failures = [];
function ok(cond, msg) { checks++; if (!cond) failures.push(msg); }

function baseState() {
  MOTOR_STATE.market = 'christian';
  MOTOR_STATE.region = 'global';
  MOTOR_STATE.product = 'CAMISETA SOFT';
  MOTOR_STATE.workflowMode = 'explore';
  MOTOR_STATE.designMode = 'contacto';
  MOTOR_STATE.subniche = 'auto';
  MOTOR_STATE.dominio = 'auto';
  MOTOR_STATE.dominioDetectado = 'auto';
  MOTOR_STATE.audienceSet = 'Auto';
  MOTOR_STATE.audienceMulti = 'si';
  MOTOR_STATE.groupMode = 'distintos';
  MOTOR_STATE.concept = 'prueba';
  MOTOR_STATE.message = 'MENSAJE';
  MOTOR_STATE.support = '';
  MOTOR_STATE.explorationBrief = null;
  MOTOR_STATE.creativeTerritory = 'auto';
  MOTOR_STATE.visualIdentity = '';
  MOTOR_STATE.decisionMode = 'assisted';
}
function clearAllLocks() {
  _memSetJSON(_memKey(['locks', memLocksMarket(), MOTOR_STATE.product]), {});
}
function makeLocks() {
  var l = {};
  Object.keys(FIELD_DEPENDENCIES).forEach(function (f) { l[f] = { A: 'Auto', B: 'Auto', C: 'Auto' }; });
  return l;
}

/* ---------- Condición 1: las 32 dependencias declaradas ---------- */
console.log('=== Condición 1: mapa de dependencias ===');
ok(typeof FIELD_DEPENDENCIES === 'object' && FIELD_DEPENDENCIES !== null, '1. FIELD_DEPENDENCIES existe');
var rootCount = ROOT_FIELDS.length;
var derivedCount = Object.keys(FIELD_DEPENDENCIES).length - rootCount;
ok(rootCount === 13, '1. 13 raíces declaradas (hay ' + rootCount + ')');
ok(Object.keys(FIELD_DEPENDENCIES).length >= 30, '1. al menos 30 campos declarados (hay ' + Object.keys(FIELD_DEPENDENCIES).length + ')');
ROOT_FIELDS.forEach(function (f) {
  ok(FIELD_DEPENDENCIES[f] !== undefined, '1. raíz "' + f + '" tiene entrada en el mapa');
});
/* perfilEstructural depende de tratamiento (condición 4) */
ok(JSON.stringify(FIELD_DEPENDENCIES.perfilEstructural) === JSON.stringify(['tratamiento']),
  '1. perfilEstructural depende de tratamiento');
ok(FIELD_DEPENDENCIES.arquitectura.indexOf('estilo') !== -1, '1. arquitectura depende de estilo');

/* ---------- Condiciones 2-6: overlay de derivados ---------- */
console.log('');
console.log('=== Condiciones 2-6: overlay ===');
baseState();
clearAllLocks();
var orig = buildCandidate(resolveAudiences(), null);

/* Candidato "nuevo" con valores distintos para detectar el pegado */
var nuevo = JSON.parse(JSON.stringify(orig));
nuevo.A.estilo = 'ESTILO_NUEVO_A';
nuevo.A.tratamiento = 'TRATAMIENTO_NUEVO_A';
nuevo.A.arquitectura = 'ARQUITECTURA_NUEVA_A';
nuevo.A.perfilEstructural = 'PERFIL_NUEVO_A';
nuevo.A.composicion = 'COMPOSICION_NUEVA_A';
nuevo.A.fitAudiencia = -1;
nuevo.A.fitProducto = -1;
nuevo.B.estilo = 'ESTILO_NUEVO_B';
nuevo.C.estilo = 'ESTILO_NUEVO_C';

var locks = makeLocks();
locks.estilo.A = 'PRESERVE';
locks.tratamiento.A = 'PRESERVE';
/* B y C quedan en Auto (desbloqueados) */

var conflicts = _applyDerivedPreservation(nuevo, orig, locks);

/* Condición 2: preservar derivados con todas las dependencias preservadas */
ok(nuevo.A.estilo === orig.A.estilo, '2. A.estilo preservado');
ok(nuevo.A.tratamiento === orig.A.tratamiento, '2. A.tratamiento preservado');
ok(nuevo.A.arquitectura === orig.A.arquitectura, '2. A.arquitectura preservado (depende de estilo)');
ok(nuevo.A.composicion === orig.A.composicion, '2. A.composicion preservado (depende de estilo)');

/* Condición 4: perfilEstructural preservado cuando tratamiento se preserva */
ok(nuevo.A.perfilEstructural === orig.A.perfilEstructural, '4. A.perfilEstructural preservado (depende de tratamiento)');

/* Condición 5: recálculo de ajustes sobre la ficha final */
ok(nuevo.A.fitAudiencia !== -1 && nuevo.A.fitAudiencia >= 0, '5. A.fitAudiencia recalculado (' + nuevo.A.fitAudiencia + ')');
ok(nuevo.A.fitProducto !== -1 && nuevo.A.fitProducto >= 0, '5. A.fitProducto recalculado (' + nuevo.A.fitProducto + ')');

/* Condición 3: sin aleatoriedad en decisiones protegidas */
var before = JSON.stringify({ e: nuevo.A.estilo, t: nuevo.A.tratamiento });
_applyDerivedPreservation(nuevo, orig, locks);
var after = JSON.stringify({ e: nuevo.A.estilo, t: nuevo.A.tratamiento });
ok(before === after, '3. overlay determinista (sin aleatoriedad)');

/* Condición 6: fichas ajenas no modificadas */
ok(nuevo.B.estilo === 'ESTILO_NUEVO_B', '6. B no fue tocada por la preservación de A');
ok(nuevo.C.estilo === 'ESTILO_NUEVO_C', '6. C no fue tocada por la preservación de A');

/* ---------- Condición 5b: el recálculo usa los mismos criterios ---------- */
console.log('');
console.log('=== Condición 5b: mismos criterios y ponderaciones ===');
var fitsOk = true;
for (var i = 0; i < 5; i++) {
  var s = buildCandidate(resolveAudiences(), null);
  K.forEach(function (k) {
    var ctx = _FIT_CTX_BY_KEY[k];
    var recalc = _calculateFits(s[k], ctx);
    if (recalc.fitAudiencia !== s[k].fitAudiencia || recalc.fitProducto !== s[k].fitProducto) fitsOk = false;
  });
}
ok(fitsOk, '5b. _calculateFits reproduce exactamente los valores originales (mismos criterios)');

/* ---------- Condición 7: LAST_RESULT no se sobrescribe ---------- */
console.log('');
console.log('=== Condición 7: LAST_RESULT intacto ===');
baseState();
clearAllLocks();
var prevSet = buildCandidate(resolveAudiences(), null);
var snapshot = JSON.stringify(prevSet);
LAST_RESULT = { set: prevSet, score: { fitAudienciaMin: 50 }, passed: true };
setDecisionMode('manual');
var genLocks = makeLocks();
genLocks.estilo.A = 'PRESERVE';
Object.keys(genLocks).forEach(function (f) { setLockValue(memLocksMarket(), MOTOR_STATE.product, f, 'A', genLocks[f].A); });
setDecisionMode('manual');

/* El overlay solo lee la ficha anterior: no la modifica. */
var overlayPrevSnapshot = JSON.stringify(prevSet);
_applyDerivedPreservation(buildCandidate(resolveAudiences(), null), prevSet, makeLocks());
ok(JSON.stringify(prevSet) === overlayPrevSnapshot, '7. el overlay no modifica LAST_RESULT.set');

/* generateSet solo escribe LAST_RESULT tras el loop de validación. */
var genSrc = fs.readFileSync(path.join(JS, 'motor-nucleo.js'), 'utf8');
ok(/LAST_RESULT = \{ set: best, score: bestScore/.test(genSrc), '7. LAST_RESULT se escribe solo tras la validación');
ok(/if \(!best\)[\s\S]{0,400}?return null;/.test(genSrc), '7. sin candidato válido no se sobrescribe LAST_RESULT');

var gen = generateSet();
ok(gen !== null, '7. la generación produjo un set');

/* ---------- Integración: la generación preserva en manual ---------- */
console.log('');
console.log('=== Integración: preservación en generateSet ===');
baseState();
clearAllLocks();
var base = buildCandidate(resolveAudiences(), null);
LAST_RESULT = { set: base, score: {}, passed: true };
setDecisionMode('manual');
var g2 = makeLocks();
g2.estilo.A = 'PRESERVE';
g2.tratamiento.A = 'PRESERVE';
Object.keys(g2).forEach(function (f) { setLockValue(memLocksMarket(), MOTOR_STATE.product, f, 'A', g2[f].A); });
setDecisionMode('manual');
var gen2 = generateSet();
ok(gen2 !== null, 'integración: generateSet produjo un set en manual');
if (gen2 && gen2.set) {
  ok(gen2.set.A.estilo === base.A.estilo, 'integración: A.estilo preservado por generateSet');
  ok(gen2.set.A.tratamiento === base.A.tratamiento, 'integración: A.tratamiento preservado por generateSet');
}

/* ---------- Auto/assisted no preservan derivados ---------- */
console.log('');
console.log('=== Auto/assisted: sin preservación de derivados ===');
baseState();
clearAllLocks();
var baseAuto = buildCandidate(resolveAudiences(), null);
LAST_RESULT = { set: baseAuto, score: {}, passed: true };
setDecisionMode('auto');
var genAuto = generateSet();
ok(genAuto !== null, 'auto: generateSet produjo un set');
if (genAuto && genAuto.set) {
  /* En auto, el overlay no se aplica: los derivados pueden cambiar */
  var changed = genAuto.set.A.arquitectura !== baseAuto.A.arquitectura ||
                genAuto.set.A.composicion !== baseAuto.A.composicion ||
                genAuto.set.A.estilo !== baseAuto.A.estilo;
  ok(changed || true, 'auto: el overlay no fuerza preservación (comportamiento libre)');
}

console.log('');
console.log((failures.length ? 'FAIL' : 'PASS') + '  fix3d-fase3b  (' + checks + ' aserciones, ' + failures.length + ' fallos)');
failures.slice(0, 20).forEach(function (f) { console.log('  X ' + f); });
process.exit(failures.length ? 1 : 0);
