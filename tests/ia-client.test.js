/* Cliente IA compartido (DEBT-011): un solo lugar para endpoints, auth,
   cuerpos de petición, timeout/abort, errores HTTP, parser JSON y
   migración de modelos muertos. Regresión: sin definiciones duplicadas
   en copy-ia / ia-revisor / ia-analisis.

   Ejecutar:  node tests/ia-client.test.js
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
  createElement: function () { return { style: {} }; }
};

const clienteSrc = fs.readFileSync(path.join(JS, 'ia-client.js'), 'utf8');
vm.runInThisContext(clienteSrc, { filename: 'ia-client.js' });
const IC = global.IAClient;

ok(IC && typeof IC.chat === 'function' && typeof IC.ep === 'function',
  'window.IAClient expuesto con chat y ep');

/* ---------- 1. Endpoints por proveedor ---------- */
ok(IC.ep('Groq', 'm') === 'https://api.groq.com/openai/v1/chat/completions',
  'endpoint Groq');
ok(IC.ep('OpenRouter', 'm') === 'https://openrouter.ai/api/v1/chat/completions',
  'endpoint OpenRouter');
ok(IC.ep('Gemini', 'gemini-3.5-flash-lite') ===
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent',
  'endpoint Gemini lleva el modelo en la URL');
ok(IC.ep('Gemini', 'a b/c') ===
  'https://generativelanguage.googleapis.com/v1beta/models/a%20b%2Fc:generateContent',
  'modelo URL-encodeado');
ok(IC.ep('Otro', 'm') === '', 'proveedor desconocido sin endpoint');

/* ---------- 2. Auth por proveedor ---------- */
const hGem = IC.headers('Gemini', 'AIza_x');
ok(hGem['x-goog-api-key'] === 'AIza_x', 'Gemini manda x-goog-api-key');
ok(!hGem.Authorization, 'Gemini NUNCA manda Authorization: Bearer');
ok(hGem['Content-Type'] === 'application/json', 'Content-Type JSON');
const hOr = IC.headers('OpenRouter', 'sk-or-x');
ok(hOr.Authorization === 'Bearer sk-or-x', 'OpenRouter/Groq usan Bearer');
const hExt = IC.headers('Groq', 'k', { 'HTTP-Referer': 'https://app.test', 'X-Title': 'Taller POD' });
ok(hExt['HTTP-Referer'] === 'https://app.test' && hExt['X-Title'] === 'Taller POD',
  'headers extra (Referer/X-Title de OpenRouter)');

/* ---------- 3. Cuerpos de petición ---------- */
const bGem = IC.buildBody('Gemini', 'm', { sys: 'SYS', user: 'USER', temperature: 0.6, maxTokens: 400, jsonMode: true });
ok(bGem.contents[0].parts[0].text === 'SYS\nUSER', 'Gemini concatena system+user en un texto');
ok(bGem.generationConfig.temperature === 0.6 && bGem.generationConfig.maxOutputTokens === 400,
  'Gemini respeta temperatura y tokens');
ok(bGem.generationConfig.responseMimeType === 'application/json',
  'Gemini pide respuesta JSON');
const bVis = IC.buildBody('Gemini', 'm', { user: 'p', geminiParts: [{ inlineData: { mimeType: 'image/jpeg', data: 'AAA' } }] });
ok(bVis.contents[0].parts.length === 2 && bVis.contents[0].parts[1].inlineData.data === 'AAA',
  'visión Gemini agrega inlineData tras el prompt');
const bOr = IC.buildBody('OpenRouter', 'm', { sys: 'SYS', user: 'USER', jsonMode: true });
ok(bOr.messages.length === 2 && bOr.messages[0].role === 'system' && bOr.messages[1].content === 'USER',
  'OpenAI-style: system + user');
ok(bOr.response_format && bOr.response_format.type === 'json_object', 'jsonMode activa response_format');
ok(bOr.model === 'm' && bOr.max_tokens === 2048 && bOr.temperature === 0.2,
  'modelo + defaults (2048 tokens, temp 0.2)');
const bOrVis = IC.buildBody('OpenRouter', 'm', { openaiContent: [{ type: 'text', text: 'hola' }] });
ok(Array.isArray(bOrVis.messages[0].content) && !bOrVis.response_format,
  'visión OpenRouter: content array y sin response_format');
const bMin = IC.buildBody('Groq', 'm', { user: 'u' });
ok(bMin.messages.length === 1 && bMin.messages[0].role === 'user' && !bMin.response_format,
  'sin sys ni jsonMode: un solo mensaje y sin response_format');

/* ---------- 4. Texto, parser y pista de clave ---------- */
ok(IC.textOf('Gemini', { candidates: [{ content: { parts: [{ text: 'hola' }] } }] }) === 'hola',
  'textOf lee Gemini');
ok(IC.textOf('OpenRouter', { choices: [{ message: { content: 'chao' } }] }) === 'chao',
  'textOf lee OpenAI-compatible');
ok(IC.textOf('Groq', {}) === '' && IC.textOf('Gemini', null) === '',
  'textOf devuelve vacío sin datos');
ok(IC.pJSON('```json\n{"frase":"a"}\n```').frase === 'a', 'pJSON con cerca markdown');
ok(IC.pJSON('ruido {"a":1} ruido').a === 1, 'pJSON extrae el objeto entre ruido');
ok(IC.pJSON('no hay json aquí') === null, 'pJSON sin objeto devuelve null');
ok(IC.pJSON('{"a":') === null, 'pJSON con JSON roto devuelve null (no lanza)');
ok(IC.pistaClave('Groq', 'sk-or-v1-abc').indexOf('OpenRouter') !== -1,
  'detecta clave de otro proveedor');
ok(IC.pistaClave('Gemini', 'AQ.Ab123').indexOf('parece de') === -1,
  'clave propia de Gemini sin falsos positivos');
ok(IC.pistaClave('Groq', 'gsk_1') === 'clave de 5 caracteres',
  'clave del proveedor correcto: solo longitud');
ok(IC.pistaClave('Groq', '') === '', 'clave vacía sin pista');

/* ---------- 5. migrateModel / modelo vivo ---------- */
ok(IC.migrateModel('Gemini', 'gemini-2.5-flash') === 'gemini-3.5-flash-lite',
  'gemini-2.5-flash (404 en claves nuevas) -> vivo 3.x');
ok(IC.migrateModel('Gemini', 'gemini-2.0-flash') === 'gemini-3.5-flash-lite',
  'gemini-2.0-flash (apagado) -> vivo');
ok(IC.migrateModel('Gemini', 'gemini-1.5-pro') === 'gemini-3.5-flash-lite',
  'serie 1.5 -> vivo');
ok(IC.migrateModel('Groq', 'llama-3.3-70b-versatile') === 'openai/gpt-oss-20b',
  'modelo Groq muerto -> vivo');
ok(IC.migrateModel('OpenRouter', 'google/gemini-2.0-flash-exp') === 'google/gemini-2.5-flash',
  'modelo OpenRouter muerto -> vivo');
ok(IC.migrateModel('OpenRouter', 'google/gemini-2.5-flash') === 'google/gemini-2.5-flash',
  'modelos vivos no se tocan');
ok(IC.migrateModel('Gemini', 'gemini-3.5-flash-lite') === 'gemini-3.5-flash-lite',
  'default vivo intacto');
ok(IC.migrateModel('Groq', 'openai/gpt-oss-20b') === 'openai/gpt-oss-20b',
  'default vivo Groq intacto');
ok(IC.modeloGeminiVivo() === 'gemini-3.5-flash-lite',
  'modelo vivo por defecto (sin panel de visión)');

(async function main() {

  /* ---------- 6. chat(): contrato de red ---------- */
  let llamada = null;
  global.fetch = function (url, opt) {
    llamada = { url: url, opt: opt };
    return Promise.resolve({
      ok: true,
      json: function () { return Promise.resolve({ choices: [{ message: { content: '{"ok":1}' } }] }); }
    });
  };
  let r = await IC.chat({ provider: 'Groq', model: 'openai/gpt-oss-20b', key: 'gsk_1' },
    { sys: 'SYS', user: 'USER', jsonMode: true, timeoutMs: 5000 });
  ok(r && IC.textOf('Groq', r) === '{"ok":1}', 'chat devuelve el JSON crudo de la respuesta');
  ok(llamada.url === 'https://api.groq.com/openai/v1/chat/completions', 'chat usa el endpoint del proveedor');
  ok(llamada.opt.headers.Authorization === 'Bearer gsk_1', 'chat manda Bearer para Groq');
  ok(!!llamada.opt.signal, 'chat manda AbortSignal (timeout real)');
  const body1 = JSON.parse(llamada.opt.body);
  ok(body1.model === 'openai/gpt-oss-20b' && body1.response_format.type === 'json_object',
    'cuerpo con modelo y jsonMode');

  /* Gemini: clave por header, modelo en URL, jamás en query */
  llamada = null;
  global.fetch = function (url, opt) {
    llamada = { url: url, opt: opt };
    const dato = { candidates: [{ content: { parts: [] } }] };
    dato.candidates[0].content.parts.push({ text: '{"ok":2}' });
    return Promise.resolve({ ok: true, json: function () { return Promise.resolve(dato); } });
  };
  r = await IC.chat({ provider: 'Gemini', model: 'gemini-3.5-flash-lite', key: 'AIza_x' },
    { user: 'hola' });
  ok(r && IC.textOf('Gemini', r) === '{"ok":2}', 'chat lee respuesta Gemini');
  ok(llamada.opt.headers['x-goog-api-key'] === 'AIza_x', 'Gemini: clave en header');
  ok(!llamada.opt.headers.Authorization, 'Gemini: sin Authorization en chat');
  ok(llamada.url.indexOf(':generateContent') !== -1 && llamada.url.indexOf('?key=') === -1,
    'Gemini: clave NUNCA en la URL');

  /* Error HTTP: mensaje, status y detalle del cuerpo de error */
  global.fetch = function () {
    return Promise.resolve({
      ok: false,
      status: 401,
      json: function () { return Promise.resolve({ error: { message: 'invalid api key' } }); }
    });
  };
  let err = null;
  try {
    await IC.chat({ provider: 'OpenRouter', model: 'm', key: 'k' }, { user: 'u' });
  } catch (e) { err = e; }
  ok(err && err.message === 'HTTP 401', 'error HTTP con mensaje por defecto (got ' + (err && err.message) + ')');
  ok(err && err.httpStatus === 401 && err.status === 401, 'error HTTP con httpStatus/status');
  ok(err && err.detail === 'invalid api key', 'error HTTP con detalle del proveedor');

  /* httpMessage personalizado (usado por la visión) */
  global.fetch = function () {
    return Promise.resolve({
      ok: false,
      status: 429,
      json: function () { return Promise.resolve({ error: { message: 'quota' } }); }
    });
  };
  err = null;
  try {
    await IC.chat({ provider: 'Gemini', model: 'm', key: 'k' }, {
      user: 'u',
      httpMessage: function (status, detail) { return 'HTTP ' + status + ' propio' + (detail ? ': ' + detail : ''); }
    });
  } catch (e) { err = e; }
  ok(err && err.message === 'HTTP 429 propio: quota', 'httpMessage recibe status y detalle (got ' + (err && err.message) + ')');
  ok(err && err.httpStatus === 429, 'httpMessage conserva httpStatus para reintentos');

  /* Respuesta de error SIN cuerpo JSON: no debe romper el diagnóstico */
  global.fetch = function () { return Promise.resolve({ ok: false, status: 404 }); };
  err = null;
  try {
    await IC.chat({ provider: 'Groq', model: 'm', key: 'k' }, { user: 'u' });
  } catch (e) { err = e; }
  ok(err && err.message === 'HTTP 404' && err.detail === '',
    'error 404 sin cuerpo: mensaje HTTP 404 y detalle vacío');

  /* Timeout: aborta con AbortError y limpia el temporizador */
  global.fetch = function (url, opt) {
    return new Promise(function (resolve, reject) {
      opt.signal.addEventListener('abort', function () {
        const e = new Error('aborted');
        e.name = 'AbortError';
        reject(e);
      });
    });
  };
  err = null;
  const t0 = Date.now();
  try {
    await IC.chat({ provider: 'Groq', model: 'm', key: 'k', timeoutMs: 400 }, { user: 'u' });
  } catch (e) { err = e; }
  ok(err && err.name === 'AbortError', 'timeout aborta con nombre AbortError');
  ok(Date.now() - t0 < 3000, 'el timeout corta la espera (no cuelga)');

  /* Proveedor desconocido: falla rápido sin red */
  err = null;
  try {
    await IC.chat({ provider: 'Desconocido', model: 'm', key: 'k' }, { user: 'u' });
  } catch (e) { err = e; }
  ok(err && /proveedor desconocido/.test(err.message), 'proveedor sin endpoint lanza sin fetch');

  /* fetchWithTimeout: devuelve la respuesta y respeta el abort */
  global.fetch = function () { return Promise.resolve({ ok: true }); };
  r = await IC.fetchWithTimeout('https://openrouter.ai/api/v1/models', { method: 'GET' }, 500);
  ok(r && r.ok === true, 'fetchWithTimeout resuelve con la respuesta');

  /* ---------- 7. Estáticos: sin duplicados + carga en index.html ---------- */
  const fuentes = fs.readdirSync(JS)
    .filter(function (f) { return f.slice(-3) === '.js'; })
    .map(function (f) { return { nombre: f, src: fs.readFileSync(path.join(JS, f), 'utf8') }; });

  const conEp = fuentes.filter(function (f) { return /function ep\(/.test(f.src); });
  ok(conEp.length === 1 && conEp[0].nombre === 'ia-client.js',
    'exactamente un ep() en js/ (está en ' + conEp.map(function (f) { return f.nombre; }).join(',') + ')');

  const conXgoog = fuentes.filter(function (f) { return f.src.indexOf('x-goog-api-key') !== -1; });
  ok(conXgoog.length === 1 && conXgoog[0].nombre === 'ia-client.js',
    'x-goog-api-key definido solo en ia-client.js');

  const conDead = fuentes.filter(function (f) { return f.src.indexOf("'llama-3.3-70b-versatile':") !== -1; });
  ok(conDead.length === 1 && conDead[0].nombre === 'ia-client.js',
    'un solo mapa de modelos muertos en el repo');

  const conBearerGem = fuentes.filter(function (f) {
    return f.nombre !== 'ia-client.js' && /Bearer/.test(f.src) && /Gemini/.test(f.src) && /fetch|\.chat\(/.test(f.src);
  });
  ok(conBearerGem.length === 0,
    'ningún consumidor arma auth propia (va por IAClient.headers): ' +
    conBearerGem.map(function (f) { return f.nombre; }).join(','));

  const idx = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const iCliente = idx.indexOf('js/ia-client.js');
  ok(iCliente !== -1, 'index.html incluye ia-client.js');
  ok(iCliente < idx.indexOf('js/ia-analisis.js') &&
    iCliente < idx.indexOf('js/ia-revisor.js') &&
    iCliente < idx.indexOf('js/copy-ia.js'),
    'ia-client.js carga antes que los tres consumidores');
  ok(!/[?&]key=/.test(clienteSrc), 'la clave API jamás viaja en la URL');

  console.log((failures.length ? 'FAIL' : 'PASS') + '  ia-client  (' + checks + ' aserciones, ' + failures.length + ' fallos)');
  failures.forEach(function (f) { console.log('  ✗ ' + f); });
  process.exit(failures.length ? 1 : 0);

})().catch(function (e) {
  console.log('FAIL  ia-client  (excepción: ' + (e && e.message) + ')');
  process.exit(1);
});
