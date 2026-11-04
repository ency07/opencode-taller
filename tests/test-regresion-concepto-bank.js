'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
global.window = global;
global.localStorage = undefined;
global.document = {
  getElementById: function () { return null; },
  querySelectorAll: function () { return []; }
};
global.$ = function (id) {
  return { value: id === 'market' ? 'gospel_es' : (id === 'subniche' ? 'biblico' : 'auto') };
};
global.alert = function () {};
global.confirm = function () { return true; };

vm.runInThisContext(
  fs.readFileSync(path.join(ROOT, 'js', 'memoria-local.js'), 'utf8'),
  { filename: 'memoria-local.js' }
);

let checks = 0;
function ok(condition, message) {
  checks++;
  if (!condition) throw new Error('FAIL: ' + message);
}

// Guardado por subnicho: debe usar la misma clave que getPersonalConcepts().
ok(addPersonalConcept('gospel_es', 'biblico', 'Fe persistente').ok, 'no guardó el concepto');
ok(
  getPersonalConcepts('gospel_es', 'biblico').includes('Fe persistente'),
  'el concepto guardado no aparece en getPersonalConcepts'
);

// El subnicho común también debe conservar el prefijo __concept__.
ok(addPersonalConcept('gospel_es', null, 'Esperanza común').ok, 'no guardó el concepto común');
ok(
  getPersonalConcepts('gospel_es', 'biblico').includes('Esperanza común'),
  'el concepto común no se recupera como fallback'
);

// La normalización debe impedir duplicados equivalentes.
const duplicate = addPersonalConcept('gospel_es', 'biblico', 'fe PERSISTENTE');
ok(!duplicate.ok, 'permitió un duplicado normalizado');

// useBankConcept debe leer el banco unificado, confirmar el reemplazo y emitir input.
addPersonalConcept('gospel_es', 'uso-test', 'Concepto cargado desde banco');
let inputEvents = 0;
const field = {
  value: 'texto anterior',
  dispatchEvent: function (event) {
    if (event && event.type === 'input' && event.bubbles) inputEvents++;
    return true;
  }
};
global.confirm = function () { return true; };
useBankConcept('gospel_es', 'uso-test', field);
ok(field.value === 'Concepto cargado desde banco', 'useBankConcept no cargó el concepto');
ok(inputEvents === 1, 'useBankConcept no emitió exactamente un evento input');

// Si el usuario cancela, no debe reemplazar ni emitir el evento.
field.value = 'mantener este texto';
inputEvents = 0;
global.confirm = function () { return false; };
useBankConcept('gospel_es', 'uso-test', field);
ok(field.value === 'mantener este texto', 'reemplazó el concepto pese a cancelar');
ok(inputEvents === 0, 'emitió input pese a cancelar');

console.log('PASS regresion-concepto-bank (' + checks + ' aserciones)');
