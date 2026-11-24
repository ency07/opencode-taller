/* Etapa 3 (multiproducto): núcleo para los 10 productos.
   Valida que generarMuchos() produce prompts independientes y con el contrato
   específico de cada producto, en secuencial y con progreso ordenado. */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.join(__dirname, '..');

/* --- DOM mínimo con selects reales (permite readStateFromDOM/syncContext) --- */
const elems = {};
function el(id, value, options) {
  if (!elems[id]) {
    elems[id] = {
      id: id,
      value: value == null ? '' : value,
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

const ORQUESTADOR_JS = fs.readFileSync(path.join(js, 'orquestador-multiproducto.js'), 'utf8');

const CTX = {
  market: 'colombia', region: 'global', language: 'es', marketplace: 'generic',
  subniche: 'auto', audienceSet: 'Auto', audienceMulti: 'no', aestheticPreference: 'auto',
  dominio: 'auto', domImagen: 'Auto', workflowMode: 'explore', decisionMode: 'assisted',
  printMethod: 'auto', capApplication: 'auto', stampSide: 'auto', creativeTerritory: 'auto',
  visualIdentity: null, brand: 'auto',
  concepto: 'farolito de papel iluminando la noche',
  mensaje: 'Que tu luz alumbre el camino',
  apoyo: '', serie: 'ETAPA3', allowAutoCopy: true, fmtDense: true
};

/* La ampliación no debe duplicar el pipeline creativo. */
ok(typeof window.OrquestadorMultiProducto.generarMuchos === 'function', 'generarMuchos está disponible');
['generarProducto', 'generar', 'generarAislado', 'generarMuchos'].forEach(nombre => {
  ok(typeof window.OrquestadorMultiProducto[nombre] === 'function', 'API existente conservada: ' + nombre);
});
ok(ORQUESTADOR_JS.indexOf('function buildCandidate') === -1, 'el orquestador no duplica buildCandidate');
ok(ORQUESTADOR_JS.indexOf('function evaluaSetOk') === -1, 'el orquestador no duplica evaluaSetOk');
ok(ORQUESTADOR_JS.indexOf('function formatPrompt') === -1, 'el orquestador no duplica formatPrompt');

/* --- Generación de los 10 productos en una sola operación --- */
const progreso = [];
const t0 = Date.now();
const out = window.OrquestadorMultiProducto.generarMuchos(Object.assign({}, CTX, {
  productos: PRODUCTOS.slice(),
  onProgreso: function (p) { progreso.push(p); }
}));
const duracionMs = Date.now() - t0;

ok(out && out.total === 10, 'el lote procesa 10 productos');
ok(Array.isArray(out.resultados) && out.resultados.length === 10, 'devuelve 10 resultados');
ok(progreso.length === 10, 'onProgreso se invoca una vez por producto');
ok(progreso.every((p, i) => p.indice === i), 'procesamiento secuencial: índices en orden 0..9');
ok(progreso.every(p => p.total === 10), 'cada callback informa el total correcto');
ok(progreso.map(p => p.producto).join('|') === PRODUCTOS.join('|'), 'orden de productos respetado');

out.resultados.forEach(r => {
  ok(!!r.ok, r.producto + ': generación correcta');
  ok(!!r.prompt && r.prompt.length > 1000, r.producto + ': prompt no vacío');
  ok(r.result && r.result.context && r.result.context.product === r.producto,
    r.producto + ': contexto de resultado con el producto correcto');
  ok(['A', 'B', 'C'].every(k => r.result.set[k] && r.result.set[k].estilo),
    r.producto + ': set A/B/C completo');
});

/* Contrato y prompt específico por producto */
PRODUCTOS.forEach(p => {
  const r = out.resultados.filter(x => x.producto === p)[0];
  const prompt = r.prompt;
  ok(prompt.indexOf('PRODUCTO / UBICACION / ESCALA') !== -1, p + ': ubicación/escala');
  ok(prompt.indexOf(String(PRODUCT_RULES[p] || '')) !== -1, p + ': regla de producto específica');
  ok(prompt.indexOf(String(PLACEMENT[p] || '')) !== -1, p + ': placement específico');
  ok(prompt.indexOf('REGLAS DEL MOCKUP COMERCIAL') !== -1, p + ': bloque de mockup');
  ok(prompt.indexOf('ACABADO / PREPARACION TECNICA') !== -1, p + ': preparación técnica');
  const surface = getProductSurface(p);
  if (surface !== 'prenda') {
    ok(!/el modelo que lleva la prenda/.test(prompt), p + ': sin lenguaje textil impropio');
    ok(!/camiseta de corte y talla/.test(prompt), p + ': sin instrucción textil impropia');
  }
  if (p === 'DISPLATE') {
    ok(/placa mural metálica/.test(prompt), 'DISPLATE: presentación en pared');
    ok(/margen de seguridad mínimo del 5%/.test(prompt), 'DISPLATE: margen 5%');
  }
});

if (failures.length) {
  console.error('FAIL multiproducto-contratos (' + duracionMs + ' ms)');
  failures.forEach(f => console.error(' - ' + f));
  process.exit(1);
}
console.log('PASS multiproducto-contratos: ' + checks + ' aserciones, 0 fallos (' + duracionMs + ' ms, 10 productos)');
