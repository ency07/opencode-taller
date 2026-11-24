/* Taller POD · Etapa 8A-F1 · Estructura común: cabecera de contexto y modos.
 *
 * Objetivo: que el generador individual y el multiproducto se perciban como UNA
 * aplicación con contexto compartido, no como dos bloques superpuestos.
 *
 * Reglas:
 * - No crea campos nuevos: los chips de contexto son una VISTA de los campos ya
 *   existentes (#market, #brand, #serie, #product, ...). No hay información duplicada
 *   ni fuentes alternativas de verdad.
 * - El selector de modo solo cambia la VISIBILIDAD del panel multiproducto; no altera
 *   valores ni comportamiento de ninguno de los dos flujos.
 * - El modo elegido persiste en localStorage (POD2|taller|modo).
 * - Degradacion elegante: si falta cualquier elemento, la cabecera simplemente no se
 *   inyecta y la aplicacion sigue funcionando como antes.
 * - Sin dependencias externas. Usa los componentes tp-* de la F0.
 */
(function () {
  'use strict';

  var CLAVE_MODO = 'POD2|taller|modo';
  var MODOS = { INDIVIDUAL: 'individual', MULTI: 'multiproducto' };
  var IDS_CONTEXTO = ['market', 'region', 'brand', 'language', 'marketplace', 'product', 'serie'];

  var modo = MODOS.INDIVIDUAL;
  var inyectado = false;

  function $(id) { return document.getElementById(id); }

  function texto(id) {
    var e = $(id);
    if (!e) return '';
    return String(e.value == null ? '' : e.value).trim();
  }

  /* Texto legible de la opción elegida (fuente: el propio <select>). */
  function opcionTexto(id) {
    var s = $(id);
    if (!s || !s.selectedOptions || !s.selectedOptions.length) return '';
    return String(s.selectedOptions[0].textContent || '').trim();
  }

  function leerContexto() {
    var M = window.MOTOR_STATE || {};
    var market = opcionTexto('market') || texto('market') || M.market || '—';
    var brand = opcionTexto('brand') || texto('brand') || M.brand || 'auto';
    var product = opcionTexto('product') || texto('product') || M.product || '—';
    var language = opcionTexto('language') || texto('language') || M.language || 'auto';
    var serie = String(M.serie || texto('serie') || '').trim();
    var region = opcionTexto('region') || texto('region') || M.region || '';
    return {
      market: market,
      brand: brand,
      product: product,
      language: language,
      serie: serie,
      region: region
    };
  }

  function recortar(s, n) {
    s = String(s == null ? '' : s);
    return s.length > n ? s.slice(0, n) + '…' : s;
  }

  function pintarContexto() {
    var c = leerContexto();
    var chips = document.querySelectorAll('#tpContexto .tp-context-chip');
    chips.forEach(function (chip) {
      var clave = chip.getAttribute('data-ctx');
      if (clave === 'market') {
        /* Etiqueta corta del mercado (antes del " — ") + región abreviada:
           evita chips largos truncados en móvil. */
        var nomMarket = String(c.market || '').split(' — ')[0].trim();
        chip.textContent = '◆ ' + recortar(nomMarket || c.market, 18) +
          (c.region ? '  ·  ' + recortar(String(c.region).split(' ').slice(0, 2).join(' '), 16) : '');
      } else if (clave === 'brand') {
        var nomBrand = String(c.brand || '').split(' — ')[0].trim();
        chip.textContent = 'Marca: ' + recortar(nomBrand || c.brand, 18);
      } else if (clave === 'product') {
        chip.textContent = 'Producto: ' + recortar(c.product, 22);
      } else if (clave === 'serie') {
        chip.textContent = c.serie ? ('Serie ' + recortar(c.serie, 18)) : 'Sin serie';
      }
    });
  }

  /* ---------- selector de modo ---------- */

  function aplicarModo(nuevo, opciones) {
    opciones = opciones || {};
    modo = (nuevo === MODOS.MULTI) ? MODOS.MULTI : MODOS.INDIVIDUAL;

    var mp = $('mpPanel');
    if (mp) mp.style.display = (modo === MODOS.MULTI) ? '' : 'none';

    document.querySelectorAll('#tpMode button').forEach(function (b) {
      var es = b.getAttribute('data-modo') === modo;
      b.classList.toggle('active', es);
      b.setAttribute('aria-selected', es ? 'true' : 'false');
    });

    document.body.setAttribute('data-modo', modo);

    if (!opciones.silencioso) {
      try { window.localStorage.setItem(CLAVE_MODO, modo); } catch (e) { /* sin storage */ }
    }
    if (typeof opciones.onCambio === 'function') {
      try { opciones.onCambio(modo); } catch (e) { console.warn('[TallerShell] onCambio falló:', e); }
    }
  }

  function leerModoGuardado() {
    try { return window.localStorage.getItem(CLAVE_MODO); } catch (e) { return null; }
  }

  /* ---------- stepper de fases ---------- */

  var PASOS = ['configurar', 'generar', 'revisar', 'exportar'];

  function fase(idx) {
    document.querySelectorAll('#tpStepper .tp-step').forEach(function (el) {
      var i = parseInt(el.getAttribute('data-paso'), 10);
      el.classList.remove('done', 'active', 'pending');
      if (i < idx) el.classList.add('done');
      else if (i === idx) el.classList.add('active');
      else el.classList.add('pending');
    });
    document.body.setAttribute('data-fase', PASOS[idx] || '');
  }

  function actualizarFase() {
    var statusTxt = String(($('status') && $('status').textContent) || '').toLowerCase();
    var mpTxt = String(($('mpStatus') && $('mpStatus').textContent) || '').toLowerCase();
    var hayResultado = !!((($('out') && $('out').value) || '') ||
                         (window.MultiproductoUI && window.MultiproductoUI._lote && window.MultiproductoUI._lote()));
    var generando = /generando|preparando|cancelando/.test(statusTxt + ' ' + mpTxt);
    var exportado = /zip generado|lote guardado/.test(statusTxt + ' ' + mpTxt);

    if (generando) return fase(1);
    if (exportado) return fase(3);
    if (hayResultado) return fase(2);
    return fase(0);
  }

  /* ---------- inyección ---------- */

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  /* Se construye con DOM API (sin innerHTML) para no introducir ninguna superficie
     de inyección: los textos de contexto se asignan con textContent. */
  function construir() {
    /* La estructura real tiene dos bloques .shell: el primero envuelve la cabecera y
       el segundo la rejilla principal. Se usa el padre real de .main-grid para no
       depender del orden de selección. */
    var rejilla = document.querySelector('.main-grid');
    if (!rejilla || !rejilla.parentElement) return false;
    var shell = rejilla.parentElement;

    var wrap = el('div', 'tp-scope');
    wrap.id = 'tpTopbar';

    var topbar = el('div', 'tp-topbar');
    topbar.appendChild(el('span', 'tp-context-chip', '⚡ Taller POD'));

    var ctx = el('span');
    ctx.id = 'tpContexto';
    ctx.style.display = 'flex';
    ctx.style.gap = '8px';
    ctx.style.flexWrap = 'wrap';
    [['market', 'Mercado'], ['brand', 'Marca'], ['product', 'Producto'], ['serie', 'Serie']].forEach(function (par) {
      ctx.appendChild(el('span', 'tp-context-chip', ''));
      ctx.lastChild.setAttribute('data-ctx', par[0]);
    });
    topbar.appendChild(ctx);

    var spacer = el('span');
    spacer.style.flex = '1';
    topbar.appendChild(spacer);

    /* Etapa 8A-F5 · rail de configuración plegable (tablet/móvil) */
    var rail = el('button', 'tp-btn', '⚙ Configurar');
    rail.id = 'tpRailToggle';
    rail.type = 'button';
    rail.setAttribute('aria-label', 'Mostrar u ocultar la configuración');
    rail.setAttribute('aria-expanded', 'true');
    topbar.appendChild(rail);

    var mode = el('div', 'tp-mode');
    mode.id = 'tpMode';
    mode.setAttribute('role', 'tablist');
    mode.setAttribute('aria-label', 'Modo de trabajo');
    [[MODOS.INDIVIDUAL, 'Un producto'], [MODOS.MULTI, 'Multiproducto']].forEach(function (par) {
      var b = el('button', '', par[1]);
      b.type = 'button';
      b.setAttribute('role', 'tab');
      b.setAttribute('data-modo', par[0]);
      b.setAttribute('aria-selected', 'false');
      mode.appendChild(b);
    });
    topbar.appendChild(mode);

    wrap.appendChild(topbar);

    var stepper = el('div', 'tp-stepper');
    stepper.id = 'tpStepper';
    stepper.setAttribute('aria-label', 'Progreso');
    [['Configurar', 0], ['Generar', 1], ['Revisar', 2], ['Exportar', 3]].forEach(function (par) {
      var s = el('span', 'tp-step', '');
      s.setAttribute('data-paso', String(par[1]));
      var n = el('span', 'tp-step-n', String(par[1] + 1));
      s.appendChild(n);
      s.appendChild(document.createTextNode(' ' + par[0]));
      stepper.appendChild(s);
    });
    wrap.appendChild(stepper);

    shell.insertBefore(wrap, rejilla);
    return true;
  }

  function bind() {
    document.querySelectorAll('#tpMode button').forEach(function (b) {
      b.addEventListener('click', function () {
        aplicarModo(b.getAttribute('data-modo'));
        pintarContexto();
      });
    });

    /* Etapa 8A-F5: rail de configuración */
    var railBtn = $('tpRailToggle');
    if (railBtn) {
      railBtn.addEventListener('click', function () {
        var cerrada = document.body.classList.toggle('config-cerrada');
        railBtn.setAttribute('aria-expanded', cerrada ? 'false' : 'true');
        railBtn.textContent = cerrada ? '⚙ Mostrar configuración' : '⚙ Configurar';
      });
    }

    /* Etapa 8A-F6: etiquetas accesibles en botones que carecían de ellas */
    [
      ['btnAI', 'Herramientas de IA'],
      ['btnMemory', 'Memoria portable del taller'],
      ['mpAllBtn', 'Seleccionar todos los productos'],
      ['mpNoneBtn', 'Quitar la selección de productos'],
      ['mpGenerate', 'Generar el lote de productos seleccionados'],
      ['mpCancel', 'Cancelar la generación en curso'],
      ['mpSave', 'Guardar el lote en el historial local'],
      ['mpZip', 'Exportar el lote como ZIP'],
      ['mpCopy', 'Copiar el prompt al portapapeles'],
      ['mpCopyPart', 'Copiar la primera mitad del prompt'],
      ['mpReroll', 'Regenerar solo este producto']
    ].forEach(function (par) {
      var b = $(par[0]);
      if (b && !b.getAttribute('aria-label')) b.setAttribute('aria-label', par[1]);
    });

    /* La vista de contexto se actualiza con los campos reales (no al revés). */
    IDS_CONTEXTO.forEach(function (id) {
      var el = $(id);
      if (!el) return;
      el.addEventListener('change', function () { pintarContexto(); });
      el.addEventListener('input', function () { pintarContexto(); });
    });
    ['concept', 'message'].forEach(function (id) {
      var el = $(id);
      if (el) el.addEventListener('input', function () { pintarContexto(); });
    });

    /* Stepper: observa los mensajes de estado existentes, sin tocar el motor. */
    try {
      var obs = new MutationObserver(function () { actualizarFase(); });
      ['status', 'mpStatus'].forEach(function (id) {
        var el = $(id);
        if (el) obs.observe(el, { childList: true, characterData: true, subtree: true });
      });
      obs.observe(document.body, { attributes: true, attributeFilter: ['data-modo'] });
    } catch (e) { /* navegador sin MutationObserver: el stepper queda en fase inicial */ }
  }

  /* ==================== Etapa 8A-F2 · Acordeones de configuración ====================
     Reorganiza los controles EXISTENTES en cuatro acordeones sin tocar ningún id,
     opción ni comportamiento: solo se mueven nodos del DOM (los listeners viajan
     con ellos). Si algo no encaja, se conserva donde estaba (degradación segura). */

  var GRUPOS_F2 = {
    contexto: ['market', 'language', 'brand', 'region', 'serie', 'set'],
    producto: ['product', 'marketplace', 'printMethod', 'stampSide', 'capApplication'],
    idea: ['concept', 'message', 'support', 'audienceSet', 'audienceMulti', 'workflowMode', 'decisionMode'],
    avanzado: ['subniche', 'dominio', 'creativeTerritory', 'visualIdentity', 'aestheticPreference']
  };

  function grupoDelId(id) {
    for (var g in GRUPOS_F2) {
      if (Object.prototype.hasOwnProperty.call(GRUPOS_F2, g) && GRUPOS_F2[g].indexOf(id) >= 0) return g;
    }
    return null;
  }

  function primerIdConocido(nodo) {
    var ctrl = nodo.querySelector('select[id], input[id], textarea[id]');
    return ctrl ? ctrl.id : null;
  }

  function grupoDelBloque(bloque) {
    var propio = bloque.id ? grupoDelId(bloque.id) : null;
    if (propio) return propio;
    var id = primerIdConocido(bloque);
    return id ? grupoDelId(id) : null;
  }

  function hojaDe(id) {
    var el = $(id);
    if (!el) return null;
    var campo = el.closest('.field');
    if (!campo) return el.parentElement;
    var fila = campo.closest('.field-row');
    if (fila) {
      var campos = Array.from(fila.querySelectorAll(':scope > .field'));
      var grupos = {};
      campos.forEach(function (c) { var g = grupoDelBloque(c); if (g) grupos[g] = true; });
      if (campos.length && Object.keys(grupos).length === 1) return fila;
    }
    return campo;
  }

  function organizarConfiguracion() {
    var mp = $('mpPanel');
    if (!mp || !mp.parentElement) return false;
    var leftCol = mp.parentElement;

    var config = document.createElement('div');
    config.className = 'tp-scope';
    config.id = 'tpConfig';

    var titulos = {
      contexto: 'Contexto',
      producto: 'Producto e impresión',
      idea: 'La idea',
      avanzado: 'Avanzado'
    };
    var abiertos = { contexto: true, producto: true };

    Object.keys(titulos).forEach(function (g) {
      var det = document.createElement('details');
      det.className = 'tp-accordion';
      det.setAttribute('data-grupo', g);
      if (abiertos[g]) det.open = true;
      var sum = document.createElement('summary');
      sum.appendChild(document.createTextNode(titulos[g]));
      var linea = document.createElement('span');
      linea.className = 'tp-accordion-summary-line';
      linea.textContent = '';
      sum.appendChild(linea);
      det.appendChild(sum);
      var cuerpo = document.createElement('div');
      cuerpo.className = 'tp-accordion-body';
      cuerpo.setAttribute('data-cuerpo', g);
      det.appendChild(cuerpo);
      config.appendChild(det);
    });

    leftCol.insertBefore(config, mp);

    /* 1) hojas de campos por grupo */
    Object.keys(GRUPOS_F2).forEach(function (g) {
      GRUPOS_F2[g].forEach(function (id) {
        var hoja = hojaDe(id);
        if (!hoja) return;
        var cuerpo = config.querySelector('[data-cuerpo="' + g + '"]');
        if (cuerpo && hoja.parentElement !== cuerpo) cuerpo.appendChild(hoja);
      });
    });

    /* 2) secciones plegables existentes -> Avanzado */
    var cuerpoAvanzado = config.querySelector('[data-cuerpo="avanzado"]');
    ['varPanel', 'mixPanel'].forEach(function (id) {
      var d = $(id);
      if (d && cuerpoAvanzado && d.parentElement !== cuerpoAvanzado) cuerpoAvanzado.appendChild(d);
    });
    /* 3) panel de banco de motivos (section.panel sin id) */
    Array.from(leftCol.querySelectorAll('section.panel')).forEach(function (sec) {
      var titulo = String((sec.querySelector('.panel-title') || {}).textContent || '');
      if (titulo.indexOf('Banco') >= 0 && sec.querySelectorAll('.field').length && cuerpoAvanzado) {
        cuerpoAvanzado.appendChild(sec);
      }
    });

    /* 4) resumen por acordeón y limpieza de contenedores vacíos */
    Object.keys(titulos).forEach(function (g) {
      var cuerpo = config.querySelector('[data-cuerpo="' + g + '"]');
      var det = cuerpo.parentNode;
      var n = cuerpo.querySelectorAll('.field').length;
      cuerpo.parentNode.querySelector('.tp-accordion-summary-line').textContent = n ? (n + ' ajustes') : 'vacío';
    });
    leftCol.querySelectorAll('section.panel').forEach(function (sec) {
      if (sec.id === 'mpPanel') return;
      if (!sec.querySelectorAll('.field, details.panel').length) sec.hidden = true;
    });
    leftCol.querySelectorAll('.field-group').forEach(function (grp) {
      if (!grp.querySelectorAll('.field').length && !grp.closest('#tpConfig')) grp.hidden = true;
    });

    return true;
  }

  /* ==================== Etapa 8A-F4 · Historial global ====================
     El historial deja de vivir solo dentro del panel multiproducto: pasa a ser
     un bloque compartido, visible en ambos modos, y se puede guardar también el
     resultado del generador individual. No duplica datos: reutiliza las mismas
     claves y el mismo módulo MultiproductoHistorial. */

  function guardarIndividualEnHistorial(avisa) {
    var out = $('out');
    var prompt = out ? String(out.value || '') : '';
    if (!prompt) { if (avisa) avisa('No hay resultado individual para guardar.', 'warn'); return false; }

    var M = window.MOTOR_STATE || {};
    var market = M.market || texto('market') || '—';
    var region = M.region || texto('region') || '';
    var brand = M.brand || texto('brand') || 'auto';
    var producto = String(M.product || texto('product') || 'PRODUCTO').trim();
    var serie = String(M.serie || texto('serie') || '').trim();

    var H = window.MultiproductoHistorial;
    if (!H || !H.guardarLote) { if (avisa) avisa('Historial no disponible.', 'bad'); return false; }

    var res = H.guardarLote({
      ctx: { market: market, region: region, brand: brand, serie: serie, product: producto, origen: 'individual' },
      productos: [{
        producto: producto,
        ok: true,
        prompt: prompt,
        context: { market: market, region: region, brand: brand, product: producto },
        error: null
      }]
    });
    if (!res.ok) { if (avisa) avisa('No se pudo guardar: ' + (res.error || ''), 'bad'); return false; }
    if (avisa) avisa(res.duplicado ? ('Resultado ya existía en el historial: ' + res.id) : ('Resultado individual guardado: ' + res.id), 'good');
    try {
      if (window.MultiproductoUI && window.MultiproductoUI._pintarHistorial) window.MultiproductoUI._pintarHistorial();
    } catch (e) { /* el historial se redibujará en la próxima interacción */ }
    return true;
  }

  function avisar(msg, tipo) {
    var st = $('tpAviso');
    if (!st) return;
    st.textContent = msg;
    st.className = 'status' + (tipo ? ' ' + tipo : '');
  }

  function historialGlobal() {
    var hist = $('mpHistorialWrap');
    var mp = $('mpPanel');
    if (!hist || !mp || !mp.parentElement) return false;
    var leftCol = mp.parentElement;

    if (hist.parentElement !== leftCol) leftCol.appendChild(hist);

    /* Cabecera propia con acción para guardar el resultado individual. */
    if (!$( 'tpHistAcciones' )) {
      var barra = document.createElement('div');
      barra.id = 'tpHistAcciones';
      barra.style.cssText = 'display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:8px';
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'tp-btn';
      btn.setAttribute('aria-label', 'Guardar el resultado individual en el historial');
      btn.textContent = '＋ Guardar resultado actual';
      btn.addEventListener('click', function () { guardarIndividualEnHistorial(avisar); });
      barra.appendChild(btn);
      var nota = document.createElement('span');
      nota.className = 'tp-muted';
      nota.textContent = 'Visible en ambos modos';
      barra.appendChild(nota);
      hist.insertBefore(barra, hist.firstChild);
    }

    /* Aviso compartido (para mensajes del shell). */
    if (!$('tpAviso')) {
      var st = document.createElement('div');
      st.id = 'tpAviso';
      st.className = 'status';
      st.style.marginTop = '8px';
      leftCol.appendChild(st);
    }
    return true;
  }

  function init() {
    var guardado = leerModoGuardado();
    if (guardado === MODOS.MULTI) modo = MODOS.MULTI;
    else if (guardado === MODOS.INDIVIDUAL) modo = MODOS.INDIVIDUAL;

    if (!construir()) return;   /* degradación: sin .shell/.main-grid no se inyecta nada */
    inyectado = true;

    aplicarModo(modo, { silencioso: true });   /* persiste el modo sin reescribir storage */
    pintarContexto();
    bind();
    actualizarFase();
    /* Etapa 8A-F2: organiza los controles existentes en cuatro acordeones.
       Es idempotente solo si se llama una vez; init lo hace una sola vez. */
    try { organizarConfiguracion(); } catch (e) { console.warn('[TallerShell] acordeones:', e); }
    try { historialGlobal(); } catch (e) { console.warn('[TallerShell] historial global:', e); }
    actualizarFase();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  /* API mínima para pruebas y futuras fases (no forma parte del motor). */
  window.TallerShell = {
    _state: function () {
      return {
        modo: modo,
        inyectado: inyectado,
        ctx: leerContexto()
      };
    },
    _setModo: function (m) { aplicarModo(m); },
    _fase: actualizarFase
  };
})();
