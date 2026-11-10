/* Fix #2 — Cumplimiento de audiencias en el validador de hoja.
   Pruebas automatizadas de comportamiento.
   Ejecutar: node tests/fix2-audiencia-validador.test.js
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
  getElementById: function (id) { return els[id] || null; },
  querySelectorAll: function () { return []; }
};

const JS = path.join(ROOT, 'js');
['data-mercados.js', 'data-audiencias.js', 'data-bancos.js', 'data-estilos.js',
 'dominios.js', 'data-productos.js', 'memoria-local.js', 'motor-nucleo.js',
 'ia-client.js', 'ia-analisis.js', 'ia-validador.js'
].forEach(function (f) {
  vm.runInThisContext(fs.readFileSync(path.join(JS, f), 'utf8'), { filename: f });
});

function lockAudience(value, marketKey) {
  marketKey = marketKey || 'colombia|todas';
  ['A', 'B', 'C'].forEach(function (k) { setLockValue(marketKey, 'CAMISETA SOFT', 'audiencia', k, value); });
}
function clearAudience(marketKey) {
  marketKey = marketKey || 'colombia|todas';
  ['A', 'B', 'C'].forEach(function (k) { setLockValue(marketKey, 'CAMISETA SOFT', 'audiencia', k, 'Auto'); });
}

/* --- 0) Helper _audienceMockupExpectation --- */
ok(typeof PODValidador._audienceMockupExpectation === 'function', 'helper _audienceMockupExpectation exportado');
ok(PODValidador._audienceMockupExpectation('infantil_col').indexOf('modelo infantil') !== -1,
  'infantil → modelo infantil');
ok(PODValidador._audienceMockupExpectation('infantil_col').indexOf('talla infantil') !== -1,
  'infantil → talla infantil');
ok(PODValidador._audienceMockupExpectation('coste_adulta_f').indexOf('modelo mujer') !== -1,
  'femenina → modelo mujer');
ok(PODValidador._audienceMockupExpectation('coste_adulta_f').indexOf('corte y talla femeninos') !== -1,
  'femenina → corte y talla femeninos');
ok(PODValidador._audienceMockupExpectation('coste_adulto_m').indexOf('modelo hombre') !== -1,
  'masculina → modelo hombre');
ok(PODValidador._audienceMockupExpectation('coste_adulto_m').indexOf('corte y talla masculinos') !== -1,
  'masculina → corte y talla masculinos');
ok(PODValidador._audienceMockupExpectation('unisex_nacional').indexOf('modelo acorde al perfil') !== -1,
  'unisex → modelo acorde al perfil');
ok(PODValidador._audienceMockupExpectation('unisex_nacional').indexOf('sin forzar género') !== -1,
  'unisex → sin forzar género');

/* --- 1) Helper _truncarReglaMockup no corta mid-frase y conserva audiencia --- */
ok(typeof PODValidador._truncarReglaMockup === 'function', 'helper _truncarReglaMockup exportado');
const mockCS = getMockupRule('CAMISETA SOFT');
ok(mockCS.length > 1400, 'CAMISETA SOFT mockup > 1400 (caso de truncado)');
const fragCS = PODValidador._truncarReglaMockup(mockCS, 3000);
ok(fragCS.length === mockCS.length, 'con límite 3000 no trunca la regla completa de CAMISETA SOFT');
ok(fragCS.indexOf('persona acorde a la AUDIENCIA DE ESA COLUMNA') !== -1,
  'el fragmento conserva la instrucción de audiencia');
ok(fragCS.indexOf('corte femenino') !== -1 && fragCS.indexOf('corte masculino') !== -1,
  'el fragmento conserva corte femenino/masculino');
/* truncado a 1400 con límite pequeño no corta mid-frase */
const fragSmall = PODValidador._truncarReglaMockup(mockCS, 1400);
ok(fragSmall.length <= 1400, 'truncado respeta el límite');
ok(fragSmall.charAt(fragSmall.length - 1) !== ' ', 'sin espacio colgante');
/* no corta a mitad de palabra: último char debe ser puntuación o letra final de palabra */
const lastChar = fragSmall.charAt(fragSmall.length - 1);
ok(lastChar === '.' || lastChar === ';' || lastChar === ')' || lastChar === 'i' || lastChar === 's' || lastChar === 'a',
  'el corte no cae a mitad de palabra (último char: ' + JSON.stringify(lastChar) + ')');

/* --- 2) Productos sin regla específica de audiencia --- */
['HOODIE', 'GORRA', 'MUG', 'MOCHILA'].forEach(function (prod) {
  const r = getMockupRule(prod);
  const f = PODValidador._truncarReglaMockup(r, 3000);
  ok(f.length === r.length, prod + ': regla corta no se trunca');
  ok(f.length > 0, prod + ': regla no vacía');
});

/* --- 3) Set con audiencias distintas: contrato por ficha incluye audiencia --- */
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
MOTOR_STATE.subniche = 'celebracion_col';
MOTOR_STATE.region = 'todas';

/* Forzar audiencias distintas mediante locks (bajo la clave market|region correcta) */
clearAudience('colombia|todas');
setLockValue('colombia|todas', 'CAMISETA SOFT', 'audiencia', 'A', 'infantil_col');
setLockValue('colombia|todas', 'CAMISETA SOFT', 'audiencia', 'B', 'coste_adulta_f');
setLockValue('colombia|todas', 'CAMISETA SOFT', 'audiencia', 'C', 'coste_adulto_m');

const set = buildCandidate(resolveAudiences(), null);
const prompt = formatPrompt({ set: set });

els.out = { value: prompt };
global.__podSet = set;
vm.runInThisContext('try { LAST_RESULT = { set: global.__podSet }; } catch (e) {}');

const contrato = PODValidador.extraerContrato();
ok(Array.isArray(contrato) && contrato.length === 3, 'contrato de 3 fichas');
ok(contrato[0].audiencia === 'infantil_col', 'ficha A audiencia infantil_col');
ok(contrato[1].audiencia === 'coste_adulta_f', 'ficha B audiencia coste_adulta_f');
ok(contrato[2].audiencia === 'coste_adulto_m', 'ficha C audiencia coste_adulto_m');

const vPrompt = PODValidador.construirPromptValidador(contrato, PODValidador._truncarReglaMockup(getMockupRule('CAMISETA SOFT'), 3000));
ok(vPrompt.indexOf('audiencia ID=infantil_col') !== -1, 'contrato incluye audiencia infantil');
ok(vPrompt.indexOf('audiencia ID=coste_adulta_f') !== -1, 'contrato incluye audiencia femenina');
ok(vPrompt.indexOf('audiencia ID=coste_adulto_m') !== -1, 'contrato incluye audiencia masculina');
ok(vPrompt.indexOf('audiencia_ok') !== -1, 'criterio audiencia_ok presente');
ok(vPrompt.indexOf('modelo infantil') !== -1, 'instrucción infantil presente');
ok(vPrompt.indexOf('corte y talla femeninos') !== -1, 'instrucción femenina presente');
ok(vPrompt.indexOf('corte y talla masculinos') !== -1, 'instrucción masculina presente');
ok(vPrompt.indexOf('INDETERMINADO') !== -1, 'permite resultado INDETERMINADO');
ok(vPrompt.indexOf('evaluar de forma independiente') !== -1, 'evaluación independiente declarada');
ok(vPrompt.indexOf('"audiencia_ok":true') !== -1, 'audiencia_ok en formato JSON');

/* --- 4) Productos con y sin reglas específicas --- */
MOTOR_STATE.product = 'HOODIE';
const setH = buildCandidate(resolveAudiences(), null);
const promptH = formatPrompt({ set: setH });
const contratoH = PODValidador.extraerDePrompt(promptH);
ok(Array.isArray(contratoH) && contratoH.length === 3, 'HOODIE: 3 fichas extraídas');
const vPromptH = PODValidador.construirPromptValidador(contratoH, PODValidador._truncarReglaMockup(getMockupRule('HOODIE'), 3000));
ok(vPromptH.indexOf('audiencia_ok') !== -1, 'HOODIE: criterio audiencia_ok presente');
MOTOR_STATE.product = 'CAMISETA SOFT';

/* --- 5) JSON inválido / incompleto: manejo seguro --- */
ok(PODValidador.parseVerdict('no es json') === null, 'JSON inválido → null');
ok(PODValidador.parseVerdict('{"resumen":"z"') === null, 'JSON incompleto → null');
ok(PODValidador.parseVerdict('```json\n{"resumen":"x","fichas":[{"ficha":"01A","audiencia_ok":null},{"ficha":"01B","audiencia_ok":true},{"ficha":"01C","audiencia_ok":true}]}\n```').fichas[0].audiencia_ok === null,
  'audiencia_ok null (INDETERMINADO) parseable');

/* --- 6) Unisex no impone género --- */
ok(PODValidador._audienceMockupExpectation('unisex_nacional').indexOf('sin forzar género') !== -1,
  'unisex no impone género');

/* limpieza de locks */
clearAudience('colombia|todas');

console.log((failures.length ? 'FAIL' : 'PASS') + ' fix2-audiencia-validador (' + checks + ' aserciones, ' + failures.length + ' fallos)');
failures.forEach(function (msg) { console.error(' - ' + msg); });
process.exit(failures.length ? 1 : 0);
