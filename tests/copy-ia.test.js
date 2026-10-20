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

  /* --- 4b) modo explorador: el concepto del brief entra al contexto --- */
  MOTOR_STATE.concept = '';
  MOTOR_STATE.explorationBrief = { concept: 'Escalera apoyada en una pared sin terminar', familyId: 'auto', familyLabel: 'Exploración libre' };
  const ctxExp = PODCopyIA.contextoActual();
  ok(ctxExp.concepto === 'Escalera apoyada en una pared sin terminar', 'sin concepto del usuario usa el del brief del explorador');
  const pExp = PODCopyIA.construirPromptContexto(ctxExp);
  ok(pExp.indexOf('Escalera apoyada en una pared sin terminar') !== -1, 'el concepto del explorador fluye al prompt de copy');
  MOTOR_STATE.explorationBrief = null;
  ok(PODCopyIA.contextoActual().concepto === '', 'sin brief ni concepto queda vacío (no inventa)');

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

  /* --- 7) contrato de red por proveedor (regresión del bug de auth) --- */
  let llamadas = [];
  global.fetch = function (url, opt) {
    llamadas.push({ url: url, opt: opt });
    return Promise.resolve({
      ok: true,
      json: function () {
        return Promise.resolve({ candidates: [{ content: { parts: [{ text: '{"frase":"Vuelve a empezar","alternativas":["Sigue subiendo"]}' }] } }] });
      }
    });
  };
  window.getAISlots = function () {
    return [{ provider: 'Gemini', model: 'gemini-2.5-flash', key: 'k-gem', timeoutMs: 15000 }];
  };
  outEl.value = '';
  const rGem = await PODCopyIA.sugerirCopy();
  ok(rGem && rGem.frase === 'Vuelve a empezar', 'Gemini devuelve frase usable');
  ok(llamadas.length === 1 && llamadas[0].opt.headers['x-goog-api-key'] === 'k-gem', 'Gemini manda la clave en x-goog-api-key');
  ok(!llamadas[0].opt.headers['Authorization'], 'Gemini NO manda Authorization Bearer');
  const bGem = JSON.parse(llamadas[0].opt.body);
  ok(bGem.generationConfig && bGem.generationConfig.responseMimeType === 'application/json', 'Gemini pide respuesta JSON');
  ok(bGem.generationConfig.maxOutputTokens >= 300, 'Gemini con presupuesto de tokens suficiente');
  ok(!!llamadas[0].opt.signal, 'la llamada lleva AbortSignal (timeout real)');

  /* --- 8) compatible OpenAI: JSON mode + tokens, y fallback entre slots --- */
  llamadas = [];
  global.fetch = function (url, opt) {
    llamadas.push({ url: url, opt: opt });
    return Promise.resolve({
      ok: true,
      json: function () { return Promise.resolve({ choices: [{ message: { content: '{"frase":"Otro viaje","alternativas":[]}' } }] }); }
    });
  };
  window.getAISlots = function () {
    return [{ provider: 'OpenRouter', model: 'google/gemini-2.5-flash', key: 'k-or', timeoutMs: 15000 }];
  };
  outEl.value = '';
  const rOr = await PODCopyIA.sugerirCopy();
  ok(rOr && rOr.frase === 'Otro viaje', 'OpenRouter devuelve frase');
  const bOr = JSON.parse(llamadas[0].opt.body);
  ok(bOr.response_format && bOr.response_format.type === 'json_object', 'OpenRouter/Groq piden JSON mode');
  ok(bOr.max_tokens >= 300, 'tokens suficientes para frase + alternativas');
  ok(llamadas[0].opt.headers['Authorization'] === 'Bearer k-or', 'OpenRouter usa Bearer');

  /* --- 9) errores reales visibles: proveedor + status (sin claves) --- */
  global.fetch = function () { return Promise.resolve({ ok: false, status: 401 }); };
  window.getAISlots = function () {
    return [
      { provider: 'Groq', model: 'openai/gpt-oss-20b', key: 'k-groq', timeoutMs: 8000 },
      { provider: 'Gemini', model: 'gemini-2.5-flash', key: 'k-gem2', timeoutMs: 8000 }
    ];
  };
  outEl.value = '';
  const rFail = await PODCopyIA.sugerirCopy();
  ok(rFail && rFail.error === 'respuesta-invalida', 'todo falla: respuesta-invalida');
  const diagTxt = (rFail.diagnosticos || []).join(' | ');
  ok(diagTxt.indexOf('Groq: HTTP 401') !== -1, 'el diagnóstico nombra Groq y su status');
  ok(diagTxt.indexOf('Gemini: HTTP 401') !== -1, 'el diagnóstico nombra Gemini y su status');
  ok(diagTxt.indexOf('k-groq') === -1 && diagTxt.indexOf('k-gem2') === -1, 'el diagnóstico nunca expone claves');

  /* --- 10) timeout real: slot colgado se aborta y pasa al siguiente --- */
  global.fetch = function (url, opt) {
    return new Promise(function (resolve, reject) {
      opt.signal.addEventListener('abort', function () {
        const e = new Error('aborted');
        e.name = 'AbortError';
        reject(e);
      });
    });
  };
  window.getAISlots = function () {
    return [{ provider: 'Groq', model: 'openai/gpt-oss-20b', key: 'k-slow', timeoutMs: 1200 }];
  };
  outEl.value = '';
  const t0 = Date.now();
  const rSlow = await PODCopyIA.sugerirCopy();
  ok(Date.now() - t0 < 5000, 'el timeout corta la espera (no cuelga el botón)');
  ok((rSlow.diagnosticos || []).join(' ').indexOf('sin respuesta en 1s') !== -1, 'el diagnóstico reporta el timeout del slot');

  console.log((failures.length ? 'FAIL' : 'PASS') + ' copy-ia (' + checks + ' aserciones, ' + failures.length + ' fallos)');
  failures.forEach(function (msg) { console.error(' - ' + msg); });
  process.exit(failures.length ? 1 : 0);

})();
