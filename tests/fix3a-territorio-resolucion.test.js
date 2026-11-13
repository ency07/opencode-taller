/* FIX 3A — Contrato territorial en la resolución real.
   El territorio orienta la dirección creativa y los tratamientos compatibles,
   pero NO restringe el catálogo de estilos. Los locks manuales tienen prioridad.

   Ejecutar:  node tests/fix3a-territorio-resolucion.test.js
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
  MOTOR_STATE.visualIdentity = null;
  MOTOR_STATE.decisionMode = 'assisted';
}

function clearStyleLocks() {
  const mk = MOTOR_STATE.market + '|' + MOTOR_STATE.region;
  ['A', 'B', 'C'].forEach(function (k) { setLockValue(mk, 'CAMISETA SOFT', 'estilo', k, 'Auto'); });
}

const AUD_KEYS = { A: 'unisex_nacional', B: 'unisex_nacional', C: 'unisex_nacional' };

/* ---------- 1. _territoryConstraints: valores del catálogo ---------- */
baseState();
let tc = _territoryConstraints();
ok(tc.styles === null && tc.treatments === null, 'auto → sin restricciones (got ' + JSON.stringify(tc) + ')');

baseState();
MOTOR_STATE.creativeTerritory = 'SACRED_EDITORIAL';
tc = _territoryConstraints();
ok(Array.isArray(tc.styles) && tc.styles.length === 2, 'SACRED_EDITORIAL declara 2 estilos (got ' + JSON.stringify(tc.styles) + ')');
ok(Array.isArray(tc.treatments) && tc.treatments.length === 3, 'SACRED_EDITORIAL declara 3 tratamientos');

baseState();
MOTOR_STATE.creativeTerritory = 'EVERYDAY_FAITH';
tc = _territoryConstraints();
ok(Array.isArray(tc.treatments) && tc.treatments.length === 2, 'EVERYDAY_FAITH declara 2 tratamientos (got ' + JSON.stringify(tc.treatments) + ')');
ok(tc.treatments.indexOf('HEAVY') === -1, 'EVERYDAY_FAITH NO permite HEAVY');

/* ---------- 2. El territorio NO restringe el catálogo de estilos ---------- */
baseState();
clearStyleLocks();
MOTOR_STATE.creativeTerritory = 'SACRED_EDITORIAL';
const fullCandidates = _styleCandidatesForContext();
const territoryCandidates = _territoryStyleFilter(fullCandidates);
ok(JSON.stringify(territoryCandidates) === JSON.stringify(fullCandidates),
  'SACRED_EDITORIAL orienta el prompt, pero conserva íntegro el pool de estilos');
ok(fullCandidates.length > 2,
  'el pool de estilos debe ofrecer más de dos opciones (got ' + fullCandidates.length + ')');
let est = resolveEstilos(AUD_KEYS);
['A', 'B', 'C'].forEach(function (k) {
  ok(fullCandidates.indexOf(est[k]) !== -1,
    'SACRED_EDITORIAL: ficha ' + k + ' debe elegir un estilo disponible del catálogo (dio «' + est[k] + '»)');
});

/* ---------- 3. resolveEstilos SIN territorio no restringe ---------- */
baseState();
clearStyleLocks();
MOTOR_STATE.creativeTerritory = 'auto';
est = resolveEstilos(AUD_KEYS);
['A', 'B', 'C'].forEach(function (k) {
  ok(typeof est[k] === 'string' && est[k].length > 0, 'auto: ficha ' + k + ' recibe un estilo');
});

/* ---------- 4. Locks GANAN sobre el territorio ---------- */
baseState();
clearStyleLocks();
MOTOR_STATE.creativeTerritory = 'SACRED_EDITORIAL';
const mk = MOTOR_STATE.market + '|' + MOTOR_STATE.region;
setLockValue(mk, 'CAMISETA SOFT', 'estilo', 'A', 'Brutalist');  // fuera del territorio
est = resolveEstilos(AUD_KEYS);
ok(est.A === 'Brutalist', 'lock de estilo fuera del territorio debe respetarse (dio «' + est.A + '»)');

/* ---------- 5. Tratamientos: EVERYDAY_FAITH excluye HEAVY ---------- */
baseState();
clearStyleLocks();
MOTOR_STATE.creativeTerritory = 'EVERYDAY_FAITH';
let heavySeen = 0;
for (let i = 0; i < 12; i++) {
  MOTOR_STATE._rerollNonce = i;
  const set = buildCandidate(resolveAudiences(), null);
  ['A', 'B', 'C'].forEach(function (k) {
    const key = _treatmentKey(set[k].tratamiento);
    ok(key === 'SOFT' || key === 'MODERN',
      'EVERYDAY_FAITH: tratamiento debe ser SOFT/MODERN (dio ' + key + ' en ficha ' + k + ')');
    if (key === 'HEAVY') heavySeen++;
  });
}
ok(heavySeen === 0, 'EVERYDAY_FAITH: nunca debe aparecer HEAVY');

/* ---------- 6. Tratamientos: SACRED_EDITORIAL permite los 3 ---------- */
baseState();
clearStyleLocks();
MOTOR_STATE.creativeTerritory = 'SACRED_EDITORIAL';
let sawHeavy = false;
for (let i = 0; i < 8; i++) {
  MOTOR_STATE._rerollNonce = i;
  const set = buildCandidate(resolveAudiences(), null);
  ['A', 'B', 'C'].forEach(function (k) {
    const key = _treatmentKey(set[k].tratamiento);
    ok(key === 'HEAVY' || key === 'SOFT' || key === 'MODERN',
      'SACRED_EDITORIAL: tratamiento debe ser HEAVY/SOFT/MODERN (dio ' + key + ')');
    if (key === 'HEAVY') sawHeavy = true;
  });
}

/* ---------- 7. Perfil estructural coherente con el tratamiento ---------- */
baseState();
clearStyleLocks();
MOTOR_STATE.creativeTerritory = 'EVERYDAY_FAITH';
for (let i = 0; i < 6; i++) {
  MOTOR_STATE._rerollNonce = i;
  const set = buildCandidate(resolveAudiences(), null);
  ['A', 'B', 'C'].forEach(function (k) {
    const tKey = _treatmentKey(set[k].tratamiento);
    const profile = (set[k].layout || '') + '|' + (set[k].tipografia || '');
    // Si el tratamiento es SOFT, el layout debe ser del perfil SOFT
    if (tKey === 'SOFT') {
      const softLayouts = _STRUCTURAL_PROFILES.SOFT.layout;
      const isSoft = softLayouts.some(function (l) { return String(set[k].layout).indexOf(l) === 0; });
      ok(isSoft, 'SOFT: layout debe ser del perfil SOFT (dio «' + set[k].layout + '»)');
    }
  });
}

console.log((failures.length ? 'FAIL' : 'PASS') + '  fix3a-territorio-resolucion  (' + checks + ' aserciones, ' + failures.length + ' fallos)');
failures.slice(0, 15).forEach(function (f) { console.log('  X ' + f); });
process.exit(failures.length ? 1 : 0);
