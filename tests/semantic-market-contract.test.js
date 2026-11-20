/* Regresión P1: compatibilidad semántica en Gospel y Secular. */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.join(__dirname, '..');

global.window = global;
const elements = {};
global.document = {
  getElementById: id => elements[id] || null,
  querySelectorAll: () => [],
  createElement: () => ({ style: {}, appendChild() {}, setAttribute() {} })
};

const js = path.join(root, 'js');
[
  'data-mercados.js', 'data-audiencias.js', 'data-bancos.js',
  'banco-gospel-es.js', 'banco-gospel-en.js', 'banco-global.js',
  'dominios.js', 'data-estilos.js', 'data-territorios.js',
  'data-productos.js', 'memoria-local.js', 'diversidad-saturacion.js',
  'inteligencia-mercado.js', 'motor-nucleo.js'
].forEach(file => {
  const full = path.join(js, file);
  if (fs.existsSync(full)) vm.runInThisContext(fs.readFileSync(full, 'utf8'), { filename: file });
});

const cases = [
  { market: 'gospel_en', concept: 'THE KING REIGNS FOREVER', message: 'THE KING REIGNS FOREVER', support: 'EVERY KNEE SHALL BOW', audience: 'gospel_comunidad', style: 'Minimal Modern' },
  { market: 'global_en', concept: 'SURF BEYOND FEAR', message: 'RIDE BEYOND FEAR', support: 'EVERY DAY IS AN OPEN LINE', audience: 'global_young_en', style: 'Brutalist' }
];

function makeFixture(options) {
  const semantic = {
    anchor: options.concept,
    type: 'abstract_or_verbal',
    namedObject: null,
    approvedRepresentation: 'abstract_geometry',
    physicalObjects: [],
    authorization: {
      text: [options.concept, options.message, options.support].filter(Boolean),
      namedObjects: [],
      decorativeElements: []
    }
  };
  const card = function (tag, layout) {
    return {
      estilo: options.style,
      audiencia: options.audience,
      jerarquiaVisual: 'OBJETO_DOMINANTE',
      objeto: options.concept,
      arquitectura: 'central',
      composicion: 'central',
      layout: layout,
      placement: 'pecho centrado',
      escalaProducto: 'media',
      formaSimbolo: 'geometrizado por módulos',
      tecnica: 'retícula visible',
      tratamiento: 'MODERN: geometría limpia, bordes nítidos y tintas planas; silueta clara y sin ruido que compita con el mensaje',
      textoPrincipal: options.message,
      textoApoyo: options.support,
      textoTerciario: '',
      tipografia: 'Sans humanista limpia',
      paleta: 'pal (modo: contrast)',
      familiaColor: 'monochrome',
      fitAudiencia: 80,
      fitProducto: 80,
      densidad: 'Balanced',
      negativeSpace: 'abierto',
      distribucionTexto: 'TEXTO ARRIBA; bloque principal centrado sobre un eje vertical; textos secundarios apilados debajo en columna',
      integracionTexto: 'las letras habitan la estructura del objeto',
      relacion: 'r',
      rutaVisual: 'RUTA ' + tag,
      motivoVisual: 'MOTIVO ' + tag
    };
  };
  return {
    A: card('A', 'Tarjeta interior'),
    B: card('B', 'Split 2/3-1/3'),
    C: card('C', 'Diagonal ascendente'),
    seriesAnchor: options.concept,
    objectConflicts: [],
    creativeContractChanges: [],
    semantic: semantic
  };
}

cases.forEach(function (options) {
  MOTOR_STATE.market = options.market;
  MOTOR_STATE.region = 'global';
  MOTOR_STATE.product = 'CAMISETA SOFT';
  MOTOR_STATE.subniche = 'auto';
  const valid = makeFixture(options);
  const validResult = _validateCreativeContract(valid, {});
  assert.equal(validResult.ok, true, options.market + ': una representación abstracta autorizada debe validar: ' + validResult.errors.join(' | '));
  assert.equal(validResult.diagnostics.some(function (diagnostic) { return diagnostic.tipo === 'unauthorized'; }), false);

  const invalidTechnique = makeFixture(options);
  invalidTechnique.B.tratamiento = 'HEAVY: contornos gruesos y masas sólidas dominantes; contraste alto; letras grandes legibles';
  invalidTechnique.B.tecnica = 'Hand-Drawn línea fina';
  const invalidTechniqueResult = _validateCreativeContract(invalidTechnique, {});
  assert.equal(invalidTechniqueResult.ok, false, options.market + ': HEAVY no admite técnica de línea fina');
  assert.ok(invalidTechniqueResult.errors.some(function (error) { return /\[INCOMPATIBLE_TREATMENT_TECHNIQUE\]/.test(error); }));

  const pool = getObjectPool();
  assert.ok(pool.length > 0, options.market + ': debe existir un banco propio no vacío');
  const unauthorizedPhysical = makeFixture(options);
  unauthorizedPhysical.B.objeto = pool[0];
  const unauthorizedPhysicalResult = _validateCreativeContract(unauthorizedPhysical, {});
  assert.equal(unauthorizedPhysicalResult.ok, false, options.market + ': un objeto físico no autorizado debe bloquear');
  assert.ok(unauthorizedPhysicalResult.errors.some(function (error) { return /\[UNAUTHORIZED_PHYSICAL_OBJECT\]/.test(error); }));
});

MOTOR_STATE.market = 'custom';
MOTOR_STATE.region = 'global';
const custom = makeFixture(cases[0]);
const customResult = _validateCreativeContract(custom, {});
assert.equal(customResult.ok, false, 'un mercado sin motor asignado no puede compilar');
assert.ok(customResult.errors.some(function (error) { return /\[INCOMPATIBLE_MARKET_ROUTING\]/.test(error); }), customResult.errors.join(' | '));

console.log('PASS semantic-market-contract: Gospel and Secular accept abstract autorizado, reject invalid technology, physical injections and unrouted markets');