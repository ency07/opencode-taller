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

  /* Red/auth/JSON/MIGRACIÓN viven en js/ia-client.js (ventana IAClient);
     aquí solo queda la lógica propia del copy (frases, contexto, estado). */
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
    o += 'También propón una frase de APOYO: 2 a 6 palabras que amplíe la misma idea sin repetir la frase principal, sin datos; si no aporta, usa "" (vacío).\n';
    o += 'Devuelve SOLO un JSON válido, sin markdown: {"frase":"frase final","apoyo":"frase de apoyo o vacía","alternativas":["frase","frase"]}.\n';
    return o;
  }

  /* Modelos retirados, auth por proveedor, parser JSON y pista de clave:
     delegados a window.IAClient (módulo único compartido, DEBT-011). */

  function llamarSlots(promptText) {
    if (typeof window.getAISlots !== 'function') {
      return Promise.resolve({ error: 'sin-slots' });
    }
    var IC = window.IAClient;
    var slots = (window.getAISlots() || []).filter(function (s) { return s.key && s.provider && s.model; });
    if (!slots.length) return Promise.resolve({ error: 'sin-clave' });
    var diagnosticos = [];
    var intento = function (slot, resto) {
      var model = slot._intentoAlt ? String(slot.model) : IC.migrateModel(slot.provider, slot.model);
      if (!IC.ep(slot.provider, model)) {
        diagnosticos.push(slot.provider + ': proveedor desconocido');
        return resto.length ? intento(resto[0], resto.slice(1))
          : Promise.resolve({ error: 'sin-proveedor', diagnosticos: diagnosticos.slice(), proveedores: slots.length });
      }
      var timeoutMs = parseInt(slot.timeoutMs, 10) || 15000;
      return IC.chat(slot, {
        model: model,
        user: promptText,
        temperature: 0.6,
        maxTokens: 400,
        jsonMode: true,
        timeoutMs: timeoutMs
      }).then(function (j) {
        var texto = IC.textOf(slot.provider, j);
        var parsed = IC.pJSON(texto);
        if (!parsed || !esFraseValida(parsed.frase)) throw new Error(texto ? 'respuesta sin frase válida' : 'respuesta vacía');
        var apoyoCrudo = parsed.apoyo ? String(parsed.apoyo).trim() : '';
        var apoyo = (apoyoCrudo && esFraseValida(apoyoCrudo) &&
          apoyoCrudo.toLowerCase() !== String(parsed.frase).trim().toLowerCase()) ? apoyoCrudo : '';
        return { frase: String(parsed.frase).trim(), apoyo: apoyo, alternativas: (parsed.alternativas || []).filter(esFraseValida).slice(0, 3) };
      }).catch(function (e) {
        var efectivo = (slot.provider === 'Gemini' && timeoutMs < 20000) ? 20000 : timeoutMs;
        var motivo = (e && e.name === 'AbortError')
          ? ('sin respuesta en ' + Math.round(efectivo / 1000) + 's')
          : String((e && e.message) || e);
        if (/HTTP 404/.test(motivo)) motivo = 'HTTP 404 (el modelo ' + model + ' no existe para esta clave)';
        if (/HTTP 40[13]/.test(motivo)) {
          var pista = IC.pistaClave(slot.provider, slot.key);
          if (pista) motivo += ' (' + pista + ')';
        }
        /* 404 en Gemini: reintento único con el modelo alterno (2.5 ↔ vivo). */
        if (slot.provider === 'Gemini' && /HTTP 404/.test(motivo) && !slot._intentoAlt) {
          var alt = (model === IC.modeloGeminiVivo()) ? 'gemini-2.5-flash' : IC.modeloGeminiVivo();
          if (alt && alt !== model) return intento(Object.assign({}, slot, { model: alt, _intentoAlt: true }), resto);
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
        var supp = $('support');
        var notaApoyo = '';
        if (r.apoyo && supp) {
          if (String(supp.value || '').trim()) {
            notaApoyo = ' Tu apoyo existente se conservó (no lo toqué).';
          } else {
            supp.value = r.apoyo;
            notaApoyo = ' Apoyo propuesto: «' + r.apoyo + '» (revísalo).';
          }
        }
        tellStatus('Propuesta: «' + r.frase + '».' + notaApoyo + ' Revisala y edita a gusto; nada se generó sin tu revisión.', 'ok');
        drawAlternatives(r.alternativas || [], field);
        return r;
      }
      var diag = r && Array.isArray(r.diagnosticos) && r.diagnosticos.length
        ? ' Causa: ' + r.diagnosticos.join(' · ') + '.'
        : '';
      var activos = r && typeof r.proveedores === 'number' ? r.proveedores : 0;
      var avisoProv = (activos > 0 && activos < 3)
        ? ' Solo ' + activos + ' de 3 proveedores tiene clave en esta pestaña; sin respaldo no hay failover. Añade una clave de Groq u OpenRouter en el panel IA (con la de Gemini sola no hay respaldo).'
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
    pJSON: function (t) { return window.IAClient.pJSON(t); },
    contextoActual: contextoActual
  };

})();
