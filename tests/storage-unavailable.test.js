'use strict';

/* RT storage: localStorage indisponible desde el inicio debe usar memoria
   de sesión, pero nunca reportar el fallback como persistencia durable. */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const source = fs.readFileSync(path.join(__dirname, '..', 'js', 'memoria-local.js'), 'utf8');
const unavailableStorage = {
  getItem: function () { return null; },
  setItem: function () { throw new Error('SecurityError: storage disabled'); },
  removeItem: function () { throw new Error('SecurityError: storage disabled'); }
};
const context = {
  console: console,
  localStorage: unavailableStorage,
  document: {
    getElementById: function () { return null; },
    createElement: function () { return {}; }
  },
  confirm: function () { return true; },
  alert: function () {},
  prompt: function () { return null; }
};
context.window = context;
vm.createContext(context);
vm.runInContext(source, context, { filename: 'memoria-local.js' });

assert.strictEqual(context.POD_LS.setItem('test', 'value'), false,
  'POD_LS must report false when localStorage is unavailable');
assert.strictEqual(context.POD_LS.getItem('test'), 'value',
  'session-memory fallback must remain readable');
assert.strictEqual(context.setRaw('POD2|locks|gospel_es|CAMISETA', '{}'), false,
  'setRaw must not report volatile fallback as durable');

const result = context.setLockValue(
  'gospel_es|global',
  'CAMISETA',
  'estilo',
  'A',
  'Test Style'
);
assert.strictEqual(result.persisted, false,
  'setLockValue must report persisted=false with unavailable localStorage');
assert.strictEqual(context.loadLocks('gospel_es|global', 'CAMISETA').estilo.A, 'Test Style',
  'lock must remain usable during the current page session');

console.log('PASS storage-unavailable (5 assertions, 0 failures)');
