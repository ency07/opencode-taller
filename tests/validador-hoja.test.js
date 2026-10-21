/* Validador de hoja: contrato por ficha, prompt de validación y parser JSON.
   Ejecutar: node tests/validador-hoja.test.js
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
const els = {};
global.document = {
  getElementById: function (id) {
    return els[id] || null;
  },
  querySelectorAll: function () { return []; }
};

const JS = path.join(ROOT, 'js');
['data-mercados.js', 'data-audiencias.js', 'data-bancos.js', 'data-estilos.js',
 'dominios.js', 'data-productos.js', 'memoria-local.js', 'motor-nucleo.js',
 'ia-client.js', 'ia-analisis.js', 'ia-validador.js'
].forEach(function (f) {
  vm.runInThisContext(fs.readFileSync(path.join(JS, f), 'utf8'), { filename: f });
});

/* baseState solo para fichas */
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
['A', 'B', 'C'].forEach(function (k) {
  setLockValue('colombia|todas', 'CAMISETA SOFT', 'estilo', k, 'Barroco Ornamental');
});
const set = buildCandidate(resolveAudiences(), null);
const prompt = formatPrompt({ set: set });

/* el validador se alimenta del textarea out cuando no hay LAST_RESULT */
els.out = { value: prompt };

/* --- 1) extracción desde prompt --- */
const contrato = PODValidador.extraerDePrompt(prompt);
ok(Array.isArray(contrato) && contrato.length === 3, 'extraerDePrompt debe reconstruir las 3 fichas');
ok(contrato[0].ficha === '01A' && contrato[1].ficha === '01B' && contrato[2].ficha === '01C', 'ids de ficha correctos');
ok(contrato.every(function (f) { return f.peso.indexOf('%') !== -1; }), 'peso exigido declarado en las 3 fichas');

/* --- 2) extraerContrato usa LAST_RESULT si existe --- */
global.__podSet = set;
vm.runInThisContext('try { LAST_RESULT = { set: global.__podSet }; } catch (e) {}');
const contratoLR = PODValidador.extraerContrato();
ok(Array.isArray(contratoLR) && contratoLR.length === 3, 'extraerContrato debe leer LAST_RESULT');
ok(contratoLR[0].estilo === 'Barroco Ornamental', 'estilo del lock debe fluir al contrato');
ok(contratoLR.every(function (f) { return f.jerarquia && f.peso; }), 'jerarquía y peso presentes en todas las fichas');
ok(contratoLR.every(function (f) { return f.cara === 'frente' || f.cara === 'espalda'; }), 'cara declarada');
ok(contratoLR[0].objeto === (set.A.objeto || ''), 'objeto coincide con el set');

/* --- 3) prompt de validación --- */
const vPrompt = PODValidador.construirPromptValidador(contratoLR, 'tres columnas');
ok(vPrompt.indexOf('SOLO un JSON válido') !== -1, 'exige JSON puro');
ok(vPrompt.indexOf('CONTRATO POR FICHA') !== -1, 'declara el contrato');
ok(vPrompt.indexOf('«Barroco Ornamental» (inmutable)') !== -1, 'estilos inmutables declarados');
ok(vPrompt.split('\n01').length >= 4, 'una línea por ficha');
ok(vPrompt.indexOf('objetos_inventados') !== -1 && vPrompt.indexOf('textos_inventados') !== -1 &&
   vPrompt.indexOf('jerarquia_medida') !== -1 && vPrompt.indexOf('fondo_ok') !== -1 &&
   vPrompt.indexOf('espalda_ok') !== -1 && vPrompt.indexOf('estilo_ok') !== -1, 'los 6 criterios declarados');
ok(vPrompt.indexOf('NO marques ejecuciones propias del estilo asignado') !== -1, 'el validador respeta la técnica de taller del estilo');
ok(vPrompt.indexOf('"fichas":[{"ficha":"01A"') !== -1, 'formato exacto con ejemplo 01A');

/* --- 4) parser de veredictos --- */
ok(PODValidador.parseVerdict('```json\n{"resumen":"x"}\n```').resumen === 'x', 'JSON con cerca de markdown ok');
ok(PODValidador.parseVerdict('prefacio texto {"resumen":"y"} colón').resumen === 'y', 'JSON entremezclado ok');
ok(PODValidador.parseVerdict('no es json') === null, 'texto basura da null');
ok(PODValidador.parseVerdict('{"resumen":"z"') === null, 'JSON incompleto da null (sin romper)');

/* --- 5) estático: panel y script conectados en index.html --- */
const idx = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
ok(idx.indexOf('js/ia-validador.js') !== -1, 'index.html incluye ia-validador.js');
ok(idx.indexOf('id="btnValidarHoja"') !== -1 && idx.indexOf('id="sheetUpload"') !== -1 &&
   idx.indexOf('id="validadorStatus"') !== -1 && idx.indexOf('id="validadorRes"') !== -1,
  'panel del validador presente en index.html');
ok(idx.indexOf('id="btnCopy"') !== -1, 'el botón copiar queda intacto (el validador no bloquea nada)');

console.log((failures.length ? 'FAIL' : 'PASS') + ' validador-hoja (' + checks + ' aserciones, ' + failures.length + ' fallos)');
failures.forEach(function (msg) { console.error(' - ' + msg); });
process.exit(failures.length ? 1 : 0);
