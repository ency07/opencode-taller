'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ROOT = path.resolve(__dirname, '..');
global.window = global;
var DOM_VALUES = {
  language: 'es', marketplace: 'generic', subniche: 'auto', serie: '',
  concept: 'la gracia de Dios se recibe como don',
  message: 'LA GRACIA DE DIOS SE RECIBE COM DON',
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
['data-mercados.js','data-audiencias.js','data-bancos.js','data-estilos.js','dominios.js','data-productos.js','data-territorios.js','memoria-local.js','diversidad-saturacion.js','motor-nucleo.js'].forEach(function (f) {
  vm.runInThisContext(fs.readFileSync(path.join(JS, f), 'utf8'), { filename: f });
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
  MOTOR_STATE.decisionMode = 'auto';
  return {};
}

// Test 1: _diversifyAxes is defined
ok(typeof _diversifyAxes === 'function', '_diversifyAxes is defined');

// Test 2: buildCandidate runs without error
baseState();
try {
  var set = buildCandidate({}, null, null);
  ok(!!set, 'buildCandidate returns set');
  ok(Array.isArray(set.diversityConflicts), 'set.diversityConflicts is array');
} catch (e) {
  ok(false, 'buildCandidate error: ' + e.message);
}

// Test 3: K constant
ok(Array.isArray(K) && K.length === 3, 'K is [A,B,C]');

console.log('Checks:', checks, 'Failures:', failures.length);
if (failures.length) { failures.forEach(function (f) { console.log('FAIL:', f); }); process.exit(1); }
console.log('PASS fix3e-smoke');

// Test: diversity module is loaded
ok(!!global.PODCreativeCatalogs && !!global.PODCreativeCatalogs.diversity, 'diversity module loaded');

// Test: _diversifyAxes returns originalDerivados
baseState();
var set2 = buildCandidate({}, null, null);
ok(set2.diversityConflicts !== undefined, 'set.diversityConflicts exists');
