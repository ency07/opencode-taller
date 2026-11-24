/* Etapa 3 (multiproducto): aislamiento, restauración, fallo individual,
   regeneración individual y compatibilidad con las API de la POC. */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.join(__dirname, '..');

const elems = {};
function el(id, value, options) {
  if (!elems[id]) {
    elems[id] = {
      id: id, value: value == null ? '' : value,
      options: options ? options.map(v => ({ value: v })) : null,
      dataset: {}, style: {},
      addEventListener() {}, removeEventListener() {}, appendChild() {},
      setAttribute() {}, focus() {}, blur() {}, click() {}
    };
  }
  return elems[id];
}
const PRODUCTOS = ['CAMISETA SOFT', 'CAMISETA APPAREL', 'HOODIE', 'GORRA', 'MUG',
  'MOCHILA', 'TOTE BAG', 'FUNDA MÓVIL', 'ILUSTRACION PREMIUM APPAREL', 'DISPLATE'];
el('product', 'CAMISETA SOFT', PRODUCTOS);
el('market', 'colombia', ['colombia', 'global_en', 'global_es']);
el('region', 'global', ['global', 'todas']);
el('brand', 'auto', ['auto', 'BERESHITH_CO', 'CrossLampCo']);
el('language', 'es', ['es', 'en']);
el('marketplace', 'generic', ['generic']);
el('subniche', 'auto', ['auto']);
el('audienceSet', 'Auto', ['Auto']);
el('audienceMulti', 'no', ['no', 'si']);
el('workflowMode', 'explore', ['explore', 'new']);
el('decisionMode', 'assisted', ['assisted', 'manual']);
el('printMethod', 'auto', ['auto', 'dtf', 'sublimacion']);
el('capApplication', 'auto', ['auto', 'bordado', 'parche', 'impresion']);
el('stampSide', 'auto', ['auto']);
el('dominio', 'auto', ['auto']);
el('domImagen', 'Auto', ['Auto']);

global.window = global;
global.document = {
  getElementById: id => elems[id] || null,
  querySelectorAll: () => [],
  createElement: () => ({ style: {}, appendChild() {}, setAttribute() {} })
};

const js = path.join(root, 'js');
[
  'data-mercados.js', 'data-audiencias.js', 'data-bancos.js',
  'banco-gospel-es.js', 'banco-gospel-en.js', 'banco-global.js',
  'dominios.js', 'data-estilos.js', 'data-territorios.js',
  'data-productos.js', 'memoria-local.js', 'diversidad-saturacion.js',
  'inteligencia-mercado.js', 'motor-nucleo.js', 'orquestador-multiproducto.js'
].forEach(file => {
  const full = path.join(js, file);
  if (fs.existsSync(full)) vm.runInThisContext(fs.readFileSync(full, 'utf8'), { filename: file });
});

let checks = 0;
const failures = [];
function ok(cond, msg) { checks++; if (!cond) failures.push(msg); }

const CTX = {
  market: 'colombia', region: 'global', language: 'es', marketplace: 'generic',
  subniche: 'auto', audienceSet: 'Auto', audienceMulti: 'no', aestheticPreference: 'auto',
  dominio: 'auto', domImagen: 'Auto', workflowMode: 'explore', decisionMode: 'assisted',
  printMethod: 'auto', capApplication: 'auto', stampSide: 'auto', creativeTerritory: 'auto',
  visualIdentity: null, brand: 'auto',
  concepto: 'farolito de papel iluminando la noche',
  mensaje: 'Que tu luz alumbre el camino',
  apoyo: '', serie: 'ETAPA3-AISLAMIENTO', allowAutoCopy: true, fmtDense: true
};

function snapEstado() {
  const dom = {};
  ['product', 'market', 'region', 'subniche', 'serie', 'concept', 'message',
    'support', 'audienceSet', 'workflowMode', 'decisionMode', 'brand'].forEach(function (id) {
    const e = document.getElementById(id);
    dom[id] = e ? String(e.value) : null;
  });
  return JSON.stringify({
    motor: MOTOR_STATE,
    dom: dom,
    last: LAST_RESULT === null ? null : { ctx: LAST_RESULT.context, passed: !!LAST_RESULT.passed },
    locks: (typeof _ACTIVE_GEN_LOCKS !== 'undefined') ? _ACTIVE_GEN_LOCKS : null,
    warnings: window._GEN_LOCK_WARNINGS === undefined ? null : window._GEN_LOCK_WARNINGS
  });
}

function clavesMemoriaConProducto() {
  const obj = exportMemoryObject();
  return Object.keys(obj).filter(k => /POD2\|/.test(k));
}

/* --- 1) Lote con fallo inyectado en un producto --- */
const antes = snapEstado();
const memoriaAntes = clavesMemoriaConProducto().sort().join('|');
const originalGenerateSet = window.generateSet;
let progreso = [];
window.generateSet = function () {
  if (MOTOR_STATE.product === 'MUG') throw new Error('FALLO_INYECTADO_ETAPA3');
  return originalGenerateSet.apply(this, arguments);
};
let out;
try {
  out = window.OrquestadorMultiProducto.generarMuchos(Object.assign({}, CTX, {
    productos: PRODUCTOS.slice(),
    onProgreso: function (p) { progreso.push(p); }
  }));
} finally {
  window.generateSet = originalGenerateSet;
}
const despues = snapEstado();

ok(out && out.total === 10, 'lote de 10 productos procesado');
ok(progreso.length === 10, 'onProgreso se invoca también para el producto que falla');
ok(progreso.every((p, i) => p.indice === i), 'progreso secuencial incluso con fallo');
const exitosos = out.resultados.filter(r => r.ok);
const fallidos = out.resultados.filter(r => !r.ok);
ok(exitosos.length === 9, 'fallo individual: 9 productos conservados (' + exitosos.length + ')');
ok(fallidos.length === 1 && fallidos[0].producto === 'MUG', 'fallo individual: MUG identificado');
ok(/FALLO_INYECTADO_ETAPA3/.test(String(fallidos[0].error || '')), 'fallo individual: error reportado');
exitosos.forEach(r => {
  ok(!!r.prompt, r.producto + ': resultado conservado tras el fallo de otro');
  ok(r.result && r.result.context && r.result.context.product === r.producto,
    r.producto + ': contexto propio');
});

/* --- 2) Restauración completa del estado global --- */
ok(despues === antes, 'estado global restaurado tras el lote (motor+DOM+LAST_RESULT+locks)');
ok((typeof _ACTIVE_GEN_LOCKS === 'undefined' ? null : _ACTIVE_GEN_LOCKS) === null, 'sin locks de generación activos');

/* --- 3) Memoria: claves por producto y sin mezclas --- */
const memoriaDespues = clavesMemoriaConProducto();
const nuevas = memoriaDespues.filter(k => memoriaAntes.split('|').indexOf(k) === -1);
const mezcladas = [];
nuevas.forEach(k => {
  const menciona = PRODUCTOS.filter(p => k.indexOf(p) !== -1);
  if (menciona.length > 1) mezcladas.push(k);
});
ok(mezcladas.length === 0, 'memoria sin claves que mezclen productos (' + mezcladas.length + ')');
PRODUCTOS.filter(p => p !== 'MUG').forEach(p => {
  ok(memoriaDespues.some(k => k.indexOf(p) !== -1), 'memoria específica para ' + p);
});

/* --- 4) Regeneración individual sin alterar otros resultados --- */
const promptsAntes = {};
out.resultados.forEach(r => { promptsAntes[r.producto] = r.prompt; });
const contextosAntes = {};
out.resultados.forEach(r => { contextosAntes[r.producto] = r.result ? r.result.context.product : null; });
const regen = window.OrquestadorMultiProducto.generarProducto(Object.assign({}, CTX, { producto: 'MUG' }));
ok(regen.ok && !!regen.prompt, 'regeneración individual de MUG correcta');
ok(regen.result.context.product === 'MUG', 'regeneración individual: contexto MUG');
out.resultados.forEach(r => {
  ok(r.prompt === promptsAntes[r.producto], r.producto + ': prompt no alterado por la regeneración individual');
  ok((r.result ? r.result.context.product : null) === contextosAntes[r.producto],
    r.producto + ': contexto no alterado por la regeneración individual');
});

/* --- 5) Compatibilidad con las API de la POC --- */
ok(typeof window.OrquestadorMultiProducto.generarProducto === 'function', 'API generarProducto conservada');
const g1 = window.OrquestadorMultiProducto.generar({ producto: 'DISPLATE' }, CTX);
ok(Array.isArray(g1) && g1.length === 1 && g1[0].producto === 'DISPLATE', 'API generar(producto) conservada');
const g2 = window.OrquestadorMultiProducto.generarAislado(Object.assign({}, CTX, { productos: ['MUG', 'TOTE BAG'] }));
ok(g2.ok === true && Array.isArray(g2.resultados) && g2.resultados.length === 2, 'API generarAislado conservada');

/* --- 6) El generador de producto único sigue intacto --- */
const directo = generateSet();
ok(!!directo && !!directo.set && !!directo.set.A, 'generateSet directo (generador único) funciona');
ok(!!formatPrompt(directo), 'formatPrompt directo (generador único) funciona');

if (failures.length) {
  console.error('FAIL multiproducto-aislamiento');
  failures.forEach(f => console.error(' - ' + f));
  process.exit(1);
}
console.log('PASS multiproducto-aislamiento: ' + checks + ' aserciones, 0 fallos');
