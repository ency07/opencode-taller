/* Test de diagnóstico de visión multi-proveedor (oct-2026).
   Regresión del bug "El analisis tardo demasiado y se cancelo" (45s sin
   respuesta = red bloqueada a Google, payload 20MB, sin failover).
   Verifica: pre-flight, downscale, failover OpenRouter→Gemini, migrate de
   modelos muertos, timeout corto + reintento, errores específicos y UI manual.

   Ejecutar:  node tests/ai-vision-diag.test.js
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
  readyState: 'complete',
  createElement: function () { return { style: {}, getContext: function () { return null; } }; },
  addEventListener: function () {},
  body: { appendChild: function () {} }
};
global.localStorage = {
  _m: {},
  getItem: function (k) { return Object.prototype.hasOwnProperty.call(this._m, k) ? this._m[k] : null; },
  setItem: function (k, v) { this._m[k] = String(v); },
  removeItem: function (k) { delete this._m[k]; }
};

const cliente = fs.readFileSync(path.join(JS, 'ia-client.js'), 'utf8');
const analisis = fs.readFileSync(path.join(JS, 'ia-analisis.js'), 'utf8');
const revisor = fs.readFileSync(path.join(JS, 'ia-revisor.js'), 'utf8');

/* ---------- 1. Infraestructura en ia-analisis.js ---------- */
['preflightVision', 'downscaleImage', 'pickVisionTarget', 'otherVisionTarget',
 'migrateVisionModel', 'callOpenRouterVision', 'callGeminiVision',
 'testVisionConnection', 'fetchWithTimeout', 'parseVisionJson',
 'getVisionConfig', 'getVisionSlots', 'VISION_DEAD_MODELS', 'VISION_DEFAULTS',
 'VISION_FALLBACK_OR', 'PODVision'
].forEach(function (name) {
  ok(analisis.indexOf(name) !== -1, 'ia-analisis.js sin ' + name);
});
ok(analisis.indexOf('45000') === -1, 'ia-analisis.js conserva el timeout ciego de 45s');
ok(/openrouter\.ai\/api\/v1\/chat\/completions/.test(cliente) || /openrouter\.ai\/api\/v1\/chat\/completions/.test(analisis), 'falta endpoint OpenAI-compatible de OpenRouter');
ok(/max-width|1024/.test(analisis) && /toDataURL\('image\/jpeg'/.test(analisis), 'downscale debe reducir a ~1024px JPEG');
ok(/nvidia\/nemotron-3-nano-omni-30b-a3b-reasoning:free/.test(analisis), 'falta default verificado OpenRouter :free con vision (nvidia nemotron omni)');
ok(/gemini-3\.5-flash-lite/.test(analisis), 'falta default verificado gemini-3.5-flash-lite');
ok(/nvidia\/nemotron-3-nano-omni/.test(analisis), 'falta fallback nemotron verificado');
ok(/Clave inválida o sin permiso/.test(analisis), 'falta mensaje 401/403');
ok(/Modelo retirado o inexistente/.test(analisis), 'falta mensaje 404');
ok(/Límite del tier free/.test(analisis), 'falta mensaje 429');
ok(/Red bloqueada hacia Google/.test(analisis), 'falta diagnóstico de bloqueo geográfico');
// Groq no tiene visión free → no debe aparecer como proveedor de visión
ok(analisis.indexOf('Groq') === -1 || !/vision.*groq|groq.*vision/i.test(analisis), 'Groq no debe usarse en visión (sin modelos free)');

/* ---------- 2. UI manual en barra IA ---------- */
['ai-vprov', 'ai-vtimeout', 'ai-vgmodel', 'ai-vomodel', 'ai-vtest', 'ai-vstatus'].forEach(function (id) {
  ok(revisor.indexOf('id="' + id + '"') !== -1, 'ia-revisor.js sin #' + id + ' en panel visión');
});
ok(revisor.indexOf('pod2_vision_cfg') !== -1, 'panel no guarda pod2_vision_cfg');
ok(revisor.indexOf('llamada real de VISIÓN') !== -1, 'el hint de Probar conexión debe aclarar que es prueba de visión (envía imagen)');
ok(/window\.getAISlots\s*=\s*getSlots/.test(revisor), 'ia-revisor.js no expone getAISlots (visión no reutiliza migrate)');
ok(revisor.indexOf('nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free') !== -1, 'panel revisor debe usar el default OpenRouter :free con vision');

/* ---------- 3. Runtime: lógica pura en vm ---------- */
vm.runInThisContext(cliente, { filename: 'ia-client.js' });
vm.runInThisContext(analisis, { filename: 'ia-analisis.js' });
const V = global.PODVision;
ok(V && typeof V.pickVisionTarget === 'function', 'window.PODVision no expuesto');

const slots = [
  { provider: 'Groq', model: 'openai/gpt-oss-20b', key: 'gsk_x', timeoutMs: 15000 },
  { provider: 'OpenRouter', model: 'google/gemini-2.5-flash', key: 'sk-or-v1_x', timeoutMs: 15000 },
  { provider: 'Gemini', model: 'gemini-2.5-flash', key: 'AIza_x', timeoutMs: 15000 }
];
const cfgAuto = { provider: 'auto', geminiModel: 'gemini-3.5-flash-lite', openrouterModel: 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free', timeoutMs: 20000 };

// auto: OpenRouter :free con vision es la prioridad por defecto (cero creditos)
let t = V.pickVisionTarget(slots, cfgAuto, { google: true, openrouter: true });
ok(t && t.kind === 'openrouter' && t.model === 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free', 'auto debe preferir OpenRouter :free con vision (dio ' + (t && t.kind) + '/' + (t && t.model) + ')');
// auto + OpenRouter bloqueado → Gemini directo con modelo nuevo
t = V.pickVisionTarget(slots, cfgAuto, { google: true, openrouter: false });
ok(t && t.kind === 'gemini' && t.model === 'gemini-3.5-flash-lite', 'auto con OpenRouter bloqueado debe ir a Gemini 3.5 (dio ' + (t && t.kind) + '/' + (t && t.model) + ')');
// fijado manual se respeta
t = V.pickVisionTarget(slots, { provider: 'openrouter', geminiModel: 'x', openrouterModel: 'y', timeoutMs: 15000 }, { google: true, openrouter: true });
ok(t && t.kind === 'openrouter', 'provider=openrouter debe respetarse');
t = V.pickVisionTarget(slots, { provider: 'gemini', geminiModel: 'x', openrouterModel: 'y', timeoutMs: 15000 }, { google: false, openrouter: true });
ok(t && t.kind === 'gemini', 'provider=gemini debe respetarse aun sin red');
// sin slots → null
ok(V.pickVisionTarget([], cfgAuto, {}) === null, 'sin slots debe dar null');
// failover cruzado
const cur = { kind: 'gemini', model: 'gemini-3.5-flash-lite', key: 'k', timeoutMs: 20000 };
const fo = V.otherVisionTarget(slots, cfgAuto, cur);
ok(fo && fo.kind === 'openrouter', 'failover de gemini debe ir a openrouter');
const fo2 = V.otherVisionTarget(slots, cfgAuto, { kind: 'openrouter', model: 'm', key: 'k', timeoutMs: 20000 });
ok(fo2 && fo2.kind === 'gemini', 'failover de openrouter debe ir a gemini');
ok(V.otherVisionTarget([{ provider: 'Gemini', key: 'k', model: 'm' }], cfgAuto, cur) === null, 'sin slot alterno no hay failover');
// migrate modelos muertos (2.5 no sirve a claves nuevas → vivo 3.x)
ok(V.migrateVisionModel('gemini-2.0-flash') === 'gemini-3.5-flash-lite', 'migrate no mapea gemini-2.0-flash al vivo 3.x');
ok(V.migrateVisionModel('gemini-2.5-flash') === 'gemini-3.5-flash-lite', 'migrate debe mover 2.5 (404 en claves nuevas) al vivo');
ok(V.migrateVisionModel('gemini-3.5-flash-lite') === 'gemini-3.5-flash-lite', 'migrate no debe tocar modelos vivos');
// defaults sin localStorage configurado
const dc = V.getVisionConfig();
ok(dc.provider === 'auto' && dc.timeoutMs === 20000, 'defaults de visión incorrectos');
ok(dc.openrouterModel === 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free', 'default OpenRouter de visión debe ser el modelo :free con visión (nvidia nemotron omni)');

/* ---------- 4. preflight con fetch stub ---------- */
const realFetch = global.fetch;
function stubFetch(impl) { global.fetch = impl; }
async function runPreflightTests() {
  // Red bloqueada: ambos false
  stubFetch(function () { return Promise.reject(new TypeError('Failed to fetch')); });
  let r = await V.preflightVision(300);
  ok(r.google === false && r.openrouter === false, 'preflight con red bloqueada debe dar false/false');
  // Red OK (HTTP 4xx cuenta como alcance)
  stubFetch(function () { return Promise.resolve({ ok: false, status: 400, json: function () { return Promise.resolve({}); } }); });
  r = await V.preflightVision(300);
  ok(r.google === true && r.openrouter === true, 'preflight con HTTP 4xx debe dar true/true (conecta)');
  stubFetch(realFetch);
}

/* ---------- 5. testVisionConnection envía imagen (no solo texto) ---------- */
async function runVisionProbeTests() {
  // Stub IAClient.chat para capturar argumentos (sin sobrescribir el cliente real)
  var captured = null;
  var realChat = global.window.IAClient.chat;
  var realTextOf = global.window.IAClient.textOf;
  global.window.IAClient.chat = function (slot, opts) {
    captured = { slot: slot, opts: opts };
    return Promise.resolve({ candidates: [{ content: { parts: [{ text: 'rojo' }] } }] });
  };
  global.window.IAClient.textOf = function () { return 'rojo'; };
  // Stub fetch para preflight
  stubFetch(function () { return Promise.resolve({ ok: false, status: 400, json: function () { return Promise.resolve({}); } }); });
  // Configurar slots con OpenRouter
  global.window.getAISlots = function () {
    return [{ provider: 'OpenRouter', model: 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free', key: 'sk-or-test', timeoutMs: 15000 }];
  };
  var r = await window.testVisionConnection();
  ok(r && r.ok === true && r.vision === true, 'testVisionConnection debe devolver vision:true cuando el modelo acepta imagen');
  ok(captured && captured.opts && captured.opts.openaiContent && captured.opts.openaiContent.length === 2, 'testVisionConnection debe enviar openaiContent con 2 elementos (texto + imagen)');
  ok(captured && captured.opts.openaiContent && captured.opts.openaiContent[1] && captured.opts.openaiContent[1].type === 'image_url', 'testVisionConnection debe enviar image_url');
  ok(captured && captured.opts.openaiContent && captured.opts.openaiContent[1] && captured.opts.openaiContent[1].image_url && captured.opts.openaiContent[1].image_url.url && captured.opts.openaiContent[1].image_url.url.indexOf('data:image/png;base64,') === 0, 'testVisionConnection debe enviar data-URI PNG');
  // Gemini path
  global.window.getAISlots = function () {
    return [{ provider: 'Gemini', model: 'gemini-3.5-flash-lite', key: 'AIza-test', timeoutMs: 15000 }];
  };
  captured = null;
  r = await window.testVisionConnection();
  ok(r && r.ok === true && r.vision === true, 'testVisionConnection Gemini debe devolver vision:true');
  ok(captured && captured.opts && captured.opts.geminiParts && captured.opts.geminiParts.length === 1, 'testVisionConnection Gemini debe enviar geminiParts');
  ok(captured && captured.opts.geminiParts && captured.opts.geminiParts[0] && captured.opts.geminiParts[0].inlineData && captured.opts.geminiParts[0].inlineData.mimeType === 'image/png', 'testVisionConnection Gemini debe enviar inlineData PNG');
  // 400 → vision:false
  global.window.IAClient.chat = function () {
    var e = new Error('rechazó la imagen'); e.httpStatus = 400; throw e;
  };
  r = await window.testVisionConnection();
  ok(r && r.ok === false && r.vision === false, 'testVisionConnection debe devolver vision:false en HTTP 400');
  global.window.IAClient.chat = realChat;
  global.window.IAClient.textOf = realTextOf;
  stubFetch(realFetch);
}

runPreflightTests().then(runVisionProbeTests).then(function () {
  const passed = failures.length === 0;
  console.log((passed ? 'PASS' : 'FAIL') + '  ai-vision-diag  (' + checks + ' aserciones, ' + failures.length + ' fallos)');
  failures.forEach(function (f) { console.log('  X ' + f); });
  process.exit(passed ? 0 : 1);
}).catch(function (e) {
  console.log('FAIL  ai-vision-diag  (excepción: ' + (e && e.message) + ')');
  process.exit(1);
});
