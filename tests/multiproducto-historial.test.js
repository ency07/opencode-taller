/* Etapa 4 (multiproducto): historial local de lotes.
   Cubre guardar/recuperar, 10 productos con sus prompts, resultados parciales y
   errores, listado por fecha, eliminación, rotación por lotes y por presupuesto,
   cuota de LocalStorage agotada, separación de memorias y compatibilidad con
   GLOBAL_MEMORY_CLEAR_KEY (clearAllMemory). */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.join(__dirname, '..');

/* --- localStorage simulado con cuota opcional --- */
function crearLocalStorage(limiteBytes) {
  const datos = new Map();
  let usados = 0;
  const tam = s => Buffer.byteLength(String(s), 'utf8');
  return {
    getItem(k) { return datos.has(k) ? datos.get(k) : null; },
    setItem(k, v) {
      v = String(v);
      const nvo = tam(v);
      const prev = datos.get(k);
      const antiguo = prev === undefined ? 0 : tam(prev);
      if (limiteBytes && usados - antiguo + nvo > limiteBytes) {
        const e = new Error('QuotaExceededError');
        e.name = 'QuotaExceededError';
        throw e;
      }
      usados = usados - antiguo + nvo;
      datos.set(k, v);
    },
    removeItem(k) { const prev = datos.get(k); if (prev !== undefined) { usados -= tam(prev); datos.delete(k); } },
    key(i) { const ks = Array.from(datos.keys()); return i < ks.length ? ks[i] : null; },
    get length() { return datos.size; },
    _claves() { return Array.from(datos.keys()); },
    _usados() { return usados; }
  };
}

const LS = crearLocalStorage(null);

/* --- DOM mínimo con selects reales --- */
const elems = {};
function el(id, value, options) {
  if (!elems[id]) elems[id] = {
    id, value: value == null ? '' : value,
    options: options ? options.map(v => ({ value: v })) : null,
    dataset: {}, style: {},
    addEventListener() {}, removeEventListener() {}, appendChild() {},
    setAttribute() {}, focus() {}, blur() {}, click() {}
  };
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
global.localStorage = LS;
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
  'inteligencia-mercado.js', 'motor-nucleo.js', 'orquestador-multiproducto.js',
  'multiproducto-historial.js'
].forEach(file => {
  const full = path.join(js, file);
  if (fs.existsSync(full)) vm.runInThisContext(fs.readFileSync(full, 'utf8'), { filename: file });
});

let checks = 0;
const failures = [];
function ok(cond, msg) { checks++; if (!cond) failures.push(msg); }

const H = window.MultiproductoHistorial;
const CTX = {
  market: 'colombia', region: 'global', language: 'es', marketplace: 'generic',
  subniche: 'auto', audienceSet: 'Auto', audienceMulti: 'no', aestheticPreference: 'auto',
  dominio: 'auto', domImagen: 'Auto', workflowMode: 'explore', decisionMode: 'assisted',
  printMethod: 'auto', capApplication: 'auto', stampSide: 'auto', creativeTerritory: 'auto',
  visualIdentity: null, brand: 'auto',
  concepto: 'farolito de papel iluminando la noche',
  mensaje: 'Que tu luz alumbre el camino',
  apoyo: '', serie: 'ETAPA4-HISTORIAL'
};

ok(typeof H.guardarLote === 'function' && typeof H.cargarLote === 'function' &&
   typeof H.listarLotes === 'function' && typeof H.eliminarLote === 'function',
  'API del historial disponible');

/* Memorias ajenas preexistentes (separación) */
LS.setItem('POD2|patterns|BERESHITH_CO|colombia||VIAJE|CAMISETA SOFT', '{"pre":"existente"}');
LS.setItem('POD2|history|colombia||VIAJE|auto|CAMISETA SOFT|new|x|y', '{"hist":"existente"}');
LS.setItem('POD2|styleUsage|colombia||CAMISETA SOFT', '{"uso":"existente"}');

/* --- Lote real de 10 productos generado con el núcleo de la etapa 3 --- */
const out = window.OrquestadorMultiProducto.generarMuchos(Object.assign({}, CTX, { productos: PRODUCTOS.slice() }));
ok(out.ok && out.total === 10, 'lote de 10 productos generado');
const registro = {
  ctx: { market: CTX.market, region: CTX.region, concept: CTX.concepto, message: CTX.mensaje, serie: CTX.serie },
  productos: out.resultados.map(r => ({
    producto: r.producto, ok: r.ok, prompt: r.prompt || '',
    context: r.result ? r.result.context : null, error: r.error || null
  }))
};

/* 1) Guardar y recuperar un lote completo */
const g = H.guardarLote(registro);
ok(g.ok, 'guardarLote acepta el lote');
const cargado = H.cargarLote(g.id);
ok(!!cargado, 'cargarLote recupera el lote sin regenerar');
ok(cargado && cargado.productos.length === 10, 'el lote recuperado tiene 10 productos');
ok(cargado && cargado.productos.every((p, i) =>
  p.producto === registro.productos[i].producto && p.prompt === registro.productos[i].prompt),
  'productos y prompts recuperados idénticos (integridad)');
ok(cargado && cargado.productos.every(p => p.prompt.length > 1000), 'los 10 prompts conservados');

/* 2) Deduplicado: el mismo lote no se duplica */
const gDup = H.guardarLote(registro);
ok(gDup.ok && gDup.duplicado === true && gDup.id === g.id, 'doble guardado no duplica el lote');
ok(H.listarLotes().length === 1, 'solo hay un lote tras el intento de duplicado');

/* 3) Listado ordenado por fecha */
const base = Date.now();
for (let i = 0; i < 3; i++) {
  H.guardarLote({ ctx: { market: 'colombia', concept: 'c' + i, message: '', serie: 'S' + i }, createdAt: new Date(base + i * 1000).toISOString(), productos: [{ producto: 'MUG', ok: true, prompt: 'p'.repeat(50) }] });
}
const lista = H.listarLotes();
ok(lista.length === 4, 'listarLotes cuenta todos los lotes');
ok(lista.length >= 2 && Date.parse(lista[0].createdAt) >= Date.parse(lista[lista.length - 1].createdAt),
  'listarLotes ordena del más reciente al más antiguo');

/* 4) Resultados parciales y errores preservados */
const conError = {
  ctx: { market: 'colombia', concept: 'con fallo', message: '', serie: 'ERR' },
  productos: [
    { producto: 'CAMISETA SOFT', ok: true, prompt: 'PROMPT_OK', context: { product: 'CAMISETA SOFT' }, error: null },
    { producto: 'MUG', ok: false, prompt: '', context: null, error: 'FALLO_INYECTADO_ETAPA4' }
  ]
};
const gErr = H.guardarLote(conError);
ok(gErr.ok, 'guarda un lote con resultados parciales');
const cargadoErr = H.cargarLote(gErr.id);
ok(cargadoErr && cargadoErr.productos[1].ok === false &&
   cargadoErr.productos[1].error === 'FALLO_INYECTADO_ETAPA4', 'error del producto conservado');
ok(cargadoErr && cargadoErr.productos[0].prompt === 'PROMPT_OK', 'resultado exitoso vecino conservado');
ok(cargadoErr && cargadoErr.ok === false && cargadoErr.errores === 1, 'el lote refleja resultados parciales');

/* 5) Eliminar un lote */
const antes = H.listarLotes().length;
const del = H.eliminarLote(gErr.id);
ok(del.ok && H.cargarLote(gErr.id) === null, 'eliminarLote borra el registro');
ok(H.listarLotes().length === antes - 1, 'el índice deja de listarlo');
ok(H.eliminarLote('no-existe').ok === false, 'eliminar un id inexistente informa error');

/* 6) Rotación por número de lotes (20) */
const idNuevos = [];
for (let i = 0; i < 25; i++) {
  const r = H.guardarLote({ ctx: { market: 'colombia', concept: 'r' + i, message: '', serie: 'R' + i }, createdAt: new Date(base + 100000 + i * 1000).toISOString(), productos: [{ producto: 'GORRA', ok: true, prompt: 'x'.repeat(200) }] });
  if (r.ok) idNuevos.push(r.id);
}
const listaRotada = H.listarLotes();
ok(listaRotada.length === H.MAX_LOTES, 'rotación mantiene el máximo de lotes (' + listaRotada.length + ')');
ok(listaRotada.some(x => x.id === idNuevos[idNuevos.length - 1]), 'el lote más reciente sobrevive');
ok(!listaRotada.some(x => x.id === idNuevos[0]), 'los más antiguos fueron rotados');

/* 7) Rotación por presupuesto (4 MB) */
const idGrande = H.guardarLote({
  ctx: { market: 'colombia', concept: 'grande', message: '', serie: 'G' },
  productos: PRODUCTOS.map(p => ({ producto: p, ok: true, prompt: 'y'.repeat(30000) }))
});
ok(idGrande.ok, 'lote grande aceptado dentro del presupuesto individual');
ok(H.tamanoBytes() <= H.PRESUPUESTO_BYTES, 'tras la rotación el historial cabe en el presupuesto (' + H.tamanoBytes() + ' bytes)');
const segundoGrande = H.guardarLote({
  ctx: { market: 'colombia', concept: 'grande2', message: '', serie: 'G2' },
  productos: PRODUCTOS.map(p => ({ producto: p, ok: true, prompt: 'z'.repeat(30000) }))
});
ok(segundoGrande.ok, 'segundo lote grande aceptado rotando');
ok(H.tamanoBytes() <= H.PRESUPUESTO_BYTES, 'presupuesto respetado con lotes grandes (' + H.tamanoBytes() + ' bytes)');

/* 8) Cuota de LocalStorage agotada */
const LS2 = crearLocalStorage(900 * 1024);
global.localStorage = LS2;
window.localStorage = LS2;
const loteCaro = (tag) => ({
  ctx: { market: 'colombia', concept: tag, message: '', serie: tag },
  productos: PRODUCTOS.map(p => ({ producto: p, ok: true, prompt: 'q'.repeat(80000) }))
});
const q1 = H.guardarLote(loteCaro('Q1'));
const q2 = H.guardarLote(loteCaro('Q2'));
const q3 = H.guardarLote(loteCaro('Q3'));
ok(q1.ok, 'con cuota limitada se guarda el primer lote');
ok(q2.ok || (q2.ok === false && /cuota/.test(q2.error)), 'el segundo intento rota o informa cuota');
let legibles = 0, corruptos = 0;
H.listarLotes().forEach(x => { const l = H.cargarLote(x.id); if (l) legibles++; else corruptos++; });
ok(corruptos === 0, 'ningún registro corrupto tras presión de cuota');
ok(legibles >= 1, 'los lotes conservados siguen legibles (' + legibles + ')');

/* Lote imposible por cuota (más que el propio límite) */
const LS3 = crearLocalStorage(60 * 1024);
global.localStorage = LS3;
window.localStorage = LS3;
const qImposible = H.guardarLote(loteCaro('IMP'));
ok(qImposible.ok === false, 'lote mayor que la cuota devuelve error estructurado');
const qChaca = H.listarLotes();
ok(Array.isArray(qChaca), 'el índice sigue siendo legible tras el fallo de cuota');

/* 9) Separación de memorias */
ok(LS.getItem('POD2|patterns|BERESHITH_CO|colombia||VIAJE|CAMISETA SOFT') === '{"pre":"existente"}', 'memoria de patrones intacta');
ok(LS.getItem('POD2|history|colombia||VIAJE|auto|CAMISETA SOFT|new|x|y') === '{"hist":"existente"}', 'historial de objetos intacto');
ok(LS.getItem('POD2|styleUsage|colombia||CAMISETA SOFT') === '{"uso":"existente"}', 'memo de uso de estilos intacta');
ok(H.PREFIJO === 'POD2|multiproduct|', 'prefijo propio declarado');

/* 10) Compatibilidad con GLOBAL_MEMORY_CLEAR_KEY (clearAllMemory) */
global.localStorage = LS;
window.localStorage = LS;
/* Estado controlado: se parte de un almacenamiento limpio (las claves viejas
   de los apartados anteriores no deben interferir en esta comprobación). */
LS._claves().forEach(function (k) { LS.removeItem(k); });
const gFinal = H.guardarLote({ ctx: { market: 'colombia', concept: 'antes del clear', message: '', serie: 'CLR' }, productos: [{ producto: 'MUG', ok: true, prompt: 'CLAVE', context: null }] });
ok(gFinal.ok, 'lote guardado antes del borrado global');
const borrado = window.clearAllMemory();
ok(borrado && borrado.persisted, 'clearAllMemory ejecutado');
ok(H.listarLotes().length === 0, 'el borrado global oculta el historial (GLOBAL_MEMORY_CLEAR_KEY)');
ok(H.cargarLote(gFinal.id) === null, 'los lotes quedan inaccesibles tras el borrado global');
ok(LS.getItem('POD2|__globalClear') !== null, 'marcador global escrito');
const gPost = H.guardarLote({ ctx: { market: 'colombia', concept: 'despues del clear', message: '', serie: 'CLR2' }, productos: [{ producto: 'MUG', ok: true, prompt: 'POST', context: null }] });
ok(gPost.ok && H.listarLotes().length === 1, 'tras el borrado global se puede guardar de nuevo');

if (failures.length) {
  console.error('FAIL multiproducto-historial');
  failures.forEach(f => console.error(' - ' + f));
  process.exit(1);
}
console.log('PASS multiproducto-historial: ' + checks + ' aserciones, 0 fallos');
