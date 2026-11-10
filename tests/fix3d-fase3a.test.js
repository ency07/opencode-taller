/* FIX 3D — Fase 3a: locks de generación.
   Verifica las 5 condiciones de la entrega 3a:
   1. _generationLocks trabaja por ficha A/B/C (no comparte valores).
   2. PRESERVE sin valor válido → fallback a Auto + advertencia.
   3. Locks explícitos del usuario > valores heredados.
   4. AUTOMÁTICO y ASISTIDO no preservan.
   5. LAST_RESULT no se modifica hasta validar.

   Ejecutar:  node tests/fix3d-fase3a.test.js
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
  MOTOR_STATE.concept = 'la creación como lenguaje de fe';
  MOTOR_STATE.message = 'SIGO FLORECIENDO';
  MOTOR_STATE.support = '';
  MOTOR_STATE.explorationBrief = null;
  MOTOR_STATE.creativeTerritory = 'auto';
  MOTOR_STATE.visualIdentity = '';
  MOTOR_STATE.decisionMode = 'assisted';
}

function clearAllLocks() {
  _memSetJSON(_memKey(['locks', memLocksMarket(), MOTOR_STATE.product]), {});
}

function makeSet() {
  return buildCandidate(resolveAudiences(), null);
}

/* ---------- Condición 1: por ficha A/B/C, sin compartir ---------- */
baseState();
clearAllLocks();
const set1 = makeSet();
LAST_RESULT = { set: set1, score: {}, passed: true };
setDecisionMode('manual');
const eff1 = _effectiveLocks(set1);
const gen1 = _generationLocks(eff1, set1);

ok(gen1.estilo.A === set1.A.estilo, '1. A preserva su estilo');
ok(gen1.estilo.B === set1.B.estilo, '1. B preserva su estilo');
ok(gen1.estilo.C === set1.C.estilo, '1. C preserva su estilo');
ok(gen1.estilo.A !== gen1.estilo.B || set1.A.estilo !== set1.B.estilo,
  '1. A y B no comparten el mismo lock (valores distintos por ficha)');
ok(gen1.tratamiento.A === _treatmentKey(set1.A.tratamiento), '1. A preserva su tratamiento');
ok(gen1.tratamiento.B === _treatmentKey(set1.B.tratamiento), '1. B preserva su tratamiento');
ok(gen1.layout.A === set1.A.layout, '1. A preserva su layout');
ok(gen1.layout.B === set1.B.layout, '1. B preserva su layout');

// Verificar que las 3 fichas tienen locks distintos (si los valores lo son)
var estilos = [gen1.estilo.A, gen1.estilo.B, gen1.estilo.C];
var distinctEstilos = new Set(estilos).size;
ok(distinctEstilos >= 2, '1. las fichas no comparten valores (estilos distintos: ' + distinctEstilos + ')');
LAST_RESULT = null;

/* ---------- Condición 2: PRESERVE sin valor válido → fallback + advertencia ---------- */
baseState();
clearAllLocks();
const incomplete = { A: { estilo: 'Minimal Modern' }, B: {}, C: {} };
setDecisionMode('manual');
const eff2 = _effectiveLocks(incomplete);
const gen2 = _generationLocks(eff2, incomplete);
ok(gen2.estilo.A === 'Minimal Modern', '2. A con valor → se preserva');
ok(gen2.estilo.B === 'Auto', '2. B sin valor → fallback a Auto');
ok(_GEN_LOCK_WARNINGS.length > 0, '2. se genera advertencia por PRESERVE sin valor');
ok(_GEN_LOCK_WARNINGS.some(function (w) { return w.indexOf('B') !== -1 && w.indexOf('estilo') !== -1; }),
  '2. la advertencia menciona la ficha B y el campo estilo');
LAST_RESULT = null;

/* ---------- Condición 3: locks explícitos > valores heredados ---------- */
baseState();
clearAllLocks();
const set3 = makeSet();
LAST_RESULT = { set: set3, score: {}, passed: true };
setDecisionMode('manual');
// Lock explícito en A
setLockValue(memLocksMarket(), MOTOR_STATE.product, 'estilo', 'A', 'Brutalist');
const eff3 = _effectiveLocks(set3);
ok(eff3.estilo.A === 'Brutalist', '3. el lock explícito se respeta (FIXED)');
ok(eff3.estilo.B === LOCK_PRESERVE, '3. B sin lock → PRESERVE');
const gen3 = _generationLocks(eff3, set3);
ok(gen3.estilo.A === 'Brutalist', '3. el lock explícito gana sobre PRESERVE');
ok(gen3.estilo.B === set3.B.estilo, '3. B preserva su valor');
clearAllLocks();
LAST_RESULT = null;

/* ---------- Condición 4: auto/assisted no preservan ---------- */
baseState();
clearAllLocks();
const set4 = makeSet();
LAST_RESULT = { set: set4, score: {}, passed: true };

setDecisionMode('auto');
var genAuto = _generationLocks(_effectiveLocks(set4), set4);
ok(genAuto.estilo.A === 'Auto', '4. auto: A no preserva (Auto)');
ok(genAuto.tratamiento.A === 'Auto', '4. auto: tratamiento no preserva');

setDecisionMode('assisted');
var genAssisted = _generationLocks(_effectiveLocks(set4), set4);
ok(genAssisted.estilo.A === 'Auto', '4. assisted: A no preserva (Auto)');

// Verificar que en auto/assisted los locks de generación son Auto (el motor decide)
setDecisionMode('auto');
var genAutoCheck = _generationLocks(_effectiveLocks(set4), set4);
ok(genAutoCheck.estilo.A === 'Auto' && genAutoCheck.estilo.B === 'Auto' && genAutoCheck.estilo.C === 'Auto',
  '4. auto: locks de generación en Auto (el motor decide libremente)');
ok(genAutoCheck.tratamiento.A === 'Auto', '4. auto: tratamiento en Auto');
ok(genAutoCheck.layout.A === 'Auto', '4. auto: layout en Auto');
ok(_ACTIVE_GEN_LOCKS === null, '4. auto: no quedan locks de generación activos');
LAST_RESULT = null;

/* ---------- Condición 5: LAST_RESULT no se modifica ---------- */
baseState();
clearAllLocks();
const set5 = makeSet();
LAST_RESULT = { set: set5, score: {}, passed: true };
const beforeSnapshot = JSON.stringify(LAST_RESULT.set);
setDecisionMode('manual');
// Calcular locks de generación (no debe tocar LAST_RESULT)
var gen5 = _generationLocks(_effectiveLocks(LAST_RESULT.set), LAST_RESULT.set);
const afterSnapshot = JSON.stringify(LAST_RESULT.set);
ok(beforeSnapshot === afterSnapshot, '5. LAST_RESULT no se modifica al calcular locks');
ok(LAST_RESULT.set === set5, '5. la referencia de LAST_RESULT.set no cambia');
// El mecanismo de generateSet limpia los locks activos
ok(_ACTIVE_GEN_LOCKS === null, '5. los locks de generación están inactivos fuera del loop');

/* ---------- Integración: generateSet usa los locks de generación ---------- */
baseState();
clearAllLocks();
const set6 = makeSet();
LAST_RESULT = { set: set6, score: {}, passed: true };
setDecisionMode('manual');
// Simular el mecanismo de generateSet
_ACTIVE_GEN_LOCKS = _generationLocks(_effectiveLocks(LAST_RESULT.set), LAST_RESULT.set);
const manualSet = buildCandidate(resolveAudiences(), null);
_ACTIVE_GEN_LOCKS = null;
ok(manualSet.A.estilo === set6.A.estilo, 'integración: manual preserva estilo A');
ok(manualSet.B.estilo === set6.B.estilo, 'integración: manual preserva estilo B');
ok(manualSet.C.estilo === set6.C.estilo, 'integración: manual preserva estilo C');
ok(_treatmentKey(manualSet.A.tratamiento) === _treatmentKey(set6.A.tratamiento), 'integración: manual preserva tratamiento A');
ok(manualSet.A.layout === set6.A.layout, 'integración: manual preserva layout A');
ok(manualSet.A.audiencia === set6.A.audiencia, 'integración: manual preserva audiencia A');
ok(manualSet.A.jerarquiaVisual === set6.A.jerarquiaVisual, 'integración: manual preserva jerarquía A');

/* ---------- Verificación 1: _ACTIVE_GEN_LOCKS no contamina ---------- */
baseState();
clearAllLocks();
var vSet = makeSet();
LAST_RESULT = { set: vSet, score: {}, passed: true };
setDecisionMode('manual');

ok(_ACTIVE_GEN_LOCKS === null, 'V1. _ACTIVE_GEN_LOCKS inicia en null');
_ACTIVE_GEN_LOCKS = _generationLocks(_effectiveLocks(LAST_RESULT.set), LAST_RESULT.set);
ok(_ACTIVE_GEN_LOCKS !== null, 'V1. activo durante la generación');
ok(_ACTIVE_GEN_LOCKS.estilo.A === vSet.A.estilo, 'V1. contiene el estilo preservado de A');
var vNested = buildCandidate(resolveAudiences(), null);
ok(vNested.A.estilo === vSet.A.estilo, 'V1. llamada anidada usa los locks de generación');
_ACTIVE_GEN_LOCKS = null;
ok(_ACTIVE_GEN_LOCKS === null, 'V1. se limpia tras la generación');
var motorSrc = fs.readFileSync(path.join(ROOT, 'js', 'motor-nucleo.js'), 'utf8');
ok(/finally\s*\{\s*_ACTIVE_GEN_LOCKS\s*=\s*null/.test(motorSrc), 'V1. generateSet tiene finally que limpia el estado');

baseState();
clearAllLocks();
LAST_RESULT = null;
setDecisionMode('manual');
ok(_generationLocks(_effectiveLocks(null), null) === null, 'V1. sin LAST_RESULT → null (sin locks activos)');

/* ---------- Verificación 2: setLockValue y compatibilidad ---------- */
baseState();
clearAllLocks();
setLockValue(memLocksMarket(), MOTOR_STATE.product, 'estilo', 'A', 'Brutalist');
ok(_rawLocks().estilo.A === 'Brutalist', 'V2. _rawLocks guarda el valor explícito');
ok(loadLocks(memLocksMarket(), MOTOR_STATE.product).estilo.A === 'Brutalist', 'V2. loadLocks recupera el lock explícito');
ok(loadLocks(memLocksMarket(), MOTOR_STATE.product).estilo.B === 'Auto', 'V2. campo no fijado → Auto (default)');
var storedRaw = _memGetJSON(_memKey(['locks', memLocksMarket(), MOTOR_STATE.product]), null);
ok(storedRaw && storedRaw.estilo && storedRaw.estilo.A === 'Brutalist', 'V2. el lock persiste (superviviría a recarga)');
setLockValue(memLocksMarket(), MOTOR_STATE.product, 'estilo', 'B', 'Hand-Drawn');
setLockValue(memLocksMarket(), MOTOR_STATE.product, 'tratamiento', 'C', 'MODERN');
var vLoaded = loadLocks(memLocksMarket(), MOTOR_STATE.product);
ok(vLoaded.estilo.A === 'Brutalist' && vLoaded.estilo.B === 'Hand-Drawn', 'V2. múltiples locks coexisten');
ok(vLoaded.tratamiento.C === 'MODERN' && vLoaded.estilo.C === 'Auto', 'V2. locks independientes por campo');
clearAllLocks();
setLockValue(memLocksMarket(), MOTOR_STATE.product, 'estilo', 'A', 'Auto');
setDecisionMode('manual');
var vEff = _effectiveLocks(makeSet());
ok(vEff.estilo.A === 'Auto', 'V2. desbloqueo explícito → Auto (no PRESERVE)');
ok(vEff.estilo.B === LOCK_PRESERVE, 'V2. campo no fijado → PRESERVE en manual');
MOTOR_STATE.market = 'gospel_en';
ok(loadLocks(memLocksMarket(), MOTOR_STATE.product).estilo.A === 'Auto', 'V2. otro mercado no ve el lock');
MOTOR_STATE.market = 'christian';

console.log((failures.length ? 'FAIL' : 'PASS') + '  fix3d-fase3a  (' + checks + ' aserciones, ' + failures.length + ' fallos)');
failures.slice(0, 20).forEach(function (f) { console.log('  X ' + f); });
process.exit(failures.length ? 1 : 0);
