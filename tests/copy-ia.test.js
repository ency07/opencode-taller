/* Copy IA (Fase 6): mejora opcional de texto; sin claves no cambia nada;
   nunca bloquea copiar. Ejecutar: node tests/copy-ia.test.js */

'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
let checks = 0;
const failures = [];
function ok(cond, msg) { checks++; if (!cond) failures.push(msg); }

global.window = global;
global.sessionStorage = { getItem: function () { return '[]'; }, setItem: function () {}, removeItem: function () {} };
let outEl = { value: '' };
const els = { message: outEl };
function stubEl() {
  return {
    style: {},
    dataset: {},
    disabled: false,
    textContent: '',
    innerHTML: '',
    classList: { add: function () {}, remove: function () {}, toggle: function () {} },
    addEventListener: function () {},
    removeEventListener: function () {},
    appendChild: function () {},
    removeChild: function () {},
    querySelector: function () { return stubEl(); },
    querySelectorAll: function () { return []; }
  };
}

global.document = {
  body: { appendChild: function () {}, removeChild: function () {} },
  getElementById: function (id) { return els[id] || null; },
  querySelectorAll: function () { return []; },
  createElement: function () { return stubEl(); },
  readyState: 'complete'
};
global.fetch = function () { throw new Error('la prueba no debe hacer red'); };

const JS = path.join(ROOT, 'js');
['data-mercados.js', 'data-audiencias.js', 'data-bancos.js', 'data-estilos.js',
 'dominios.js', 'data-productos.js', 'memoria-local.js', 'motor-nucleo.js',
 'ia-revisor.js', 'copy-ia.js'
].forEach(function (f) {
  vm.runInThisContext(fs.readFileSync(path.join(JS, f), 'utf8'), { filename: f });
});

(async function main() {

  /* --- 1) parser JSON --- */
  ok(PODCopyIA.pJSON('```json\n{"frase":"a"}\n```').frase === 'a', 'pJSON lee con cerca de markdown');
  ok(PODCopyIA.pJSON('ruído {"frase":"b"} ruido').frase === 'b', 'pJSON ignora texto alrededor');
  ok(PODCopyIA.pJSON('nada') === null, 'pJSON rechaza basura');

  /* --- 2) validador de frases --- */
  ok(PODCopyIA.esFraseValida('Renace cada mañana'), 'frase corta válida');
  ok(!PODCopyIA.esFraseValida('muylargaquesinluces'), 'frase sin palabras separadas no valida');
  ok(!PODCopyIA.esFraseValida('Frase con <placeholder>'), 'rechaza marcos/inyección');
  ok(!PODCopyIA.esFraseValida(''), 'vacía inválida');

  /* --- 3) prompt de contexto --- */
  const p = PODCopyIA.construirPromptContexto({ mercado: 'global_es', producto: 'CAMISETA SOFT', familia: 'Pascua', concepto: 'zapatilla en la puerta', audiencia: 'gospel_adulto_fe' });
  ok(p.indexOf('JSON válido') !== -1 && p.indexOf('alternativas') !== -1, 'el prompt exige JSON + alternativas');
  ok(p.indexOf('Pascua') !== -1 && p.indexOf('zapatilla en la puerta') !== -1 && p.indexOf('gospel_adulto_fe') !== -1, 'el contexto fluye al prompt');
  ok(p.indexOf('versículos') !== -1 && p.indexOf('nombres propios') !== -1, 'prohibiciones de invención presentes');

  /* --- 4) sin claves configuradas: aviso, nada cambia --- */
  const rSin = await PODCopyIA.sugerirCopy();
  ok(rSin && rSin.error === 'sin-clave', 'sin claves: aviso de configuración, no invención');
  ok(outEl.value === '', 'el campo mensaje queda intacto sin claves');

  /* --- 5) mensaje existente: no se toca (revisión del usuario manda) --- */
  outEl.value = 'Frase del usuario';
  const rExiste = await PODCopyIA.sugerirCopy();
  ok(rExiste && rExiste.error === 'mensaje-existe', 'con mensaje escrito, no propone nada');
  ok(outEl.value === 'Frase del usuario', 'el mensaje del usuario queda intacto');
  outEl.value = '';

  /* --- 6) estático: botón y script conectados en index.html --- */
  const idx = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  ok(idx.indexOf('js/copy-ia.js') !== -1, 'index.html incluye copy-ia.js');
  ok(idx.indexOf('id="btnSugerirCopy"') !== -1 && idx.indexOf('id="copyIAStatus"') !== -1, 'botón y estado en index.html');
  ok(idx.indexOf('id="btnCopy"') !== -1, 'el botón copiar queda intacto');

  console.log((failures.length ? 'FAIL' : 'PASS') + ' copy-ia (' + checks + ' aserciones, ' + failures.length + ' fallos)');
  failures.forEach(function (msg) { console.error(' - ' + msg); });
  process.exit(failures.length ? 1 : 0);

})();
