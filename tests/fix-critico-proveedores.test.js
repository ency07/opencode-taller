/* Test del fix crítico: errores de proveedores (400/403/503), fallback y
   prueba real de visión. Verifica que:
   - Gemini 403 diferencia 4 causas (clave inválida, sin permisos, API no
     habilitada, clave de Agent Platform).
   - Gemini 503 reintenta 1× con backoff.
   - OpenRouter 400 NO reintenta (evita bucles inútiles).
   - Fallback entre proveedores funciona.
   - testVisionConnection envía imagen real (no solo texto).

   Ejecutar:  node tests/fix-critico-proveedores.test.js
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
  addEventListener: function () {},
  createElement: function () { return { style: {}, getContext: function () { return null; } }; },
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

vm.runInThisContext(cliente, { filename: 'ia-client.js' });
vm.runInThisContext(analisis, { filename: 'ia-analisis.js' });
// ia-revisor.js no se ejecuta: construye UI y requiere DOM completo.
// Solo se lee para verificaciones estáticas.

const V = global.PODVision;
const IC = global.IAClient;
ok(V && typeof V.callGeminiVision === 'function', 'PODVision.callGeminiVision expuesto');
ok(V && typeof V.callOpenRouterVision === 'function', 'PODVision.callOpenRouterVision expuesto');

const realFetch = global.fetch;
function stubFetch(impl) { global.fetch = impl; }
function respError(status, detail) {
  return Promise.resolve({
    ok: false,
    status: status,
    json: function () { return Promise.resolve(detail ? { error: { message: detail } } : {}); }
  });
}
function respOk(body) {
  return Promise.resolve({ ok: true, json: function () { return Promise.resolve(body); } });
}

(async function main() {

  /* ---------- 1. Gemini 403 diferenciado en 4 causas ---------- */
  const casos403 = [
    { detalle: 'API key not valid. Please pass a valid API key.', espera: 'inválida' },
    { detalle: 'Permission denied on resource', espera: 'permisos' },
    { detalle: 'API has not been used in project before or it is disabled', espera: 'habilitada' },
    { detalle: '', espera: 'Agent Platform' }
  ];
  for (const c of casos403) {
    stubFetch(function () { return respError(403, c.detalle); });
    let err = null;
    try {
      await IC.chat({ provider: 'Gemini', model: 'gemini-3.5-flash-lite', key: 'k' }, {
        user: 'u',
        httpMessage: function (status, detail) { return 'HTTP ' + status + (detail ? ': ' + detail : ''); }
      });
    } catch (e) { err = e; }
    ok(err && err.httpStatus === 403, '403 Gemini: httpStatus 403 (detalle: ' + c.detalle + ')');
    ok(err && err.message.indexOf(c.espera) !== -1,
      '403 Gemini: mensaje diferencia causa «' + c.espera + '» (got: ' + (err && err.message) + ')');
  }

  /* ---------- 2. Gemini 503 reintenta 1× con backoff ---------- */
  let llamadas = 0;
  stubFetch(function () {
    llamadas++;
    if (llamadas === 1) return respError(503, 'The model is overloaded');
    return respOk({ candidates: [{ content: { parts: [{ text: '{"fichas":[]}' }] } }] });
  });
  const t0 = Date.now();
  const r503 = await V.callGeminiVision(
    { kind: 'gemini', model: 'gemini-3.5-flash-lite', key: 'k', timeoutMs: 5000 },
    { mimeType: 'image/png', base64: 'AAA' },
    'test'
  );
  const dt = Date.now() - t0;
  ok(llamadas === 2, '503 Gemini: reintenta 1× (llamadas=' + llamadas + ')');
  ok(dt >= 1500, '503 Gemini: backoff de 2s entre intentos (dt=' + dt + 'ms)');
  ok(r503 && typeof r503 === 'object', '503 Gemini: tras reintento responde el objeto');

  /* ---------- 3. OpenRouter 400 NO reintenta ---------- */
  llamadas = 0;
  stubFetch(function () { llamadas++; return respError(400, 'bad request'); });
  let err400 = null;
  try {
    await V.callOpenRouterVision(
      { kind: 'openrouter', model: 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free', key: 'k', timeoutMs: 5000 },
      { mimeType: 'image/png', base64: 'AAA' },
      'test'
    );
  } catch (e) { err400 = e; }
  ok(llamadas === 1, '400 OpenRouter: NO reintenta (llamadas=' + llamadas + ')');
  ok(err400 && err400.httpStatus === 400, '400 OpenRouter: lanza con httpStatus 400');

  /* ---------- 4. Gemini 400 tampoco reintenta ---------- */
  llamadas = 0;
  stubFetch(function () { llamadas++; return respError(400, 'bad request'); });
  let err400g = null;
  try {
    await V.callGeminiVision(
      { kind: 'gemini', model: 'gemini-3.5-flash-lite', key: 'k', timeoutMs: 5000 },
      { mimeType: 'image/png', base64: 'AAA' },
      'test'
    );
  } catch (e) { err400g = e; }
  ok(llamadas === 1, '400 Gemini: NO reintenta (llamadas=' + llamadas + ')');
  ok(err400g && err400g.httpStatus === 400, '400 Gemini: lanza con httpStatus 400');

  /* ---------- 5. Fallback entre proveedores ---------- */
  global.window.getAISlots = function () {
    return [
      { provider: 'OpenRouter', model: 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free', key: 'sk-or-x', timeoutMs: 5000 },
      { provider: 'Gemini', model: 'gemini-3.5-flash-lite', key: 'AIza-x', timeoutMs: 5000 }
    ];
  };
  const cfgAuto = { provider: 'auto', geminiModel: 'gemini-3.5-flash-lite', openrouterModel: 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free', timeoutMs: 20000 };
  const cur = { kind: 'openrouter', model: 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free', key: 'sk-or-x', timeoutMs: 5000 };
  const fo = V.otherVisionTarget(global.window.getAISlots(), cfgAuto, cur);
  ok(fo && fo.kind === 'gemini' && fo.model === 'gemini-3.5-flash-lite',
    'fallback: OpenRouter → Gemini con modelo vivo (dio ' + (fo && fo.kind) + '/' + (fo && fo.model) + ')');
  const fo2 = V.otherVisionTarget(global.window.getAISlots(), cfgAuto, { kind: 'gemini', model: 'gemini-3.5-flash-lite', key: 'AIza-x', timeoutMs: 5000 });
  ok(fo2 && fo2.kind === 'openrouter', 'fallback: Gemini → OpenRouter');
  ok(V.otherVisionTarget([{ provider: 'Gemini', key: 'k', model: 'm' }], cfgAuto, { kind: 'gemini', model: 'm', key: 'k', timeoutMs: 5000 }) === null,
    'fallback: sin slot alterno → null (no hay bucle)');
  // Sin slots → no hay fallback
  ok(V.otherVisionTarget([], cfgAuto, cur) === null, 'fallback sin slots → null');

  /* ---------- 6. Ausencia de claves ---------- */
  global.window.getAISlots = function () { return []; };
  const rSin = await V.callGeminiVision(
    { kind: 'gemini', model: 'm', key: '', timeoutMs: 5000 },
    { mimeType: 'image/png', base64: 'AAA' },
    'test'
  ).catch(function (e) { return { error: e.message }; });
  ok(rSin && (rSin.error || rSin), 'sin claves: no rompe (devuelve error manejable)');

  /* ---------- 7. Modelo sin soporte de visión (400 en testVisionConnection) ---------- */
  global.window.getAISlots = function () {
    return [{ provider: 'OpenRouter', model: 'meta-llama/llama-3-8b', key: 'sk-or-x', timeoutMs: 5000 }];
  };
  stubFetch(function () { return respError(400, 'model does not support images'); });
  const rV400 = await global.testVisionConnection();
  ok(rV400 && rV400.ok === false && rV400.vision === false,
    'testVisionConnection: modelo sin visión → vision:false');
  ok(rV400 && rV400.message.indexOf('400') !== -1,
    'testVisionConnection: menciona HTTP 400 (got: ' + (rV400 && rV400.message) + ')');

  /* ---------- 8. testVisionConnection envía imagen (Gemini) ---------- */
  let capturedGemini = null;
  const realChat = IC.chat;
  IC.chat = function (slot, opts) {
    capturedGemini = { slot: slot, opts: opts };
    return Promise.resolve({ candidates: [{ content: { parts: [{ text: 'rojo' }] } }] });
  };
  global.window.getAISlots = function () {
    return [{ provider: 'Gemini', model: 'gemini-3.5-flash-lite', key: 'AIza-x', timeoutMs: 5000 }];
  };
  stubFetch(function () { return respError(400, ''); }); // preflight "OK" (conecta)
  const rVisG = await global.testVisionConnection();
  ok(rVisG && rVisG.ok === true && rVisG.vision === true, 'testVisionConnection Gemini: vision:true');
  ok(capturedGemini && capturedGemini.opts.geminiParts &&
     capturedGemini.opts.geminiParts[0].inlineData.mimeType === 'image/png',
    'testVisionConnection Gemini: envía inlineData PNG');
  IC.chat = realChat;

  /* ---------- 9. testVisionConnection envía imagen (OpenRouter) ---------- */
  let capturedOR = null;
  IC.chat = function (slot, opts) {
    capturedOR = { slot: slot, opts: opts };
    return Promise.resolve({ choices: [{ message: { content: 'rojo' } }] });
  };
  global.window.getAISlots = function () {
    return [{ provider: 'OpenRouter', model: 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free', key: 'sk-or-x', timeoutMs: 5000 }];
  };
  const rVisO = await global.testVisionConnection();
  ok(rVisO && rVisO.ok === true && rVisO.vision === true, 'testVisionConnection OpenRouter: vision:true');
  ok(capturedOR && capturedOR.opts.openaiContent &&
     capturedOR.opts.openaiContent[1].image_url.url.indexOf('data:image/png;base64,') === 0,
    'testVisionConnection OpenRouter: envía image_url data-URI');
  IC.chat = realChat;

  /* ---------- 10. Nunca filtra claves en mensajes ---------- */
  stubFetch(function () { return respError(401, 'invalid key AIzaSECRET'); });
  let errKey = null;
  try {
    await IC.chat({ provider: 'Gemini', model: 'm', key: 'AIzaSECRET' }, { user: 'u' });
  } catch (e) { errKey = e; }
  ok(errKey && errKey.message.indexOf('AIzaSECRET') === -1,
    'los mensajes de error no filtran la clave');
  ok(errKey && errKey.message.indexOf('HTTP 401') !== -1, 'el error usa mensaje genérico HTTP 401');

  stubFetch(realFetch);

  console.log((failures.length ? 'FAIL' : 'PASS') + '  fix-critico-proveedores  (' + checks + ' aserciones, ' + failures.length + ' fallos)');
  failures.forEach(function (f) { console.log('  ✗ ' + f); });
  process.exit(failures.length ? 1 : 0);

})().catch(function (e) {
  console.log('FAIL  fix-critico-proveedores  (excepción: ' + (e && e.message) + ')');
  process.exit(1);
});
