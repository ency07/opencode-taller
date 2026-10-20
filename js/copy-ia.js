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

  function llamarSlots(promptText) {
    if (typeof window.getAISlots !== 'function') {
      return Promise.resolve({ error: 'sin-slots' });
    }
    const slots = (window.getAISlots() || []).filter(function (s) { return s.key && s.provider && s.model; });
    if (!slots.length) return Promise.resolve({ error: 'sin-clave' });
    const intento = function (slot, resto) {
      const url = ep(slot.provider, slot.model);
      if (!url) return resto.length ? intento(resto[0], resto.slice(1)) : Promise.resolve({ error: 'sin-proveedor' });
      let body;
      if (slot.provider === 'Gemini') {
        body = JSON.stringify({ contents: [{ parts: [{ text: promptText }] }] });
      } else {
        body = JSON.stringify({ model: slot.model, messages: [{ role: 'user', content: promptText }], max_tokens: 200, temperature: 0.6 });
      }
      return fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + slot.key },
        body: body
      }).then(function (r) {
        if (!r.ok) {
          if (resto.length) return intento(resto[0], resto.slice(1));
          return { error: 'http ' + r.status };
        }
        return r.json().then(function (j) {
          let texto;
          if (slot.provider === 'Gemini') {
            texto = j && j.candidates && j.candidates[0] && j.candidates[0].content && j.candidates[0].content.parts && j.candidates[0].content.parts[0] && j.candidates[0].content.parts[0].text;
          } else {
            texto = j && j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content;
          }
          const parsed = pJSON(texto);
          if (!parsed || !esFraseValida(parsed.frase)) {
            if (resto.length) return intento(resto[0], resto.slice(1));
            return { error: 'respuesta-invalida' };
          }
          return { frase: String(parsed.frase).trim(), alternativas: (parsed.alternativas || []).filter(esFraseValida).slice(0, 3) };
        });
      }).catch(function (e) {
        if (resto.length) return intento(resto[0], resto.slice(1));
        return { error: String((e && e.message) || e) };
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
    return {
      mercado: MOTOR_STATE.market,
      producto: MOTOR_STATE.product,
      familia: familia,
      concepto: String(MOTOR_STATE.concept || '').trim(),
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
      var msg = r && r.error === 'sin-clave' ? 'Configura una clave en el panel IA para proponer copy.'
        : r && r.error === 'sin-slots' ? 'Carga ia-revisor.js para usar los slots del panel IA.'
        : 'La IA no devolvió una frase usable. Nada cambió; puedes escribir el mensaje a mano.';
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
    pJSON: pJSON
  };

})();
