/* Regresión P1: compatibilidad cruzada y autorización semántica.
   Los códigos son diagnósticos; solo un bloque imposible/unauthorized impide continuar. */
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

const concept = 'The King reigns';
const message = 'THE KING REIGNS FOREVER';
const support = 'EVERY KNEE SHALL BOW';

function makeSet(cardOverrides, treatmentOverride) {
  const semantic = {
    anchor: concept,
    type: 'abstract_or_verbal',
    namedObject: null,
    approvedRepresentation: 'abstract_geometry',
    physicalObjects: [],
    authorization: {
      text: [concept, message, support],
      namedObjects: [],
      decorativeElements: []
    }
  };
  const baseCard = function (tag, layout, technique) {
    return {
      estilo: 'Minimal Modern',
      audiencia: 'gospel_comunidad',
      jerarquiaVisual: 'OBJETO_DOMINANTE',
      objeto: concept,
      arquitectura: 'central',
      composicion: 'central',
      layout: layout,
      placement: 'pecho centrado',
      escalaProducto: 'media',
      formaSimbolo: 'geometrizado por módulos',
      tecnica: technique || 'retícula visible',
      tratamiento: treatmentOverride || 'MODERN: geometría limpia, bordes nítidos y tintas planas; silueta clara y sin ruido que compita con el mensaje',
      textoPrincipal: message,
      textoApoyo: support,
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
    A: Object.assign(baseCard('A', 'Tarjeta interior', 'retícula visible'), cardOverrides || {}),
    B: baseCard('B', 'Split 2/3-1/3', 'retícula visible'),
    C: baseCard('C', 'Diagonal ascendente', 'retícula visible'),
    seriesAnchor: concept,
    objectConflicts: [],
    creativeContractChanges: [],
    semantic
  };
}

const validAbstract = makeSet();
const validAbstractResult = _validateCreativeContract(validAbstract, {});
assert.equal(validAbstractResult.ok, true, 'una representación abstracta autorizada debe poder dominar: ' + validAbstractResult.errors.join(' | '));
assert.deepEqual(validAbstract.semantic.physicalObjects, []);

const heavyFineTechnique = makeSet({}, 'HEAVY: contornos gruesos y masas sólidas dominantes; contraste alto; letras grandes legibles');
heavyFineTechnique.B.tecnica = 'Hand-Drawn línea fina';
const heavyFineResult = _validateCreativeContract(heavyFineTechnique, {});
assert.equal(heavyFineResult.ok, false, 'HEAVY no debe admitir técnica de línea fina');
assert.ok(heavyFineResult.errors.some(error => /\[INCOMPATIBLE_TREATMENT_TECHNIQUE\]/.test(error)), heavyFineResult.errors.join(' | '));
assert.ok(heavyFineResult.diagnostics.some(diagnostic => diagnostic.tipo === 'incompatible'), 'el diagnóstico debe clasificar incompatibilidad');

const heavyFineForm = makeSet({}, 'HEAVY: contornos gruesos y masas sólidas dominantes; contraste alto; letras grandes legibles');
heavyFineForm.B.formaSimbolo = 'contorno lineal calibrado 0.25 mm';
const heavyFineFormResult = _validateCreativeContract(heavyFineForm, {});
assert.equal(heavyFineFormResult.ok, false, 'HEAVY no debe admitir forma/ ejecución fina');
assert.ok(heavyFineFormResult.errors.some(error => /\[INCOMPATIBLE_TREATMENT_FORM\]/.test(error)), heavyFineFormResult.errors.join(' | '));

const unauthorizedPhysical = makeSet();
const bank = typeof getObjectPool === 'function' ? getObjectPool() : [];
if (bank && bank.length) {
  unauthorizedPhysical.B.objeto = bank[0];
  const unauthorizedPhysicalResult = _validateCreativeContract(unauthorizedPhysical, {});
  assert.equal(unauthorizedPhysicalResult.ok, false, 'un objeto físico no autorizado debe impedir generar');
  assert.ok(unauthorizedPhysicalResult.errors.some(error => /\[UNAUTHORIZED_PHYSICAL_OBJECT\]/.test(error)), unauthorizedPhysicalResult.errors.join(' | '));
  assert.ok(unauthorizedPhysicalResult.diagnostics.some(diagnostic => diagnostic.tipo === 'unauthorized' && diagnostic.authority === 'P1'));
}

const unauthorizedDecorative = makeSet();
unauthorizedDecorative.C.objeto = 'corona';
const unauthorizedDecorativeResult = _validateCreativeContract(unauthorizedDecorative, {});
assert.equal(unauthorizedDecorativeResult.ok, false, 'un elemento decorativo sin autorización debe impedir generar');
assert.ok(unauthorizedDecorativeResult.errors.some(error => /\[UNAUTHORIZED_DECORATIVE_ELEMENT\]/.test(error)), unauthorizedDecorativeResult.errors.join(' | '));

const indeterminate = makeSet();
delete indeterminate.semantic;
const indeterminateResult = _validateCreativeContract(indeterminate, {});
assert.equal(indeterminateResult.ok, true, 'información semántica insuficiente no debe inventar incompatibilidad');
assert.ok(indeterminateResult.diagnostics.some(diagnostic => diagnostic.tipo === 'indeterminate'), 'debe reportar que la autorización es indeterminate');

console.log('PASS semantic-compatibility-contract: abstract dominance allowed, incompatible contracts blocked, unauthorized elements rejected');