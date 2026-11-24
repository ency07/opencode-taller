/* ============================================================================
 * HARNESS DE VERIFICACIÓN — POC MULTIPRODUCTO (CAMISETA SOFT / DISPLATE)
 * Autorización: "AUTORIZACIÓN CONTROLADA — POC MULTIPRODUCTO" (2026-11-23).
 * Se ejecuta DENTRO de la página (http://127.0.0.1:8080/) con el motor ya
 * cargado. No modifica el motor ni sus contratos: solo observa y ejerce la API
 * window.OrquestadorMultiProducto.
 *
 * Uso:
 *   const src = await (await fetch('<esta ruta>')).text();
 *   (0, eval)(src);
 *   const resumen = await window.__POC__.runTodo();      // JSON con 10 pruebas
 *   window.__POC__.prompts['CAMISETA SOFT']              // prompt completo
 * ========================================================================== */
(function () {
  'use strict';

  var PRODUCTOS = ['CAMISETA SOFT', 'DISPLATE'];

  var CTX = {
    concepto: 'farolito de papel iluminando la noche',
    mensaje: 'Que tu luz alumbre el camino',
    apoyo: '',
    serie: 'POC-AISLAMIENTO-2026-11',
    market: 'colombia',
    region: 'global',
    language: 'es',
    marketplace: 'generic',
    subniche: 'auto',
    audienceSet: 'Auto',
    audienceMulti: 'no',
    aestheticPreference: 'auto',
    dominio: 'auto',
    domImagen: 'Auto',
    workflowMode: 'explore',
    decisionMode: 'assisted',
    printMethod: 'auto',
    capApplication: 'auto',
    stampSide: 'auto',
    creativeTerritory: 'auto',
    visualIdentity: null,
    brand: 'auto'
  };

  var DOM_IDS = ['product', 'brand', 'language', 'marketplace', 'subniche', 'serie',
    'concept', 'message', 'support', 'audienceSet', 'audienceMulti', 'aestheticPreference',
    'dominio', 'domImagen', 'workflowMode', 'repeatType', 'simboloVar', 'textosVar',
    'paletaVar', 'essence', 'capApplication', 'stampSide', 'printMethod', 'creativeTerritory',
    'visualIdentity', 'decisionMode', 'market', 'region'];

  function dom(id) { var e = document.getElementById(id); return e ? String(e.value) : null; }

  function deep(v) {
    if (v === null || typeof v !== 'object') return v;
    try { return JSON.parse(JSON.stringify(v)); } catch (e) { return String(v); }
  }

  function hash32(s) {
    var h = 0x811c9dc5;
    for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
    return ('00000000' + h.toString(16)).slice(-8);
  }

  /* Estado observable del pipeline: motor + DOM + contexto de resultado +
     locks activos + memoria local. Es lo que el orquestador promete restaurar. */
  function snapshot() {
    var ms = {};
    Object.keys(MOTOR_STATE).forEach(function (k) { ms[k] = deep(MOTOR_STATE[k]); });
    var d = {};
    DOM_IDS.forEach(function (id) { d[id] = dom(id); });
    var s = {
      motor: ms,
      dom: d,
      lastResult: LAST_RESULT ? { context: deep(LAST_RESULT.context), passed: !!LAST_RESULT.passed } : null,
      activeGenLocks: (typeof window._ACTIVE_GEN_LOCKS === 'undefined') ? null : window._ACTIVE_GEN_LOCKS,
      genLockWarnings: (typeof window._GEN_LOCK_WARNINGS === 'undefined') ? null : deep(window._GEN_LOCK_WARNINGS),
      ls: (function () {
        var o = {};
        Object.keys(localStorage).forEach(function (k) {
          if (k.indexOf('POD2|') !== 0) return;
          var v = localStorage.getItem(k) || '';
          o[k] = v.length > 4000 ? v.slice(0, 4000) + '…TRUNCADO' : v;
        });
        return o;
      })()
    };
    s.lsKeys = Object.keys(s.ls).sort();
    return s;
  }

  function diffClaves(antes, despues) {
    var a = {}, b = {};
    (antes || []).forEach(function (k) { a[k] = 1; });
    (despues || []).forEach(function (k) { b[k] = 1; });
    var out = {};
    Object.keys(b).forEach(function (k) { if (!(k in a)) out[k] = 'NUEVA'; });
    Object.keys(a).forEach(function (k) { if (!(k in b)) out[k] = 'ELIMINADA'; });
    return out;
  }

  function diffMotor(a, b) {
    var out = [];
    var keys = {};
    Object.keys(a).forEach(function (k) { keys[k] = 1; });
    Object.keys(b).forEach(function (k) { keys[k] = 1; });
    Object.keys(keys).forEach(function (k) {
      var va = JSON.stringify(a[k] === undefined ? null : a[k]);
      var vb = JSON.stringify(b[k] === undefined ? null : b[k]);
      if (va !== vb) out.push(k);
    });
    return out.sort();
  }

  function firmaSet(set) {
    return ['A', 'B', 'C'].map(function (k) {
      var f = set[k] || {};
      return [f.estilo, f.jerarquizacionVisual || f.jerarquiaVisual, f.tratamiento, f.layout].join(' · ');
    });
  }

  function conceptMsgDe(prompt) {
    var linea = '';
    prompt.split('\n').forEach(function (l) { if (!linea && l.indexOf('CONCEPTO:') === 0) linea = l; });
    var im = linea.indexOf('| MENSAJE');
    var c = im >= 0 ? linea.slice(0, im) : linea;
    var m = im >= 0 ? linea.slice(im + 2) : '';
    return {
      concepto: c.replace(/^CONCEPTO:\s*/, '').trim(),
      mensaje: m.replace(/^MENSAJE(?:\sEXACTO)?:\s*/, '').trim()
    };
  }

  function reglas(producto) {
    return {
      productRule: (typeof _PRODUCT_RULES !== 'undefined' && _PRODUCT_RULES[producto]) || '',
      placement: (typeof PLACEMENT !== 'undefined' && PLACEMENT[producto]) || '',
      mockup: (typeof PRODUCT_MOCKUP_RULES !== 'undefined' && PRODUCT_MOCKUP_RULES[producto]) || ''
    };
  }

  function chk(lista, id, nombre, ok, detalle) {
    lista.push({ id: id, nombre: nombre, ok: !!ok, detalle: detalle || null });
    return !!ok;
  }

  async function runTodo() {
    var pruebas = [];
    var avisos = [];
    var t0 = Date.now();
    var api = window.OrquestadorMultiProducto;
    if (!api) { return JSON.stringify({ error: 'OrquestadorMultiProducto no cargado' }); }

    var antes = snapshot();

    /* --- Ejecución principal: un mismo concepto/mensaje para ambos productos */
    var rCamiseta = null, rDisplate = null, dtA = 0, dtB = 0;
    try {
      var t = Date.now();
      rCamiseta = api.generarProducto(Object.assign({}, CTX, { producto: 'CAMISETA SOFT' }));
      dtA = Date.now() - t;
      window.__POC__.ultimos.push(rCamiseta);
      t = Date.now();
      rDisplate = api.generarProducto(Object.assign({}, CTX, { producto: 'DISPLATE' }));
      dtB = Date.now() - t;
      window.__POC__.ultimos.push(rDisplate);
    } catch (e) {
      return JSON.stringify({ error: 'la ejecución principal lanzó: ' + String((e && e.message) || e) });
    }

    var pA = rCamiseta.prompt || '', pB = rDisplate.prompt || '';
    window.__POC__.prompts['CAMISETA SOFT'] = pA;
    window.__POC__.prompts['DISPLATE'] = pB;

    /* P1 — mismo concepto y mensaje en ambos productos */
    var cmA = conceptMsgDe(pA), cmB = conceptMsgDe(pB);
    chk(pruebas, 'P1', 'Mismo concepto y mensaje para ambos productos',
      !!(cmA.concepto && cmA.mensaje && cmA.concepto === CTX.concepto && cmA.mensaje === CTX.mensaje &&
         cmB.concepto === cmA.concepto && cmB.mensaje === cmA.mensaje),
      { camiseta: cmA, displate: cmB, esperado: { concepto: CTX.concepto, mensaje: CTX.mensaje } });

    /* P2 — set A/B/C independiente por producto */
    var fA = rCamiseta.result && rCamiseta.result.set ? firmaSet(rCamiseta.result.set) : [];
    var fB = rDisplate.result && rDisplate.result.set ? firmaSet(rDisplate.result.set) : [];
    var identicos = fA.length === 3 && fB.length === 3 && fA.every(function (f, i) { return f === fB[i]; });
    var diversosA = fA.length === 3 && new Set(fA).size >= 2;
    var diversosB = fB.length === 3 && new Set(fB).size >= 2;
    chk(pruebas, 'P2', 'Set A/B/C independiente para cada producto',
      !!(fA.length === 3 && fB.length === 3 && !identicos && diversosA && diversosB),
      { camiseta: fA, displate: fB, ternasIdenticas: identicos });

    /* P3 — reglas textiles presentes en CAMISETA SOFT */
    var regA = reglas('CAMISETA SOFT');
    chk(pruebas, 'P3', 'Reglas textiles presentes en CAMISETA SOFT',
      !!(pA.indexOf(regA.productRule) >= 0 && pA.indexOf(regA.placement) >= 0 && /costuras laterales/i.test(pA)),
      { productRulePresente: pA.indexOf(regA.productRule) >= 0, placementPresente: pA.indexOf(regA.placement) >= 0, costuras: /costuras laterales/i.test(pA) });

    /* P4 — reglas de arte mural presentes en DISPLATE */
    var regB = reglas('DISPLATE');
    chk(pruebas, 'P4', 'Reglas de arte mural presentes en DISPLATE',
      !!(pB.indexOf(regB.productRule) >= 0 && /obra mural premium/i.test(pB) &&
         /margen de seguridad mínimo del 5%/i.test(pB) && /placa mural metálica/i.test(pB)),
      { productRulePresente: pB.indexOf(regB.productRule) >= 0, obraMural: /obra mural premium/i.test(pB), margen5: /margen de seguridad mínimo del 5%/i.test(pB), mockupMetal: /placa mural metálica/i.test(pB) });

    /* P5 — ausencia de instrucciones textiles en DISPLATE */
    var camisetaRuleEnB = pB.indexOf(regA.productRule) >= 0;
    var pechoEnB = /pecho centrado medio/i.test(pB);
    var costurasEnB = /costuras laterales/i.test(pB);
    chk(pruebas, 'P5', 'Ausencia de instrucciones textiles en DISPLATE',
      !(camisetaRuleEnB || pechoEnB || costurasEnB),
      { reglaCamisetaPresente: camisetaRuleEnB, pechoCentrado: pechoEnB, costuras: costurasEnB, negacionExplícita: /NO es una camiseta ni un estampado textil/i.test(pB) });

    /* P6 — aislamiento de locks y memorias */
    var despues = snapshot();
    var locksLimpios = despues.activeGenLocks === null;
    var warnIgual = JSON.stringify(antes.genLockWarnings) === JSON.stringify(despues.genLockWarnings);
    var clavesNuevas = diffClaves(antes.lsKeys, despues.lsKeys);
    var modificadas = Object.keys(despues.ls).filter(function (k) {
      return (k in antes.ls) && antes.ls[k] !== despues.ls[k];
    });
    var mezcla = [];
    Object.keys(clavesNuevas).concat(modificadas).forEach(function (k) {
      var v = localStorage.getItem(k) || '';
      PRODUCTOS.forEach(function (p) {
        if (k.indexOf(p) >= 0) {
          PRODUCTOS.forEach(function (q) {
            if (q !== p && v.indexOf(q) >= 0) mezcla.push({ clave: k, productoEsperado: p, contiene: q });
          });
        } else if (v.indexOf(p) >= 0) {
          mezcla.push({ clave: k, productoEsperado: '(sin producto en la clave)', contiene: p });
        }
      });
    });
    var memoriaPorProducto = PRODUCTOS.map(function (p) {
      return {
        producto: p,
        clavesTotales: despues.lsKeys.filter(function (k) { return k.indexOf(p) >= 0; }).length,
        clavesNuevas: Object.keys(clavesNuevas).filter(function (k) { return k.indexOf(p) >= 0; }).length
      };
    });
    chk(pruebas, 'P6', 'Ausencia de contaminación entre locks y memorias',
      !!(locksLimpios && warnIgual && mezcla.length === 0),
      {
        locksActivosNulos: locksLimpios,
        avisosLocksSinCambio: warnIgual,
        clavesMemoriaNuevas: clavesNuevas,
        clavesMemoriaModificadas: modificadas,
        mezclaDetectada: mezcla,
        memoriaPorProducto: memoriaPorProducto
      });

    /* P7 — restauración completa del estado original */
    var motorDiff = diffMotor(antes.motor, despues.motor);
    var domDiff = [];
    DOM_IDS.forEach(function (id) { if (antes.dom[id] !== despues.dom[id]) domDiff.push(id); });
    var lastIgual = JSON.stringify(antes.lastResult) === JSON.stringify(despues.lastResult);
    chk(pruebas, 'P7', 'Restauración completa del estado original',
      !!(motorDiff.length === 0 && domDiff.length === 0 && lastIgual),
      { motorDifiereEn: motorDiff, domDifiereEn: domDiff, lastResultIgual: lastIgual });
    if (motorDiff.indexOf('_generationCounter') >= 0 || motorDiff.indexOf('_rerollNonce') >= 0) {
      avisos.push('Los contadores internos (_generationCounter/_rerollNonce) avanzan por diseño: el motor los usa para no repetir nonce entre generaciones. No son contexto de producto.');
    }

    /* P8 — recuperación independiente de ambos resultados */
    var ctxA = rCamiseta.result && rCamiseta.result.context;
    var ctxB = rDisplate.result && rDisplate.result.context;
    chk(pruebas, 'P8', 'Recuperación independiente de ambos resultados',
      !!(rCamiseta.ok && rDisplate.ok && ctxA && ctxB &&
         ctxA.product === 'CAMISETA SOFT' && ctxB.product === 'DISPLATE' &&
         window.__POC__.ultimos.length === 2),
      { camiseta: ctxA, displate: ctxB, resultadosGuardados: window.__POC__.ultimos.length });

    /* P9 — fallo de un producto sin pérdida del otro */
    var originalGenerateSet = window.generateSet;
    var p9 = { inyectado: false };
    try {
      window.generateSet = function () {
        if (MOTOR_STATE.product === 'DISPLATE') throw new Error('FALLO_INYECTADO_POC');
        return originalGenerateSet.apply(this, arguments);
      };
      var res = api.generarAislado(Object.assign({}, CTX, { productos: PRODUCTOS }));
      p9 = {
        inyectado: true,
        estadoOk: res.ok === false,
        camisetaOk: !!(res.resultados[0] && res.resultados[0].ok && res.resultados[0].prompt),
        displateFallo: !!(res.resultados[1] && res.resultados[1].ok === false && /FALLO_INYECTADO_POC/.test(res.resultados[1].error || '')),
        locksPostFallo: snapshot().activeGenLocks === null,
        errorReportado: res.resultados[1] ? res.resultados[1].error : null
      };
    } finally {
      window.generateSet = originalGenerateSet;
    }
    chk(pruebas, 'P9', 'Fallo de un producto sin pérdida del resultado del otro',
      !!(p9.inyectado && p9.estadoOk && p9.camisetaOk && p9.displateFallo && p9.locksPostFallo), p9);

    /* P10 — regeneración de un producto sin modificar el otro */
    var r1 = api.generarProducto(Object.assign({}, CTX, { producto: 'CAMISETA SOFT' }));
    var prompt1 = r1.prompt || '';
    var hash1 = hash32(prompt1);
    var rD = api.generarProducto(Object.assign({}, CTX, { producto: 'DISPLATE' }));
    var r2 = api.generarProducto(Object.assign({}, CTX, { producto: 'CAMISETA SOFT' }));
    var prompt2 = r2.prompt || '';
    var muralEnCamiseta2 = /obra mural premium|margen de seguridad mínimo del 5%|placa mural metálica/i.test(prompt2);
    chk(pruebas, 'P10', 'Regeneración de un producto sin modificar el otro',
      !!(r1.ok && rD.ok && r2.ok && hash1 === hash32(prompt1) && r2.result.context.product === 'CAMISETA SOFT' && !muralEnCamiseta2),
      {
        camiseta1Hash: hash1, camiseta1Len: prompt1.length,
        displateOk: !!rD.ok, displateHash: hash32(rD.prompt || ''),
        camiseta2Hash: hash32(prompt2), camiseta2Len: prompt2.length,
        regeneradaDistinta: hash1 !== hash32(prompt2),
        registroMuralEnCamiseta: muralEnCamiseta2
      });

    var despuesFinal = snapshot();
    var resumen = {
      fecha: new Date().toISOString(),
      url: location.href,
      orquestador: Object.keys(api),
      contexto: CTX,
      duracionMs: Date.now() - t0,
      prompts: {
        'CAMISETA SOFT': { len: pA.length, hash: hash32(pA) },
        'DISPLATE': { len: pB.length, hash: hash32(pB) }
      },
      rendimientoMs: { camiseta: dtA, displate: dtB },
      pruebas: pruebas,
      estadoOriginal: {
        product: antes.motor.product,
        lastResult: antes.lastResult,
        clavesMemoria: antes.lsKeys.length
      },
      restauracionFinal: {
        motorDifiereEn: diffMotor(antes.motor, despuesFinal.motor),
        domDifiereEn: DOM_IDS.filter(function (id) { return antes.dom[id] !== despuesFinal.dom[id]; }),
        lastResultIgual: JSON.stringify(antes.lastResult) === JSON.stringify(despuesFinal.lastResult),
        locksNulos: despuesFinal.activeGenLocks === null,
        clavesMemoriaAntes: antes.lsKeys.length,
        clavesMemoriaDespues: despuesFinal.lsKeys.length
      },
      avisos: avisos,
      totalOk: pruebas.filter(function (p) { return p.ok; }).length,
      totalPruebas: pruebas.length
    };
    window.__POC__.resumen = resumen;
    return JSON.stringify(resumen);
  }

  window.__POC__ = { ctx: CTX, productos: PRODUCTOS, prompts: {}, ultimos: [], resumen: null, runTodo: runTodo };
})();
