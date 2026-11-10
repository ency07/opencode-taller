'use strict';
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');

const browser = {
  window: { addEventListener: function () {}, confirm: function () { return true; }, getComputedStyle: function () { return { getPropertyValue: function () { return ''; } }; }, requestAnimationFrame: function (fn) { fn(); }, matchMedia: function () { return { matches: false, addEventListener: function () {} }; } },
  document: { readyState: 'complete', addEventListener: function () {}, getElementById: function () { return null; }, querySelector: function () { return null; }, querySelectorAll: function () { return []; }, createElement: function () { return { style: {}, setAttribute: function () {}, appendChild: function () {} }; } },
  navigator: { userAgent: 'node' },
  location: { href: 'http://localhost/', protocol: 'http:', host: 'localhost', origin: 'http://localhost', search: '', hash: '' },
  localStorage: { getItem: function () { return null; }, setItem: function () {}, removeItem: function () {} },
  addEventListener: function () {}
};
browser.window.document = browser.document;
vm.createContext(browser);
vm.runInContext(fs.readFileSync(path.join(root, 'js/data-territorios.js'), 'utf8'), browser, { filename: 'js/data-territorios.js' });
vm.runInContext(fs.readFileSync(path.join(root, 'js/motor-nucleo.js'), 'utf8'), browser, { filename: 'js/motor-nucleo.js' });

const MOTOR_STATE = vm.runInContext('MOTOR_STATE', browser);
const _resolveTerritoryDirective = vm.runInContext('_resolveTerritoryDirective', browser);

function directiveFor(territory) {
  const r = vm.runInContext('_resolveTerritoryDirective(' + JSON.stringify(territory) + ')', browser);
  return String(r || '');
}

// Fix #1 (Red Team corrective): cuando existe concepto y mensaje, el territorio inyecta ANCLA CONCEPTO.
MOTOR_STATE.concept = 'Jardinero que llama por nombre en madrugada';
MOTOR_STATE.message = 'Jardinero que llama por nombre en madrugada';
MOTOR_STATE.creativeTerritory = 'SACRED_EDITORIAL';
const d1 = directiveFor('SACRED_EDITORIAL');
assert.ok(d1.indexOf('TERRITORIO CREATIVO ACTIVO') !== -1, 'El territorio activo debe seguir presente.');
assert.ok(d1.indexOf('ANCLA CONCEPTO: Jardinero que llama por nombre en madrugada.') !== -1, 'Debe existir ANCLA CONCEPTO con el concepto.');
assert.ok(d1.indexOf('El motivo visual debe derivarse de este concepto') !== -1, 'El motivo debe derivarse del concepto.');

// El ancla usa el concepto y no sustituye el mensaje visible.
MOTOR_STATE.concept = 'Jardinero llama por nombre';
MOTOR_STATE.message = 'Escena generica ajena al concepto';
const d2 = directiveFor('SACRED_EDITORIAL');
assert.ok(d2.indexOf('ANCLA CONCEPTO: Jardinero llama por nombre.') !== -1, 'La ancla debe usar el concepto.');
assert.ok(d2.indexOf('ANCLA CONCEPTO: Escena generica ajena al concepto') === -1, 'La ancla no debe usar el mensaje cuando existe concepto.');

// Sin concepto ni mensaje: no hay ancla.
MOTOR_STATE.concept = '';
MOTOR_STATE.message = '';
const d3 = directiveFor('SACRED_EDITORIAL');
assert.ok(d3.indexOf('ANCLA CONCEPTO') === -1, 'Sin concepto/mensaje no debe haber ANCLA CONCEPTO.');

// Territorio AUTO: sin directiva.
MOTOR_STATE.creativeTerritory = 'auto';
const d4 = directiveFor('auto');
assert.equal(d4, '', 'Territorio AUTO debe producir sin directiva.');

// El mensaje no debe alterarse con la resolucion de la ancla.
MOTOR_STATE.concept = 'Jardinero que llama por nombre en madrugada';
MOTOR_STATE.message = 'Jardinero que llama por nombre en madrugada';
MOTOR_STATE.creativeTerritory = 'SACRED_EDITORIAL';
const before = String(MOTOR_STATE.message);
directiveFor('SACRED_EDITORIAL');
assert.equal(String(MOTOR_STATE.message), before, 'La resolucion no debe alterar el mensaje original.');

console.log('PASS redteam-territorio-ancla: ANCLA CONCEPTO inyectado por _resolveTerritoryDirective (comportamiento real).');
