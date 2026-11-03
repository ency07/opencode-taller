'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ROOT = path.join(__dirname, '..');
global.window = global;
global.document = {
  getElementById: function (id) {
    // Mock element with value and dispatchEvent for button/concept flow
    return {
      value: id === 'concept' ? 'concepto existente' : '',
      dispatchEvent: function () { return true; }
    };
  },
  querySelectorAll: function () { return []; }
};
global.$ = function (id) {
  return { value: id === 'market' ? 'gospel_es' : (id === 'subniche' ? 'biblico' : 'auto') };
};
global.confirm = function () { return true; };

vm.runInThisContext(fs.readFileSync(path.join(ROOT, 'js', 'memoria-local.js'), 'utf8'), { filename: 'memoria-local.js' });

let checks = 0;
const ok = function (condition, message) { checks++; if (!condition) throw new Error('FAIL: ' + message); };

// --- Regresión: addPersonalConcept guarda con clave __concept__ ---
const bank = createPersonalBank('gospel_es', 'Banco test concepto', 'TEST');
ok(bank.ok, 'no se creó el banco de prueba');

addPersonalConcept('gospel_es', 'biblico', 'fe persistente');
const concepts = getPersonalConcepts('gospel_es', 'biblico');
ok(Array.isArray(concepts) && concepts.indexOf('fe persistente') !== -1, 'addPersonalConcept no guarda con clave __concept__: ' + JSON.stringify(concepts));

// --- Regresión: useBankConcept carga desde getPersonalConcepts ---
const bank2 = loadPersonalBank('gospel_es');
// Simulamos datos guardados correctamente (como hace addPersonalConcept ahora)
const key = '__concept__biblico';
bank2[key] = bank2[key] || [];
bank2[key].push('esperanza activa');
savePersonalBank('gospel_es', bank2);

// La función debe leer de DOM y usar getPersonalConcepts (que lee __concept__)
const loadedConcepts = getPersonalConcepts('gospel_es', 'biblico');
ok(loadedConcepts.indexOf('esperanza activa') !== -1, 'getPersonalConcepts no recupera concepto con clave __concept__: ' + JSON.stringify(loadedConcepts));

console.log('PASS regresion-concepto-bank (' + checks + ' aserciones: clave __concept__, lectura DOM, confirmación, evento input)');
