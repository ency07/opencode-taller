/* PR 2 — Cara del estampado + hoja de presentación tipo QUIETO + contraste A/B/C.
   Ejecutar: node tests/contactsheet-cara.test.js
   No requiere DOM real ni proveedores. Sale con código 1 si algo falla. */

'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
let checks = 0;
const failures = [];
function ok(cond, msg) { checks++; if (!cond) failures.push(msg); }

global.window = global;
global.document = { getElementById: function () { return null; }, querySelectorAll: function () { return []; } };

const JS = path.join(ROOT, 'js');
['data-mercados.js', 'data-audiencias.js', 'data-bancos.js', 'data-estilos.js',
 'dominios.js', 'data-productos.js', 'memoria-local.js', 'motor-nucleo.js'
].forEach(function (f) {
  vm.runInThisContext(fs.readFileSync(path.join(JS, f), 'utf8'), { filename: f });
});

const motorSource = fs.readFileSync(path.join(JS, 'motor-nucleo.js'), 'utf8');
const productSource = fs.readFileSync(path.join(JS, 'data-productos.js'), 'utf8');
const htmlSource = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');

function baseState() {
  MOTOR_STATE.market = 'colombia';
  MOTOR_STATE.region = 'todas';
  MOTOR_STATE.product = 'CAMISETA SOFT';
  MOTOR_STATE.subniche = 'auto';
  MOTOR_STATE.dominio = 'auto';
  MOTOR_STATE.dominioDetectado = 'auto';
  MOTOR_STATE.audienceSet = 'Auto';
  MOTOR_STATE.audienceMulti = 'si';
  MOTOR_STATE.groupMode = 'distintos';
  MOTOR_STATE.designMode = 'contacto';
  MOTOR_STATE.support = '';
  MOTOR_STATE.explorationBrief = null;
  MOTOR_STATE.stampSide = 'auto';
}

/* --- 1) Resolución de la cara del estampado --- */
baseState();
ok(_stampSideForProduct() === 'frente', 'CAMISETA SOFT en auto debe resolver FRENTE');
MOTOR_STATE.stampSide = 'espalda';
ok(_stampSideForProduct() === 'espalda', 'la selección manual ESPALDA debe respetarse');
MOTOR_STATE.stampSide = 'frente';
ok(_stampSideForProduct() === 'frente', 'la selección manual FRENTE debe respetarse');
MOTOR_STATE.stampSide = 'auto';
MOTOR_STATE.product = 'FUNDA MÓVIL';
ok(_stampSideForProduct() === 'espalda', 'un producto de colocación trasera (FUNDA) en auto debe resolver ESPALDA');

/* --- 2) buildCandidate asigna v.cara en las 3 fichas --- */
baseState();
MOTOR_STATE.workflowMode = 'new';
MOTOR_STATE.concept = 'águila calva sobre el cañón';
MOTOR_STATE.message = 'Aguanta firme';
let set = buildCandidate(resolveAudiences(), null);
ok(['A', 'B', 'C'].every(function (k) { return set[k].cara === 'frente'; }),
  'con auto en CAMISETA SOFT las 3 fichas deben declarar cara FRENTE');
MOTOR_STATE.stampSide = 'espalda';
set = buildCandidate(resolveAudiences(), null);
ok(['A', 'B', 'C'].every(function (k) { return set[k].cara === 'espalda'; }),
  'con ESPALDA las 3 fichas deben declarar cara ESPALDA');

/* --- 3) formatPrompt emite cara, eje de columnas y contraste A/B/C --- */
baseState();
MOTOR_STATE.workflowMode = 'new';
MOTOR_STATE.concept = 'águila calva sobre el cañón';
MOTOR_STATE.message = 'Aguanta firme';
set = buildCandidate(resolveAudiences(), null);
const prompt = formatPrompt({ set: set });
ok(prompt.indexOf('CARA DEL ESTAMPADO: FRENTE') !== -1, 'el prompt debe indicar la cara del estampado por ficha');
ok(prompt.indexOf('CONTRASTE ESTRUCTURAL A/B/C') !== -1, 'el prompt debe incluir el bloque de contraste estructural A/B/C');
ok(prompt.indexOf('EJE DE COLUMNAS:') !== -1, 'el prompt debe aclarar el eje de las 3 columnas');
ok(prompt.indexOf('CARAS DEL SET:') !== -1, 'el prompt debe resumir las caras del set');
ok(prompt.indexOf('todas FRENTE') !== -1, 'sin espalda pedida, el set completo debe ser FRENTE');
ok(motorSource.includes('function _contrastBlock(set)'), 'el contraste A/B/C debe estar encapsulado en una función');
ok(motorSource.includes('si dos columnas comparten encuadre, silueta global o distribución de masas'),
  'el contraste debe prohibir columnas con la misma estructura');

/* --- 4) Reglas de producto coherentes (frente por defecto) --- */
ok(!/espalda completa/.test(getPlacement('CAMISETA SOFT')), 'la colocación de CAMISETA SOFT no debe ofrecer "espalda completa" por defecto');
ok(/frente/i.test(getPlacement('CAMISETA SOFT')), 'la colocación de CAMISETA SOFT debe ser frontal por defecto');
const mockup = getMockupRule('CAMISETA SOFT');
ok(mockup.indexOf('COLORES SUGERIDOS POR COLUMNA') !== -1, 'la hoja debe incluir COLORES SUGERIDOS POR COLUMNA');
ok(mockup.indexOf('VISTA ESPALDA') !== -1 && mockup.indexOf('CARA DEL ESTAMPADO: ESPALDA') !== -1,
  'la espalda solo debe dibujarse cuando la ficha lo pide');
ok(mockup.indexOf('LÍNEA DE VALOR') !== -1, 'cada columna debe llevar su línea de valor');
ok(mockup.indexOf('LÍNEA DE VALOR') !== -1 && /EJE|encabezado/i.test(mockup), 'el encabezado debe ser adaptable al eje del modo');
ok(mockup.indexOf('DETALLES DE IMPRESIÓN') !== -1 && mockup.indexOf('PALETA GENERAL DE LA SERIE') !== -1,
  'la fila inferior debe incluir detalles de impresión y la paleta general');
ok(!/espalda completa/.test(productSource), 'data-productos no debe invitar a la espalda completa por defecto');

/* --- 5) Selector conectado en la interfaz y leído por el motor --- */
ok(/<select id="stampSide">/.test(htmlSource), 'index.html debe exponer el selector Cara del estampado');
ok(motorSource.includes("MOTOR_STATE.stampSide = v('stampSide', 'auto')"), 'readStateFromDOM debe leer el selector de cara');

console.log((failures.length ? 'FAIL' : 'PASS') + ' contactsheet-cara (' + checks + ' aserciones, ' + failures.length + ' fallos)');
failures.forEach(function (msg) { console.error(' - ' + msg); });
process.exit(failures.length ? 1 : 0);
