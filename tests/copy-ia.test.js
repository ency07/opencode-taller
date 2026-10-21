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
  ok(llamadas[0].url.indexOf('gemini-3.5-flash-lite') !== -1, 'serie 2.5 no existe para claves nuevas: usa el modelo vivo (3.x)');

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
  ok(rFail.proveedores === 2, 'informa cuántos proveedores tienen clave (2 de 3)');
  ok(diagTxt.indexOf('que parece de') === -1, 'claves de formato desconocido no se acusan (sin falsos positivos)');

  /* --- 9b) clave de OTRO proveedor en el slot: se detecta la confusión --- */
  global.fetch = function () { return Promise.resolve({ ok: false, status: 401 }); };
  window.getAISlots = function () {
    return [
      { provider: 'Groq', model: 'openai/gpt-oss-20b', key: 'sk-or-v1-0123456789abcdef', timeoutMs: 8000 },
      { provider: 'Gemini', model: 'gemini-2.5-flash', key: 'AQ.Ab8newformat123', timeoutMs: 8000 }
    ];
  };
  outEl.value = '';
  const rCruz = await PODCopyIA.sugerirCopy();
  const dCruz = (rCruz.diagnosticos || []).join(' | ');
  ok(dCruz.indexOf('Groq: HTTP 401 (clave de 25 caracteres que parece de OpenRouter') !== -1, 'detecta clave de OpenRouter en slot Groq');
  ok(dCruz.indexOf('Gemini: HTTP 401 (clave de 18 caracteres)') !== -1, 'acepta claves nuevas de Gemini (AQ.Ab…) sin falsos positivos');
  ok(dCruz.indexOf('AQ.Ab8newformat123') === -1 && dCruz.indexOf('0123456789abcdef') === -1, 'nunca imprime el cuerpo de la clave');

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

  /* --- 11) Gemini serie 2.5 (retirada para claves nuevas) → modelo vivo --- */
  llamadas = [];
  global.fetch = function (url, opt) {
    llamadas.push({ url: url, opt: opt });
    return Promise.resolve({
      ok: true,
      json: function () { return Promise.resolve({ candidates: [{ content: { parts: [{ text: '{"frase":"Vivir el dia","alternativas":[]}' }] } }] }); }
    });
  };
  window.getAISlots = function () { return [{ provider: 'Gemini', model: 'gemini-2.5-flash', key: 'AQ.Ab123', timeoutMs: 8000 }]; };
  outEl.value = '';
  const rVivo = await PODCopyIA.sugerirCopy();
  ok(rVivo && rVivo.frase === 'Vivir el dia', 'el slot 2.5 se redirige al modelo vivo y devuelve frase');
  ok(llamadas[0].url.indexOf('gemini-3.5-flash-lite') !== -1, 'la URL llama al modelo de visión por defecto (3.x)');

  /* --- 12) el vivo da 404: reintento único con el alterno --- */
  llamadas = [];
  let cuenta12 = 0;
  global.fetch = function (url) {
    llamadas.push({ url: url });
    cuenta12++;
    if (cuenta12 === 1) return Promise.resolve({ ok: false, status: 404 });
    return Promise.resolve({ ok: true, json: function () { return Promise.resolve({ candidates: [{ content: { parts: [{ text: '{"frase":"Segundo intento","alternativas":[]}' }] } }] }); } });
  };
  outEl.value = '';
  const rAlt = await PODCopyIA.sugerirCopy();
  ok(rAlt && rAlt.frase === 'Segundo intento', 'reintenta con el modelo alterno tras 404');
  ok(llamadas.length === 2 && llamadas[1].url.indexOf('gemini-2.5-flash') !== -1, 'el reintento llama exactamente al alterno');

  /* --- 13) ambos 404: error nombrando el modelo, sin bucle --- */
  llamadas = [];
  global.fetch = function (url) { llamadas.push({ url: url }); return Promise.resolve({ ok: false, status: 404 }); };
  outEl.value = '';
  const r404 = await PODCopyIA.sugerirCopy();
  ok(r404 && r404.error === 'respuesta-invalida', 'ambos modelos 404 → respuesta-invalida');
  ok(llamadas.length === 2, 'exactamente 2 intentos (sin bucle infinito)');
  ok((r404.diagnosticos || []).join(' ').indexOf('HTTP 404 (el modelo gemini-2.5-flash no existe para esta clave)') !== -1, 'el diagnóstico nombra el modelo caído');

  console.log((failures.length ? 'FAIL' : 'PASS') + ' copy-ia (' + checks + ' aserciones, ' + failures.length + ' fallos)');
  failures.forEach(function (msg) { console.error(' - ' + msg); });
  process.exit(failures.length ? 1 : 0);

})();
