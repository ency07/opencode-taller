/* ============================================================================
 * ETAPA 5 — EXPORTACIÓN ZIP SIN DEPENDENCIAS EXTERNAS
 * Genera un ZIP en modo STORE (sin compresión) con encabezados locales,
 * directorio central y EOCD, más CRC32 propio. Sólo APIs nativas (TextEncoder,
 * Uint8Array/DataView, Blob para la descarga).
 *
 * Estructura del ZIP:
 *   00_LOTE.txt            información general del lote
 *   NN_<PRODUCTO>_<estado>.txt   prompt + contexto de cada producto (NN = 01..)
 *   99_RESUMEN.txt         resultados y errores
 *
 * Los nombres internos se saneados a ASCII (para máxima compatibilidad) con
 * prefijo numérico que garantiza unicidad y orden; el contenido va en UTF-8 y
 * se marca el bit EFS (0x0800) en los encabezados.
 * Solo lectura del historial: exportar no modifica lotes ni memoria.
 * ========================================================================== */
(function () {
  'use strict';

  var DOS_TIME = 0x0000;  /* 00:00:00 — determinista */
  var DOS_DATE = 0x0021;  /* 1980-01-01 */
  var FLAG_UTF8 = 0x0800;

  /* --- CRC32 (polinomio 0xEDB88320) --- */
  var CRC_TABLE = (function () {
    var tabla = new Uint32Array(256);
    for (var n = 0; n < 256; n++) {
      var c = n;
      for (var k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      tabla[n] = c >>> 0;
    }
    return tabla;
  })();

  function crc32(bytes) {
    var crc = 0xFFFFFFFF;
    for (var i = 0; i < bytes.length; i++) crc = (CRC_TABLE[(crc ^ bytes[i]) & 0xFF] ^ (crc >>> 8)) >>> 0;
    return (crc ^ 0xFFFFFFFF) >>> 0;
  }

  /* --- UTF-8 --- */
  function utf8(str) {
    if (typeof TextEncoder !== 'undefined') return new TextEncoder().encode(String(str));
    var out = [];
    var s = String(str);
    for (var i = 0; i < s.length; i++) {
      var code = s.codePointAt(i);
      if (code > 0xFFFF) i++;
      if (code < 0x80) out.push(code);
      else if (code < 0x800) { out.push(0xC0 | (code >> 6), 0x80 | (code & 63)); }
      else if (code < 0x10000) { out.push(0xE0 | (code >> 12), 0x80 | ((code >> 6) & 63), 0x80 | (code & 63)); }
      else { out.push(0xF0 | (code >> 18), 0x80 | ((code >> 12) & 63), 0x80 | ((code >> 6) & 63), 0x80 | (code & 63)); }
    }
    return new Uint8Array(out);
  }

  function _concat(partes) {
    var total = 0;
    partes.forEach(function (p) { total += p.length; });
    var out = new Uint8Array(total);
    var off = 0;
    partes.forEach(function (p) { out.set(p, off); off += p.length; });
    return out;
  }

  function _txt(s) { return utf8(String(s == null ? '' : s)); }

  /* Nombres internos ASCII, legibles y únicos por prefijo numérico. */
  function sanearNombre(s) {
    var limpio = String(s == null ? '' : s)
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^A-Za-z0-9._-]+/g, '_')
      .replace(/^_+|_+$/g, '');
    if (!limpio) limpio = 'sin-nombre';
    if (limpio.length > 60) limpio = limpio.slice(0, 60);
    return limpio;
  }

  function _estadoDe(p) { return p && p.ok ? 'OK' : 'ERROR'; }

  function _lineaContexto(ctx) {
    ctx = ctx || {};
    return [
      '  mercado: ' + (ctx.market || ''),
      '  región: ' + (ctx.region || ''),
      '  concepto: ' + (ctx.concept || ctx.concepto || ''),
      '  mensaje: ' + (ctx.message || ctx.mensaje || ''),
      '  serie: ' + (ctx.serie || '')
    ].join('\n');
  }

  function _construirArchivos(lote) {
    var archivos = [];
    var ctx = lote.ctx || {};
    var productos = Array.isArray(lote.productos) ? lote.productos : [];

    var info = [
      '=== LOTE MULTIPRODUCTO ===',
      'ID: ' + (lote.id || '(sin id)'),
      'Fecha: ' + (lote.createdAt || ''),
      'Resultado global: ' + (lote.ok ? 'COMPLETO' : 'PARCIAL'),
      'Productos: ' + productos.length,
      'Errores: ' + (lote.errores != null ? lote.errores : productos.filter(function (p) { return !(p || {}).ok; }).length),
      '',
      'CONTEXTO:',
      _lineaContexto(ctx),
      '',
      'Generado con Taller POD · exportación multiproducto (etapa 5)'
    ].join('\n');
    archivos.push({ nombre: '00_LOTE.txt', contenido: info });

    productos.forEach(function (p, i) {
      p = p || {};
      var estado = _estadoDe(p);
      var numero = String(i + 1).padStart(2, '0');
      var nombre = numero + '_' + sanearNombre(p.producto || ('producto-' + numero)) + '_' + estado + '.txt';
      var cuerpo = [
        '=== PRODUCTO: ' + (p.producto || '(sin nombre)') + ' · ESTADO: ' + estado + ' ===',
        'MERCADO: ' + ((p.context && p.context.market) || ctx.market || ''),
        'REGIÓN: ' + ((p.context && p.context.region) || ctx.region || ''),
        'FECHA DEL LOTE: ' + (lote.createdAt || ''),
        '',
        '--- CONTEXTO DEL RESULTADO ---',
        p.context ? JSON.stringify(p.context) : '(sin contexto)',
        ''
      ];
      if (estado === 'ERROR') cuerpo.push('--- ERROR ---', String(p.error || 'error no especificado'), '');
      else cuerpo.push('--- PROMPT ---', p.prompt || '(prompt vacío)', '');
      archivos.push({ nombre: nombre, contenido: cuerpo.join('\n') });
    });

    var resumen = ['=== RESUMEN DEL LOTE ===', 'Lote: ' + (lote.id || '(sin id)') + ' · ' + (lote.createdAt || '')];
    resumen.push('Resultado global: ' + (lote.ok ? 'COMPLETO' : 'PARCIAL'));
    resumen.push('');
    resumen.push('Producto | Estado | Caracteres de prompt | Error');
    productos.forEach(function (p) {
      p = p || {};
      var prompt = typeof p.prompt === 'string' ? p.prompt : '';
      resumen.push((p.producto || '(sin nombre)') + ' | ' + _estadoDe(p) + ' | ' +
        prompt.length + ' | ' + (p.error ? String(p.error) : '-'));
    });
    archivos.push({ nombre: '99_RESUMEN.txt', contenido: resumen.join('\n') });

    return archivos.map(function (a) {
      var bytes = _txt(a.contenido);
      return { nombre: a.nombre, bytes: bytes, crc: crc32(bytes) };
    });
  }

  function _zipStore(entradas) {
    var partes = [];
    var central = [];
    var offset = 0;

    entradas.forEach(function (e) {
      var nombre = utf8(e.nombre);
      var local = new Uint8Array(30 + nombre.length);
      var lv = new DataView(local.buffer);
      lv.setUint32(0, 0x04034b50, true);
      lv.setUint16(4, 20, true);
      lv.setUint16(6, FLAG_UTF8, true);
      lv.setUint16(8, 0, true);
      lv.setUint16(10, DOS_TIME, true);
      lv.setUint16(12, DOS_DATE, true);
      lv.setUint32(14, e.crc, true);
      lv.setUint32(18, e.bytes.length, true);
      lv.setUint32(22, e.bytes.length, true);
      lv.setUint16(26, nombre.length, true);
      lv.setUint16(28, 0, true);
      local.set(nombre, 30);
      partes.push(local, e.bytes);
      central.push({ nombre: nombre, crc: e.crc, size: e.bytes.length, offset: offset });
      offset += local.length + e.bytes.length;
    });

    var cdPartes = [];
    central.forEach(function (c) {
      var h = new Uint8Array(46 + c.nombre.length);
      var cv = new DataView(h.buffer);
      cv.setUint32(0, 0x02014b50, true);
      cv.setUint16(4, 20, true);
      cv.setUint16(6, 20, true);
      cv.setUint16(8, FLAG_UTF8, true);
      cv.setUint16(10, 0, true);
      cv.setUint16(12, DOS_TIME, true);
      cv.setUint16(14, DOS_DATE, true);
      cv.setUint32(16, c.crc, true);
      cv.setUint32(20, c.size, true);
      cv.setUint32(24, c.size, true);
      cv.setUint16(28, c.nombre.length, true);
      cv.setUint16(30, 0, true);
      cv.setUint16(32, 0, true);
      cv.setUint16(34, 0, true);
      cv.setUint16(36, 0, true);
      cv.setUint16(38, 0, true);
      cv.setUint32(42, c.offset, true);
      h.set(c.nombre, 46);
      cdPartes.push(h);
    });

    var cdBytes = _concat(cdPartes);
    var eocd = new Uint8Array(22);
    var ev = new DataView(eocd.buffer);
    ev.setUint32(0, 0x06054b50, true);
    ev.setUint16(4, 0, true);
    ev.setUint16(6, 0, true);
    ev.setUint16(8, entradas.length, true);
    ev.setUint16(10, entradas.length, true);
    ev.setUint32(12, cdBytes.length, true);
    ev.setUint32(16, offset, true);
    ev.setUint16(20, 0, true);

    return _concat(partes.concat([cdBytes, eocd]));
  }

  /* Genera el ZIP de un lote (solo lectura; no toca el historial). */
  function generarZip(lote, opciones) {
    opciones = opciones || {};
    lote = lote || {};
    if (!Array.isArray(lote.productos)) return { ok: false, error: 'el lote debe traer un array "productos"' };
    var archivos = _construirArchivos(lote);
    var nombres = archivos.map(function (a) { return a.nombre; });
    var duplicados = nombres.filter(function (n, i) { return nombres.indexOf(n) !== i; });
    if (duplicados.length) return { ok: false, error: 'nombres duplicados en el ZIP' };
    var bytes = _zipStore(archivos);
    var id = sanearNombre(lote.id || Date.now());
    var nombreZip = 'lote-multiproducto-' + id + '.zip';
    var out = {
      ok: true,
      bytes: bytes,
      nombre: opciones.nombre || nombreZip,
      tamano: bytes.length,
      archivos: nombres,
      crc: archivos.map(function (a) { return { nombre: a.nombre, crc: a.crc }; })
    };
    if (opciones.blob !== false && typeof Blob !== 'undefined') {
      try { out.blob = new Blob([bytes], { type: 'application/zip' }); } catch (e) {}
    }
    return out;
  }

  /* Descarga en el navegador (Blob + objectURL). No hace nada fuera de un DOM. */
  function descargarZip(lote, opciones) {
    var res = generarZip(lote, opciones || {});
    if (!res.ok) return res;
    try {
      var url = URL.createObjectURL(res.blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = res.nombre;
      document.body.appendChild(a);
      a.click();
      setTimeout(function () { URL.revokeObjectURL(url); a.remove(); }, 1500);
      return { ok: true, nombre: res.nombre, tamano: res.tamano };
    } catch (e) {
      return { ok: false, error: String((e && e.message) || e) };
    }
  }

  window.MultiproductoZip = {
    generarZip: generarZip,
    descargarZip: descargarZip,
    crc32: crc32,
    sanearNombre: sanearNombre
  };
})();
