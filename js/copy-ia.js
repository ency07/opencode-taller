(function () {
  'use strict';

  /* ============================================================
     COPY IA — Sugerencia de copy con IA de TEXTO (mejora opcional).
     Reutiliza los slots del panel IA (window.getAISlots, ia-revisor.js):
     Groq / OpenRouter / Gemini, con failover.
     REGLAS: nunca sobreescribe el mensaje del usuario sin revisión;
     si falla, no cambia nada; nunca bloquea copiar ni regenerar.
     ============================================================ */

  function $(id) { return document.getElementById(id); }

  function ep(p, m) {
    if (p === 'Groq') return 'https://api.groq.com/openai/v1/chat/completions';
    if (p === 'OpenRouter') return 'https://openrouter.ai/api/v1/chat/completions';
    if (p === 'Gemini') return 'https://generativelanguage.googleapis.com/v1beta/models/' + encodeURIComponent(m) + ':generateContent';
    return '';
  }

  function pJSON(t) {
    var s = String(t || '').trim();
    s = s.replace(/^```(?:json)?/i, '').replace(/```\s*$/, '').trim();
    var a = s.indexOf('{');
    var b = s.lastIndexOf('}');
    if (a === -1 || b === -1 || b <= a) return null;
    try { return JSON.parse(s.slice(a, b + 1)); } catch (e) { return null; }
  }

  function esFraseValida(f) {
    var s = String(f || '').trim();
    if (s.length < 2 || s.length > 60) return false;
    var words = s.split(/\s+/g);
    if (words.length < 1 || words.length > 10) return false;
    for (var i = 0; i < words.length; i++) {
      if (words[i].length > 16) return false;
    }
    return !/[{}<>\\]/.test(s);
  }

  function construirPromptContexto(ctx) {
    var o = 'Eres redactor comercial de arte POD. El usuario no definió el mensaje visible del diseño. Escribe UNA frase original de 2 a 8 palabras para estampar en el producto.\n';
    o += 'CONTEXTO: mercado ' + (ctx.mercado || 'global') + '; producto ' + (ctx.producto || 'CAMISETA SOFT') + '; familia ' + (ctx.familia || 'sin definir') + (ctx.concepto ? '; concepto: ' + ctx.concepto : '') + (ctx.audiencia ? '; audiencia ' + ctx.audiencia : '') + '.\n';
    o += 'REGLAS: nativa del idioma del mercado; concreta y comercial; prohibidas citas doctrinales, versículos, fechas, cifras, nombres propios, datos factuales, claims medibles, marcas, tildes inventadas y palabras sueltas sin sentido; no mezcles idiomas; la frase debe existir por sí sola en el arte.\n';
    o += 'Devuelve SOLO un JSON válido, sin markdown: {"frase":"frase final","alternativas":["frase","frase"]}.\n';
    return o;
  }

  /* Modelos de texto retirados -> reemplazo vivo. Los slots guardados pueden
     traer modelos apagados; aquí se migran antes de llamar. */
  var DEAD_TEXT_MODELS = {
    'llama-3.3-70b-versatile': 'openai/gpt-oss-20b',
    'google/gemini-2.0-flash-exp': 'google/gemini-2.5-flash',
    'gemini-2.0-flash': 'gemini-2.5-flash',
    'gemini-2.0-flash-001': 'gemini-2.5-flash',
    'gemini-2.0-flash-lite': 'gemini-2.5-flash',
    'gemini-2.0-flash-lite-001': 'gemini-2.5-flash',
    'gemini-1.5-flash': 'gemini-2.5-flash',
    'gemini-1.5-flash-001': 'gemini-2.5-flash',
    'gemini-1.5-pro': 'gemini-2.5-flash'
  };

  /* Gemini de texto alineado a la generación que el panel de visión ya usa
     (evita llamar a modelos de la serie 1.x/2.0 retirados). */
  function modeloVivo(provider, model) {
    var m = String(model || '').trim();
    if (provider !== 'Gemini') return m;
    if (/^gemini-(1\.|2\.0)/i.test(m)) {
      try {
        if (window.PODVision && window.PODVision.getVisionConfig) {
          var vc = window.PODVision.getVisionConfig();
          if (vc && vc.geminiModel) return vc.geminiModel;
        }
      } catch (e) { /* sin visión cargada */ }
      return 'gemini-2.5-flash';
    }
    return DEAD_TEXT_MODELS[m] || m;
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

  function llamarSlots(promptText) {
    if (typeof window.getAISlots !== 'function') {
      return Promise.resolve({ error: 'sin-slots' });
    }
    var slots = (window.getAISlots() || []).filter(function (s) { return s.key && s.provider && s.model; });
    if (!slots.length) return Promise.resolve({ error: 'sin-clave' });
    var diagnosticos = [];
    var intento = function (slot, resto) {
      var model = modeloVivo(slot.provider, slot.model);
      var url = ep(slot.provider, model);
      if (!url) {
        diagnosticos.push(slot.provider + ': proveedor desconocido');
        return resto.length ? intento(resto[0], resto.slice(1))
          : Promise.resolve({ error: 'sin-proveedor', diagnosticos: diagnosticos.slice(), proveedores: slots.length });
      }
      var ctrl = (typeof AbortController === 'function') ? new AbortController() : null;
      var timeoutMs = parseInt(slot.timeoutMs, 10) || 15000;
      var timer = ctrl ? setTimeout(function () { ctrl.abort(); }, timeoutMs) : null;
      function limpiar() { if (timer) clearTimeout(timer); }
      var headers = { 'Content-Type': 'application/json' };
      var body;
      if (slot.provider === 'Gemini') {
        /* Gemini NO acepta Authorization: Bearer; la clave va en x-goog-api-key. */
        headers['x-goog-api-key'] = slot.key;
        body = JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: promptText }] }],
          generationConfig: { temperature: 0.6, maxOutputTokens: 400, responseMimeType: 'application/json' }
        });
      } else {
        headers['Authorization'] = 'Bearer ' + slot.key;
        body = JSON.stringify({
          model: model,
          messages: [{ role: 'user', content: promptText }],
          max_tokens: 400,
          temperature: 0.6,
          response_format: { type: 'json_object' }
        });
      }
      return fetch(url, {
        method: 'POST',
        headers: headers,
        body: body,
        signal: ctrl ? ctrl.signal : undefined
      }).then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      }).then(function (j) {
        var texto;
        if (slot.provider === 'Gemini') {
          texto = j && j.candidates && j.candidates[0] && j.candidates[0].content && j.candidates[0].content.parts && j.candidates[0].content.parts[0] && j.candidates[0].content.parts[0].text;
        } else {
          texto = j && j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content;
        }
        var parsed = pJSON(texto);
        if (!parsed || !esFraseValida(parsed.frase)) throw new Error(texto ? 'respuesta sin frase válida' : 'respuesta vacía');
        limpiar();
        return { frase: String(parsed.frase).trim(), alternativas: (parsed.alternativas || []).filter(esFraseValida).slice(0, 3) };
      }).catch(function (e) {
        limpiar();
        var motivo = (e && e.name === 'AbortError')
          ? ('sin respuesta en ' + Math.round(timeoutMs / 1000) + 's')
          : String((e && e.message) || e);
        if (/HTTP 40[13]/.test(motivo)) {
          var pista = pistaClave(slot.provider, slot.key);
          if (pista) motivo += ' (' + pista + ')';
        }
        diagnosticos.push(slot.provider + ': ' + motivo);
        if (resto.length) return intento(resto[0], resto.slice(1));
        return { error: 'respuesta-invalida', diagnosticos: diagnosticos.slice(), proveedores: slots.length };
      });
    };
    return intento(slots[0], slots.slice(1));
  }

  function contextoActual() {
    let familia = '';
    try {
      if (MOTOR_STATE.explorationBrief && MOTOR_STATE.explorationBrief.familyLabel) familia = MOTOR_STATE.explorationBrief.familyLabel;
      else if (typeof getSubnicheLabel === 'function') familia = getSubnicheLabel(MOTOR_STATE.subniche, MOTOR_STATE.market) || '';
    } catch (e) { familia = ''; }
    let audiencia = '';
    try {
      if (typeof LAST_RESULT !== 'undefined' && LAST_RESULT && LAST_RESULT.set && LAST_RESULT.set.A) audiencia = String(LAST_RESULT.set.A.audiencia || '');
    } catch (e) { audiencia = ''; }
    let concepto = String(MOTOR_STATE.concept || '').trim();
    /* En modo explorador el usuario no escribió concepto: usamos el que el
       motor generó (explorationBrief.concept), igual que hace la hoja. */
    if (!concepto && MOTOR_STATE.explorationBrief && MOTOR_STATE.explorationBrief.concept) {
      concepto = String(MOTOR_STATE.explorationBrief.concept).trim();
    }
    return {
      mercado: MOTOR_STATE.market,
      producto: MOTOR_STATE.product,
      familia: familia,
      concepto: concepto,
      audiencia: audiencia
    };
  }

  async function sugerirCopy() {
    var field = $('message');
    var btn = $('btnSugerirCopy');
    var prev = btn ? btn.textContent : '';
    if (btn) { btn.disabled = true; btn.textContent = 'Proponiendo...'; }
    try {
      if (field && String(field.value || '').trim()) {
        tellStatus('El mensaje ya tiene texto: no lo toco. Borra el campo si quieres una propuesta.', 'warn');
        return { error: 'mensaje-existe' };
      }
      var r = await llamarSlots(construirPromptContexto(contextoActual()));
      if (r && r.frase && field) {
        field.value = r.frase;
        tellStatus('Propuesta: «' + r.frase + '». Revisala y edita a gusto; nada se generó sin tu revisión.', 'ok');
        drawAlternatives(r.alternativas || [], field);
        return r;
      }
      var diag = r && Array.isArray(r.diagnosticos) && r.diagnosticos.length
        ? ' Causa: ' + r.diagnosticos.join(' · ') + '.'
        : '';
      var activos = r && typeof r.proveedores === 'number' ? r.proveedores : 0;
      var avisoProv = (activos > 0 && activos < 3)
        ? ' Solo ' + activos + ' de 3 proveedores tiene clave en esta pestaña; los vacíos no pueden usarse como respaldo (panel IA).'
        : '';
      var msg = r && r.error === 'sin-clave' ? 'Configura una clave en el panel IA para proponer copy.'
        : r && r.error === 'sin-slots' ? 'Carga ia-revisor.js para usar los slots del panel IA.'
        : 'La IA no devolvió una frase usable.' + diag + avisoProv + ' Nada cambió; puedes escribir el mensaje a mano.';
      tellStatus(msg, r && (r.error === 'sin-clave' || r.error === 'sin-slots') ? 'warn' : 'bad');
      return r;
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = prev; }
      clearStatus();
    }
  }

  var statusTimer = null;
  function tellStatus(msg, kind) {
    var el = $('copyIAStatus');
    if (el) {
      el.textContent = msg;
      el.dataset.kind = kind || '';
    }
  }
  function clearStatus() {
    clearTimeout(statusTimer);
    statusTimer = setTimeout(function () {
      var el = $('copyIAStatus');
      if (el && el.textContent.indexOf('Configura') === -1 && el.textContent.indexOf('no') !== 0) el.textContent = '';
    }, 6000);
  }

  function drawAlternatives(list, field) {
    var el = $('copyIAAlternativas');
    if (!el) return;
    if (!list || !list.length) { el.innerHTML = ''; return; }
    el.innerHTML = list.map(function (f) {
      return '<button type="button" class="ghost alt-copy" data-fl>' + f.replace(/</g, '&lt;') + '</button>';
    }).join(' ');
    Array.prototype.forEach.call(el.querySelectorAll('.alt-copy'), function (b) {
      b.addEventListener('click', function () { field.value = b.textContent; });
    });
  }

  function init() {
    var btn = $('btnSugerirCopy');
    if (btn) btn.addEventListener('click', function () { sugerirCopy(); });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.PODCopyIA = {
    sugerirCopy: sugerirCopy,
    construirPromptContexto: construirPromptContexto,
    esFraseValida: esFraseValida,
    pJSON: pJSON,
    contextoActual: contextoActual
  };

})();
