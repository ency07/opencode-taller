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
        var reg = String(c.region || '').trim();
        if (/^todas\b/i.test(reg)) {
          reg = 'Todas';
        } else {
          reg = recortar(reg.split(' ').slice(0, 2).join(' '), 16);
        }
        chip.textContent = '◆ ' + recortar(nomMarket || c.market, 18) +
          (reg ? '  ·  ' + reg : '');
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

    /* Con los laterales plegados por pestañas, el modo también selecciona la
       sección visible: Lote en multiproducto, Ajustes en individual. */
    var tabLote = document.querySelector('.tp-sidenav .tp-tab-btn[data-tab="lote"]');
    if (tabLote) {
      tabLote.disabled = (modo !== MODOS.MULTI);
      tabLote.classList.toggle('deshabilitada', modo !== MODOS.MULTI);
    }
    if (!opciones.silencioso) {
      activarTab(modo === MODOS.MULTI ? 'lote' : 'ajustes');
    }

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
    spacer.id = 'tpSpacer';
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

  /* ==================== Etapa "referencia visual" · Laterales con pestañas ====================
     Reagrupa los tres bloques ya existentes (configuración+acciones, lote multiproducto,
     historial) bajo pestañas laterales. No crea ni elimina funcionalidad. */

  function tabBtn(nombre, texto, extra) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'tp-tab-btn';
    b.setAttribute('role', 'tab');
    b.setAttribute('data-tab', nombre);
    b.setAttribute('aria-selected', 'false');
    b.textContent = texto;
    if (extra) {
      var c = document.createElement('span');
      c.className = 'tp-count';
      c.setAttribute('data-count', extra);
      c.textContent = '';
      b.appendChild(c);
    }
    return b;
  }

  function paneDe(nombre) {
    var s = document.createElement('section');
    s.className = 'tp-pane';
    s.setAttribute('data-pane', nombre);
    s.setAttribute('role', 'tabpanel');
    return s;
  }

  function activarTab(nombre) {
    document.querySelectorAll('.tp-sidenav .tp-tab-btn').forEach(function (b) {
      var es = b.getAttribute('data-tab') === nombre;
      b.classList.toggle('active', es);
      b.setAttribute('aria-selected', es ? 'true' : 'false');
    });
    document.querySelectorAll('.tp-pane').forEach(function (p) {
      p.classList.toggle('active', p.getAttribute('data-pane') === nombre);
    });
    document.body.setAttribute('data-pane-activo', nombre);
  }

  function actualizarContadorLote() {
    var c = document.querySelector('.tp-tab-btn[data-tab="lote"] .tp-count');
    if (!c) return;
    var n = 0;
    try {
      if (window.MultiproductoUI && window.MultiproductoUI._productos) n = window.MultiproductoUI._productos().length;
    } catch (e) { n = 0; }
    c.textContent = String(n);
  }

  function organizarLaterales() {
    var lc = document.querySelector('.left-col');
    if (!lc || lc.querySelector('.tp-sidenav')) return false;
    var config = $('tpConfig'), mp = $('mpPanel'), hist = $('mpHistorialWrap');
    if (!config || !mp || !hist) return false;

    var accPrimaria = lc.querySelector('.actions-primary');
    var accSecundaria = lc.querySelector('.actions');

    var wrap = document.createElement('div');
    wrap.className = 'tp-laterales tp-scope';

    var nav = document.createElement('div');
    nav.className = 'tp-sidenav';
    nav.setAttribute('role', 'tablist');
    nav.setAttribute('aria-label', 'Secciones del taller');
    nav.appendChild(tabBtn('ajustes', 'Ajustes'));
    nav.appendChild(tabBtn('lote', 'Lote', 'lote'));
    nav.appendChild(tabBtn('historial', 'Historial'));

    var pAjustes = paneDe('ajustes');
    var pLote = paneDe('lote');
    var pHist = paneDe('historial');

    pAjustes.appendChild(config);
    pLote.appendChild(mp);
    pHist.appendChild(hist);

    /* Las acciones se reparten: las del lote van al pane Lote y las individuales,
       al pane Ajustes. Así el modo individual no muestra botones de multiproducto. */
    Array.from(lc.querySelectorAll(':scope > .actions-primary, :scope > .actions')).forEach(function (sec) {
      if (!sec) return;
      var esLote = !!sec.querySelector('#mpGenerate, #mpZip');
      (esLote ? pLote : pAjustes).appendChild(sec);
    });

    wrap.appendChild(nav);
    wrap.appendChild(pAjustes);
    wrap.appendChild(pLote);
    wrap.appendChild(pHist);

    lc.insertBefore(wrap, lc.firstChild);

    /* Secciones residuales vacías: se retiran para no dejar huecos. */
    Array.from(lc.querySelectorAll(':scope > section.panel')).forEach(function (s) {
      if (!s.querySelector('.field, details.panel') && !s.id) s.remove();
    });

    var aviso = $('tpAviso');
    if (aviso && aviso.parentElement === lc) lc.appendChild(aviso);

    nav.addEventListener('click', function (ev) {
      var b = ev.target.closest('.tp-tab-btn');
      if (!b || b.disabled) return;
      activarTab(b.getAttribute('data-tab'));
    });

    actualizarContadorLote();
    var inicial = (modo === MODOS.MULTI) ? 'lote' : 'ajustes';
    activarTab(inicial);
    aplicarModo(modo, { silencioso: true });
    return true;
  }

  /* ==================== Etapa "referencia visual" · Vistas de la zona principal ====================
     Agrupa los paneles existentes (Fichas, Matriz, Árbitro+Validador, Prompt) bajo
     pestañas y añade una barra de indicadores derivada del estado real. */

  function chipIndicador(clave, texto) {
    var s = document.createElement('span');
    s.className = 'tp-ind';
    s.setAttribute('data-ind', clave);
    s.textContent = texto;
    return s;
  }

  function actualizarIndicadores() {
    var barra = $('tpIndicadores');
    if (!barra) return;
    var statusTxt = String(($('status') && $('status').textContent) || '');
    var aud = (statusTxt.match(/audiencia\s+(\d+)\s*\/\s*100/i) || [])[1];
    var prod = (statusTxt.match(/producto\s+(\d+)\s*\/\s*100/i) || [])[1];
    var arbTxt = String(($('arbitroEstado') && $('arbitroEstado').textContent) || '').trim();
    var qaTxt = String(($('qaEstado') && $('qaEstado').textContent) || '').trim();

    var datos = {
      audiencia: aud ? ('Audiencia ' + aud + '/100') : 'Audiencia —',
      producto: prod ? ('Producto ' + prod + '/100') : 'Producto —',
      arbitro: arbTxt ? ('Árbitro: ' + arbTxt.replace(/^Árbitro:\s*/i, '')) : 'Árbitro: sin datos',
      qa: qaTxt ? ('QA visual: ' + qaTxt.replace(/^Revisión visual:\s*/i, '')) : 'QA visual: —'
    };
    Object.keys(datos).forEach(function (k) {
      var el = barra.querySelector('[data-ind="' + k + '"]');
      if (el) el.textContent = datos[k];
    });
    var pAud = barra.querySelector('[data-ind="audiencia"]');
    if (pAud) pAud.classList.toggle('ok', !!aud);
  }

  function organizarVistas() {
    var rc = document.querySelector('.right-col');
    if (!rc || rc.querySelector('.tp-vistas')) return false;

    var panels = Array.from(rc.querySelectorAll(':scope > section.panel'));
    function grupoDe(p) {
      if (p.contains($('cards')) || p.contains($('qaVisual'))) return 'fichas';
      if (p.contains($('matrix'))) return 'matriz';
      if (p.contains($('arbitro'))) return 'arbitro';
      if (p.contains($('out'))) return 'prompt';
      if (/Validador/i.test(p.textContent || '')) return 'arbitro';
      return null;
    }
    var grupos = { fichas: [], matriz: [], arbitro: [], prompt: [] };
    panels.forEach(function (p) { var g = grupoDe(p); if (g) grupos[g].push(p); });

    var wrap = document.createElement('div');
    wrap.className = 'tp-vistas tp-scope';

    var nav = document.createElement('div');
    nav.className = 'tp-tabs';
    nav.setAttribute('role', 'tablist');
    nav.setAttribute('aria-label', 'Vistas de resultados');
    [['fichas', 'Fichas 01A · 01B · 01C'], ['matriz', 'Matriz comparativa'],
     ['arbitro', 'Árbitro y Validador'], ['prompt', 'Prompt final']].forEach(function (par) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'tp-tab-btn';
      b.setAttribute('role', 'tab');
      b.setAttribute('data-vista', par[0]);
      b.setAttribute('aria-selected', 'false');
      b.textContent = par[1];
      nav.appendChild(b);
    });
    wrap.appendChild(nav);

    [['fichas'], ['matriz'], ['arbitro'], ['prompt']].forEach(function (par) {
      var pane = document.createElement('section');
      pane.className = 'tp-vpane';
      pane.setAttribute('data-vpane', par[0]);
      pane.setAttribute('role', 'tabpanel');
      grupos[par[0]].forEach(function (p) { pane.appendChild(p); });
      wrap.appendChild(pane);
    });

    /* Insertar tras #status/#colorAudit para conservar la barra superior. */
    var status = $('status');
    if (status && status.parentElement === rc) rc.insertBefore(wrap, status.nextSibling);
    else rc.appendChild(wrap);

    nav.addEventListener('click', function (ev) {
      var b = ev.target.closest('.tp-tab-btn');
      if (!b) return;
      nav.querySelectorAll('.tp-tab-btn').forEach(function (x) {
        var es = x === b;
        x.classList.toggle('active', es);
        x.setAttribute('aria-selected', es ? 'true' : 'false');
      });
      wrap.querySelectorAll('.tp-vpane').forEach(function (p) {
        p.classList.toggle('active', p.getAttribute('data-vpane') === b.getAttribute('data-vista'));
      });
      document.body.setAttribute('data-vista-activa', b.getAttribute('data-vista'));
    });

    /* Activa la primera vista con contenido; si hay resultado, Fichas. */
    var first = nav.querySelector('.tp-tab-btn[data-vista="fichas"]') || nav.querySelector('.tp-tab-btn');
    if (first) first.click();
    return true;
  }

  function construirIndicadores() {
    var rc = document.querySelector('.right-col');
    if (!rc || $('tpIndicadores')) return false;
    var barra = document.createElement('div');
    barra.className = 'tp-scope tp-indicadores';
    barra.id = 'tpIndicadores';
    barra.setAttribute('aria-label', 'Indicadores de calidad');
    ['audiencia', 'producto', 'arbitro', 'qa'].forEach(function (k) {
      barra.appendChild(chipIndicador(k, '—'));
    });
    var status = $('status');
    if (status && status.parentElement === rc) rc.insertBefore(barra, status.nextSibling);
    else rc.appendChild(barra);
    return true;
  }

  /* Referencia visual: el stepper pasa a la misma barra de contexto (al centro). */
  function reordenarCabecera() {
    var topbar = document.querySelector('#tpTopbar .tp-topbar');
    var stepper = $('tpStepper');
    if (!topbar || !stepper) return false;
    if (stepper.parentElement !== topbar) {
      var spacer = $('tpSpacer') || null;
      topbar.insertBefore(stepper, spacer || null);
    }
    stepper.classList.add('tp-stepper-inline');
    return true;
  }

  /* Referencia visual: títulos de acordeón alineados con la captura. */
  function renombrarAcordes() {
    var mapa = { idea: 'La idea y audiencia', avanzado: 'Avanzado y bancos' };
    Object.keys(mapa).forEach(function (g) {
      var det = document.querySelector('.tp-accordion[data-grupo="' + g + '"]');
      if (!det) return;
      var s = det.querySelector('summary');
      if (s && s.firstChild && s.firstChild.nodeType === 3) s.firstChild.textContent = mapa[g];
    });
  }

  /* Referencia visual: zona de previsualización por tarjeta.
     Estado vacío claro cuando no hay imagen; nunca simula una generación inexistente. */
  function construirPreviews() {
    document.querySelectorAll('#cards .vcard').forEach(function (v) {
      if (v.querySelector('.vc-preview')) return;
      var box = document.createElement('div');
      box.className = 'vc-preview';

      var estado = document.createElement('span');
      estado.className = 'vc-estado';
      box.appendChild(estado);

      var btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = 'Ampliar';
      btn.setAttribute('aria-label', 'Ampliar previsualización de la tarjeta');
      btn.addEventListener('click', function () {
        var ampliada = box.classList.toggle('ampliar');
        btn.textContent = ampliada ? 'Reducir' : 'Ampliar';
      });
      box.appendChild(btn);

      var body = v.querySelector('.vbody');
      if (body) v.insertBefore(box, body);
      else v.appendChild(box);

      pintarPreview(box);
    });
  }

  function pintarPreview(box) {
    if (!box) return;
    var img = $('imagePreview');
    var hay = !!(img && img.src && img.src.indexOf('data:') === 0);
    var estado = box.querySelector('.vc-estado');
    box.querySelectorAll('img').forEach(function (i) { i.remove(); });
    if (hay) {
      var nueva = document.createElement('img');
      nueva.alt = 'Vista previa del arte generado';
      nueva.src = img.src;
      box.appendChild(nueva);
      if (estado) estado.textContent = 'Vista previa del arte';
    } else if (estado) {
      estado.textContent = 'Vista previa: aparecerá aquí cuando se genere la imagen';
    }
  }

  function pintarPreviews() {
    document.querySelectorAll('.vc-preview').forEach(pintarPreview);
  }

  /* Referencia visual: tooltips con el valor completo en selects truncados,
     para que ningún control quede ilegible por elipsis. */
  function fijarTitulosSelects() {
    document.querySelectorAll('#tpConfig select').forEach(function (s) {
      if (!s.title) {
        var op = s.options && s.selectedIndex >= 0 ? s.options[s.selectedIndex] : null;
        if (op) s.title = op.textContent || '';
      }
    });
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
    /* Referencia visual: cabecera en una sola barra, laterales con pestañas,
       indicadores y vistas de resultados. */
    try { reordenarCabecera(); } catch (e) { console.warn('[TallerShell] cabecera:', e); }
    try { organizarLaterales(); } catch (e) { console.warn('[TallerShell] laterales:', e); }
    try { renombrarAcordes(); } catch (e) { /* títulos: no crítico */ }
    try { fijarTitulosSelects(); } catch (e) { /* tooltips: no crítico */ }
    try { construirIndicadores(); } catch (e) { console.warn('[TallerShell] indicadores:', e); }
    try { organizarVistas(); } catch (e) { console.warn('[TallerShell] vistas:', e); }
    try { construirPreviews(); } catch (e) { /* previews: no crítico */ }
    actualizarIndicadores();
    actualizarFase();
    /* Previews: se construyen UNA sola vez por render de resultados, detectado
       desde el mensaje de estado (nunca observando #cards, para no alimentar
       un bucle de mutaciones). */
    try {
      if (!window.__previewsHechas) window.__previewsHechas = false;
      var obsStatus = new MutationObserver(function () {
        var txt = String(($('status') && $('status').textContent) || '');
        if (!window.__previewsHechas && /verificad|complet|listo/i.test(txt)) {
          window.__previewsHechas = true;
          construirPreviews();
          pintarPreviews();
        }
        if (/preparado|sin diseños/i.test(txt)) window.__previewsHechas = false;
      });
      var st = $('status');
      if (st) obsStatus.observe(st, { childList: true, characterData: true, subtree: true });
    } catch (e) { /* sin observer */ }
    /* Los indicadores siguen al mensaje de estado real. */
    try {
      var obsInd = new MutationObserver(function () { actualizarIndicadores(); });
      ['status', 'arbitroEstado', 'qaEstado'].forEach(function (id) {
        var el = $(id);
        if (el) obsInd.observe(el, { childList: true, characterData: true, subtree: true });
      });
    } catch (e) { /* sin observer */ }
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
