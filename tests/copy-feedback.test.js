/* Confirmación visual de copiado: al copiar, el botón se pinta (.btn-copiado),
   muestra «✓ Copiado» y vuelve a su estado original. Cubre prompt, partes y
   el JSON de sync. Ejecutar: node tests/copy-feedback.test.js */

'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const JS = path.join(ROOT, 'js');
let checks = 0;
const failures = [];
function ok(cond, msg) { checks++; if (!cond) failures.push(msg); }

const motorSrc = fs.readFileSync(path.join(JS, 'motor-nucleo.js'), 'utf8');
const syncSrc = fs.readFileSync(path.join(JS, 'sync-supabase.js'), 'utf8');
const cssSrc = fs.readFileSync(path.join(ROOT, 'styles.css'), 'utf8');

/* --- 1) Fuente --- */
ok(cssSrc.indexOf('button.btn-copiado') !== -1 && cssSrc.indexOf('transform: scale(1.05)') !== -1,
  'styles.css define .btn-copiado con fondo, color y escala');
ok(cssSrc.indexOf('transition: border-color 0.15s ease, background-color 0.15s ease, color 0.15s ease, opacity 0.15s ease, transform 0.18s ease;') !== -1,
  'los botones transicionan también transform (animación visible)');
ok(motorSrc.indexOf('function _feedbackCopiado') !== -1, 'motor define _feedbackCopiado');
ok(motorSrc.indexOf('window._feedbackCopiado = _feedbackCopiado') !== -1, '_feedbackCopiado exportada para otros módulos');
ok(motorSrc.indexOf('class="good">Prompt copiado. Pégalo en tu IA de imagen.</span>\' + avisoHtml;') !== -1
  && motorSrc.indexOf("_feedbackCopiado(document.getElementById('btnCopy'));") !== -1,
  'copiarPrompt (éxito principal) dispara el feedback en btnCopy');
ok(motorSrc.indexOf("Copiado con fallback.</span>' + avisoHtml; _feedbackCopiado(document.getElementById('btnCopy'));") !== -1,
  'copiarPrompt (éxito fallback) también dispara el feedback');
ok(motorSrc.indexOf('if (ok) _feedbackCopiado(btn);') !== -1,
  'copiarPartePrompt dispara el feedback solo si copió (ok)');
ok(syncSrc.indexOf('_feedbackCopiado(btnJson)') !== -1,
  'el JSON de sync-supabase también confirma con feedback');

/* --- DOM falso + clipboard que SIEMPRE funciona --- */
const captured = [];
function fakeBtn(texto) {
  const _s = new Set();
  return {
    textContent: texto,
    classList: {
      add: function (c) { _s.add(c); },
      remove: function (c) { _s.delete(c); },
      contains: function (c) { return _s.has(c); }
    }
  };
}
const els = {
  out: { value: '', focus: function () {}, select: function () {} },
  status: { innerHTML: '', textContent: '' },
  btnCopy: fakeBtn('Copiar el prompt'),
  btnCopyPart: fakeBtn('Copiar parte 1/2')
};
global.window = global;
global.document = {
  getElementById: function (id) { return els[id] || null; },
  querySelectorAll: function () { return []; },
  readyState: 'complete',
  createElement: function () { return { value: '', style: {}, select: function () {} }; },
  addEventListener: function () {},
  body: { appendChild: function () {}, removeChild: function () {} }
};
Object.defineProperty(global, 'navigator', {
  value: { clipboard: { writeText: function (t) { captured.push(String(t)); return Promise.resolve(); } } },
  configurable: true
});

['data-mercados.js', 'data-audiencias.js', 'data-bancos.js', 'data-estilos.js',
 'dominios.js', 'data-productos.js', 'memoria-local.js', 'motor-nucleo.js'
].forEach(function (f) {
  vm.runInThisContext(fs.readFileSync(path.join(JS, f), 'utf8'), { filename: f });
});

const sleep = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };

(async function () {
  /* --- 2) Helper directo: pinta, dice «✓ Copiado» y revierte --- */
  const b = fakeBtn('Original');
  _feedbackCopiado(b, 40);
  ok(b.classList.contains('btn-copiado'), 'helper: clase btn-copiado aplicada');
  ok(b.textContent === '✓ Copiado', 'helper: texto «✓ Copiado» durante la animación');
  await sleep(90);
  ok(!b.classList.contains('btn-copiado'), 'helper: clase retirada tras el tiempo');
  ok(b.textContent === 'Original', 'helper: texto original restaurado');

  /* --- 3) copiarPrompt real: feedback en btnCopy --- */
  els.out.value = 'PROMPT DE PRUEBA LARGO';
  await copiarPrompt();
  ok(els.btnCopy.classList.contains('btn-copiado'), 'copiarPrompt: btnCopy pintado al copiar');
  ok(els.btnCopy.textContent === '✓ Copiado', 'copiarPrompt: btnCopy dice «✓ Copiado»');
  ok(els.status.innerHTML.indexOf('Prompt copiado') !== -1, 'copiarPrompt: mensaje de estado igual que antes');
  await sleep(1650);
  ok(!els.btnCopy.classList.contains('btn-copiado'), 'copiarPrompt: btnCopy vuelve a su color');
  ok(els.btnCopy.textContent === 'Copiar el prompt', 'copiarPrompt: btnCopy restaura su texto original');

  /* --- 4) copiarPartePrompt: feedback solo al copiar --- */
  await copiarPartePrompt();
  ok(els.btnCopyPart.classList.contains('btn-copiado'), 'copiarPartePrompt: btnCopyPart pintado');
  ok(els.btnCopyPart.textContent === '✓ Copiado', 'copiarPartePrompt: dice «✓ Copiado»');
  await sleep(1650);
  ok(els.btnCopyPart.textContent === 'Copiar parte 2/2',
    'copiarPartePrompt: tras la animación queda el texto de la siguiente parte');

  /* --- 5) Sin prompt: no hay feedback (no copió nada) --- */
  els.out.value = '';
  await copiarPrompt();
  ok(!els.btnCopy.classList.contains('btn-copiado'), 'sin prompt: btnCopy NO se pinta');

  const passed = failures.length === 0;
  console.log((passed ? 'PASS' : 'FAIL') + '  copy-feedback  (' + checks + ' aserciones, ' + failures.length + ' fallos)');
  failures.forEach(function (f) { console.log('  X ' + f); });
  process.exit(passed ? 0 : 1);
})();
