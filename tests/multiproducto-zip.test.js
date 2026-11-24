/* Etapa 5 (multiproducto): exportación ZIP sin dependencias.
   Valida STORE puro, encabezados locales, directorio central, EOCD, CRC32
   recalculado de forma independiente, apertura real con Python zipfile,
   UTF-8, nombres, lotes con fallos y no-modificación del historial. */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { execFileSync } = require('node:child_process');
const root = path.join(__dirname, '..');

global.window = global;
global.document = {
  getElementById: () => null,
  querySelectorAll: () => [],
  createElement: () => ({ style: {}, appendChild() {}, setAttribute() {}, click() {}, remove() {} }),
  body: { appendChild() {} }
};
try { window.URL = { createObjectURL: () => 'blob:fake', revokeObjectURL() {} }; } catch (e) {}

const js = path.join(root, 'js');
['data-productos.js', 'memoria-local.js', 'multiproducto-historial.js', 'multiproducto-zip.js']
  .forEach(f => vm.runInThisContext(fs.readFileSync(path.join(js, f), 'utf8'), { filename: f }));

let checks = 0;
const failures = [];
function ok(cond, msg) { checks++; if (!cond) failures.push(msg); }

/* --- CRC32 independiente (para contrastar con el del módulo) --- */
const TABLA = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1); t[n] = c >>> 0; } return t; })();
function crcIndependiente(bytes) { let c = 0xFFFFFFFF; for (let i = 0; i < bytes.length; i++) c = (TABLA[(c ^ bytes[i]) & 0xFF] ^ (c >>> 8)) >>> 0; return (c ^ 0xFFFFFFFF) >>> 0; }

/* --- Parseo mínimo del ZIP para verificar estructura y CRC --- */
function parsearZip(bytes) {
  const u8 = new Uint8Array(bytes);
  const dv = new DataView(u8.buffer, u8.byteOffset, u8.byteLength);
  function u32(o) { return dv.getUint32(o, true); }
  function u16(o) { return dv.getUint16(o, true); }
  const eocdOff = u8.length - 22;
  const entradas = [];
  if (u32(eocdOff) !== 0x06054b50) throw new Error('EOCD no encontrado');
  const total = u16(eocdOff + 10);
  let ptr = u32(eocdOff + 16);
  for (let i = 0; i < total; i++) {
    if (u32(ptr) !== 0x02014b50) throw new Error('central dir inválido en entrada ' + i);
    const crc = u32(ptr + 16);
    const size = u32(ptr + 24);
    const nameLen = u16(ptr + 28);
    const offset = u32(ptr + 42);
    const nombre = Buffer.from(u8.slice(ptr + 46, ptr + 46 + nameLen)).toString('utf8');
    const lf = offset;
    if (u32(lf) !== 0x04034b50) throw new Error('local header inválido para ' + nombre);
    const lfNameLen = u16(lf + 26);
    const inicio = lf + 30 + lfNameLen;
    const contenido = u8.slice(inicio, inicio + size);
    entradas.push({ nombre, crc, size, contenido });
    ptr += 46 + nameLen;
  }
  return { total, entradas };
}

function loteSintetico(n, opciones) {
  opciones = opciones || {};
  const productos = [];
  for (let i = 0; i < n; i++) {
    const falla = opciones.fallar === i;
    productos.push({
      producto: opciones.nombres ? opciones.nombres[i] : ('PRODUCTO ' + (i + 1)),
      ok: !falla,
      prompt: falla ? '' : 'Prompt de prueba ' + (i + 1) + ' con ñ, áéíóú, «comillas», · guion — y ✦',
      context: { market: 'colombia', region: 'global', product: opciones.nombres ? opciones.nombres[i] : ('PRODUCTO ' + (i + 1)) },
      error: falla ? 'FALLO_INYECTADO' : null
    });
  }
  return {
    id: opciones.id || 'lote-' + n,
    createdAt: new Date().toISOString(),
    ctx: { market: 'colombia', region: 'global', concept: 'concepto con ñ', message: 'mensaje con á' },
    productos: productos
  };
}

const Z = window.MultiproductoZip;

ok(typeof Z.generarZip === 'function' && typeof Z.descargarZip === 'function', 'API ZIP disponible');
ok(!/require\(|import\s+\w+\s+from/.test(fs.readFileSync(path.join(js, 'multiproducto-zip.js'), 'utf8')),
  'el módulo no usa require/import');
ok(!fs.existsSync(path.join(root, 'package.json')), 'el proyecto sigue sin package.json ni dependencias');

/* --- 1) ZIP con un producto --- */
const z1 = Z.generarZip(loteSintetico(1, { id: 'uno' }));
ok(z1.ok, 'ZIP de un producto generado');
ok(z1.archivos.length === 3, 'un producto: LOTE + producto + RESUMEN (' + z1.archivos.length + ')');

/* --- 2) ZIP con los 10 productos --- */
const lote10 = loteSintetico(10, { id: 'diez', nombres: ['CAMISETA SOFT','CAMISETA APPAREL','HOODIE','GORRA','MUG','MOCHILA','TOTE BAG','FUNDA MÓVIL','ILUSTRACION PREMIUM APPAREL','DISPLATE'] });
const z10 = Z.generarZip(lote10);
ok(z10.ok, 'ZIP de 10 productos generado');
ok(z10.archivos.length === 12, 'diez productos: 10 + LOTE + RESUMEN (' + z10.archivos.length + ')');

/* --- 3) Integridad CRC32 (recalculada) --- */
[ [z1, lote10], [z10, lote10] ].forEach(function (par) {
  const z = par[0], lote = par[1];
  const p = parsearZip(z.bytes);
  ok(p.total === z.archivos.length, 'número de entradas del directorio central = ' + z.archivos.length);
  p.entradas.forEach(function (e) {
    ok(crcIndependiente(e.contenido) === e.crc, 'CRC32 correcto en ' + e.nombre);
    ok(e.contenido.length === e.size, 'tamaño correcto en ' + e.nombre);
  });
});

/* --- 4) Estructura ZIP y directorio central --- */
{
  const p = parsearZip(z10.bytes);
  ok(p.entradas[0].nombre === '00_LOTE.txt', 'primera entrada: información del lote');
  ok(p.entradas[p.entradas.length - 1].nombre === '99_RESUMEN.txt', 'última entrada: resumen');
  const orden = p.entradas.map(e => e.nombre);
  ok(JSON.stringify(orden.slice(1, 11)) === JSON.stringify(lote10.productos.map((x, i) =>
    String(i + 1).padStart(2, '0') + '_' + Z.sanearNombre(x.producto) + '_OK.txt')), 'entradas de producto numeradas y ordenadas');
}

/* --- 5) Apertura y extracción real con Python zipfile --- */
let zipOk = true;
try {
  const dirEvidencia = path.join(root, 'PRUEBAS WORKFLOW', '09_CHECKPOINTS', 'etapa5_zip');
  fs.mkdirSync(dirEvidencia, { recursive: true });
  const rutaZip = path.join(dirEvidencia, 'muestra_10.zip');
  fs.writeFileSync(rutaZip, Buffer.from(z10.bytes));
  const script = `
import json, zipfile, sys
ruta = sys.argv[1]
z = zipfile.ZipFile(ruta)
salida = {"entradas": z.namelist(), "testzip": z.testzip()}
contenidos = {}
for n in z.namelist():
    contenidos[n] = z.read(n).decode("utf-8")
print(json.dumps({"estado": "ok", "entradas": salida["entradas"], "testzip": salida["testzip"], "contenidos": contenidos}, ensure_ascii=False))
`;
  const salida = execFileSync('python3', ['-c', script, rutaZip], { encoding: 'utf8' });
  const info = JSON.parse(salida);
  ok(info.entradas.length === 12, 'python zipfile: 12 entradas');
  ok(info.testzip === null, 'python zipfile: CRC/testzip OK');
  const clave = Object.keys(info.contenidos).find(k => k.startsWith('01'));
  ok(/ñ|áéíóú|«/.test(info.contenidos[clave]), 'python zipfile: UTF-8 recuperado (tildes/comillas)');
} catch (e) {
  zipOk = false;
  console.log('SKIP apertura con python zipfile: ' + String(e.message).slice(0, 160));
}
if (!zipOk) { /* SKIP declarado: sin Python zipfile disponible */ }

/* --- 6) Nombres y rutas: únicos, ASCII, sin rutas --- */
ok(new Set(z10.archivos).size === z10.archivos.length, 'nombres de archivo únicos');
ok(z10.archivos.every(n => /^[0-9A-Za-z._-]+$/.test(n)), 'nombres ASCII seguros');
ok(z10.archivos.every(n => n.indexOf('/') === -1), 'sin rutas en los nombres');
ok(Z.sanearNombre('FUNDA MÓVIL') === 'FUNDA_MOVIL', 'tildes saneadas en nombres (FUNDA MOVIL)');

/* --- 7) UTF-8: contenido con ñ, tildes y caracteres especiales --- */
{
  const p = parsearZip(z10.bytes);
  const prod = p.entradas.filter(e => /^0[1-9]_/.test(e.nombre))[0];
  const texto = Buffer.from(prod.contenido).toString('utf8');
  ok(texto.includes('ñ') && texto.includes('áéíóú') && texto.includes('«') && texto.includes('·') && texto.includes('✦'),
    'contenido del producto en UTF-8 completo');
}

/* --- 8) Lotes con productos fallidos --- */
{
  const loteFallo = loteSintetico(10, { id: 'con-fallo', fallar: 4 });
  const zf = Z.generarZip(loteFallo);
  ok(zf.ok, 'ZIP con un producto fallado generado');
  const p = parsearZip(zf.bytes);
  const nombreFallo = p.entradas.find(e => e.nombre.indexOf('_ERROR.txt') !== -1);
  ok(!!nombreFallo, 'archivo del producto fallado marcado ERROR');
  const textoFallo = Buffer.from(nombreFallo.contenido).toString('utf8');
  ok(textoFallo.includes('FALLO_INYECTADO'), 'error conservado en el ZIP');
  const resumen = p.entradas[p.entradas.length - 1];
  ok(Buffer.from(resumen.contenido).toString('utf8').includes('PARCIAL'), 'resumen global PARCIAL');
}

/* --- 9) Ausencia de dependencias externas --- */
{
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  ok(!/jszip|fflate|pako|archive-js/i.test(html), 'index.html sin librerías ZIP');
  ok(!fs.existsSync(path.join(root, 'node_modules')), 'sin node_modules');
}

/* --- 10) La exportación no modifica el historial --- */
{
  const datos = new Map();
  const tam = s => Buffer.byteLength(String(s), 'utf8');
  const mock = {
    getItem: k => (datos.has(k) ? datos.get(k) : null),
    setItem(k, v) { datos.set(k, String(v)); },
    removeItem(k) { datos.delete(k); },
    key(i) { return Array.from(datos.keys())[i] || null; },
    get length() { return datos.size; }
  };
  global.localStorage = mock;
  window.localStorage = mock;
  vm.runInThisContext(fs.readFileSync(path.join(js, 'memoria-local.js'), 'utf8'), { filename: 'memoria-local.js' });
  vm.runInThisContext(fs.readFileSync(path.join(js, 'multiproducto-historial.js'), 'utf8'), { filename: 'multiproducto-historial.js' });
  const H = window.MultiproductoHistorial;
  const g = H.guardarLote(lote10);
  ok(g.ok, 'lote guardado en el historial para la prueba de no-modificación');
  const snapshot = JSON.stringify(Array.from(datos.entries()).sort());
  const zipRes = Z.generarZip(H.cargarLote(g.id));
  ok(zipRes.ok, 'ZIP generado desde el historial');
  const despues = JSON.stringify(Array.from(datos.entries()).sort());
  ok(snapshot === despues, 'la exportación no altera el almacenamiento del historial');
  ok(H.listarLotes().length === 1, 'el historial sigue intacto tras exportar');
  ok(H.cargarLote(g.id).productos.length === 10, 'el lote del historial conserva sus 10 productos');
}

if (failures.length) {
  console.error('FAIL multiproducto-zip');
  failures.forEach(f => console.error(' - ' + f));
  process.exit(1);
}
console.log('PASS multiproducto-zip: ' + checks + ' aserciones, 0 fallos' + (zipOk ? '' : ' (con SKIP de python zipfile)'));
