/* Contrato de imagen: estilos inmutables por ficha + técnicas sin objetos
   anexos (filacteria, cartela, gloria de nubes…).
   Ejecutar: node tests/contrato-imagen.test.js
   Sale con código 1 si algo falla. */

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

function count(hay, needle) { return hay.split(needle).length - 1; }

function baseState() {
  MOTOR_STATE.market = 'colombia';
  MOTOR_STATE.region = 'todas';
  MOTOR_STATE.product = 'CAMISETA SOFT';
  MOTOR_STATE.subniche = 'fe_popular_col';
  MOTOR_STATE.audienceSet = 'Auto';
  MOTOR_STATE.audienceMulti = 'no';
  MOTOR_STATE.groupMode = 'distintos';
  MOTOR_STATE.designMode = 'contacto';
  MOTOR_STATE.support = '';
  MOTOR_STATE.explorationBrief = null;
  MOTOR_STATE.stampSide = 'auto';
  MOTOR_STATE.workflowMode = 'new';
  MOTOR_STATE.serie = '';
  MOTOR_STATE.concept = 'nueva vida en Cristo al abrir una puerta';
  MOTOR_STATE.message = 'Vivir por fe, no por vista';
}

function lockEstilos(value) {
  ['A', 'B', 'C'].forEach(function (k) {
    setLockValue(memLocksMarket(), MOTOR_STATE.product, 'estilo', k, value);
  });
}
function clearEstilos() {
  ['A', 'B', 'C'].forEach(function (k) {
    setLockValue(memLocksMarket(), MOTOR_STATE.product, 'estilo', k, 'Auto');
  });
}

/* --- 1) Helper de técnicas: unit --- */
const soloObjetos = _tecnicaSinObjetos(['Filacteria tallada', 'Gloria de nubes', 'Orla renacentista', 'Cartela dorada']);
ok(soloObjetos.length === 1 && /tratamiento de superficie/.test(soloObjetos[0]),
  'si todas las técnicas del pool son objetos anexos, se degrada a tratamiento de superficie');
const mixto = _tecnicaSinObjetos(['Claroscuro dramático', 'Filacteria tallada', 'Gloria de nubes']);
ok(mixto.length === 1 && mixto[0] === 'Claroscuro dramático',
  'el filtro elimina solo las técnicas-objeto y conserva el orden de las válidas');
ok(_tecnicaSinObjetos(null)[0].indexOf('tratamiento de superficie') !== -1,
  'pool nulo cae al fallback de tratamiento de superficie');
ok(_tecnicaSinObjetos(['Talla dorada', 'Retablo completo']).length === 1,
  'retablo también cuenta como objeto anexo y se filtra');

/* --- 2) Contrato superior + bloqueo por ficha en el prompt --- */
baseState();
lockEstilos('Barroco Ornamental');
let set = buildCandidate(resolveAudiences(), null);
let prompt = formatPrompt({ set: set });

const topBlock = prompt.indexOf('CONTRATO DE ESTILO POR FICHA (INMUTABLE)');
ok(topBlock !== -1 && topBlock < prompt.indexOf('### 01A'),
  'el contrato por ficha debe abrir el prompt, antes de las fichas');
ok(count(prompt, 'CONTRATO DE ESTILO POR FICHA (INMUTABLE)') === 1,
  'el contrato por ficha aparece exactamente una vez');
ok(count(prompt, 'BLOQUEO DE ESTILO (SERIE)') === 1,
  'el bloqueo de estilo global aparece exactamente una vez');
['01A: estilo «Barroco Ornamental»', '01B: estilo «Barroco Ornamental»', '01C: estilo «Barroco Ornamental»']
  .forEach(function (linea) {
    ok(prompt.indexOf(linea) !== -1, 'el contrato debe fijar por ficha: ' + linea);
  });
['BLOQUEO DE ESTILO 01A', 'BLOQUEO DE ESTILO 01B', 'BLOQUEO DE ESTILO 01C'].forEach(function (linea) {
  ok(prompt.indexOf(linea + ': «Barroco Ornamental»') !== -1, 'bloqueo por ficha presente: ' + linea);
});
ok(count(prompt.toLowerCase(), 'inmutable') >= 4,
  'el bloqueo repite la inmutabilidad (global + 3 fichas)');
ok(prompt.indexOf('nunca sustituyen ni reetiquetan el estilo') !== -1,
  'el bloqueo prohíbe reetiquetar el estilo');
ok(prompt.toLowerCase().indexOf('filacteria') === -1,
  'Filacteria tallada no puede aparecer como técnica del arte');
ok(prompt.indexOf('Gloria de nubes') === -1,
  'Gloria de nubes no puede aparecer como técnica del arte');
ok(prompt.indexOf('Filacteria tallada') === -1,
  'sin exceso de mayúsculas ni variantes, Filacteria desaparece del prompt');

/* --- 3) Pool sin objetos no rompe la variedad --- */
const teclas = ['Claroscuro dramático', 'Talla dorada'];
const tecnicasYE = [set.A.tecnica, set.B.tecnica, set.C.tecnica];
teclas.forEach(function (t) {
  ok(prompt.indexOf(t) !== -1 || prompt.indexOf('técnica') !== -1,
    'el estilo mantiene técnicas de superficie: ' + t);
});
ok(tecnicasYE.every(function (t) { return !_TECNICA_OBJETO_RE.test(t); }),
  'todas las técnicas asignadas en A/B/C pasan el filtro de objetos');

/* --- 4) Des-imanes de la hoja de presentación --- */
const mockup = getMockupRule('CAMISETA SOFT');
ok(mockup.indexOf('LÍNEA DE VALOR') === -1 && mockup.indexOf('línea de valor') === -1,
  'la hoja ya no exige LÍNEA DE VALOR (imán de invenciones)');
ok(mockup.indexOf('prohibido inventar nombre') !== -1 && mockup.indexOf('SIN SERIE') !== -1,
  'SERIE vacía debe producir celda sin serie, sin inventar nombre');
ok(mockup.indexOf('celda vacía; prohibido inventar datos') !== -1,
  'DATO ausente debe dejar celda vacía, sin inventar versículos ni claims');
ok(mockup.indexOf('prohibido inventar etiquetas nuevas') !== -1,
  'ESTILO GENERAL debe tomar los estilos exactos de las fichas');
ok(prompt.indexOf('SERIE: —') !== -1,
  'el prompt comunica SERIE vacía como "—", coherente con la regla de la hoja');

clearEstilos();

console.log((failures.length ? 'FAIL' : 'PASS') + ' contrato-imagen (' + checks + ' aserciones, ' + failures.length + ' fallos)');
failures.forEach(function (msg) { console.error(' - ' + msg); });
process.exit(failures.length ? 1 : 0);
