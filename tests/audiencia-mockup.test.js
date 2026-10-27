/* Audiencia real: perfil humano en el prompt + mockup con edad/género/talla.
   Ejecutar: node tests/audiencia-mockup.test.js
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
function lockAudience(value, marketKey) {
  marketKey = marketKey || 'colombia|todas';
  ['A', 'B', 'C'].forEach(function (k) { setLockValue(marketKey, 'CAMISETA SOFT', 'audiencia', k, value); });
}
function clearAudience(marketKey) {
  marketKey = marketKey || 'colombia|todas';
  ['A', 'B', 'C'].forEach(function (k) { setLockValue(marketKey, 'CAMISETA SOFT', 'audiencia', k, 'Auto'); });
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

/* --- 1) Infantil: perfil humano + modelo infantil + talla de niño --- */
baseState();
MOTOR_STATE.subniche = 'celebracion_col';
lockAudience('infantil_col');
let set = buildCandidate(resolveAudiences(), null);
let prompt = formatPrompt({ set: set });
ok(count(prompt, 'AUDIENCIA DE LA FICHA: «Infantil Colombia»') === 3, 'las 3 fichas deben nombrar la audiencia en palabras humanas');
ok(count(prompt, 'modelo infantil') >= 3, 'la audiencia infantil debe exigir modelo infantil en el mockup');
ok(prompt.indexOf('talla infantil') !== -1, 'la audiencia infantil debe exigir talla infantil');
ok(prompt.indexOf('un modelo adulto genérico no valida') !== -1, 'debe invalidar el modelo adulto genérico');
ok(prompt.indexOf('infantil_col') !== -1, 'el id de audiencia debe seguir en el prompt para las validaciones');
ok(prompt.indexOf('Evita:') !== -1 && prompt.indexOf('Códigos que le hablan:') !== -1, 'el prompt debe incluir rechazos y códigos del perfil');
clearAudience();

/* --- 2) Mujer adulta: modelo mujer adulta y corte femenino --- */
baseState();
MOTOR_STATE.subniche = 'humor_costeno';
MOTOR_STATE.region = 'costa_caribe';
const costeñoKey = 'colombia|costa_caribe';
lockAudience('coste_adulta_f', costeñoKey);
set = buildCandidate(resolveAudiences(), null);
prompt = formatPrompt({ set: set });
ok(prompt.indexOf('AUDIENCIA DE LA FICHA: «Costeña adulta 29-55»') !== -1, 'la etiqueta debe llegar al prompt');
ok(prompt.indexOf('modelo mujer adulta con corte y talla femeninos') !== -1, 'mujer adulta: modelo mujer adulta y corte femenino');
clearAudience(costeñoKey);

/* --- 3) Hombre adulto --- */
baseState();
MOTOR_STATE.subniche = 'humor_costeno';
MOTOR_STATE.region = 'costa_caribe';
lockAudience('coste_adulto_m', costeñoKey);
set = buildCandidate(resolveAudiences(), null);
prompt = formatPrompt({ set: set });
ok(prompt.indexOf('modelo hombre adulto con corte y talla masculinos') !== -1, 'hombre adulto: modelo hombre adulto y corte masculino');
clearAudience(costeñoKey);

/* --- 4) Unisex/amplia: modelo acorde al perfil, sin forzar género --- */
baseState();
MOTOR_STATE.subniche = 'humor_costeno';
MOTOR_STATE.region = 'costa_caribe';
lockAudience('unisex_nacional', costeñoKey);
set = buildCandidate(resolveAudiences(), null);
prompt = formatPrompt({ set: set });
ok(prompt.indexOf('modelo o grupo acorde al perfil declarado') !== -1, 'unisex debe pedir modelo o grupo acorde al perfil');
clearAudience(costeñoKey);

/* --- 5) Audiencias colectivas exigen un grupo, no una persona genérica --- */
baseState();
MOTOR_STATE.market = 'gospel_es';
MOTOR_STATE.region = 'global';
MOTOR_STATE.subniche = 'gospel_es';
const gospelKey = 'gospel_es|global';
lockAudience('gospel_familia', gospelKey);
set = buildCandidate(resolveAudiences(), null);
prompt = formatPrompt({ set: set });
ok(prompt.indexOf('grupo familiar reconocible de al menos 3 personas en dos o más generaciones') !== -1,
  'familia cristiana exige grupo familiar visible multigeneracional');
ok(prompt.indexOf('un modelo adulto genérico no valida familia') !== -1,
  'adulto solo no puede pasar como representación de familia');
clearAudience(gospelKey);

lockAudience('gospel_pareja', gospelKey);
set = buildCandidate(resolveAudiences(), null);
prompt = formatPrompt({ set: set });
ok(prompt.indexOf('pareja adulta de dos personas') !== -1, 'pareja exige dos personas en el mockup');
clearAudience(gospelKey);

lockAudience('gospel_comunidad', gospelKey);
set = buildCandidate(resolveAudiences(), null);
prompt = formatPrompt({ set: set });
ok(prompt.indexOf('grupo pequeño de al menos 3 personas') !== -1, 'comunidad exige grupo diverso');
clearAudience(gospelKey);

/* --- 6) La hoja exige mockup acorde a la audiencia de cada columna --- */
const mockup = getMockupRule('CAMISETA SOFT');
ok(mockup.indexOf('persona o grupo que corresponda a la AUDIENCIA DE ESA COLUMNA') !== -1, 'la hoja debe permitir persona o grupo según la audiencia');
ok(mockup.indexOf('talla infantil') !== -1 && mockup.indexOf('corte femenino') !== -1 && mockup.indexOf('corte masculino') !== -1,
  'la hoja debe fijar talla/corte por género y edad');
ok(mockup.indexOf('familia exige grupo familiar visible multigeneracional') !== -1 && mockup.indexOf('pareja exige dos personas') !== -1 && mockup.indexOf('comunidad exige grupo diverso') !== -1,
  'el contrato común de mockup fija las reglas para audiencias colectivas');

console.log((failures.length ? 'FAIL' : 'PASS') + ' audiencia-mockup (' + checks + ' aserciones, ' + failures.length + ' fallos)');
failures.forEach(function (msg) { console.error(' - ' + msg); });
process.exit(failures.length ? 1 : 0);
