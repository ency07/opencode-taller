(function () {
  'use strict';

  /* ============================================================
     IA CLIENT — Módulo ÚNICO de red/autenticación para los tres
     consumidores de IA de texto/visión (copy-ia, ia-revisor,
     ia-analisis). Centraliza: endpoints, auth por proveedor,
     cuerpos de petición, timeout con abort, parser JSON,
     diagnóstico de claves y migración de modelos muertos.
     Regresión DEBT-011: una sola definición de cada contrato.
     ============================================================ */

  /* --- Endpoints por proveedor (nombre de modelo solo importa en Gemini). --- */
  function ep(p, m) {
    if (p === 'Groq') return 'https://api.groq.com/openai/v1/chat/completions';
    if (p === 'OpenRouter') return 'https://openrouter.ai/api/v1/chat/completions';
    if (p === 'Gemini') return 'https://generativelanguage.googleapis.com/v1beta/models/' + encodeURIComponent(m) + ':generateContent';
    return '';
  }

  /* --- Auth: Gemini exige x-goog-api-key (NUNCA Authorization: Bearer ni
         llave en la URL); Groq/OpenRouter usan Bearer. `extra` son headers
         opcionales (ej. HTTP-Referer/X-Title de OpenRouter). --- */
  function headers(provider, key, extra) {
    var h = { 'Content-Type': 'application/json' };
    if (provider === 'Gemini') {
      h['x-goog-api-key'] = String(key || '');
    } else {
      h['Authorization'] = 'Bearer ' + String(key || '');
    }
    if (extra) {
      Object.keys(extra).forEach(function (k) { if (extra[k]) h[k] = extra[k]; });
    }
    return h;
  }

  /* --- Cuerpo de petición por proveedor.
         opts: { sys, user, temperature (def 0.2), maxTokens (def 2048),
                 jsonMode, geminiParts (visión inlineData), openaiContent } --- */
  function buildBody(provider, model, opts) {
    var o = opts || {};
    var temperature = (typeof o.temperature === 'number') ? o.temperature : 0.2;
    var maxTokens = (typeof o.maxTokens === 'number') ? o.maxTokens : 2048;
    if (provider === 'Gemini') {
      var text = o.sys ? (o.sys + '\n' + (o.user || '')) : (o.user || '');
      var parts = [{ text: text }];
      if (Array.isArray(o.geminiParts)) parts = parts.concat(o.geminiParts);
      return {
        contents: [{ role: 'user', parts: parts }],
        generationConfig: { temperature: temperature, maxOutputTokens: maxTokens, responseMimeType: 'application/json' }
      };
    }
    var messages = [];
    if (o.sys) messages.push({ role: 'system', content: o.sys });
    messages.push({ role: 'user', content: o.openaiContent || (o.user || '') });
    var body = {
      model: model,
      messages: messages,
      max_tokens: maxTokens,
      temperature: temperature
    };
    if (o.jsonMode) body.response_format = { type: 'json_object' };
    return body;
  }

  /* --- Texto de la respuesta por proveedor ('' si vino vacío). --- */
  function textOf(provider, data) {
    if (provider === 'Gemini') {
      return (data && data.candidates && data.candidates[0] && data.candidates[0].content &&
        data.candidates[0].content.parts && data.candidates[0].content.parts[0] &&
        data.candidates[0].content.parts[0].text) || '';
    }
    return (data && data.choices && data.choices[0] && data.choices[0].message &&
      data.choices[0].message.content) || '';
  }

  /* --- Parser JSON tolerante: cercas de markdown y ruido alrededor;
         devuelve null si no hay JSON usable (nunca lanza). --- */
  function pJSON(t) {
    var s = String(t || '').trim();
    s = s.replace(/^```(?:json)?/i, '').replace(/```\s*$/, '').trim();
    var a = s.indexOf('{');
    var b = s.lastIndexOf('}');
    if (a === -1 || b === -1 || b <= a) return null;
    try { return JSON.parse(s.slice(a, b + 1)); } catch (e) { return null; }
  }

  /* Pista de diagnóstico SIN exponer la clave. No asume formatos "de futuro":
     solo avisa cuando la clave parece de OTRO proveedor del panel. */
  var MARCAS_CLAVE = {
    Groq: ['gsk_'],
    OpenRouter: ['sk-or-'],
    Gemini: ['AIza', 'AQ.']
  };
  function pistaClave(provider, key) {
    var k = String(key || '');
    if (!k) return '';
    var base = 'clave de ' + k.length + ' caracteres';
    var ajena = '';
    Object.keys(MARCAS_CLAVE).forEach(function (p) {
      if (p === provider) return;
      var marcas = MARCAS_CLAVE[p];
      for (var i = 0; i < marcas.length; i++) {
        if (k.indexOf(marcas[i]) === 0) ajena = p;
      }
    });
    if (ajena) return base + ' que parece de ' + ajena + ' (revisa el proveedor de ese slot)';
    return base;
  }

  /* --- Modelos muertos -> reemplazo vivo. ÚNICA copia en el repo
         (antes triplicada en copy-ia / revisor / visión). --- */
  var DEAD_MODELS = {
    'llama-3.3-70b-versatile': 'openai/gpt-oss-20b',
    'google/gemini-2.0-flash-exp': 'google/gemini-2.5-flash',
    'gemini-2.5-flash': 'gemini-3.5-flash-lite',
    'gemini-2.0-flash': 'gemini-3.5-flash-lite',
    'gemini-2.0-flash-001': 'gemini-3.5-flash-lite',
    'gemini-2.0-flash-lite': 'gemini-3.5-flash-lite',
    'gemini-2.0-flash-lite-001': 'gemini-3.5-flash-lite',
    'gemini-1.5-flash': 'gemini-3.5-flash-lite',
    'gemini-1.5-flash-001': 'gemini-3.5-flash-lite',
    'gemini-1.5-pro': 'gemini-3.5-flash-lite'
  };

  /* Gemini de texto alineado a la generación que el panel de visión ya usa.
     Proyectos con claves nuevas (AQ.Ab…) no reciben la serie 2.5 ni anteriores:
     responderían 404. */
  function modeloGeminiVivo() {
    try {
      if (window.PODVision && window.PODVision.getVisionConfig) {
        var vc = window.PODVision.getVisionConfig();
        if (vc && vc.geminiModel) return vc.geminiModel;
      }
    } catch (e) { /* sin visión cargada */ }
    return 'gemini-3.5-flash-lite';
  }

  /* Migración de modelo guardado -> modelo vivo. Regla Gemini (serie 2.5/2.0/1.x
     fuera de alcance para claves nuevas) + mapa de muertos para el resto. */
  function migrateModel(provider, model) {
    var m = String(model || '').trim();
    if (provider === 'Gemini') {
      if (m === 'gemini-2.5-flash' || /^gemini-(1\.|2\.0)/i.test(m)) return modeloGeminiVivo();
      return DEAD_MODELS[m] || m;
    }
    return DEAD_MODELS[m] || m;
  }

  /* --- fetch con timeout: aborta y limpia el temporizador en cualquier
         camino (éxito, error o rechazo). --- */
  function fetchWithTimeout(url, opts, timeoutMs) {
    var controller = (typeof AbortController !== 'undefined') ? new AbortController() : null;
    var t = controller ? setTimeout(function () { controller.abort(); }, timeoutMs || 20000) : null;
    function limpiar() { if (t) clearTimeout(t); }
    var o2 = Object.assign({}, opts || {});
    if (controller) o2.signal = controller.signal;
    return fetch(url, o2).then(function (r) { limpiar(); return r; }, function (e) { limpiar(); throw e; });
  }

  /* --- Llamada chat completa: devuelve el JSON CRUDO de la respuesta.
         opts: { model, sys, user, temperature, maxTokens, jsonMode,
                 timeoutMs (o el del slot; 15s por defecto), extraHeaders,
                 geminiParts, openaiContent, httpMessage(status, detail) }
         Errores HTTP: lanza Error con mensaje = httpMessage(status, detail)
         (o 'HTTP <status>' si no se pasa) y e.httpStatus / e.status / e.detail.
         El timeout aborta con nombre 'AbortError' (el consumidor decide el
         texto); el temporizador SIEMPRE se limpia. --- */
  async function chat(slot, opts) {
    var o = opts || {};
    var s = slot || {};
    var model = o.model || s.model;
    var url = ep(s.provider, model);
    if (!url) throw new Error('proveedor desconocido: ' + s.provider);
    var timeoutMs = parseInt(o.timeoutMs || s.timeoutMs, 10) || 15000;
    var ctrl = (typeof AbortController === 'function') ? new AbortController() : null;
    var timer = ctrl ? setTimeout(function () { ctrl.abort(); }, timeoutMs) : null;
    function limpiar() { if (timer) clearTimeout(timer); }
    try {
      var r = await fetch(url, {
        method: 'POST',
        headers: headers(s.provider, s.key, o.extraHeaders),
        body: JSON.stringify(buildBody(s.provider, model, o)),
        signal: ctrl ? ctrl.signal : undefined
      });
      if (!r.ok) {
        var detail = '';
        try {
          if (typeof r.json === 'function') {
            var eb = await r.json();
            detail = (eb && eb.error && eb.error.message) ? String(eb.error.message) : '';
          }
        } catch (e) { detail = ''; }
        var err = new Error(o.httpMessage ? o.httpMessage(r.status, detail) : ('HTTP ' + r.status));
        err.status = r.status;
        err.httpStatus = r.status;
        err.detail = detail;
        throw err;
      }
      return await r.json();
    } finally {
      limpiar();
    }
  }

  window.IAClient = {
    ep: ep,
    headers: headers,
    buildBody: buildBody,
    textOf: textOf,
    pJSON: pJSON,
    pistaClave: pistaClave,
    MARCAS_CLAVE: MARCAS_CLAVE,
    DEAD_MODELS: DEAD_MODELS,
    modeloGeminiVivo: modeloGeminiVivo,
    migrateModel: migrateModel,
    fetchWithTimeout: fetchWithTimeout,
    chat: chat
  };

})();
