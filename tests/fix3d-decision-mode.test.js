/* FIX 3D — Fase 2: decisionMode (estado, persistencia, UI) + lock de tratamiento.
   No toca buildCandidate ni el pipeline de generación (eso es Fase 3).

   Ejecutar:  node tests/fix3d-decision-mode.test.js
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
 'dominios.js', 'data-productos.js', 'data-territorios.js', 'memoria-local.js', 'motor-nucleo.js'
].forEach(function (f) {
  vm.runInThisContext(fs.readFileSync(path.join(JS, f), 'utf8'), { filename: f });
});

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

/* Limpia TODOS los locks guardados (distinto de fijarlos en Auto). */
function clearAllLocks() {
  _memSetJSON(_memKey(['locks', memLocksMarket(), MOTOR_STATE.product]), {});
}

/* ---------- 1. Validación de valores ---------- */
ok(_normalizeDecisionMode('auto') === 'auto', 'auto → auto');
ok(_normalizeDecisionMode('assisted') === 'assisted', 'assisted → assisted');
ok(_normalizeDecisionMode('manual') === 'manual', 'manual → manual');
ok(_normalizeDecisionMode('automático') === 'auto', 'automático → auto');
ok(_normalizeDecisionMode('controlado') === 'manual', 'controlado → manual');
ok(_normalizeDecisionMode('asistido') === 'assisted', 'asistido → assisted');
ok(_normalizeDecisionMode('INVALIDO') === 'assisted', 'valor inválido → assisted (default)');
ok(_normalizeDecisionMode('') === 'assisted', 'vacío → assisted');
ok(_normalizeDecisionMode(null) === 'assisted', 'null → assisted');
ok(DECISION_MODES.length === 3, 'tres modos definidos');

/* ---------- 2. Persistencia: setDecisionMode / loadDecisionMode ---------- */
baseState();
setDecisionMode('auto');
ok(MOTOR_STATE.decisionMode === 'auto', 'setDecisionMode actualiza MOTOR_STATE');
ok(loadDecisionMode() === 'auto', 'loadDecisionMode recupera el valor persistido');

setDecisionMode('manual');
ok(loadDecisionMode() === 'manual', 'manual persiste');

setDecisionMode('assisted');
ok(loadDecisionMode() === 'assisted', 'assisted persiste');

/* ---------- 3. Aislamiento por mercado|región|producto ---------- */
baseState();
setDecisionMode('auto');
// Cambiar de mercado
MOTOR_STATE.market = 'gospel_en';
ok(loadDecisionMode() === 'assisted', 'otro mercado recupera su propia config (assisted por defecto)');
setDecisionMode('manual');
ok(loadDecisionMode() === 'manual', 'manual persiste en gospel_en');
// Volver al mercado original
MOTOR_STATE.market = 'christian';
ok(loadDecisionMode() === 'auto', 'el mercado original conserva su config (auto)');

// Cambiar de región
baseState();
setDecisionMode('manual');
MOTOR_STATE.region = 'todas';
ok(loadDecisionMode() === 'assisted', 'otra región recupera su propia config');
MOTOR_STATE.region = 'global';
ok(loadDecisionMode() === 'manual', 'la región original conserva su config');

// Cambiar de producto
baseState();
setDecisionMode('auto');
MOTOR_STATE.product = 'HOODIE';
ok(loadDecisionMode() === 'assisted', 'otro producto recupera su propia config');
MOTOR_STATE.product = 'CAMISETA SOFT';
ok(loadDecisionMode() === 'auto', 'el producto original conserva su config');

/* ---------- 4. Lock de tratamiento: defaultLocks y loadLocks ---------- */
const dl = defaultLocks();
ok(dl.tratamiento && typeof dl.tratamiento === 'object', 'defaultLocks incluye tratamiento');
ok(dl.tratamiento.A === 'Auto' && dl.tratamiento.B === 'Auto' && dl.tratamiento.C === 'Auto',
  'tratamiento: A/B/C en Auto por defecto');
ok(dl.estilo && dl.audiencia && dl.jerarquia && dl.layout, 'los 4 locks existentes se conservan');

baseState();
const locks = loadLocks(memLocksMarket(), MOTOR_STATE.product);
ok(locks.tratamiento && locks.tratamiento.A === 'Auto', 'loadLocks devuelve tratamiento');

// Guardar y recuperar un lock de tratamiento
setLockValue(memLocksMarket(), MOTOR_STATE.product, 'tratamiento', 'A', 'HEAVY');
const locks2 = loadLocks(memLocksMarket(), MOTOR_STATE.product);
ok(locks2.tratamiento.A === 'HEAVY', 'el lock de tratamiento se guarda y recupera');
// Limpiar
setLockValue(memLocksMarket(), MOTOR_STATE.product, 'tratamiento', 'A', 'Auto');

/* ---------- 5. _effectiveLocks: PRESERVE en manual, locks en otros modos ---------- */
baseState();
setDecisionMode('auto');
let eff = _effectiveLocks();
ok(eff.estilo && typeof eff.estilo === 'object', 'auto: _effectiveLocks devuelve locks');

baseState();
setDecisionMode('assisted');
eff = _effectiveLocks();
ok(eff.estilo && typeof eff.estilo === 'object', 'assisted: _effectiveLocks devuelve locks');

// En manual sin LAST_RESULT: no debe romper (fallback a Auto)
baseState();
setDecisionMode('manual');
eff = _effectiveLocks();
ok(eff.estilo && typeof eff.estilo === 'object', 'manual sin LAST_RESULT: no rompe');

// En manual con LAST_RESULT: los campos sin fijar pasan a PRESERVE
baseState();
const set = buildCandidate(resolveAudiences(), null);
LAST_RESULT = { set: set, score: {}, passed: true };
clearAllLocks();
setDecisionMode('manual');
eff = _effectiveLocks(set);
ok(eff.tratamiento && typeof eff.tratamiento === 'object', 'manual: _effectiveLocks incluye tratamiento');
// Los campos sin fijar pasan al estado PRESERVE (diferenciado de Auto)
ok(eff.estilo.A === LOCK_PRESERVE, 'manual: estilo sin fijar pasa a PRESERVE (dio ' + eff.estilo.A + ')');
ok(eff.tratamiento.A === LOCK_PRESERVE, 'manual: tratamiento sin fijar pasa a PRESERVE');
// _generationLocks resuelve PRESERVE al valor real por ficha
var genLocksTest = _generationLocks(eff, set);
const prevEstilo = set.A.estilo;
const prevTrat = _treatmentKey(set.A.tratamiento);
ok(genLocksTest.estilo.A === prevEstilo, 'manual: PRESERVE se resuelve al valor anterior (' + genLocksTest.estilo.A + ' vs ' + prevEstilo + ')');
ok(genLocksTest.tratamiento.A === prevTrat, 'manual: tratamiento PRESERVE se resuelve al valor anterior');
LAST_RESULT = null;

// En manual con lock explícito: el lock gana sobre PRESERVE
baseState();
const set2 = buildCandidate(resolveAudiences(), null);
LAST_RESULT = { set: set2, score: {}, passed: true };
setDecisionMode('manual');
setLockValue(memLocksMarket(), MOTOR_STATE.product, 'estilo', 'A', 'Brutalist');
eff = _effectiveLocks();
ok(eff.estilo.A === 'Brutalist', 'manual: un lock explícito gana sobre PRESERVE');
setLockValue(memLocksMarket(), MOTOR_STATE.product, 'estilo', 'A', 'Auto');
LAST_RESULT = null;

/* ---------- 6. No se modifican las decisiones actuales del motor ---------- */
baseState();
setDecisionMode('auto');
const setAuto = buildCandidate(resolveAudiences(), null);
ok(setAuto.A && setAuto.A.estilo, 'el motor sigue generando con decisionMode=auto');

baseState();
setDecisionMode('assisted');
const setAssisted = buildCandidate(resolveAudiences(), null);
ok(setAssisted.A && setAssisted.A.estilo, 'el motor sigue generando con decisionMode=assisted');

baseState();
setDecisionMode('manual');
const setManual = buildCandidate(resolveAudiences(), null);
ok(setManual.A && setManual.A.estilo, 'el motor sigue generando con decisionMode=manual (Fase 3 no implementada)');

/* ---------- 7. Los locks existentes no se rompen ---------- */
baseState();
setLockValue(memLocksMarket(), MOTOR_STATE.product, 'estilo', 'A', 'Minimal Modern');
const locks3 = loadLocks(memLocksMarket(), MOTOR_STATE.product);
ok(locks3.estilo.A === 'Minimal Modern', 'el lock de estilo existente sigue funcionando');
setLockValue(memLocksMarket(), MOTOR_STATE.product, 'estilo', 'A', 'Auto');

/* ---------- 8. UI: el selector existe en index.html ---------- */
const idx = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
ok(idx.indexOf('id="decisionMode"') !== -1, 'index.html tiene el selector #decisionMode');
ok(idx.indexOf('value="auto"') !== -1 && idx.indexOf('value="assisted"') !== -1 && idx.indexOf('value="manual"') !== -1,
  'el selector ofrece los 3 modos');

console.log((failures.length ? 'FAIL' : 'PASS') + '  fix3d-decision-mode  (' + checks + ' aserciones, ' + failures.length + ' fallos)');
failures.slice(0, 15).forEach(function (f) { console.log('  X ' + f); });
process.exit(failures.length ? 1 : 0);
