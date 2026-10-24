/* Regresiones de pertinencia creativa: el banco no puede sustituir el concepto
   por un motivo aleatorio o por coincidencias parciales.
   Ejecutar: node tests/creative-relevance.test.js */
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ROOT = path.join(__dirname, '..');
let checks = 0;
const failures = [];
function ok(cond, msg) { checks++; if (!cond) failures.push(msg); }

global.window = global;
global.document = {
  getElementById: function () { return null; },
  querySelectorAll: function () { return []; },
  readyState: 'complete',
  addEventListener: function () {}
};
const JS = path.join(ROOT, 'js');
[
  'data-mercados.js', 'data-audiencias.js', 'data-bancos.js',
  'data-estilos.js', 'dominios.js', 'data-productos.js',
  'memoria-local.js', 'motor-nucleo.js', 'banco-gospel-es.js',
  'banco-global.js'
].forEach(function (f) {
  vm.runInThisContext(fs.readFileSync(path.join(JS, f), 'utf8'), { filename: f });
});

const family = ['cruz de madera', 'corona de espinas', 'paloma blanca'];
const concept = 'jardinero que llama por nombre en madrugada';
const planned = _planExploreMotifs(family, family, concept, concept, 'Jesucristo');
ok(planned.anchor === concept, 'si no hay afinidad semántica, conserva el concepto completo');
ok(planned.list.length === 1 && planned.list[0] === concept,
  'no selecciona un motivo de Gospel aleatorio ajeno al concepto');
ok(!!planned.conflict, 'explica que el banco no contiene un motivo suficientemente pertinente');

const messageConflict = _planExploreMotifs(
  ['cruz de madera', 'corona de espinas'],
  ['cruz de madera', 'corona de espinas'],
  'eternamente rey',
  'eternamente rey',
  'Jesucristo'
);
ok(messageConflict.anchor === 'eternamente rey',
  'un mensaje religioso no reemplaza un concepto explícito distinto');

const weakKingMatch = _rankCompatibleMotifs(
  ['trono ocupado por Rey con toalla de siervo'],
  'Eterno rey'
);
ok(weakKingMatch.length === 0,
  '«Eterno rey» no selecciona un objeto solo porque menciona «Rey»');

const kingPlan = _planExploreMotifs(
  ['trono ocupado por Rey con toalla de siervo', 'corona real'],
  ['trono ocupado por Rey con toalla de siervo', 'corona real'],
  'Eterno rey',
  'Eterno rey',
  'Jesucristo nombre sobre todo nombre'
);
ok(kingPlan.anchor === 'Eterno rey' && kingPlan.list[0] === 'Eterno rey',
  'si el banco solo ofrece coincidencias débiles, conserva el concepto y no impone una escena');

const substring = _rankCompatibleMotifs(['soldado romano', 'sol naciente'], 'sol');
ok(substring.indexOf('soldado romano') === -1,
  'no acepta coincidencia parcial dentro de una palabra');
ok(substring.indexOf('sol naciente') !== -1,
  'conserva coincidencia por palabra completa');

ok(!_arquitecturaCompatible(
  'TEXTO ARRIBA, motivo debajo; alineación izquierda irregular',
  'Axial centrado'
), 'no permite alineación izquierda irregular dentro de un layout axial centrado');
ok(_arquitecturaCompatible(
  'TEXTO DIVIDIDO a ambos lados del motivo',
  'Axial centrado'
), 'permite texto dividido simétricamente dentro de un eje axial centrado');
ok(_arquitecturaCompatible(
  'CINTA ABIERTA oblicua cruza un borde del motivo',
  'Retícula áurea'
), 'permite cinta abierta con retícula áurea');
ok(_arquitecturaCompatible(
  'TEXTO DIVIDIDO a ambos lados del motivo',
  'Diagonal descendente'
), 'permite texto dividido en una composición diagonal descendente');

const modesWithRequiredCopy = _allowedVisualModes(true);
const modesWithoutRequiredCopy = _allowedVisualModes(false);
ok(modesWithRequiredCopy.length === 4 && modesWithRequiredCopy.indexOf('SOLO_OBJETO') === -1,
  'no borra el mensaje obligatorio con SOLO_OBJETO en asignación automática');
ok(modesWithRequiredCopy.indexOf('SOLO_TEXTO') !== -1
  && modesWithRequiredCopy.indexOf('TEXTO_DOMINANTE') !== -1
  && modesWithRequiredCopy.indexOf('BALANCEADO') !== -1
  && modesWithRequiredCopy.indexOf('OBJETO_DOMINANTE') !== -1,
  'con copy obligatorio conserva las cuatro jerarquías compatibles con el mensaje');
ok(modesWithoutRequiredCopy.length === 5
  && modesWithoutRequiredCopy.indexOf('SOLO_OBJETO') !== -1,
  'sin copy obligatorio permite competir a los cinco modos visuales');
ok(new Set(PROFILE_VISUAL_MODES.HEAVY).size === 5
  && new Set(PROFILE_VISUAL_MODES.SOFT).size === 5
  && new Set(PROFILE_VISUAL_MODES.MODERN).size === 5,
  'los perfiles HEAVY, SOFT y MODERN ponderan los cinco modos sin prohibirlos');

ok(_arquitecturaCompatible(
  'TEXTO CENTRADO ARRIBA; motivo centrado debajo; eje vertical limpio',
  'Axial centrado'
), 'ofrece arquitectura realmente centrada para el layout axial');
ok(_arquitecturaCompatible(
  'TEXTO CENTRADO DEBAJO del motivo; título compacto y eje vertical continuo',
  'Emblema circular'
), 'permite texto centrado bajo el motivo en emblema circular');
ok(_arquitecturaCompatible(
  'DIAGONAL descendente izquierda-derecha; sigue el eje de caída',
  'Diagonal descendente'
), 'la arquitectura diagonal descendente coincide con el layout descendente');
ok(!_arquitecturaCompatible(
  'DIAGONAL ascendente izquierda-derecha; cruza espacio negativo',
  'Diagonal descendente'
), 'no acepta una dirección diagonal opuesta al layout');
ok(_arquitecturaCompatible(
  'ÓRBITA PARCIAL alrededor del motivo; deja una abertura amplia',
  'Órbita radial'
), 'la órbita radial recibe una arquitectura específica y abierta');
ok(!_arquitecturaCompatible(
  'COLUMNA LATERAL izquierda; motivo al lado opuesto',
  'Axial centrado'
), 'rechaza columna lateral en layout axial');
ok(
  _fallbackTextArchitectureForLayout('Axial centrado') ===
    'TEXTO CENTRADO ARRIBA; motivo centrado debajo; eje vertical limpio y separación amplia.',
  'fallback axial genera arquitectura compatible y no conserva una instrucción contradictoria'
);

console.log('creative-relevance: ' + (checks - failures.length) + '/' + checks + ' checks passed');
if (failures.length) {
  failures.forEach(function (f) { console.error('FAIL: ' + f); });
  process.exitCode = 1;
}
