(function () {
  'use strict';

  /* ============================================================
     IA VALIDADOR — Revisión visual de la HOJA ya generada.
     Reutiliza la conexión de visión de ia-analisis.js (PODVision),
     que a su vez usa la barra IA (Gemini / OpenRouter).
     SOLO AVISA: nunca bloquea copiar el prompt ni regenerar.
     ============================================================ */

  var statusEl = null;
  var resEl = null;

  function $(id) { return document.getElementById(id); }

  function tell(msg) {
    if (statusEl) statusEl.innerHTML = msg;
  }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  /* ============================================================
     EXTRACCIÓN DEL CONTRATO (del último set generado)
     Prioridad: window.LAST_RESULT.set (fichas reales del motor).
     Fallback: regex estable sobre el texto del prompt de salida.
     ============================================================ */

  function pesoExigido(j) {
    return {
      SOLO_TEXTO: 'texto 100% / símbolo 0%',
      TEXTO_DOMINANTE: 'texto 70-80% / símbolo 20-30%',
      OBJETO_DOMINANTE: 'símbolo 70-80% / texto 20-30%',
      BALANCEADO: 'texto 45-55% / símbolo 45-55%',
      SOLO_OBJETO: 'símbolo 100% / texto 0% (cero letras)'
    }[j] || 'franja no declarada';
  }

  function extraerContrato() {
    var set = null;
    try { set = typeof LAST_RESULT !== 'undefined' && LAST_RESULT ? LAST_RESULT.set : null; } catch (e) { set = null; }
    if (!set || !set.A) return null;
    return ['A', 'B', 'C'].map(function (k) {
      var f = set[k];
      return {
        ficha: '01' + k,
        estilo: String(f.estilo || ''),
        jerarquia: String(f.jerarquiaVisual || ''),
        objeto: String(f.objeto || ''),
        audiencia: String(f.audiencia || ''),
        audiencia_label: typeof _audienceDisplay === 'function' ? String(_audienceDisplay(f.audiencia) || '') : String(f.audiencia || ''),
        concepto: String(MOTOR_STATE.concept || ''),
        copy_literal: String(MOTOR_STATE.message || ''),
        tratamiento: String(f.tratamiento || ''),
        cara: f.cara ? String(f.cara) : '',
        peso: pesoExigido(f.jerarquiaVisual)
      };
    });
  }

  function extraerDePrompt(promptText) {
    var txt = String(promptText || '');
    if (!txt) return null;
    var fichas = [];
    var reRecap = /RECAP (01A|01B|01C): jerarquía=([^·]+) · estilo=([^·]+) · objeto=«([^»]*)»/g;
    var recaps = {};
    var mr;
    while ((mr = reRecap.exec(txt)) !== null) {
      recaps[mr[1]] = { jerarquia: mr[2].trim(), estilo: mr[3].trim(), objeto: mr[4].trim() };
    }
    var re = /### (01A|01B|01C) · (.*?) · ([^\n]+)/g;
    var m;
    var secciones = {};
    ['01A', '01B', '01C'].forEach(function (id) {
      var i = txt.indexOf('### ' + id + ' ·');
      if (i !== -1) secciones[id] = txt.slice(i);
    });
    var vistos = {};
    while ((m = re.exec(txt)) !== null) {
      var id = m[1];
      if (vistos[id]) continue;
      vistos[id] = 1;
      var r = recaps[id] || { jerarquia: '', estilo: m[2], objeto: '' };
      fichas.push({
        ficha: id,
        estilo: r.estilo,
        jerarquia: r.jerarquia,
        objeto: r.objeto,
        audiencia: (m[3] || '').trim(),
        audiencia_label: (m[3] || '').trim(),
        concepto: (txt.match(/CONCEPTO:\s*([^|\n]+)/i) || [])[1] || '',
        copy_literal: (txt.match(/MENSAJE(?: EXACTO)?:\s*([^|\n]+)/i) || [])[1] || '',
        tratamiento: ((secciones[id] || '').match(/PERFIL ESTRUCTURAL:\s*([^·\n]+)/i) || [])[1] || '',
        cara: !/CARA DEL ESTAMPADO:/.test(secciones[id] || '')
          ? ''
          : (/CARA DEL ESTAMPADO:\s*ESPALDA/.test(secciones[id] || '') ? 'espalda' : 'frente'),
        peso: pesoExigido(r.jerarquia)
      });
    }
    return fichas.length === 3 ? fichas : null;
  }

  /* ============================================================
     PROMPT DE VALIDACIÓN
     ============================================================ */

  function construirPromptValidador(contrato, estructuraHoja) {
    var lineas = [];
    (contrato || []).forEach(function (f) {
      lineas.push(
        f.ficha + ': estilo «' + (f.estilo || 'sin declarar') + '» (inmutable)' +
        '; audiencia «' + (f.audiencia_label || f.audiencia || 'sin declarar') + '»' +
        '; motivo/objeto autorizado «' + (f.objeto || 'ninguno') + '»' +
        (f.concepto ? '; concepto «' + f.concepto + '»' : '') +
        (f.copy_literal ? '; copy literal exacto «' + f.copy_literal + '» (debe aparecer exactamente, sin traducción, sustitución ni palabras añadidas)' : '; no hay copy literal proporcionado: no inventes texto') +
        '; jerarquía ' + (f.jerarquia || '?') + ' (peso exigido ' + (f.peso || '?') + ')' +
        (f.objeto ? '; objeto autorizado «' + f.objeto + '»' : '; sin objeto autorizado') +
        (f.tratamiento ? '; tratamiento estructural ' + f.tratamiento + ' (debe verse en composición, densidad, contraste y espacio negativo)' : '; tratamiento estructural sin declarar') +
        '; cara ' + (!f.cara
          ? 'sin declaración (producto sin caras: no exijas vistas traseras ni espaldas de persona)'
          : (f.cara === 'espalda' ? 'espalda (pide lifestyle de espaldas y recuadro de espalda en esta columna)' : 'frente (prohibida espalda de persona o prenda en esta columna)'))
      );
    });
    var o = 'Eres director de arte POD. Compara la imagen adjunta con este CONTRATO generado por el motor y devuelve SOLO un JSON válido (sin markdown ni explicaciones).\n';
    o += 'CONTRATO POR FICHA:\n' + lineas.join('\n') + '\n';
    if (estructuraHoja) o += 'ESTRUCTURA DE HOJA: ' + estructuraHoja + '\n';
    o += 'CRITERIOS (marca solo incumplimientos verificables a primera vista):\n';
    o += '- audiencia_ok: false si la persona/grupo/edad/género/talla del mockup o el lenguaje visible del diseño contradice la audiencia exacta de la ficha; Familia exige grupo familiar multigeneracional, pareja dos personas, comunidad grupo diverso, infantil modelo infantil. No uses una persona genérica para representar un grupo.\n';
    o += '- motivo_ok: false si falta, se sustituye o se contradice el motivo/objeto autorizado; detecta explícitamente el objeto visible.\n';
    o += '- copy_literal_ok: false si el copy visible altera, traduce, omite o añade palabras al texto fijado; registra copy_detectado exactamente como aparece. Si no hay copy fijado, false ante texto inventado.\n';
    o += '- tratamiento_ok: false si la estructura visual no evidencia el tratamiento asignado; el tratamiento no es un rótulo ni efecto decorativo.\n';
    o += '- estilo_ok: false si el lenguaje visual dibujado no es el asignado (sustitución, fusión de estilos o vocabulario de otro estilo). El estilo ejecuta su propia técnica de taller, pero no puede cambiar de estilo.\n';
    o += '- jerarquia_ok: false si el elemento que manda no ocupa su franja de peso; indica jerarquia_medida como "NN% texto / NN% símbolo".\n';
    o += '- objetos_inventados: objetos o adornos nuevos que no nombraron el contrato ni el copy, aunque sean habituales del estilo; NO marques ejecuciones propias del estilo asignado (su técnica de taller). Si el contrato define SOLO_TEXTO, cualquier objeto/decoración dibujada cuenta.\n';
    o += '- textos_inventados: rótulos, serie, versículos o frases no presentes en el copy ni en los encabezados editoriales de columna; estos encabezados están permitidos (código de ficha, estilo si el eje lo pide, audiencia si es el eje).\n';
    o += '- fondo_ok: false si hay cielo, suelo, paisaje, rayos, resplandores, degradados ambientales, salpicaduras, viñetas o escenas de fondo DENTRO del arte de cada diseño (en recuadros de ambiente de mockup, el ambiente es normal).\n';
    o += '- espalda_ok: false si una columna con cara frente muestra espalda de persona o prenda, o una columna con cara espalda carece de vista de espalda.\n';
    o += 'FORMATO EXACTO:\n';
    o += '{"fichas":[{"ficha":"01A","estilo_asignado":"X","estilo_detectado":"X o descripcion breve","estilo_ok":true,"audiencia_ok":true,"audiencia_detectada":"descripcion breve","motivo_ok":true,"motivo_detectado":"objeto visible","copy_literal_ok":true,"copy_detectado":"texto exacto visto","tratamiento_ok":true,"tratamiento_detectado":"evidencia visual breve","jerarquia_medida":"80% texto / 20% simbolo","jerarquia_ok":true,"objetos_inventados":[],"textos_inventados":[],"fondo_ok":true,"espalda_ok":true,"nota":"una frase"}],"estilos_correctos":3,"resumen":"frase corta","avisos_generales":[]}';
    return o;
    }

  /* ============================================================
     RESPUESTA → JSON
     ============================================================ */

  function parseVerdict(text) {
    var s = String(text || '').trim();
    s = s.replace(/^```(?:json)?/i, '').replace(/```\s*$/, '').trim();
    var a = s.indexOf('{');
    var b = s.lastIndexOf('}');
    if (a === -1 || b === -1 || b <= a) return null;
    try { return JSON.parse(s.slice(a, b + 1)); } catch (e) { return null; }
  }

  /* ============================================================
     RENDER (AVISOS — NADA BLOQUEA COPIAR NI REGENERAR)
     ============================================================ */

  function good() { return '<span style="color:#15803d;">✓</span> '; }
  function bad() { return '<span style="color:#b91c1c;">✗</span> '; }
  function warn() { return '<span style="color:#b45309;">⚠</span> '; }

  function renderVerdict(v) {
    if (!resEl) return;
    if (!v || !Array.isArray(v.fichas) || !v.fichas.length) {
      resEl.innerHTML = '<span class="bad">La IA no devolvió un veredicto legible. Prueba de nuevo o cambia de proveedor en la barra IA.</span>';
      return;
    }
    var html = '<div><b>REVISIÓN VISUAL (un criterio sin evidencia explícita se marca como fallo):</b> ' + esc(v.resumen || '') + '</div>';
    v.fichas.forEach(function (f) {
      var lineas = [];
      lineas.push((f.estilo_ok === true ? good() : bad()) + ' estilo ' + esc(f.estilo_asignado || '?') + (f.estilo_ok === true ? '' : ' — detectado «' + esc(f.estilo_detectado || 'sin evidencia') + '»'));
      lineas.push((f.audiencia_ok === true ? good() : bad()) + ' audiencia ' + (f.audiencia_ok === true ? 'coincide con el perfil de la ficha' : '— detectado «' + esc(f.audiencia_detectada || 'sin evidencia') + '»'));
      lineas.push((f.motivo_ok === true ? good() : bad()) + ' motivo ' + (f.motivo_ok === true ? 'motivo autorizado presente' : '— detectado «' + esc(f.motivo_detectado || 'sin evidencia') + '»'));
      lineas.push((f.copy_literal_ok === true ? good() : bad()) + ' copy literal ' + (f.copy_literal_ok === true ? 'coincide con el texto fijado' : '— detectado «' + esc(f.copy_detectado || 'sin evidencia') + '»'));
      lineas.push((f.tratamiento_ok === true ? good() : bad()) + ' tratamiento ' + (f.tratamiento_ok === true ? 'se distingue en la estructura' : '— evidencia «' + esc(f.tratamiento_detectado || 'sin evidencia') + '»'));
      lineas.push((f.jerarquia_ok ? good() : bad()) + ' jerarquía ' + (f.jerarquia_medida ? esc(String(f.jerarquia_medida)) : 'sin medir'));
      if (f.objetos_inventados && f.objetos_inventados.length) lineas.push(warn() + ' objetos inventados: ' + f.objetos_inventados.map(esc).join(', '));
      if (f.textos_inventados && f.textos_inventados.length) lineas.push(warn() + ' textos inventados: ' + f.textos_inventados.map(esc).join(', '));
      if (f.fondo_ok === false) lineas.push(warn() + ' fondo del arte con escena/ornamento no pedido');
      if (f.espalda_ok === false) lineas.push(bad() + ' caras de la columna no respetadas');
      if (f.nota) lineas.push('<em>' + esc(f.nota) + '</em>');
      html += '<div style="border:1px solid rgba(148,163,184,.35);border-radius:10px;padding:10px;margin-top:8px;"><b>' + esc(f.ficha) + '</b><ul style="margin:6px 0 0 16px;padding:0;">' + lineas.map(function (l) { return '<li>' + l + '</li>'; }).join('') + '</ul></div>';
    });
    (v.avisos_generales || []).forEach(function (g) {
      html += '<div>' + warn() + esc(g) + '</div>';
    });
    resEl.innerHTML = html;
  }

  /* ============================================================
     FLUJO PRINCIPAL
     ============================================================ */

  async function llamadaVision(fileData, prompt) {
    if (typeof window.PODVision === 'undefined' || !window.PODVision.getVisionSlots) {
      return { error: 'vision-no-disponible' };
    }
    var slots = window.PODVision.getVisionSlots();
    var cfg = window.PODVision.getVisionConfig();
    var reach = { google: true, openrouter: true };
    if (cfg.provider === 'auto') {
      try { reach = await window.PODVision.preflightVision(5000); } catch (e) { reach = { google: true, openrouter: true }; }
    }
    var target = window.PODVision.pickVisionTarget(slots, cfg, reach);
    if (!target) return { error: 'sin-clave-vision' };
    try {
      return target.kind === 'openrouter'
        ? await window.PODVision.callOpenRouterVision(target, fileData, prompt)
        : await window.PODVision.callGeminiVision(target, fileData, prompt);
    } catch (e1) {
      var other = window.PODVision.otherVisionTarget(slots, cfg, target);
      if (!other) throw e1;
      return other.kind === 'openrouter'
        ? await window.PODVision.callOpenRouterVision(other, fileData, prompt)
        : await window.PODVision.callGeminiVision(other, fileData, prompt);
    }
  }

  async function validarHoja() {
    var fileInput = $('sheetUpload');
    if (!fileInput || !fileInput.files || !fileInput.files[0]) {
      tell('<span class="bad">Selecciona la imagen de la hoja generada.</span>');
      return;
    }
    var file = fileInput.files[0];
    var contrato = extraerContrato() || extraerDePrompt($('out') ? $('out').value : '');
    if (!contrato) {
      tell('<span class="bad">Genera los diseños primero: el validador compara la hoja con el set 01A/01B/01C actual.</span>');
      return;
    }
    var estructura = '';
    try {
      var mockup = typeof getMockupRule === 'function' ? getMockupRule(String(MOTOR_STATE.product || 'CAMISETA SOFT')) : '';
      estructura = mockup ? String(mockup).slice(0, 1400) : '';
    } catch (e) { estructura = ''; }

    tell('Leyendo imagen y contrato (' + contrato.length + ' fichas)...');
    var fileData = null;
    if (window.PODVision && window.PODVision.downscaleImage) {
      try { fileData = await window.PODVision.downscaleImage(file); } catch (e) {}
    }
    if (!fileData && window.PODVision && window.PODVision.fileToBase64) {
      try { fileData = await window.PODVision.fileToBase64(file); } catch (e) {}
    }
    if (!fileData) {
      tell('<span class="bad">No se pudo leer la imagen (formato o tamaño). Usa PNG/JPG/WEBP.</span>');
      return;
    }

    var prompt = construirPromptValidador(contrato, estructura);
    tell('Validando hoja con visión (solo avisos)...');
    var resp;
    try {
      resp = await llamadaVision(fileData, prompt);
    } catch (e) {
      tell('<span class="bad">La IA de visión no respondió: ' + esc(String((e && e.message) || e)) + ' — copiar no se ve afectado.</span>');
      return;
    }
    if (resp && resp.error) {
      tell('<span class="bad">' + esc(resp.error) + ' — configura la barra IA; copiar no se ve afectado.</span>');
      return;
    }
    var v = parseVerdict(resp);
    if (!v) {
      tell('<span class="bad">Respuesta no legible de la IA de visión. Copiar no se ve afectado; intenta de nuevo.</span>');
      return;
    }
    tell('Lista. El prompt original sigue copiándose igual: estos son solo avisos.');
    renderVerdict(v);
  }

  function init() {
    statusEl = $('validadorStatus');
    resEl = $('validadorRes');
    var btn = $('btnValidarHoja');
    if (btn) btn.addEventListener('click', function () { validarHoja(); });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.PODValidador = {
    extraerContrato: extraerContrato,
    extraerDePrompt: extraerDePrompt,
    construirPromptValidador: construirPromptValidador,
    parseVerdict: parseVerdict,
    validarHoja: validarHoja
  };

})();
