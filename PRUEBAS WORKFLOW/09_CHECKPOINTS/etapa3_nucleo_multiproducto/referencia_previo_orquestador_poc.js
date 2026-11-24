/* ============================================================================
 * POC FASE 2 — ORQUESTADOR MULTIPRODUCTO (CAMISETA SOFT / DISPLATE)
 * Autorización: "AUTORIZACIÓN CONTROLADA — POC MULTIPRODUCTO" (2026-11-23).
 * Alcance: generar prompts para CAMISETA SOFT y DISPLATE desde un mismo concepto.
 * No es implementación definitiva. No implementa UI multiproducto definitiva,
 * ZIP, historial ni catálogo completo.
 * Reutiliza el pipeline existente (generateSet -> evaluaSetOk interno -> formatPrompt).
 * NO duplica buildCandidate / evaluaSetOk / formatPrompt.
 * Isolation: snapshot/restore del contexto mutable + dependencias de DOM + contexto
 * de resultado, con try/finally. Sin generaciones concurrentes (POC sincrono por diseño).
 * ========================================================================== */
(function () {
  'use strict';

  function _deepClone(v) {
    if (v === null || v === undefined) return v;
    if (typeof v === 'object') {
      if (Array.isArray(v)) return v.slice();
      var o = {};
      Object.keys(v).forEach(function (k) { o[k] = _deepClone(v[k]); });
      return o;
    }
    return v;
  }

  function _snapshotDom() {
    var ids = ['language','marketplace','subniche','serie','concept','message','support',
      'audienceSet','audienceMulti','aestheticPreference','dominio','domImagen','workflowMode',
      'repeatType','simboloVar','textosVar','paletaVar','essence','capApplication','stampSide',
      'printMethod','creativeTerritory','visualIdentity','decisionMode','market','region','product','brand'];
    var out = {};
    ids.forEach(function (id) {
      var el = document.getElementById(id);
      out[id] = el ? String(el.value || '') : null;
    });
    return out;
  }

  function _setDom(id, value) {
    var el = document.getElementById(id);
    if (el) el.value = String(value == null ? '' : value);
  }

  /* Selects: sólo se escribe un valor que exista como opción. Si el valor
     inyectado no existe, asignar value dejaría selectedIndex=-1 y el motor leería
     una región/producto vacío (prompt "de la region ."). En ese caso se conserva
     el valor real del DOM y MOTOR_STATE se alinea con él más abajo. */
  function _setDomSelect(id, value) {
    var el = document.getElementById(id);
    if (!el || !el.options) { _setDom(id, value); return; }
    var ok = false;
    for (var i = 0; i < el.options.length; i++) {
      if (String(el.options[i].value) === String(value)) { ok = true; break; }
    }
    if (ok) el.value = String(value);
  }

  /* Deja MOTOR_STATE exactamente como lo leerá readStateFromDOM()->syncContext(),
     sin disparar avisos de UI ni efectos secundarios del pipeline. */
  function _alinearConDom() {
    ['market', 'region', 'product', 'brand'].forEach(function (k) {
      var el = document.getElementById(k);
      if (el) MOTOR_STATE[k] = el.value;
    });
  }

  function _snapshot() {
    var ms = (typeof MOTOR_STATE !== 'undefined') ? MOTOR_STATE : {};
    var snap = { motor: _deepClone(ms), lastResult: (typeof LAST_RESULT !== 'undefined') ? LAST_RESULT : null, dom: _snapshotDom() };
    snap.activeGenLocks = (typeof window !== 'undefined' && window._ACTIVE_GEN_LOCKS !== undefined) ? window._ACTIVE_GEN_LOCKS : null;
    snap.genLockWarnings = (typeof window !== 'undefined' && window._GEN_LOCK_WARNINGS !== undefined) ? window._GEN_LOCK_WARNINGS : null;
    return snap;
  }

  function _restore(snap) {
    var ms = (typeof MOTOR_STATE !== 'undefined') ? MOTOR_STATE : {};
    Object.keys(ms).forEach(function (k) { delete ms[k]; });
    Object.keys(snap.motor || {}).forEach(function (k) { ms[k] = snap.motor[k]; });
    if (snap.activeGenLocks !== undefined) { try { window._ACTIVE_GEN_LOCKS = snap.activeGenLocks; } catch (e) {} }
    if (snap.genLockWarnings !== undefined) { try { window._GEN_LOCK_WARNINGS = snap.genLockWarnings; } catch (e) {} }
    if (snap.lastResult !== undefined) {
      try { LAST_RESULT = snap.lastResult; } catch (e) {}
      try { window.LAST_RESULT = LAST_RESULT; } catch (e) {}
    }
    var d = snap.dom || {};
    Object.keys(d).forEach(function (id) { if (d[id] !== null && d[id] !== undefined) _setDom(id, d[id]); });
  }

  function _escribirContexto(opts) {
    MOTOR_STATE.product = String(opts.producto || 'CAMISETA SOFT');
    MOTOR_STATE.concept = String(opts.concepto || '');
    MOTOR_STATE.message = String(opts.mensaje || '');
    MOTOR_STATE.support = String(opts.apoyo || '');
    MOTOR_STATE.serie = String(opts.serie || '');
    MOTOR_STATE.language = String(opts.language || 'es');
    MOTOR_STATE.marketplace = String(opts.marketplace || 'generic');
    MOTOR_STATE.subniche = String(opts.subniche || 'auto');
    MOTOR_STATE.audienceSet = String(opts.audienceSet || 'Auto');
    MOTOR_STATE.audienceMulti = String(opts.audienceMulti || 'no');
    MOTOR_STATE.aestheticPreference = String(opts.aestheticPreference || 'auto');
    MOTOR_STATE.dominio = String(opts.dominio || 'auto');
    MOTOR_STATE.domImagen = String(opts.domImagen || 'Auto');
    MOTOR_STATE.workflowMode = String(opts.workflowMode || 'explore');
    MOTOR_STATE.repeatType = String(opts.repeatType || 'medio salto');
    MOTOR_STATE.variationOptions = {
      simbolo: String(opts.simboloVar || 'sustituir'),
      textos: String(opts.textosVar || 'conservar_palabras'),
      paleta: String(opts.paletaVar || 'renovar'),
      esencia: String(opts.esencia || '')
    };
    MOTOR_STATE.capApplication = String(opts.capApplication || 'auto');
    MOTOR_STATE.stampSide = String(opts.stampSide || 'auto');
    MOTOR_STATE.printMethod = String(opts.printMethod || 'auto');
    MOTOR_STATE.creativeTerritory = String(opts.creativeTerritory || 'auto');
    MOTOR_STATE.visualIdentity = opts.visualIdentity === undefined ? null : opts.visualIdentity;
    MOTOR_STATE.decisionMode = String(opts.decisionMode || 'assisted');
    MOTOR_STATE.allowAutoCopy = opts.allowAutoCopy === undefined ? true : !!opts.allowAutoCopy;
    MOTOR_STATE.fmtDense = opts.fmtDense === undefined ? true : !!opts.fmtDense;
    MOTOR_STATE.market = String(opts.market || 'global_es');
    MOTOR_STATE.region = String(opts.region || 'global');
    MOTOR_STATE.brand = String(opts.brand || 'auto');

    _setDomSelect('product', MOTOR_STATE.product);
    _setDomSelect('brand', MOTOR_STATE.brand);
    _setDomSelect('language', MOTOR_STATE.language);
    _setDomSelect('marketplace', MOTOR_STATE.marketplace);
    _setDomSelect('subniche', MOTOR_STATE.subniche);
    _setDom('serie', MOTOR_STATE.serie);
    _setDom('concept', MOTOR_STATE.concept);
    _setDom('message', MOTOR_STATE.message);
    _setDom('support', MOTOR_STATE.support);
    _setDomSelect('audienceSet', MOTOR_STATE.audienceSet);
    _setDomSelect('audienceMulti', MOTOR_STATE.audienceMulti);
    _setDomSelect('aestheticPreference', MOTOR_STATE.aestheticPreference);
    _setDomSelect('dominio', MOTOR_STATE.dominio);
    _setDomSelect('domImagen', MOTOR_STATE.domImagen);
    _setDomSelect('workflowMode', MOTOR_STATE.workflowMode);
    _setDomSelect('repeatType', MOTOR_STATE.repeatType);
    _setDomSelect('simboloVar', MOTOR_STATE.variationOptions.simbolo);
    _setDomSelect('textosVar', MOTOR_STATE.variationOptions.textos);
    _setDomSelect('paletaVar', MOTOR_STATE.variationOptions.paleta);
    _setDom('essence', MOTOR_STATE.variationOptions.esencia);
    _setDomSelect('capApplication', MOTOR_STATE.capApplication);
    _setDomSelect('stampSide', MOTOR_STATE.stampSide);
    _setDomSelect('printMethod', MOTOR_STATE.printMethod);
    _setDomSelect('creativeTerritory', MOTOR_STATE.creativeTerritory);
    _setDom('visualIdentity', MOTOR_STATE.visualIdentity === null ? '' : String(MOTOR_STATE.visualIdentity || ''));
    _setDomSelect('decisionMode', MOTOR_STATE.decisionMode);
    _setDomSelect('market', MOTOR_STATE.market);
    _setDomSelect('region', MOTOR_STATE.region);
    _alinearConDom();
  }

  function generarProducto(opts) {
    opts = opts || {};
    var producto = String(opts.producto || 'CAMISETA SOFT');
    var snap = _snapshot();
    try {
      _escribirContexto(opts);
      var result = generateSet();
      var prompt = result ? formatPrompt(result) : '';
      return { ok: !!prompt, producto: producto, prompt: prompt, result: result };
    } finally {
      try { _restore(snap); } catch (e) { console.warn('[POC-Orquestador] restore falló:', e); }
    }
  }

  /* Aislamiento de fallos por producto: la generación de un producto no debe
     destruir el resultado ya obtenido de los hermanos (prueba obligatoria 9). */
  function generarProductoAislado(opts) {
    opts = opts || {};
    var producto = String(opts.producto || 'CAMISETA SOFT');
    try {
      return generarProducto(opts);
    } catch (e) {
      return { ok: false, producto: producto, prompt: '', result: null, error: String((e && e.message) || e) };
    }
  }

  function generar(opts) {
    opts = opts || {};
    var productos = Array.isArray(opts.productos) ? opts.productos : [opts.producto].filter(Boolean);
    var out = [];
    for (var i = 0; i < productos.length; i++) {
      out.push(generarProductoAislado(Object.assign({}, opts, { producto: productos[i] })));
    }
    return out;
  }

  function generarAislado(opts) {
    var resultados = generar(opts);
    return { ok: resultados.every(function (r) { return !!r.ok; }), resultados: resultados };
  }

  window.OrquestadorMultiProducto = {
    generarProducto: generarProducto,
    generar: generar,
    generarAislado: generarAislado
  };
})();
