/* Taller POD · Etapa 6 — Interfaz de generación multiproducto.
 *
 * Orquesta el núcleo ya validado (OrquestadorMultiProducto), el historial local
 * (MultiproductoHistorial) y el exportador ZIP (MultiproductoZip).
 * No modifica el generador de producto único ni el motor creativo.
 * Sin dependencias externas.
 *
 * Reglas de la interfaz:
 * - La lista de productos se lee del <select id="product"> real (no se hardcodea).
 * - Modo TODOS / SELECCIONADOS.
 * - Progreso REAL por producto (la UI cede el hilo entre productos para repintar).
 * - Anti-duplicados: el botón Generar se deshabilita mientras hay una ejecución.
 * - Resultados independientes por producto, pestañas, copiado, regeneración individual.
 * - Historial local: cargar sin regenerar, eliminar, exportar ZIP.
 */
(function () {
  'use strict';

  var ORQ = window.OrquestadorMultiProducto;
  var HIST = window.MultiproductoHistorial;
  var ZIP = window.MultiproductoZip;

  function $(id) { return document.getElementById(id); }

  var PRODUCTOS = [];
  var seleccion = {};
  var modo = 'all';
  var lote = null;          /* { ctx:{...}, productos:[{producto,ok,prompt,context,error}] } */
  var activo = null;
  var generando = false;
  var cancelado = false;

  /* ---------- utilidades ---------- */

  function val(id) {
    var e = $(id);
    if (!e) return '';
    return String(e.value == null ? '' : e.value);
  }

  function truncar(s, n) {
    s = String(s == null ? '' : s);
    return s.length > n ? s.slice(0, n) + '…' : s;
  }

  function estado() { return $('mpStatus'); }

  function setStatus(msg, tipo) {
    var el = estado();
    if (!el) return;
    el.textContent = msg;
    el.className = 'status' + (tipo ? ' ' + tipo : '');
  }

  function barra(pct) {
    var b = $('mpBar');
    if (b) b.style.width = Math.max(0, Math.min(100, pct)) + '%';
  }

  /* Contexto compartido: se lee del estado vivo del motor y, como respaldo,
     de los campos del formulario. Es el mismo contexto para todos los productos. */
  function ctxFromDom() {
    var M = window.MOTOR_STATE || {};
    function g(id) { return val(id); }
    function pick(clave, id, def) {
      var v = M[clave];
      if (v === undefined || v === null || String(v) === '') v = g(id);
      return String(v === undefined || v === null ? def : v);
    }
    return {
      market: pick('market', 'market', 'global_es'),
      region: pick('region', 'region', 'global'),
      brand: pick('brand', 'brand', 'auto'),
      language: pick('language', 'language', 'es'),
      marketplace: pick('marketplace', 'marketplace', 'generic'),
      subniche: pick('subniche', 'subniche', 'auto'),
      serie: pick('serie', 'serie', ''),
      concept: pick('concept', 'concept', ''),
      mensaje: pick('message', 'message', ''),
      apoyo: pick('support', 'support', ''),
      audienceSet: pick('audienceSet', 'audienceSet', 'Auto'),
      audienceMulti: pick('audienceMulti', 'audienceMulti', 'no'),
      aestheticPreference: pick('aestheticPreference', 'aestheticPreference', 'auto'),
      dominio: pick('dominio', 'dominio', 'auto'),
      domImagen: pick('domImagen', 'domImagen', 'Auto'),
      workflowMode: pick('workflowMode', 'workflowMode', 'explore'),
      repeatType: pick('repeatType', 'repeatType', 'medio salto')
    };
  }

  /* Opciones que consume OrquestadorMultiProducto.generarMuchos():
     exactamente las claves que entendía _escribirContexto(). */
  function ctxOpts(ctx) {
    return {
      concepto: ctx.concept,
      mensaje: ctx.mensaje,
      apoyo: ctx.apoyo,
      serie: ctx.serie,
      market: ctx.market,
      region: ctx.region,
      brand: ctx.brand,
      language: ctx.language,
      marketplace: ctx.marketplace,
      subniche: ctx.subniche,
      audienceSet: ctx.audienceSet,
      audienceMulti: ctx.audienceMulti,
      aestheticPreference: ctx.aestheticPreference,
      dominio: ctx.dominio,
      domImagen: ctx.domImagen,
      workflowMode: ctx.workflowMode,
      repeatType: ctx.repeatType,
      simboloVar: ctx.simboloVar,
      textosVar: ctx.textosVar,
      paletaVar: ctx.paletaVar,
      esencia: ctx.esencia,
      capApplication: ctx.capApplication,
      stampSide: ctx.stampSide,
      printMethod: ctx.printMethod,
      creativeTerritory: ctx.creativeTerritory,
      visualIdentity: ctx.visualIdentity,
      decisionMode: ctx.decisionMode
    };
  }

  /* Versión completa del contexto (los campos de variación viven en el DOM). */
  function ctxCompleto(base) {
    var ctx = {};
    for (var k in base) if (Object.prototype.hasOwnProperty.call(base, k)) ctx[k] = base[k];
    ctx.simboloVar = val('simboloVar') || ctx.simboloVar || 'sustituir';
    ctx.textosVar = val('textosVar') || 'conservar_palabras';
    ctx.paletaVar = val('paletaVar') || 'renovar';
    ctx.esencia = val('essence') || '';
    ctx.capApplication = val('capApplication') || 'auto';
    ctx.stampSide = val('stampSide') || 'auto';
    ctx.printMethod = val('printMethod') || 'auto';
    ctx.creativeTerritory = val('creativeTerritory') || 'auto';
    ctx.visualIdentity = val('visualIdentity') || '';
    ctx.decisionMode = val('decisionMode') || 'assisted';
    return ctx;
  }

  function ctxLinea(ctx) {
    var partes = [
      ctx.market || '—',
      ctx.region || '—',
      ctx.serie ? ('serie ' + ctx.serie) : '',
      ctx.concept ? ('«' + truncar(ctx.concept, 60) + '»') : ''
    ].filter(Boolean);
    return 'Contexto compartido: ' + partes.join(' · ');
  }

  function promesaCediendo() {
    return new Promise(function (resolve) { setTimeout(resolve, 0); });
  }

  function framing() {
    /* Ceder un pintado antes de empezar. Con requestAnimationFrame como
       mecanismo principal, pero con tiempo límite: si la pestaña no pinta
       (headless, segundo plano) la generación no debe quedarse colgada. */
    return new Promise(function (resolve) {
      var hecho = false;
      function fin() { if (!hecho) { hecho = true; resolve(); } }
      try {
        if (window.requestAnimationFrame) window.requestAnimationFrame(fin);
        else setTimeout(fin, 16);
      } catch (e) { setTimeout(fin, 16); }
      setTimeout(fin, 150);
    });
  }

  /* ---------- productos y selección ---------- */

  function leerProductos() {
    var sel = $('product');
    var out = [];
    if (sel && sel.options) {
      for (var i = 0; i < sel.options.length; i++) {
        var t = String(sel.options[i].value != null && sel.options[i].value !== ''
          ? sel.options[i].value : (sel.options[i].textContent || '')).trim();
        if (t) out.push(t);
      }
    }
    return out;
  }

  function seleccionados() {
    if (modo === 'all') return PRODUCTOS.slice();
    return PRODUCTOS.filter(function (p) { return !!seleccion[p]; });
  }

  function pintarGrid() {
    var grid = $('mpGrid');
    if (!grid) return;
    grid.innerHTML = '';
    PRODUCTOS.forEach(function (p) {
      var chip = document.createElement('div');
      chip.className = 'mp-chip';
      chip.setAttribute('data-producto', p);

      var label = document.createElement('label');
      label.style.display = 'flex';
      label.style.gap = '6px';
      label.style.alignItems = 'center';
      label.style.cursor = 'pointer';
      label.style.flex = '1';

      var cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.checked = modo === 'all' ? true : !!seleccion[p];
      cb.disabled = (modo === 'all');
      cb.setAttribute('aria-label', 'Seleccionar ' + p);
      cb.addEventListener('change', function () {
        seleccion[p] = cb.checked;
        actualizarSeleccion();
      });

      var nombre = document.createElement('span');
      nombre.textContent = p;

      label.appendChild(cb);
      label.appendChild(nombre);

      var st = document.createElement('span');
      st.className = 'mp-st';
      st.setAttribute('data-st', p);
      st.textContent = '—';

      chip.appendChild(label);
      chip.appendChild(st);

      chip.addEventListener('click', function (ev) {
        if (ev.target && ev.target.tagName === 'INPUT') return;
        if (resultadosPorProducto()[p]) activar(p);
      });

      grid.appendChild(chip);
    });
    actualizarSeleccion();
  }

  function resultadosPorProducto() {
    var mapa = {};
    if (lote && Array.isArray(lote.productos)) {
      lote.productos.forEach(function (r) { if (r) mapa[r.producto] = r; });
    }
    return mapa;
  }

  function actualizarSeleccion() {
    var n = seleccionados().length;
    var contador = $('mpSelCount');
    if (contador) contador.textContent = String(n);
    var btn = $('mpGenerate');
    if (btn) btn.textContent = generando ? 'Generando…' : ('Generar' + (n ? ' ' + n + (n === 1 ? ' producto' : ' productos') : ''));
  }

  function fijarEstadoChips(mapa) {
    PRODUCTOS.forEach(function (p) {
      var st = document.querySelector('.mp-st[data-st="' + CSS.escape(p) + '"]');
      if (!st) return;
      var r = mapa[p];
      st.className = 'mp-st tp-state';
      if (!r) { st.textContent = 'Pendiente'; return; }
      if (r.ok) { st.className += ' ok tp-state-ok'; st.textContent = 'OK'; }
      else { st.className += ' err tp-state-err'; st.textContent = 'Error'; }
    });
  }

  /* ---------- pestañas y visor ---------- */

  function pintarTabs() {
    var wrap = $('mpTabs');
    if (!wrap) return;
    wrap.innerHTML = '';
    var lista = lote && Array.isArray(lote.productos) ? lote.productos : [];
    lista.forEach(function (r) {
      if (!r) return;
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'tab' + (activo === r.producto ? ' activa' : '');
      b.textContent = r.producto + (r.ok ? '' : ' · ERROR');
      b.addEventListener('click', function () { activar(r.producto); });
      wrap.appendChild(b);
    });
  }

  function activar(producto) {
    var r = resultadosPorProducto()[producto];
    if (!r) return;
    activo = producto;
    var tabs = $('mpTabs');
    if (tabs) {
      Array.prototype.forEach.call(tabs.querySelectorAll('.tab'), function (t) {
        var es = t.textContent.indexOf(producto) === 0;
        t.classList.toggle('activa', es);
      });
    }
    var ta = $('mpPrompt');
    if (ta) ta.value = r.prompt || '';
    var meta = $('mpMeta');
    if (meta) {
      meta.textContent = r.producto + ' · ' + (r.ok ? 'OK' : 'ERROR')
        + ' · ' + String(r.prompt || '').length + ' caracteres'
        + (r.context ? (' · contexto ' + (r.context.market || '—') + '/' + (r.context.region || '—') + '/' + r.producto) : '')
        + (r.error ? (' · ' + truncar(r.error, 80)) : '');
    }
    var reroll = $('mpReroll');
    if (reroll) reroll.disabled = false;
  }

  function actualizarAcciones() {
    var hayLote = !!(lote && Array.isArray(lote.productos) && lote.productos.length);
    var btnSave = $('mpSave');
    var btnZip = $('mpZip');
    if (btnSave) btnSave.disabled = generando || !hayLote;
    if (btnZip) btnZip.disabled = generando || !hayLote;
    var btnGen = $('mpGenerate');
    if (btnGen) btnGen.disabled = generando;
    var btnCancel = $('mpCancel');
    if (btnCancel) btnCancel.disabled = !generando;
    var btnCopy = $('mpCopy');
    var btnCopyPart = $('mpCopyPart');
    var btnReroll = $('mpReroll');
    var hayActivo = !!activo;
    if (btnCopy) btnCopy.disabled = generando || !hayActivo;
    if (btnCopyPart) btnCopyPart.disabled = generando || !hayActivo;
    if (btnReroll) btnReroll.disabled = generando || !hayActivo;
  }

  /* ---------- copiado ---------- */

  /* Devuelve 'clipboard' si usó la API moderna, 'fallback' si solo dejó el
     texto seleccionado / intentó execCommand, o 'fallo'. En navegadores sin
     activación de usuario (p.ej. automatización CDP) la API del portapapeles
     puede denegarse: entonces el visor queda seleccionado para Ctrl+C. */
  function copiarAlPortapapeles(texto) {
    texto = String(texto == null ? '' : texto);
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(texto).then(function () {
        ultimoMecanismoCopiado = 'clipboard';
        return true;
      }, function () {
        return copiarPorSeleccion(texto);
      });
    }
    return Promise.resolve(copiarPorSeleccion(texto));
  }

  var ultimoMecanismoCopiado = '';

  async function pulsarCopiar(parte) {
    var ta = $('mpPrompt');
    var txt = ta ? ta.value : '';
    var texto = parte ? parteDelPrompt(txt, 1, 2) : txt;
    var ok = await copiarAlPortapapeles(texto);
    if (ok) {
      setStatus((parte ? 'Primera mitad copiada' : 'Prompt copiado') + ' (' + ultimoMecanismoCopiado + ').', 'good');
    } else {
      setStatus('No se pudo copiar automáticamente: el texto sigue en el visor; selecciónalo y usa Ctrl+C.', 'warn');
    }
    return ok;
  }

  function copiarPorSeleccion(texto) {
    texto = String(texto == null ? '' : texto);
    /* 1) Si el texto pedido es exactamente el del visor, reutilizar su selección
       (así el usuario ve qué se copió). */
    try {
      var ta = $('mpPrompt');
      if (ta && ta.setSelectionRange && texto && ta.value.indexOf(texto) === 0) {
        /* Texto completo o una parte que coincide con el inicio del visor:
           se deja seleccionado exactamente ese tramo para Ctrl+C. */
        ta.focus();
        ta.setSelectionRange(0, texto.length);
        try {
          if (document.execCommand && document.execCommand('copy')) { ultimoMecanismoCopiado = 'fallback-execCommand'; return true; }
        } catch (e) { /* sin activación de usuario */ }
        ultimoMecanismoCopiado = 'fallback-seleccion';
        return true;
      }
    } catch (e) { /* se prueba el mecanismo portable */ }

    /* 2) Portapapeles portable: campo temporal fuera de pantalla con el texto
       exacto pedido (también sirve para copiar solo una parte). */
    try {
      var tmp = document.createElement('textarea');
      tmp.value = texto;
      tmp.setAttribute('readonly', '');
      tmp.style.cssText = 'position:fixed;top:-1000px;left:-1000px;opacity:0;';
      document.body.appendChild(tmp);
      tmp.select();
      var ok = document.execCommand ? document.execCommand('copy') : false;
      if (tmp.parentNode) tmp.parentNode.removeChild(tmp);
      ultimoMecanismoCopiado = ok ? 'fallback-temporal' : '';
      return !!ok;
    } catch (e) { return false; }
  }

  function parteDelPrompt(texto, parte, total) {
    var s = String(texto || '');
    if (total <= 1) return s;
    var n = Math.ceil(s.length / total);
    var desde = (parte - 1) * n;
    return s.slice(desde, desde + n);
  }

  /* ---------- historial ---------- */

  function fmtFecha(iso) {
    var d = new Date(iso);
    if (isNaN(d.getTime())) return String(iso || '');
    function p(n) { return (n < 10 ? '0' : '') + n; }
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate())
      + ' ' + p(d.getHours()) + ':' + p(d.getMinutes());
  }

  function pintarHistorial() {
    var wrap = $('mpHistorial');
    if (!wrap) return;
    if (!HIST) { wrap.innerHTML = '<div class="hitem">Historial no disponible.</div>'; return; }
    var lista = HIST.listarLotes();
    if (!lista.length) {
      wrap.innerHTML = '<div class="hitem">Sin lotes guardados.</div>';
      return;
    }
    wrap.innerHTML = '';
    lista.forEach(function (e) {
      var item = document.createElement('div');
      item.className = 'hitem';

      var izq = document.createElement('span');
      izq.textContent = fmtFecha(e.createdAt) + ' · ' + e.total + ' productos · '
        + (e.ok ? 'COMPLETO' : ('PARCIAL (' + (e.errores == null ? '?' : e.errores) + ' errores)'));

      var der = document.createElement('span');
      der.className = 'row';

      var bCargar = document.createElement('button');
      bCargar.type = 'button';
      bCargar.className = 'btn ghost';
      bCargar.textContent = 'Cargar';
      bCargar.addEventListener('click', function () { cargarLote(e.id); });

      var bZip = document.createElement('button');
      bZip.type = 'button';
      bZip.className = 'btn ghost';
      bZip.textContent = 'ZIP';
      bZip.addEventListener('click', function () {
        var l = HIST.cargarLote(e.id);
        if (!l) { setStatus('No se pudo cargar el lote ' + e.id, 'bad'); return; }
        exportarZip(l);
      });

      var bElim = document.createElement('button');
      bElim.type = 'button';
      bElim.className = 'btn ghost';
      bElim.textContent = 'Eliminar';
      bElim.addEventListener('click', function () {
        var r = HIST.eliminarLote(e.id);
        setStatus(r.ok ? ('Lote eliminado: ' + e.id) : ('No se pudo eliminar: ' + (r.error || '')), r.ok ? 'good' : 'bad');
        pintarHistorial();
      });

      der.appendChild(bCargar);
      der.appendChild(bZip);
      der.appendChild(bElim);
      item.appendChild(izq);
      item.appendChild(der);
      wrap.appendChild(item);
    });
  }

  function normalizarProductos(src) {
    var base = ctxFromDom();
    return (src || []).map(function (r) {
      r = r || {};
      var ctxObj = r.context && typeof r.context === 'object' ? r.context : null;
      var p = String(r.producto || '');
      return {
        producto: p,
        ok: !!r.ok,
        prompt: typeof r.prompt === 'string' ? r.prompt : '',
        context: ctxObj || {
          market: base.market, region: base.region, product: p, brand: base.brand
        },
        error: r.error == null ? null : String(r.error)
      };
    });
  }

  function guardarLote() {
    if (!lote || !HIST) return;
    var res = HIST.guardarLote({ ctx: lote.ctx, productos: lote.productos });
    if (res.ok) {
      if (res.id) lote.id = res.id;
      setStatus(res.duplicado
        ? ('Lote ya existía (sin duplicar): ' + res.id)
        : ('Lote guardado: ' + res.id + (res.rotados && res.rotados.length ? (' · rotados: ' + res.rotados.length) : '')),
        'good');
    } else {
      setStatus('No se pudo guardar: ' + (res.error || 'error desconocido'), 'bad');
    }
    pintarHistorial();
  }

  function cargarLote(id) {
    if (!HIST) return;
    var l = HIST.cargarLote(id);
    if (!l) { setStatus('No se pudo cargar el lote ' + id, 'bad'); return; }
    lote = {
      id: id || (l && l.id) || null,
      createdAt: (l && l.createdAt) || new Date().toISOString(),
      ctx: l.ctx || ctxFromDom(),
      productos: normalizarProductos(l.productos),
      ok: (l && typeof l.ok === 'boolean') ? l.ok : true,
      errores: (l && typeof l.errores === 'number') ? l.errores : 0
    };
    activo = null;
    fijarEstadoChips(resultadosPorProducto());
    pintarTabs();
    var primero = lote.productos[0];
    if (primero) activar(primero.producto);
    var ctxEl = $('mpCtx');
    if (ctxEl) ctxEl.textContent = ctxLinea(lote.ctx);
    setStatus('Lote cargado sin regenerar: ' + id + ' · ' + lote.productos.length + ' productos', 'info');
    actualizarAcciones();
  }

  function exportarZip(l) {
    if (!ZIP) { setStatus('Exportador ZIP no disponible.', 'bad'); return; }
    var loteAExportar = l || lote;
    if (!loteAExportar) { setStatus('No hay lote para exportar.', 'bad'); return; }
    var res = ZIP.generarZip(loteAExportar);
    if (!res.ok) { setStatus('No se pudo crear el ZIP: ' + (res.error || ''), 'bad'); return; }
    var desc = ZIP.descargarZip(loteAExportar, { nombre: res.nombre });
    if (desc && desc.ok) {
      setStatus('ZIP generado y descargado: ' + desc.nombre + ' · ' + desc.tamano + ' bytes', 'good');
    } else {
      setStatus('ZIP válido (' + res.tamano + ' bytes, ' + res.archivos.length + ' archivos) pero la descarga falló: '
        + ((desc && desc.error) || ''), 'warn');
    }
  }

  /* ---------- generación ---------- */

  async function generar() {
    if (generando) return;
    if (!ORQ || !ORQ.generarMuchos) { setStatus('Orquestador multiproducto no disponible.', 'bad'); return; }
    var lista = seleccionados();
    if (!lista.length) { setStatus('No hay productos seleccionados.', 'warn'); return; }

    generando = true;
    cancelado = false;
    lote = {
      id: null,
      createdAt: new Date().toISOString(),
      ctx: ctxCompleto(ctxFromDom()),
      productos: [],
      ok: true,
      errores: 0
    };
    activo = null;
    actualizarAcciones();
    fijarEstadoChips({});
    pintarTabs();
    var ta = $('mpPrompt'); if (ta) ta.value = '';
    var meta = $('mpMeta'); if (meta) meta.textContent = '—';
    barra(0);
    setStatus('Preparando ' + lista.length + ' productos…', 'info');

    await framing();

    var exitos = 0;
    var fallos = 0;

    for (var i = 0; i < lista.length; i++) {
      if (cancelado) { setStatus('Cancelado por el usuario con resultados parciales.', 'warn'); break; }
      var p = lista[i];
      marcarEjecutando(p);
      setStatus('Generando ' + p + '… (' + (i + 1) + ' de ' + lista.length + ')', 'info');
      await promesaCediendo();

      var res = ORQ.generarMuchos(Object.assign(ctxOpts(lote.ctx), { productos: [p] }));

      var r = (res && Array.isArray(res.resultados) && res.resultados[0]) || null;
      var item = r || { ok: false, producto: p, prompt: '', result: null, error: 'sin resultado' };
      if (!item.context) {
        item.context = { market: lote.ctx.market, region: lote.ctx.region, product: p, brand: lote.ctx.brand };
      }
      lote.productos.push(item);
      if (item.ok) exitos++; else fallos++;
      fijarEstadoChips(resultadosPorProducto());
      pintarTabs();
      activar(p);
      barra(((i + 1) / lista.length) * 100);
    }

    generando = false;
    lote.ok = (fallos === 0 && !cancelado);
    lote.errores = fallos;
    actualizarAcciones();
    var detalle = exitos + ' OK · ' + fallos + ' errores · ' + lote.productos.length + '/' + lista.length;
    var msg = cancelado
      ? ('Cancelado por el usuario con resultados parciales: ' + detalle)
      : ('Lote terminado: ' + detalle);
    setStatus(msg, (fallos || cancelado) ? 'warn' : 'good');
    var ctxEl = $('mpCtx');
    if (ctxEl) ctxEl.textContent = ctxLinea(lote.ctx);
  }

  function marcarEjecutando(p) {
    var st = document.querySelector('.mp-st[data-st="' + CSS.escape(p) + '"]');
    if (st) { st.className = 'mp-st tp-state run tp-state-run'; st.textContent = 'Generando…'; }
  }

  async function regenerarIndividual() {
    if (generando || !activo) return;
    if (!ORQ || !ORQ.generarMuchos) return;
    var idx = -1;
    for (var i = 0; i < lote.productos.length; i++) if (lote.productos[i].producto === activo) idx = i;
    if (idx < 0) return;

    generando = true;
    cancelado = false;
    actualizarAcciones();
    marcarEjecutando(activo);
    setStatus('Regenerando ' + activo + '…', 'info');
    await promesaCediendo();

    var res = ORQ.generarMuchos(Object.assign(ctxOpts(lote.ctx), {
      productos: [activo],
      rerollNonce: Date.now() + idx
    }));
    var r = (res && res.resultados && res.resultados[0]) || { ok: false, producto: activo, prompt: '', error: 'sin resultado' };
    r.context = { market: lote.ctx.market, region: lote.ctx.region, product: activo, brand: lote.ctx.brand };
    lote.productos[idx] = r;              /* solo este: los demás no se tocan */

    generando = false;
    fijarEstadoChips(resultadosPorProducto());
    pintarTabs();
    activar(activo);
    actualizarAcciones();
    setStatus('Regenerado ' + activo + ': ' + (r.ok ? 'OK' : ('ERROR ' + (r.error || ''))), r.ok ? 'good' : 'bad');
  }

  /* ---------- arranque ---------- */

  function bind() {
    var bAll = $('mpAllBtn');
    var bNone = $('mpNoneBtn');
    var bMode = $('mpMode');
    var bGen = $('mpGenerate');
    var bCancel = $('mpCancel');
    var bSave = $('mpSave');
    var bZip = $('mpZip');
    var bCopy = $('mpCopy');
    var bCopyPart = $('mpCopyPart');
    var bReroll = $('mpReroll');

    if (bMode) bMode.addEventListener('change', function () {
      modo = bMode.value === 'selected' ? 'selected' : 'all';
      /* Al cambiar de modo se conserva una selección completa: el usuario
         puede quitar los que no quiera con «Ninguno» + marcas individuales. */
      PRODUCTOS.forEach(function (p) { seleccion[p] = true; });
      pintarGrid();
      actualizarSeleccion();
    });
    if (bAll) bAll.addEventListener('click', function () {
      PRODUCTOS.forEach(function (p) { seleccion[p] = true; });
      modo = 'selected';
      if (bMode) bMode.value = 'selected';
      pintarGrid();
      actualizarSeleccion();
    });
    if (bNone) bNone.addEventListener('click', function () {
      PRODUCTOS.forEach(function (p) { seleccion[p] = false; });
      modo = 'selected';
      if (bMode) bMode.value = 'selected';
      pintarGrid();
      actualizarSeleccion();
    });
    if (bGen) bGen.addEventListener('click', generar);
    if (bCancel) bCancel.addEventListener('click', function () {
      if (generando) { cancelado = true; setStatus('Cancelando tras el producto en curso…', 'warn'); }
    });
    if (bSave) bSave.addEventListener('click', guardarLote);
    if (bZip) bZip.addEventListener('click', function () { exportarZip(null); });
    if (bCopy) bCopy.addEventListener('click', function () { pulsarCopiar(false); });
    if (bCopyPart) bCopyPart.addEventListener('click', function () { pulsarCopiar(true); });
    if (bReroll) bReroll.addEventListener('click', regenerarIndividual);
  }

  function init() {
    PRODUCTOS = leerProductos();
    if (!PRODUCTOS.length) {
      setStatus('No se encontraron productos en el catálogo (#product).', 'bad');
      return;
    }
    PRODUCTOS.forEach(function (p) { seleccion[p] = true; });
    pintarGrid();
    actualizarSeleccion();
    var ctx = ctxFromDom();
    var ctxEl = $('mpCtx');
    if (ctxEl) ctxEl.textContent = ctxLinea(ctx);
    bind();
    actualizarAcciones();
    pintarHistorial();
    setStatus('Selecciona los productos y pulsa Generar.', 'info');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  /* API mínima para pruebas automatizadas (CDP) sin acoplar la UI al test. */
  window.MultiproductoUI = {
    _state: function () { return { generando: generando, modo: modo, activo: activo, n: PRODUCTOS.length }; },
    _productos: function () { return PRODUCTOS.slice(); },
    _lote: function () { return lote; },
    _mecanismoCopiado: function () { return ultimoMecanismoCopiado; },
    _pintarHistorial: pintarHistorial,
    _guardarLote: guardarLote
  };
})();
