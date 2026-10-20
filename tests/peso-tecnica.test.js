/* Peso visual exigido + técnica global del estilo por ficha.
   Ejecutar: node tests/peso-tecnica.test.js
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
function clearJerarquiaLocks() {
  ['A', 'B', 'C'].forEach(function (k) { setLockValue('colombia|todas', 'CAMISETA SOFT', 'jerarquia', k, 'Auto'); });
}

function baseState() {
  MOTOR_STATE.market = 'colombia';
  MOTOR_STATE.region = 'todas';
  MOTOR_STATE.product = 'CAMISETA SOFT';
  MOTOR_STATE.audienceSet = 'Auto';
  MOTOR_STATE.audienceMulti = 'si';
  MOTOR_STATE.groupMode = 'distintos';
  MOTOR_STATE.designMode = 'contacto';
  MOTOR_STATE.support = '';
  MOTOR_STATE.explorationBrief = null;
  MOTOR_STATE.stampSide = 'auto';
  MOTOR_STATE.workflowMode = 'new';
  MOTOR_STATE.concept = 'águila calva sobre el cañón';
  MOTOR_STATE.message = 'Aguanta firme';
}

/* --- 1) PESO VISUAL EXIGIDO reporta la franja correcta por jerarquía --- */
[['BALANCEADO', 'texto 45–55% del área · símbolo 45–55%'],
 ['OBJETO_DOMINANTE', 'símbolo 70–80% del área · texto 20–30%'],
 ['TEXTO_DOMINANTE', 'texto 70–80% del área · símbolo 20–30%'],
 ['SOLO_TEXTO', 'texto 100% · símbolo 0%']
].forEach(function (caseDef) {
  baseState();
  ['A', 'B', 'C'].forEach(function (k) { setLockValue('colombia|todas', 'CAMISETA SOFT', 'jerarquia', k, caseDef[0]); });
  const set = buildCandidate(resolveAudiences(), null);
  const prompt = formatPrompt({ set: set });
  ok(count(prompt, 'PESO VISUAL EXIGIDO — ' + caseDef[1]) === 3,
    'las 3 fichas ' + caseDef[0] + ' deben exigir la franja «' + caseDef[1] + '»');
  ok(prompt.indexOf('medición verificable a primera vista, no una sugerencia') !== -1,
    'el peso visual debe presentarse como regla verificable en ' + caseDef[0]);
  if (caseDef[0] === 'SOLO_TEXTO') {
    ok(prompt.indexOf('el arte completo son las letras del copy literal') !== -1,
      'SOLO_TEXTO debe aclarar que solo hay letras');
  }
  clearJerarquiaLocks();
});

/* --- 2) TÉCNICA GLOBAL obliga a dibujar las letras con la técnica del estilo --- */
baseState();
const set = buildCandidate(resolveAudiences(), null);
const prompt = formatPrompt({ set: set });
ok(count(prompt, 'TÉCNICA GLOBAL: todo el arte de esta ficha — símbolo, letras, fondo y detalles — se ejecuta con la técnica del estilo «') === 3,
  'cada ficha debe declarar la técnica global del estilo activo');
const estilosNoLettering = ['A', 'B', 'C'].filter(function (k) {
  return !/graffiti|street|lettering|sign paint/i.test(set[k].estilo);
});
ok(estilosNoLettering.length === 0 || prompt.indexOf('Prohibido dibujar el copy como graffiti') !== -1,
  'con estilos que no son lettering, el prompt debe prohibir graffiti/lettering ajeno en el copy');
ok(prompt.indexOf('TÉCNICA GLOBAL') !== -1 && prompt.indexOf('las letras también llevan la técnica del estilo') !== -1,
  'la regla debe cubrir explícitamente las letras');

/* --- 3) Las líneas nuevas no rompen el orden del bloque de ficha --- */
const i01a = prompt.indexOf('### 01A');
const iPeso = prompt.indexOf('PESO VISUAL EXIGIDO', i01a);
const iTec = prompt.indexOf('TÉCNICA GLOBAL', i01a);
ok(i01a !== -1 && iPeso !== -1 && iPeso < prompt.indexOf('CARA DEL ESTAMPADO: ', i01a),
  'el peso visual debe ir antes de la cara dentro de la ficha (acumula importancia temprana)');
ok(iTec !== -1 && iTec > prompt.indexOf('COMPATIBILIDAD ESTILO', i01a),
  'la técnica global debe seguir a la compatibilidad estilo × tratamiento');
ok(iTec !== -1 && iTec < prompt.indexOf('PRIORIDAD DE IDENTIDAD', i01a),
  'la técnica global debe ir antes de la prioridad de identidad');

console.log((failures.length ? 'FAIL' : 'PASS') + ' peso-tecnica (' + checks + ' aserciones, ' + failures.length + ' fallos)');
failures.forEach(function (msg) { console.error(' - ' + msg); });
process.exit(failures.length ? 1 : 0);
