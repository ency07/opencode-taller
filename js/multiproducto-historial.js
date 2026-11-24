/* ============================================================================
 * ETAPA 4 — HISTORIAL LOCAL DE LOTES MULTIPRODUCTO
 * Almacenamiento: localStorage. Sin Supabase ni servicios externos.
 *
 * Claves:
 *   POD2|multiproduct|lote|<id>   -> registro del lote (JSON)
 *   POD2|multiproduct|index       -> índice [{id, createdAt, total, ok, firma}]
 *
 * Compatibilidad con la memoria del Taller POD:
 *   - Prefijo propio (POD2|multiproduct|) separado de patterns/history/bancos.
 *   - Respeta GLOBAL_MEMORY_CLEAR_KEY ('***'): los lotes anteriores a
 *     la barrera se ocultan y los registros tombstone (__podDeleted) se ignoran.
 *   - clearAllMemory() deja el historial inaccesible (tumbas + barrera).
 *
 * Límites: MAX_LOTES = 20 lotes; PRESUPUESTO_BYTES = 4 MB estimados del conjunto.
 * Rotación automática por número de lotes y por presupuesto, de más antiguo a
 * más reciente. Un lote que por sí solo supere el presupuesto se rechaza antes
 * de escribir. Si la escritura falla por cuota, se rota y se reintenta; si
 * persiste el fallo, se devuelve error estructurado sin corromper lo existente.
 * ========================================================================== */
(function () {
  'use strict';

  var PREFIJO = 'POD2|multiproduct|';
  var CLAVE_INDICE = PREFIJO + 'index';
  var CLAVE_LOTE_PREFIX = PREFIJO + 'lote|';
  var GLOBAL_CLEAR_KEY = 'POD2|__' + 'globalClear';
  var MAX_LOTES = 20;
  var PRESUPUESTO_BYTES = 4 * 1024 * 1024;

  function claveLote(id) { return CLAVE_LOTE_PREFIX + id; }

  function _storage() {
    try { if (typeof window !== 'undefined' && window.localStorage) return window.localStorage; } catch (e) {}
    try { if (typeof localStorage !== 'undefined') return localStorage; } catch (e) {}
    return null;
  }
  function _leer(clave) {
    var s = _storage();
    if (!s) return null;
    try { return s.getItem(clave); } catch (e) { return null; }
  }
  function _escribir(clave, valor) {
    var s = _storage();
    if (!s) return false;
    try { s.setItem(clave, String(valor)); return true; } catch (e) { return false; }
  }
  function _borrar(clave) {
    var s = _storage();
    if (!s) return false;
    try { s.removeItem(clave); return true; } catch (e) { return false; }
  }

  function _bytes(texto) {
    try { if (typeof Blob !== 'undefined') return new Blob([texto]).size; } catch (e) {}
    try { if (typeof Buffer !== 'undefined') return Buffer.byteLength(texto, 'utf8'); } catch (e) {}
    return texto.length * 2;
  }

  /* Fecha de lote respetando la barrera global: una escritura posterior al borrado
     debe quedar por encima de la barrera aunque el reloj comparta milisegundo
     (misma regla que la memoria local: now > clearEpoch ? now : clearEpoch + 1). */
  function _fechaNueva() {
    var now = Date.now();
    var barrera = _barreraGlobal();
    return new Date(now > barrera ? now : barrera + 1).toISOString();
  }

  /* Tumba de la memoria global: los registros con __podDeleted no son válidos. */
  function _esTombstone(valor) {
    try { var o = JSON.parse(valor); return !!(o && o.__podDeleted === true); } catch (e) { return false; }
  }

  /* Barrera de borrado global (clearAllMemory): oculta lotes anteriores. */
  function _barreraGlobal() {
    var raw = _leer(GLOBAL_CLEAR_KEY);
    if (!raw) return 0;
    try {
      var m = JSON.parse(raw);
      if (m && m.__podGlobalClear === true && Number.isFinite(Date.parse(m.deletedAt || ''))) {
        return Date.parse(m.deletedAt);
      }
    } catch (e) {}
    return 0;
  }

  function _valido(entrada, barrera) {
    if (!entrada || typeof entrada.id !== 'string' || !entrada.createdAt) return false;
    if (_esTombstone(_leer(claveLote(entrada.id)) || '')) return false;
    if (barrera && !(Date.parse(entrada.createdAt) > barrera)) return false;
    return true;
  }

  function _leerIndice() {
    var barrera = _barreraGlobal();
    var raw = _leer(CLAVE_INDICE);
    var lista = [];
    if (raw && !_esTombstone(raw)) {
      try { lista = JSON.parse(raw); } catch (e) { lista = []; }
    }
    if (!Array.isArray(lista)) lista = [];
    return lista
      .filter(function (e) { return _valido(e, barrera); })
      .sort(function (a, b) { return Date.parse(a.createdAt) - Date.parse(b.createdAt); });
  }

  function _escribirIndice(lista) { return _escribir(CLAVE_INDICE, JSON.stringify(lista)); }

  function _tamanoRegistros(indice) {
    var total = 0;
    indice.forEach(function (e) { total += _bytes(_leer(claveLote(e.id)) || ''); });
    return total;
  }

  /* Rotación de más antiguo a más reciente hasta cumplir ambos límites. */
  function _rotar(indice) {
    var rotados = [];
    while (indice.length > 0 && (indice.length > MAX_LOTES || _tamanoRegistros(indice) > PRESUPUESTO_BYTES)) {
      var victima = indice.shift();
      _borrar(claveLote(victima.id));
      rotados.push(victima.id);
    }
    return rotados;
  }

  function _firma(lote) {
    var ctx = lote.ctx || {};
    return JSON.stringify([
      ctx.market || '', ctx.region || '', ctx.concept || '', ctx.message || '',
      ctx.serie || '', (lote.productos || []).map(function (p) { return p.producto; }).join('|')
    ]);
  }

  function _normalizar(lote) {
    lote = lote || {};
    if (!Array.isArray(lote.productos)) return { error: 'el lote debe traer un array "productos"' };
    var ctx = lote.ctx && typeof lote.ctx === 'object' ? lote.ctx : {};
    var productos = lote.productos.map(function (p) {
      p = p || {};
      return {
        producto: String(p.producto || ''),
        ok: !!p.ok,
        prompt: typeof p.prompt === 'string' ? p.prompt : '',
        context: p.context && typeof p.context === 'object' ? p.context : null,
        error: p.error == null ? null : String(p.error)
      };
    });
    var errores = productos.filter(function (p) { return !p.ok; }).length;
    return {
      normalizado: {
        id: null,
        createdAt: lote.createdAt || _fechaNueva(),
        ctx: ctx,
        productos: productos,
        total: productos.length,
        ok: errores === 0,
        errores: errores
      }
    };
  }

  /* Guarda un lote. No sobrescribe lotes anteriores: cada guardado crea uno
     nuevo; con `deduplicar` (por defecto) un lote idéntico al último no se
     duplica y devuelve el existente. */
  function guardarLote(lote, opciones) {
    opciones = opciones || {};
    var n = _normalizar(lote);
    if (n.error) return { ok: false, error: n.error, rotados: [] };
    var registro = n.normalizado;
    var firma = _firma(registro);

    var indice = _leerIndice();

    if (opciones.deduplicar !== false) {
      var duplicado = null;
      for (var i = indice.length - 1; i >= 0; i--) {
        if (indice[i].firma === firma) { duplicado = indice[i]; break; }
      }
      if (duplicado) return { ok: true, id: duplicado.id, duplicado: true, rotados: [] };
    }

    var json = JSON.stringify(registro);
    if (_bytes(json) > PRESUPUESTO_BYTES) {
      return { ok: false, error: 'lote demasiado grande para el presupuesto (' + _bytes(json) + ' bytes)', rotados: [] };
    }

    var id = Date.now() + '-' + Math.random().toString(36).slice(2, 8);
    var rotados = [];

    if (!_escribir(claveLote(id), json)) {
      /* Cuota agotada: rotar primero y reintentar una sola vez. */
      rotados = _rotar(indice);
      _escribirIndice(indice);
      if (!_escribir(claveLote(id), json)) {
        return { ok: false, error: 'cuota de almacenamiento agotada', rotados: rotados };
      }
    }

    indice.push({ id: id, createdAt: registro.createdAt, total: registro.total, ok: registro.ok, firma: firma });
    rotados = rotados.concat(_rotar(indice));

    if (!_escribirIndice(indice)) {
      _borrar(claveLote(id));
      return { ok: false, error: 'no se pudo persistir el índice', rotados: rotados };
    }
    return { ok: true, id: id, duplicado: false, rotados: rotados };
  }

  /* Recupera un lote sin volver a ejecutar la generación. */
  function cargarLote(id) {
    var clave = claveLote(String(id || ''));
    var raw = _leer(clave);
    if (!raw || _esTombstone(raw)) return null;
    try {
      var lote = JSON.parse(raw);
      if (!lote || lote.__podDeleted) return null;
      if (_barreraGlobal() && !(Date.parse(lote.createdAt || '') > _barreraGlobal())) return null;
      return lote;
    } catch (e) { return null; }
  }

  /* Resúmenes ordenados del más reciente al más antiguo. */
  function listarLotes() {
    return _leerIndice()
      .sort(function (a, b) { return Date.parse(b.createdAt) - Date.parse(a.createdAt); })
      .map(function (e) {
        return { id: e.id, createdAt: e.createdAt, total: e.total, ok: e.ok, errores: e.errores == null ? null : e.errores };
      });
  }

  function eliminarLote(id) {
    id = String(id || '');
    if (!cargarLote(id)) return { ok: false, error: 'lote no encontrado' };
    _borrar(claveLote(id));
    var indice = _leerIndice().filter(function (e) { return e.id !== id; });
    return { ok: _escribirIndice(indice) };
  }

  /* Diagnóstico (para evidencia y futura UI). */
  function tamanoBytes() { return _tamanoRegistros(_leerIndice()); }
  function contarLotes() { return _leerIndice().length; }

  window.MultiproductoHistorial = {
    guardarLote: guardarLote,
    cargarLote: cargarLote,
    listarLotes: listarLotes,
    eliminarLote: eliminarLote,
    tamanoBytes: tamanoBytes,
    contarLotes: contarLotes,
    PREFIJO: PREFIJO,
    MAX_LOTES: MAX_LOTES,
    PRESUPUESTO_BYTES: PRESUPUESTO_BYTES
  };
})();
