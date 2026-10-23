/* Copiar prompt por partes: los chats y las IAs web cortan entradas largas.
   Parte 1 = hasta «### 01B»; parte 2 = el resto; parte 1 + parte 2 = el prompt
   ÍNTEGRO. «Copiar el prompt» original sigue copiando el 100% (garantía de que
   la app nunca trunca). Ejecutar: node tests/copiar-prompt-partes.test.js */

'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
let checks = 0;
const failures = [];
function ok(cond, msg) { checks++; if (!cond) failures.push(msg); }

const indexSrc = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const motorSrc = fs.readFileSync(path.join(ROOT, 'js', 'motor-nucleo.js'), 'utf8');
const iaSrc = fs.readFileSync(path.join(ROOT, 'js', 'ia-analisis.js'), 'utf8');

/* --- 0) Fuente --- */
ok(indexSrc.includes('id="btnCopyPart"'), 'index.html tiene el botón btnCopyPart');
ok(motorSrc.includes('function _splitPrompt'), 'motor define _splitPrompt');
ok(motorSrc.includes('function copiarPartePrompt'), 'motor define copiarPartePrompt');
ok(iaSrc.includes("on('btnCopyPart'"), 'ia-analisis enlaza btnCopyPart');
ok(motorSrc.includes('window.copiarPartePrompt = copiarPartePrompt'), 'copiarPartePrompt exportada');
ok(motorSrc.includes('window._splitPrompt = _splitPrompt'), '_splitPrompt exportada');
ok(motorSrc.includes('outEl.value = formatPrompt(LAST_RESULT)'), 'garantía: el textarea recibe el prompt COMPLETO (sin slice)');
ok(motorSrc.includes('clipboard.writeText(outEl.value)'), 'garantía: «Copiar el prompt» copia el valor ENTERO del textarea');

/* --- DOM falso + clipboard capturadora --- */
const els = {
  out: { value: '', focus: function () {}, select: function () {} },
  status: { innerHTML: '', textContent: '' },
  btnCopyPart: {
    textContent: 'Copiar parte 1/2',
    classList: (function () {
      const s = new Set();
      return { add: function (c) { s.add(c); }, remove: function (c) { s.delete(c); }, contains: function (c) { return s.has(c); } };
    })()
  }
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
const captured = [];
Object.defineProperty(global, 'navigator', {
  value: { clipboard: { writeText: function (t) { captured.push(String(t)); return Promise.resolve(); } } },
  configurable: true
});

const JS = path.join(ROOT, 'js');
['data-mercados.js', 'data-audiencias.js', 'data-bancos.js', 'data-estilos.js',
 'dominios.js', 'data-productos.js', 'memoria-local.js', 'motor-nucleo.js'
].forEach(function (f) {
  vm.runInThisContext(fs.readFileSync(path.join(JS, f), 'utf8'), { filename: f });
});

/* --- 1) _splitPrompt puro --- */
const P = 'CABECERA MERCADO\n### 01A · Estilo A\nCONTENIDO A LARGO\n### 01B · Estilo B\nCONTENIDO B\n### 01C · Estilo C\nCONTENIDO C\nFIN';
const partes = _splitPrompt(P);
ok(partes.length === 2, 'prompt con fichas → 2 partes');
ok(partes.join('') === P, 'parte 1 + parte 2 = original EXACTO');
ok(partes[0].indexOf('### 01B') === -1 && partes[0].indexOf('### 01A') !== -1, 'parte 1 contiene 01A y corta ANTES de 01B');
ok(partes[1].slice(0, 7) === '### 01B', 'parte 2 empieza exactamente en ### 01B');

const sinMarca = ('x'.repeat(50));
const mitades = _splitPrompt(sinMarca);
ok(mitades.length === 2 && mitades.join('') === sinMarca && mitades[0].length > 0 && mitades[1].length > 0,
  'sin marcador → 2 mitades que recomponen el original');
ok(_splitPrompt('').length === 0, 'texto vacío → sin partes');

/* --- 2) Prompt REAL del motor tiene el marcador y se parte limpio --- */
MOTOR_STATE.workflowMode = 'explore';
MOTOR_STATE.market = 'colombia';
MOTOR_STATE.language = 'es';
MOTOR_STATE.product = 'CAMISETA SOFT';
MOTOR_STATE.concept = 'fogata pequeña para contar historias';
MOTOR_STATE.message = '';
MOTOR_STATE.support = '';
MOTOR_STATE.audienceSet = 'Auto';
MOTOR_STATE.explorationBrief = null;
function ficha(jer, extra) {
  const base = {
    estilo: 'Minimal Modern', audiencia: 'coste_adulto_m', jerarquiaVisual: jer,
    objeto: 'campfire small enough to hold in talk',
    arquitectura: 'a', composicion: 'b', layout: 'Columna apilada',
    placement: 'pecho centrado', escalaProducto: 'media',
    formaSimbolo: 'c', tecnica: 'd', tratamiento: 'e',
    textoPrincipal: 'T', textoApoyo: 'A', textoTerciario: 'S',
    tipografia: 'Slab pesada', paleta: 'pal (modo: X)', familiaColor: 'f',
    fitAudiencia: 70, fitProducto: 60, densidad: 'Media', negativeSpace: 'abierto',
    distribucionTexto: 'TEXTO ARRIBA, motivo debajo', integracionTexto: 'w', relacion: 'r'
  };
  Object.keys(extra || {}).forEach(function (k) { base[k] = extra[k]; });
  return base;
}
const set = {
  A: ficha('BALANCEADO', { estilo: 'Grunge / DIY' }),
  B: ficha('TEXTO_DOMINANTE', { estilo: 'Hand-Drawn' }),
  C: ficha('OBJETO_DOMINANTE', { estilo: 'Brutalist' })
};
const real = formatPrompt({ set: set });
ok(real.indexOf('### 01B') > 0, 'el prompt real contiene ### 01B (corte limpio posible)');
const partesReal = _splitPrompt(real);
ok(partesReal.length === 2 && partesReal.join('') === real, 'prompt real: partes recomponen el original byte a byte');
ok(partesReal[1].slice(0, 7) === '### 01B', 'prompt real: la parte 2 arranca en ### 01B');
ok(real.length > 5000, 'prompt real es largo (' + real.length + ' chars) — motivo de las partes');

/* --- 3) copiarPartePrompt end-to-end (2 llamadas = prompt íntegro) --- */
const sleep = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };

(async function () {
  els.out.value = real;

  await copiarPartePrompt();
  ok(captured.length === 1 && captured[0] === partesReal[0], '1ª pulsación copia la parte 1 (' + (captured[0] || '').length + ' chars)');
  ok(els.btnCopyPart.textContent === '✓ Copiado' && els.btnCopyPart.classList.contains('btn-copiado'),
    'feedback: «✓ Copiado» + clase .btn-copiado durante la animación');
  ok(els.status.innerHTML.indexOf('Parte 1/2 copiada') !== -1, 'el estado anuncia Parte 1/2');
  await sleep(1650);
  ok(els.btnCopyPart.textContent === 'Copiar parte 2/2', 'el botón pasa a «Copiar parte 2/2»');

  await copiarPartePrompt();
  ok(captured.length === 2 && captured[1] === partesReal[1], '2ª pulsación copia la parte 2 (' + (captured[1] || '').length + ' chars)');
  ok(captured[0] + captured[1] === real, 'las 2 partes copiadas suman el prompt ÍNTEGRO');
  ok(els.btnCopyPart.textContent === '✓ Copiado', 'feedback también en la parte 2');
  ok(els.status.innerHTML.indexOf('Parte 2/2 copiada') !== -1, 'el estado anuncia Parte 2/2');
  await sleep(1650);
  ok(els.btnCopyPart.textContent === 'Copiar parte 1/2', 'el botón vuelve a «Copiar parte 1/2»');

  /* Si el prompt cambia, vuelve a empezar por la parte 1 */
  els.out.value = real + '\nCAMBIO';
  await copiarPartePrompt();
  const nuevas = _splitPrompt(els.out.value);
  ok(captured.length === 3 && captured[2] === nuevas[0], 'prompt cambiado → la siguiente pulsación es la parte 1 del nuevo');

  /* Sin prompt: mensaje de error y nada copiado */
  const antes = captured.length;
  els.out.value = '';
  await copiarPartePrompt();
  ok(captured.length === antes, 'sin prompt no se copia nada');
  ok(els.status.innerHTML.indexOf('No hay prompt') !== -1, 'sin prompt el estado avisa');

  const passed = failures.length === 0;
  console.log((passed ? 'PASS' : 'FAIL') + '  copiar-prompt-partes  (' + checks + ' aserciones, ' + failures.length + ' fallos)');
  failures.forEach(function (f) { console.log('  X ' + f); });
  process.exit(passed ? 0 : 1);
})();
