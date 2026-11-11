'use strict';
/* Smoke/integration test for FIX 3E. Uses repository-relative paths and
   assertions that exercise actual diversification behavior. */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
global.window = global;

var DOM_VALUES = {
  language: 'es', marketplace: 'generic', subniche: 'auto', serie: '',
  concept: 'la gracia de Dios se recibe como don',
  message: 'LA GRACIA DE DIOS SE RECIBE COMO DON',
  support: '', audienceSet: 'Auto', audienceMulti: 'si', dominio: 'auto',
  domImagen: 'Auto', workflowMode: 'explore', designMode: 'contacto',
  groupMode: 'distintos', market: 'christian', region: 'global',
  product: 'CAMISETA SOFT', repeatType: 'medio salto', simbodoVar: 'sustituir',
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
[
  'data-mercados.js', 'data-audiencias.js', 'data-bancos.js',
  'data-estilos.js', 'dominios.js', 'data-productos.js',
  'data-territorios.js', 'memoria-local.js',
  'diversidad-saturacion.js', 'motor-nucleo.js'
].forEach(function (file) {
  const fullPath = path.join(JS, file);
  if (!fs.existsSync(fullPath)) throw new Error('Dependencia requerida ausente: ' + fullPath);
  vm.runInThisContext(fs.readFileSync(fullPath, 'utf8'), { filename: file });
});

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

let checks = 0;
const failures = [];
function ok(condition, message) {
  checks++;
  if (!condition) failures.push(message);
}
function baseState() {
  MOTOR_STATE.market = 'christian';
  MOTOR_STATE.region = 'global';
  MOTOR_STATE.product = 'CAMISETA SOFT';
  MOTOR_STATE.workflowMode = 'explore';
  MOTOR_STATE.designMode = 'contacto';
  MOTOR_STATE.subniche = 'auto';
  MOTOR_STATE.dominio = 'auto';
  MOTOR_STATE.dominioDetectado = 'auto';
  MOTOR_STATE.decisionMode = 'auto';
}

ok(typeof _diversifyAxes === 'function', '_diversifyAxes está disponible');
ok(!!global.PODCreativeCatalogs && !!global.PODCreativeCatalogs.diversity, 'catálogo de diversidad cargado');
ok(Array.isArray(K) && K.length === 3, 'el motor conserva las tres fichas A/B/C');

baseState();
let generated = null;
try {
  generated = buildCandidate({}, null, null);
  ok(!!generated && !!generated.A && !!generated.B && !!generated.C, 'buildCandidate genera A/B/C');
  ok(Array.isArray(generated.diversityConflicts), 'el resultado expone conflictos de diversidad');
} catch (error) {
  ok(false, 'buildCandidate no debe lanzar excepción: ' + error.message);
}

// Prueba de comportamiento: una jerarquía saturada se redistribuye respetando
// los pools HEAVY/SOFT/MODERN y recalcula el ajuste con la propiedad correcta.
if (typeof _diversifyAxes === 'function') {
  const originalResolveLocks = _resolveLocks;
  const originalCalculateFits = _calculateFits;
  const capturedCards = [];
  const fixture = {
    A: { perfilEstructural: 'HEAVY', jerarquiaVisual: 'TEXTO_DOMINANTE', layout: 'Layout-A', formaSimbolo: 'Escudo', distribucionTexto: 'Editorial', integracionTexto: 'Integrada' },
    B: { perfilEstructural: 'SOFT', jerarquiaVisual: 'TEXTO_DOMINANTE', layout: 'Layout-B', formaSimbolo: 'Rama', distribucionTexto: 'Apilada', integracionTexto: 'Separada' },
    C: { perfilEstructural: 'MODERN', jerarquiaVisual: 'TEXTO_DOMINANTE', layout: 'Layout-C', formaSimbolo: 'Monograma', distribucionTexto: 'Axial', integracionTexto: 'Contenida' }
  };
  K.forEach(function (key) { _FIT_CTX_BY_KEY[key] = {}; });
  _resolveLocks = function () {
    return { layout: { A: 'Auto', B: 'Auto', C: 'Auto' }, jerarquia: { A: 'Auto', B: 'Auto', C: 'Auto' } };
  };
  _calculateFits = function (card) {
    capturedCards.push(card);
    return { fitAudiencia: 80, fitProducto: 80 };
  };
  try {
    const result = _diversifyAxes(fixture, {}, null);
    const finalModes = K.map(function (key) { return fixture[key].jerarquiaVisual; });
    ok(new Set(finalModes).size === 3, 'la jerarquía saturada se redistribuye en tres modos distintos');
    K.forEach(function (key) {
      const allowed = PROFILE_VISUAL_MODES[fixture[key].perfilEstructural];
      ok(allowed.indexOf(fixture[key].jerarquiaVisual) !== -1, key + ' conserva jerarquía permitida por ' + fixture[key].perfilEstructural);
    });
    ok(capturedCards.length > 0, 'la redistribución recalcula pertinencia para las fichas modificadas');
    ok(capturedCards.every(function (card) {
      return Object.prototype.hasOwnProperty.call(card, 'formaSimbolo') && !Object.prototype.hasOwnProperty.call(card, 'formaSimbodo');
    }), 'el candidato entrega formaSimbolo con el nombre de propiedad del motor');
    ok(Array.isArray(result.changes), 'la función devuelve el registro de cambios');
  } catch (error) {
    ok(false, 'la prueba de redistribución estructural no debe lanzar excepción: ' + error.message);
  } finally {
    _resolveLocks = originalResolveLocks;
    _calculateFits = originalCalculateFits;
  }

  // Prueba negativa: si el usuario bloquea las tres jerarquías, el motor no
  // debe sobrescribirlas para forzar diversidad.
  const lockedFixture = {
    A: { perfilEstructural: 'HEAVY', jerarquiaVisual: 'TEXTO_DOMINANTE', layout: 'L1' },
    B: { perfilEstructural: 'SOFT', jerarquiaVisual: 'TEXTO_DOMINANTE', layout: 'L2' },
    C: { perfilEstructural: 'MODERN', jerarquiaVisual: 'TEXTO_DOMINANTE', layout: 'L3' }
  };
  _resolveLocks = function () {
    return { layout: { A: 'Locked', B: 'Locked', C: 'Locked' }, jerarquia: { A: 'Locked', B: 'Locked', C: 'Locked' } };
  };
  try {
    _diversifyAxes(lockedFixture, {}, null);
    ok(K.every(function (key) { return lockedFixture[key].jerarquiaVisual === 'TEXTO_DOMINANTE'; }), 'la redistribución nunca rompe jerarquías bloqueadas');
  } catch (error) {
    ok(false, 'el escenario de locks debe ejecutarse sin excepción: ' + error.message);
  } finally {
    _resolveLocks = originalResolveLocks;
  }
}

console.log('Checks:', checks, 'Failures:', failures.length);
if (failures.length) {
  failures.forEach(function (failure) { console.error('FAIL:', failure); });
  process.exitCode = 1;
} else {
  console.log('PASS fix3e-smoke: comportamiento, compatibilidad estructural, recálculo y locks');
}
