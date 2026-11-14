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
    if (statusEl) statusEl.textContent = String(msg == null ? '' : msg);
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

  function _audienceMockupExpectation(audienceId) {
    var ap = (typeof AUD_PROFILES !== 'undefined' && AUD_PROFILES && AUD_PROFILES[audienceId]) || {};
    var edad = String(ap.edad || '').toLowerCase();
    var genero = String(ap.genero || '').toLowerCase();
    if (edad === 'infantil') return 'modelo infantil (niño o niña según el perfil) con talla infantil; un modelo adulto genérico invalida la ficha';
    if (genero === 'femenino') return 'modelo mujer' + (edad ? ' (' + edad + ')' : '') + ' con corte y talla femeninos';
    if (genero === 'masculino') return 'modelo hombre' + (edad ? ' (' + edad + ')' : '') + ' con corte y talla masculinos';
    return 'modelo acorde al perfil (edad y género del perfil), sin forzar género ni edad';
  }

  function _audienceProfile(audienceId) {
    var ap = (typeof AUD_PROFILES !== 'undefined' && AUD_PROFILES && AUD_PROFILES[audienceId]) || {};
    return {
      id: String(audienceId || ''),
      label: String((typeof getAudienceLabel === 'function' ? getAudienceLabel(audienceId) : '') || ap.label || audienceId || ''),
      edad: String(ap.edad || ''),
      genero: String(ap.genero || ''),
      perfil: String(ap.perfil || ''),
      region: String(ap.region || ''),
      requisitoMockup: _audienceMockupExpectation(audienceId)
    };
  }

  function _truncarReglaMockup(texto, limite) {
    var t = String(texto == null ? '' : texto);
    if (!t) return '';
    limite = (typeof limite === 'number' && limite > 0) ? limite : 3000;
    if (t.length <= limite) return t;
    var mejor = -1;
    for (var i = Math.min(limite, t.length) - 1; i >= 0; i--) {
      var ch = t.charAt(i);
      if (ch === '.' || ch === ';' || ch === ')') {
        var siguiente = t.charAt(i + 1);
        if (siguiente === '' || siguiente === ' ' || siguiente === '\n' || siguiente === '\r') {
          mejor = i + 1;
          break;
        }
      }
    }
    if (mejor <= 0) mejor = limite;
    return t.slice(0, mejor).trim();
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
        tratamiento: '',
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
      var _ap = _audienceProfile(f.audiencia);
      lineas.push(
      f.ficha + ': estilo «' + (f.estilo || 'sin declarar') + '» (inmutable)' +
      '; jerarquía ' + (f.jerarquia || '?') + ' (peso exigido ' + (f.peso || '?') + ')' +
      (f.objeto ? '; objeto autorizado «' + f.objeto + '»' : '; sin objeto autorizado') +
      (f.tratamiento ? '; tratamiento ' + f.tratamiento : '') +
      '; audiencia ID=' + (f.audiencia || 'sin declarar') + ' / perfil=' + _ap.perfil + ' / edad=' + _ap.edad + ' / género=' + _ap.genero + ' (mockup esperado: ' + _audienceMockupExpectation(f.audiencia) + '); evaluar de forma independiente para esta columna, sin mezclar con otras fichas' +
        '; cara ' + (!f.cara
          ? 'sin declaración (producto sin caras: no exijas vistas traseras ni espaldas de persona)'
          : (f.cara === 'espalda' ? 'espalda (pide lifestyle de espaldas y recuadro de espalda en esta columna)' : 'frente (prohibida espalda de persona o prenda en esta columna)'))
      );
    });
    var o = 'Eres director de arte POD. Compara la imagen adjunta con este CONTRATO generado por el motor y devuelve SOLO un JSON válido (sin markdown ni explicaciones).\n';
    o += 'CONTRATO POR FICHA:\n' + lineas.join('\n') + '\n';
    if (estructuraHoja) o += 'ESTRUCTURA DE HOJA: ' + estructuraHoja + '\n';
    o += 'CRITERIOS (marca solo incumplimientos verificables a primera vista):\n';
    o += '- estilo_ok: false si el lenguaje visual dibujado no es el asignado (sustitución, fusión de estilos o vocabulario de otro estilo). El estilo ejecuta su propia técnica de taller, pero no puede cambiar de estilo.\n';
    o += '- jerarquia_ok: false si el elemento que manda no ocupa su franja de peso; indica jerarquia_medida como "NN% texto / NN% símbolo".\n';
    o += '- objetos_inventados: objetos o adornos nuevos que no nombraron el contrato ni el copy, aunque sean habituales del estilo; NO marques ejecuciones propias del estilo asignado (su técnica de taller). Si el contrato define SOLO_TEXTO, cualquier objeto/decoración dibujada cuenta.\n';
    o += '- textos_inventados: rótulos, serie, versículos o frases no presentes en el copy ni en los encabezados editoriales de columna; estos encabezados están permitidos (código de ficha, estilo si el eje lo pide, audiencia si es el eje).\n';
    o += '- fondo_ok: false si hay cielo, suelo, paisaje, rayos, resplandores, degradados ambientales, salpicaduras, viñetas o escenas de fondo DENTRO del arte de cada diseño (en recuadros de ambiente de mockup, el ambiente es normal).\n';
    o += '- espalda_ok: false si una columna con cara frente muestra espalda de persona o prenda, o una columna con cara espalda carece de vista de espalda.\n';
    o += '- audiencia_ok: false si el mockup de la columna no representa la audiencia asignada (edad/género/talla). Infantil = modelo infantil con talla infantil (un modelo adulto genérico invalida); femenino = mujer con corte y talla femeninos; masculino = hombre con corte y talla masculinos; unisex/amplia = modelo acorde al perfil sin forzar género. Evalúa cada columna de forma independiente según su audiencia; no traslades restricciones de una ficha a otra. Si no hay evidencia visual suficiente para verificar, marca audiencia_ok como null (INDETERMINADO) en lugar de true.\n';
    o += 'FORMATO EXACTO:\n';
    o += '{"fichas":[{"ficha":"01A","estilo_asignado":"X","estilo_detectado":"X o descripcion breve","estilo_ok":true,"jerarquia_medida":"80% texto / 20% simbolo","jerarquia_ok":true,"objetos_inventados":[],"textos_inventados":[],"fondo_ok":true,"espalda_ok":true,"audiencia_ok":true,"audiencia_detectada":"descripcion breve del modelo visto","modelo_mockup":"infantil/femenino/masculino/unisex","nota_audiencia":"una frase","nota":"una frase"}],"estilos_correctos":3,"resumen":"frase corta","avisos_generales":[]}';
    return o;
    }

  /* ============================================================
     RESPUESTA → JSON
     ============================================================ */

  function parseVerdict(text) {
    // Aceptar: objeto ya parseado, string JSON, JSON en Markdown, texto con JSON alrededor.
    var obj = null;
    if (text && typeof text === 'object' && !Array.isArray(text)) {
      obj = text;
    } else {
      var s = String(text == null ? '' : text).trim();
      // Eliminar cercas de markdown
      s = s.replace(/^```(?:json)?/i, '').replace(/```\s*$/m, '').trim();
      obj = extraerObjetoBalanceado(s);
    }
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return null;
    // Validar que tenga fichas como array con las 3 esperadas
    if (!Array.isArray(obj.fichas) || obj.fichas.length !== 3) return null;
    var ids = obj.fichas.map(function (f) { return String(f && f.ficha || ''); });
    if (ids.indexOf('01A') === -1 || ids.indexOf('01B') === -1 || ids.indexOf('01C') === -1) return null;
    return obj;
  }

  /* Extrae el primer objeto JSON balanceado de un texto (soporta llaves
     anidadas y llaves sueltas en el texto alrededor). Si un candidato no
     parsea, prueba con el siguiente { que encuentre. */
  function extraerObjetoBalanceado(s) {
    if (!s || typeof s !== 'string') return null;
    var start = -1, depth = 0, inStr = false, esc = false;
    for (var i = 0; i < s.length; i++) {
      var ch = s.charAt(i);
      if (start === -1) {
        if (ch === '{') { start = i; depth = 1; inStr = false; esc = false; }
        continue;
      }
      if (inStr) {
        if (esc) { esc = false; continue; }
        if (ch === '\\') { esc = true; continue; }
        if (ch === '"') { inStr = false; continue; }
        continue;
      }
      if (ch === '"') { inStr = true; continue; }
      if (ch === '{') { depth++; continue; }
      if (ch === '}') {
        depth--;
        if (depth === 0) {
          var candidate = s.slice(start, i + 1);
          try { return JSON.parse(candidate); } catch (e) { start = -1; continue; }
        }
      }
    }
    return null;
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
    var html = '<div><b>AVISOS (no bloquean copiar ni regenerar):</b> ' + esc(v.resumen || '') + '</div>';
    v.fichas.forEach(function (f) {
      var lineas = [];
      lineas.push((f.estilo_ok ? good() : bad()) + ' estilo ' + esc(f.estilo_asignado || '?') + (f.estilo_ok ? '' : ' — detectado «' + esc(f.estilo_detectado || '?') + '»'));
      lineas.push((f.jerarquia_ok ? good() : bad()) + ' jerarquía ' + (f.jerarquia_medida ? esc(String(f.jerarquia_medida)) : 'sin medir'));
      if (f.objetos_inventados && f.objetos_inventados.length) lineas.push(warn() + ' objetos inventados: ' + f.objetos_inventados.map(esc).join(', '));
      if (f.textos_inventados && f.textos_inventados.length) lineas.push(warn() + ' textos inventados: ' + f.textos_inventados.map(esc).join(', '));
      if (f.fondo_ok === false) lineas.push(warn() + ' fondo del arte con escena/ornamento no pedido');
      if (f.espalda_ok === false) lineas.push(bad() + ' caras de la columna no respetadas');
      if (f.audiencia_ok === false) lineas.push(bad() + ' audiencia del mockup no corresponde al perfil asignado' + (f.audiencia_detectada ? ' — detectado: «' + esc(f.audiencia_detectada) + '»' : '') + (f.modelo_mockup ? ' (modelo: ' + esc(f.modelo_mockup) + ')' : ''));
      else if (f.audiencia_ok === null) lineas.push(warn() + ' audiencia del mockup no verificable (INDETERMINADO)' + (f.audiencia_detectada ? ' — visto: «' + esc(f.audiencia_detectada) + '»' : ''));
      else if (f.audiencia_ok === true && f.audiencia_detectada) lineas.push(good() + ' audiencia del mockup verificada: «' + esc(f.audiencia_detectada) + '»');
      if (f.nota_audiencia) lineas.push('<em>' + esc(f.nota_audiencia) + '</em>');
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
      tell('Selecciona la imagen de la hoja generada.');
      return;
    }
    var file = fileInput.files[0];
    var contrato = extraerContrato() || extraerDePrompt($('out') ? $('out').value : '');
    if (!contrato) {
      tell('Genera los diseños primero: el validador compara la hoja con el set 01A/01B/01C actual.');
      return;
    }
    var estructura = '';
    try {
      var mockup = typeof getMockupRule === 'function' ? getMockupRule(String(MOTOR_STATE.product || 'CAMISETA SOFT')) : '';
      estructura = mockup ? _truncarReglaMockup(mockup, 3000) : '';
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
      tell('No se pudo leer la imagen (formato o tamaño). Usa PNG/JPG/WEBP.');
      return;
    }

    var prompt = construirPromptValidador(contrato, estructura);
    tell('Validando hoja con visión (solo avisos)...');
    var resp;
    try {
      resp = await llamadaVision(fileData, prompt);
    } catch (e) {
      tell('La IA de visión no respondió: ' + String((e && e.message) || e) + ' — copiar no se ve afectado.');
      return;
    }
    if (resp && resp.error) {
      tell(String(resp.error) + ' — configura la barra IA; copiar no se ve afectado.');
      return;
    }
    var v = parseVerdict(resp);
    if (!v) {
      tell('Respuesta no legible de la IA de visión. Copiar no se ve afectado; intenta de nuevo.');
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
    validarHoja: validarHoja,
    _audienceMockupExpectation: _audienceMockupExpectation,
    _audienceProfile: _audienceProfile,
    _truncarReglaMockup: _truncarReglaMockup,
    _extraerObjetoBalanceado: extraerObjetoBalanceado
  };

})();
