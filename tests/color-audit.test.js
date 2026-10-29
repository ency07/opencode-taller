/* Test de auditoría de cambios de color hechos por la IA (regla UX POD).
   Tras un análisis con visión, cuando el motor (o el reroll) asigna una nueva
   paleta/familia de color, la interfaz debe quedar con el rastro de qué
   cambió y en dónde (ficha + eje + valores).

   Ejecutar:  node tests/color-audit.test.js
   Sale con código 1 si falla cualquier aserción. */

'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const JS = path.join(ROOT, 'js');
let checks = 0;
const failures = [];
function ok(cond, msg) { checks++; if (!cond) failures.push(msg); }

global.window = global;
global.document = {
  getElementById: function () { return null; },
  querySelectorAll: function () { return []; },
  createElement: function () { return { style: {}, getContext: function () { return null; }, appendChild: function () {} }; },
  addEventListener: function () {},
  body: { appendChild: function () {} }
};
global.localStorage = {
  _m: {},
  getItem: function (k) { return Object.prototype.hasOwnProperty.call(this._m, k) ? this._m[k] : null; },
  setItem: function (k, v) { this._m[k] = String(v); },
  removeItem: function (k) { delete this._m[k]; }
};

['data-mercados.js', 'data-audiencias.js', 'data-bancos.js', 'data-estilos.js',
 'dominios.js', 'data-productos.js', 'memoria-local.js', 'motor-nucleo.js'
].forEach(function (f) {
  vm.runInThisContext(fs.readFileSync(path.join(JS, f), 'utf8'), { filename: f });
});

const motorSrc = fs.readFileSync(path.join(JS, 'motor-nucleo.js'), 'utf8');
const indexSrc = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');

/* ---------- 1. Contratos estáticos ---------- */
ok(motorSrc.indexOf('function auditSetColors') !== -1, 'motor-nucleo.js sin auditSetColors');
ok(motorSrc.indexOf('function auditFichaColors') !== -1, 'motor-nucleo.js sin auditFichaColors');
ok(motorSrc.indexOf('function renderColorAudit') !== -1, 'motor-nucleo.js sin renderColorAudit');
ok(motorSrc.indexOf("getElementById('colorAudit')") !== -1, 'auditoría debe escribir en #colorAudit');
ok(motorSrc.indexOf('recordColorAudit(colorChanges)') !== -1, 'generateSet no registra el cambio de color auditado');
ok(motorSrc.indexOf('auditFichaColors(current, best') !== -1, 'rerollSingle no audita el cambio de color de la ficha');
ok(indexSrc.indexOf('id="colorAudit"') !== -1, 'index.html no tiene el elemento #colorAudit');

/* ---------- 2. Runtime: lógica pura en vm ---------- */
const setAntes = {
  A: { familiaColor: 'kraft', paleta: 'kraft — fondo #14141A · dominante #3E424A' },
  B: { familiaColor: 'kraft', paleta: 'kraft — fondo #14141A · dominante #3E424A' },
  C: { familiaColor: 'kraft', paleta: 'kraft — fondo #14141A · dominante #3E424A' }
};
const setDespues = {
  A: { familiaColor: 'terracota', paleta: 'kraft — fondo #14141A · dominante #3E424A' },
  B: { familiaColor: 'arena', paleta: 'kraft — fondo #14141A · dominante #3E424A' },
  C: { familiaColor: 'kraft', paleta: 'kraft — fondo #14141A · dominante #3E424A' }
};

let changes = auditSetColors(setAntes, setDespues);
ok(Array.isArray(changes) && changes.length === 2, 'debe detectar solo los ejes que cambiaron (2, no 6)');
ok(changes[0] && changes[0].ficha === '01A', 'cambio debe reportar la ficha (01A)');
ok(changes[0] && changes[0].eje === 'familiaColor', 'cambio debe reportar el eje (familiaColor)');
ok(changes[0] && changes[0].antes === 'kraft' && changes[0].despues === 'terracota', 'cambio debe reportar valores antes/después');
ok(changes[1] && changes[1].ficha === '01B' && changes[1].eje === 'familiaColor', 'cambio de segunda ficha debe seguir el orden A,B,C');

// Sin cambios → lista vacía
ok(auditSetColors(setAntes, JSON.parse(JSON.stringify(setAntes))).length === 0, 'set idéntico no debe registrar cambios');

// Sin set anterior (primera generación) → sin cambios reportados
ok(auditSetColors(null, setAntes).length === 0, 'sin set anterior no debe reportar cambios');

// Auditoría pura: una ficha cambia familia y otra paleta
const setMix = {
  A: { familiaColor: 'kraft', paleta: 'kraft — fondo #14141A · dominante #3E424A' },
  B: { familiaColor: 'kraft', paleta: 'kraft — fondo #14141A · dominante #3E424A' },
  C: { familiaColor: 'kraft', paleta: 'kraft — fondo #14141A · dominante #3E424A' }
};
const setMix2 = JSON.parse(JSON.stringify(setMix));
setMix2.B.paleta = 'paleta nueva — fondo #111111 · dominante #222222';
let mixChanges = auditFichaColors(setMix.B, setMix2.B, '01B');
ok(mixChanges.length === 1 && mixChanges[0].eje === 'paleta', 'auditFichaColors debe separar familiaColor de paleta');

// Render es tolerante sin elemento DOM real
renderColorAudit();

/* ---------- 3. Resumen ---------- */
const passed = failures.length === 0;
console.log((passed ? 'PASS' : 'FAIL') + '  color-audit  (' + checks + ' aserciones, ' + failures.length + ' fallos)');
failures.forEach(function (f) { console.log('  X ' + f); });
process.exit(passed ? 0 : 1);
