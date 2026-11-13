/* FIX 3B — promptDirective en los 10 territorios Gospel + compatibilidad con
   _resolveTerritoryDirective().

   Verifica:
   - Los 10 territorios Gospel declaran promptDirective (instrucción concreta); el catálogo puede contener territorios adicionales.
   - La directriz aparece en la directiva resuelta por el motor.
   - 'auto' no inyecta directriz.
   - La directriz no duplica la descripción.
   - El contrato (creative-contract.md) queda satisfecho.

   Ejecutar:  node tests/fix3b-prompt-directive.test.js
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

const TERR_IDS = [
  'SACRED_EDITORIAL', 'BIBLICAL_BOTANICAL', 'BIBLICAL_ARCHAEOLOGY',
  'THEOLOGICAL_ABSTRACTION', 'CHRISTIAN_HERITAGE', 'NARRATIVE_ILLUSTRATION',
  'EVERYDAY_FAITH', 'FAITH_WORKWEAR', 'CONTRAST_ART', 'LOCAL_FAITH_CULTURE'
];

/* ---------- 1. Los 10 territorios existen y declaran promptDirective ---------- */
const TERR = (typeof POD_CREATIVE_TERRITORIES !== 'undefined') ? POD_CREATIVE_TERRITORIES : {};
ok(Object.keys(TERR).length >= TERR_IDS.length, 'el catálogo debe contener los 10 territorios Gospel requeridos y puede incluir otros (dio ' + Object.keys(TERR).length + ')');

TERR_IDS.forEach(function (id) {
  const rec = TERR[id];
  ok(!!rec, id + ': existe en el catálogo');
  if (!rec) return;
  ok(typeof rec.promptDirective === 'string' && rec.promptDirective.trim().length > 0,
    id + ': declara promptDirective no vacío');
  ok(rec.promptDirective.length >= 40,
    id + ': promptDirective es una instrucción concreta (longitud ' + rec.promptDirective.length + ')');
});

/* ---------- 2. Campos del contrato (creative-contract.md) ---------- */
TERR_IDS.forEach(function (id) {
  const rec = TERR[id];
  if (!rec) return;
  ok(typeof rec.id === 'string' && rec.id.length > 0, id + ': id estable');
  ok(typeof rec.label === 'string' && rec.label.length > 0, id + ': label visible');
  ok(typeof rec.description === 'string' && rec.description.length > 0, id + ': description operativa');
  ok(Array.isArray(rec.compatibleMarkets) && rec.compatibleMarkets.length > 0, id + ': compatibleMarkets');
  ok(typeof rec.promptDirective === 'string', id + ': promptDirective (requisito contractual)');
});

/* ---------- 3. _resolveTerritoryDirective incluye la directriz ---------- */
TERR_IDS.forEach(function (id) {
  const rec = TERR[id];
  if (!rec) return;
  const dir = _resolveTerritoryDirective(id);
  ok(dir.indexOf('TERRITORIO CREATIVO ACTIVO:') !== -1, id + ': la directiva declara el territorio activo');
  ok(dir.indexOf('DIRECTRIZ CREATIVA:') !== -1, id + ': la directiva incluye DIRECTRIZ CREATIVA');
  ok(dir.indexOf(rec.promptDirective) !== -1, id + ': la directiva contiene el texto de promptDirective');
});

/* ---------- 4. 'auto' no inyecta directriz ---------- */
const autoDir = _resolveTerritoryDirective('auto');
ok(autoDir === '', 'auto → sin directriz (got: ' + JSON.stringify(autoDir) + ')');
const noneDir = _resolveTerritoryDirective('NO_EXISTE');
ok(noneDir === '', 'territorio inexistente → sin directriz (got: ' + JSON.stringify(noneDir) + ')');

/* ---------- 5. La directriz no duplica la descripción ---------- */
TERR_IDS.forEach(function (id) {
  const rec = TERR[id];
  if (!rec) return;
  // Extraer frases de la directriz y comprobar que ninguna es idéntica a la descripción
  const dir = String(rec.promptDirective || '');
  const desc = String(rec.description || '');
  ok(dir.trim() !== desc.trim(), id + ': promptDirective no es copia literal de description');
  // Comprobar que no comparten oraciones largas (>40 chars)
  const dirSents = dir.split(/[.;:]/).map(function (s) { return s.trim(); }).filter(function (s) { return s.length > 40; });
  const dup = dirSents.some(function (s) { return desc.indexOf(s) !== -1; });
  ok(!dup, id + ': promptDirective no duplica oraciones de description');
});

/* ---------- 6. Compatible con el motor: no altera otros campos ---------- */
const rec1 = TERR.SACRED_EDITORIAL;
ok(rec1.resources && rec1.resources.length > 0, 'SACRED_EDITORIAL conserva resources');
ok(rec1.themes && rec1.themes.length > 0, 'SACRED_EDITORIAL conserva themes');
ok(rec1.restrictions && rec1.restrictions.length > 0, 'SACRED_EDITORIAL conserva restrictions');
ok(rec1.compatibleStyles && rec1.compatibleStyles.length === 2, 'SACRED_EDITORIAL conserva compatibleStyles');
ok(rec1.compatibleTreatments && rec1.compatibleTreatments.length === 3, 'SACRED_EDITORIAL conserva compatibleTreatments');
ok(rec1.visualIdentity === 'editorial_contemporaneo', 'SACRED_EDITORIAL conserva visualIdentity');

/* ---------- 7. Integración: el prompt final recibe la directriz ---------- */
MOTOR_STATE.market = 'christian';
MOTOR_STATE.region = 'global';
MOTOR_STATE.product = 'CAMISETA SOFT';
MOTOR_STATE.creativeTerritory = 'SACRED_EDITORIAL';
MOTOR_STATE.concept = 'la creación como lenguaje de fe';
MOTOR_STATE.message = 'SIGO FLORECIENDO';
const dir = _resolveTerritoryDirective(MOTOR_STATE.creativeTerritory);
ok(dir.indexOf('DIRECTRIZ CREATIVA:') !== -1, 'integración: la directiva llega al prompt final');
ok(dir.indexOf('ANCLA CONCEPTO:') !== -1, 'integración: se conserva el ancla de concepto (Fix #1)');

console.log((failures.length ? 'FAIL' : 'PASS') + '  fix3b-prompt-directive  (' + checks + ' aserciones, ' + failures.length + ' fallos)');
failures.slice(0, 15).forEach(function (f) { console.log('  X ' + f); });
process.exit(failures.length ? 1 : 0);
