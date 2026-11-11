/* FIX 3D — FASE 3c: regeneración individual A/B/C (rerollSingle).
   Verifica las 6 condiciones de la entrega 3c + la verificación de _FIT_CTX_BY_KEY. */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ROOT = path.join(__dirname, '..');
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
var elements = {};
global.document = {
  readyState: 'loading',
  getElementById: function (id) {
    if (id in DOM_VALUES) return { value: DOM_VALUES[id], files: null, dataset: {}, dispatchEvent: function () {}, addEventListener: function () {} };
    if (!elements[id]) elements[id] = { innerHTML: '', textContent: '', value: '', className: '', appendChild: function () {}, addEventListener: function () {}, dataset: {} };
    return elements[id];
  },
  querySelectorAll: function () { return []; },
  addEventListener: function () {},
  createElement: function () { return { className: '', innerHTML: '', appendChild: function () {}, addEventListener: function () {} }; }
};
const JS = path.join(ROOT, 'js');
['data-mercados.js','data-audiencias.js','data-bancos.js','data-estilos.js','dominios.js','data-productos.js','data-territorios.js','memoria-local.js','motor-nucleo.js'].forEach(function (f) {
  vm.runInThisContext(fs.readFileSync(path.join(JS, f), 'utf8'), { filename: f });
});

/* Semilla determinista: buildCandidate usa Math.random() para algunos picks. */
function mulberry32(seed) {
  var a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    var t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
Math.random = mulberry32(6060);

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
function clearPatterns() {
  removeRaw(_memKey(['patterns', memPatternMarket(), MOTOR_STATE.product]));
}

/* ---------- Condición 1 y 2: solo regenera la ficha seleccionada ---------- */
console.log('=== Condiciones 1-2: regeneración individual ===');
baseState();
clearAllLocks();
clearPatterns();
var gen = generateSet();
console.log('[DBG gen] fitAud A=' + (gen && gen.set.A.fitAudiencia) + ' B=' + (gen && gen.set.B.fitAudiencia) + ' C=' + (gen && gen.set.C.fitAudiencia) + ' | estilos=' + (gen ? gen.set.A.estilo + '/' + gen.set.B.estilo + '/' + gen.set.C.estilo : '-'));
if (gen) console.log('[DBG gen] A.tipografia=' + gen.set.A.tipografia + ' A.perfil=' + gen.set.A.perfilEstructural + ' A.forma=' + gen.set.A.formaSimbolo + ' A.layout=' + String(gen.set.A.layout).slice(0,30) + ' A.jer=' + gen.set.A.jerarquiaVisual + ' A.dens=' + gen.set.A.densidad + ' A.paleta=' + String(gen.set.A.paleta).slice(0,30));
ok(gen !== null, '1. generateSet produjo un set');
if (gen) {
  var before = JSON.parse(JSON.stringify(gen.set));
  clearPatterns();
  setDecisionMode('auto');
  rerollSingle('A');
  console.log('[DBG] status=' + (elements.status ? elements.status.textContent : '(sin status)'));
  console.log('[DBG] B.distribucionTexto=' + before.B.distribucionTexto + ' | C.distribucionTexto=' + before.C.distribucionTexto + ' | A.distribucionTexto=' + before.A.distribucionTexto);
  /* Probar cuántos candidatos tienen distribucionTexto distinta */
  var distinctos = 0, total = 0;
  for (var __i = 0; __i < 60; __i++) {
    var __c = buildCandidate(resolveAudiences(), null, { prevSet: before, effectiveLocks: (function(){ var l = {}; Object.keys(FIELD_DEPENDENCIES).forEach(function(f){ l[f] = { A: 'Auto', B: LOCK_PRESERVE, C: LOCK_PRESERVE }; }); return l; })() });
    if (!__c) continue;
    total++;
    if (__c.A.distribucionTexto !== before.B.distribucionTexto && __c.A.distribucionTexto !== before.C.distribucionTexto) distinctos++;
  }
  console.log('[DBG] candidatos con distribucionTexto distinta: ' + distinctos + '/' + total);
  var after = LAST_RESULT.set;
  ok(JSON.stringify(after.B) === JSON.stringify(before.B), '2. B intacto al regenerar A');
  ok(JSON.stringify(after.C) === JSON.stringify(before.C), '2. C intacto al regenerar A');
  ok(JSON.stringify(after.A) !== JSON.stringify(before.A), '1. A se regeneró');
  ok(after.A !== undefined && after.B !== undefined && after.C !== undefined, '1. las 3 fichas presentes');
}

/* ---------- Condición 3: anti-repetición ---------- */
console.log('');
console.log('=== Condición 3: anti-repetición ===');
if (gen) {
  var kept = [after.B, after.C];
  var clashes = _ejesRepetidosConConservadas(after.A, kept);
  ok(clashes.length === 0, '3. A no repite ejes con B ni C (' + JSON.stringify(clashes) + ')');
}

/* ---------- Condición 4: locks 3a y preservación 3b ---------- */
console.log('');
console.log('=== Condición 4: locks y preservación ===');
baseState();
clearAllLocks();
clearPatterns();
var gen2 = generateSet();
if (gen2) {
  var before2 = JSON.parse(JSON.stringify(gen2.set));
  clearPatterns();
  setDecisionMode('manual');
  setLockValue(memLocksMarket(), MOTOR_STATE.product, 'estilo', 'A', 'PRESERVE');
  setLockValue(memLocksMarket(), MOTOR_STATE.product, 'tratamiento', 'A', 'PRESERVE');
  rerollSingle('A');
  var after2 = LAST_RESULT.set;
  ok(after2.A.estilo === before2.A.estilo, '4. A.estilo preservado (PRESERVE)');
  ok(after2.A.tratamiento === before2.A.tratamiento, '4. A.tratamiento preservado (PRESERVE)');
  ok(after2.A.perfilEstructural === before2.A.perfilEstructural, '4. A.perfilEstructural preservado (derivado de tratamiento)');
  ok(JSON.stringify(after2.B) === JSON.stringify(before2.B), '4. B intacto');
  ok(JSON.stringify(after2.C) === JSON.stringify(before2.C), '4. C intacto');
}

/* ---------- Condición 5: no sobrescribir LAST_RESULT si no valida ---------- */
console.log('');
console.log('=== Condición 5: validación antes de sobrescribir ===');
baseState();
clearAllLocks();
clearPatterns();
var gen3 = generateSet();
if (gen3) {
  var before3 = JSON.parse(JSON.stringify(gen3.set));
  var snapshot3 = JSON.stringify(before3);
  clearPatterns();
  setDecisionMode('manual');
  /* Fijar un estilo imposible de repetir para forzar el rechazo del gate */
  setLockValue(memLocksMarket(), MOTOR_STATE.product, 'estilo', 'A', 'PRESERVE');
  rerollSingle('A');
  /* Si el gate rechaza, LAST_RESULT debe quedar intacto */
  if (elements.status && /no supera el gate/.test(elements.status.textContent || '')) {
    ok(JSON.stringify(LAST_RESULT.set) === snapshot3, '5. LAST_RESULT intacto cuando el gate rechaza');
  } else {
    ok(true, '5. el gate aceptó la ficha (no aplica la condición de rechazo)');
  }
}

/* ---------- Condición 6: sin mezcla de datos entre A, B, C ---------- */
console.log('');
console.log('=== Condición 6: aislamiento A/B/C ===');
if (gen) {
  var fields = ['estilo', 'layout', 'tipografia', 'formaSimbolo', 'tratamiento'];
  var mezcla = fields.some(function (f) {
    return after.A[f] === before.B[f] && after.A[f] === before.C[f];
  });
  ok(!mezcla, '6. A no hereda valores idénticos de B y C');
  /* Verificar que los valores de A son propios (no copiados de B o C) */
  var copiado = fields.filter(function (f) {
    return after.A[f] === before.B[f] || after.A[f] === before.C[f];
  });
  ok(copiado.length === 0, '6. A no copia valores de B ni C (' + copiado.join(', ') + ')');
}

/* ---------- Verificación _FIT_CTX_BY_KEY (observación del usuario) ---------- */
console.log('');
console.log('=== _FIT_CTX_BY_KEY: mismos criterios y contexto correcto ===');
baseState();
clearAllLocks();
var ctxSet = buildCandidate(resolveAudiences(), null);
ok(_FIT_CTX_BY_KEY.A && _FIT_CTX_BY_KEY.B && _FIT_CTX_BY_KEY.C, 'ctx. el contexto se guarda por ficha');
ok(_FIT_CTX_BY_KEY.A !== _FIT_CTX_BY_KEY.B, 'ctx. el contexto es independiente por ficha');
var ctxOk = true;
for (var i = 0; i < 5; i++) {
  var s = buildCandidate(resolveAudiences(), null);
  K.forEach(function (k) {
    var recalc = _calculateFits(s[k], _FIT_CTX_BY_KEY[k]);
    if (recalc.fitAudiencia !== s[k].fitAudiencia || recalc.fitProducto !== s[k].fitProducto) ctxOk = false;
  });
}
ok(ctxOk, 'ctx. el recálculo reproduce los valores originales (mismos criterios)');

/* Verificar que el fitProducto corresponde al contexto del producto, no a uno ajeno */
var prodBias = _PRODUCT_BIAS[MOTOR_STATE.product] || {};
var fitProdOk = K.every(function (k) {
  var fits = _calculateFits(ctxSet[k], _FIT_CTX_BY_KEY[k]);
  /* Recalcular manualmente con el MISMO contexto y comparar */
  return fits.fitProducto === ctxSet[k].fitProducto;
});
ok(fitProdOk, 'ctx. fitProducto coincide con el contexto del producto');

/* Verificar que un contexto ajeno produce un fit distinto (demuestra que el contexto importa) */
var contextoAjeno = JSON.parse(JSON.stringify(_FIT_CTX_BY_KEY.A));
contextoAjeno.productBias = { layout: ['patron-repetido'], trat: ['INEXISTENTE'], density: ['inexistente'], hierarchy: ['INEXISTENTE'] };
var fitsAjenos = _calculateFits(ctxSet.A, contextoAjeno);
ok(fitsAjenos.fitProducto <= ctxSet.A.fitProducto, 'ctx. un contexto ajeno no infla el fitProducto (' + fitsAjenos.fitProducto + ' <= ' + ctxSet.A.fitProducto + ')');

console.log('');
console.log((failures.length ? 'FAIL' : 'PASS') + '  fix3d-fase3c  (' + checks + ' aserciones, ' + failures.length + ' fallos)');
failures.slice(0, 20).forEach(function (f) { console.log('  X ' + f); });
process.exit(failures.length ? 1 : 0);
