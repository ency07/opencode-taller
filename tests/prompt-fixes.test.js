/* Test propio de los 5 fixes de prompt (rama fix/prompt-copy-hands-mockups).
   A diferencia de visual-prompt-contract (que inspecciona el código fuente),
   este test es black-box: ejecuta formatPrompt() y verifica el TEXTO EMITIDO,
   que es lo único que la IA de imagen realmente recibe.

   Ejecutar:  node tests/prompt-fixes.test.js
   Sale con código 1 si falla cualquier aserción. */

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
[
  'data-mercados.js',
  'data-audiencias.js',
  'data-bancos.js',
  'data-estilos.js',
  'dominios.js',
  'data-productos.js',
  'memoria-local.js',
  'motor-nucleo.js'
].forEach(function (f) {
  vm.runInThisContext(fs.readFileSync(path.join(JS, f), 'utf8'), { filename: f });
});

function ficha(jerarquia, extra) {
  const base = {
    estilo: 'Minimal Modern', audiencia: 'global_adult_en', jerarquiaVisual: jerarquia,
    objeto: 'campfire small enough to hold in talk',
    arquitectura: 'a', composicion: 'b', layout: 'Columna apilada',
    placement: 'pecho centrado', escalaProducto: 'media',
    formaSimbolo: 'c', tecnica: 'd', tratamiento: 'e',
    textoPrincipal: 'T', textoApoyo: 'A', textoTerciario: 'S',
    tipografia: 'Slab pesada', paleta: 'pal (modo: X)', familiaColor: 'f',
    fitAudiencia: 70, fitProducto: 60, densidad: 'Media', negativeSpace: 'abierto',
    distribucionTexto: 'texto en diagonal ascendente', integracionTexto: 'w', relacion: 'r'
  };
  if (extra) Object.keys(extra).forEach(function (k) { base[k] = extra[k]; });
  return base;
}
function count(out, sub) { return out.split(sub).length - 1; }

/* ---------- Caso real del fallo: explore + global_en + sin mensaje ---------- */
MOTOR_STATE.workflowMode = 'explore';
MOTOR_STATE.designMode = 'contacto';
MOTOR_STATE.market = 'global_en';
MOTOR_STATE.language = 'en';
MOTOR_STATE.product = 'CAMISETA SOFT';
MOTOR_STATE.subniche = 'auto';
MOTOR_STATE.concept = 'campfire small enough to hold in talk';
MOTOR_STATE.message = '';
MOTOR_STATE.support = '';

const SET1 = { A: ficha('BALANCEADO'), B: ficha('TEXTO_DOMINANTE'), C: ficha('OBJETO_DOMINANTE') };
const out = formatPrompt({ set: SET1 });

/* Fix 1: copy literal compartido, idéntico en A/B/C */
const lits = out.match(/COPY LITERAL COMPARTIDO A\/B\/C \(propuesto por el motor\): «([^»]+)»/g) || [];
ok(lits.length === 3, 'Fix1: las 3 fichas deben citar el copy literal (hay ' + lits.length + ')');
ok(new Set(lits).size === 1, 'Fix1: la frase debe ser IDÉNTICA en A/B/C (distintas: ' + new Set(lits).size + ')');
const frase = (out.match(/COPY LITERAL COMPARTIDO A\/B\/C \(propuesto por el motor\): «([^»]+)»/) || [])[1] || '';
ok(frase.length > 0, 'Fix1: la frase compartida no puede estar vacía');
ok(out.indexOf('define palabras exactas de una frase principal original') === -1, 'Fix1: no debe delegar inventar el copy a la IA de imagen');
ok(out.indexOf('MENSAJE EXACTO: ' + frase) !== -1, 'Fix1: la cabecera debe mostrar el mismo literal');

/* Fix 2: guardia anti-manos */
ok(out.indexOf('Prohibido añadir manos, brazos, personas') !== -1, 'Fix2: falta la guardia explícita anti-manos');

/* Fix 3: layout de hoja */
ok(/tres columnas, una por ficha del set/i.test(out), 'Fix3: falta el layout de hoja 3 columnas');
ok(out.indexOf('No agrupar ni omitir vistas') === -1, 'Fix3: sobrevive el imposible «no agrupar»');

/* Fix 4: sin duplicados */
ok(count(out, 'JERARQUÍA: aplica exactamente la jerarquía indicada en cada ficha') === 1, 'Fix4: JERARQUÍA general duplicada');
ok(count(out, 'TEXTO_DOMINANTE: el COPY TIPOGRÁFICO ocupa') === 1, 'Fix4: directiva TEXTO triplicada');
ok(count(out, 'OBJETO_DOMINANTE: el símbolo autorizado de esta ficha') === 1, 'Fix4: directiva OBJETO triplicada');

/* Fix 5: recap fija el mapeo ficha→jerarquía */
ok(out.indexOf('RECAP 01A: jerarquía=BALANCEADO') !== -1, 'Fix5: RECAP 01A debe fijar BALANCEADO');
ok(out.indexOf('RECAP 01B: jerarquía=TEXTO_DOMINANTE') !== -1, 'Fix5: RECAP 01B debe fijar TEXTO_DOMINANTE');
ok(out.indexOf('RECAP 01C: jerarquía=OBJETO_DOMINANTE') !== -1, 'Fix5: RECAP 01C debe fijar OBJETO_DOMINANTE');
ok(count(out, 'INTEGRACIÓN TEXTO-SÍMBOLO:') === 1, 'Fix5: integración solo en la ficha TEXTO_DOMINANTE');
ok(count(out, 'COMPOSICIÓN BALANCEADA:') === 1, 'Fix5: composición solo en la ficha BALANCEADO');
ok(count(out, 'CONTROL ABSOLUTO: no dibujar personas') === 0, 'Fix5: sin SOLO_TEXTO no debe haber CONTROL ABSOLUTO');

/* Sin rótulos pintados EN EL ARTE: los códigos de ficha viven en el texto del prompt
   y, en la hoja de presentación, solo como encabezados editoriales de columna */
ok(out.indexOf('Prohibido pintar códigos de ficha (01A/01B/01C), nombres de estilo, jerarquía, tratamiento o audiencia DENTRO de los dibujos, estampados y mockups') !== -1, 'Falta la prohibición de rotular dentro del arte');
ok(out.indexOf('únicamente como encabezados editoriales de columna (ver PRESENTACIÓN), nunca dentro de un estampado') !== -1, 'Falta el cierre anti-rótulos acotado a encabezados editoriales');

/* Determinismo: misma entrada → misma salida */
const outB = formatPrompt({ set: { A: ficha('BALANCEADO'), B: ficha('TEXTO_DOMINANTE'), C: ficha('OBJETO_DOMINANTE') } });
ok(out === outB, 'Regenerar con el mismo contexto debe dar el mismo prompt');

/* Endurecimiento píxel: OBJETO con texto acotado */
ok(count(out, 'TEXTO SUBORDINADO:') === 1, 'OBJETO_DOMINANTE debe acotar el texto a banda breve (1 ficha objeto)');

/* SOLO_TEXTO: excluye objeto y escena */
const outSolo = formatPrompt({ set: { A: ficha('SOLO_TEXTO'), B: ficha('TEXTO_DOMINANTE'), C: ficha('BALANCEADO') } });
ok(outSolo.indexOf('OBJETO: NINGUNO') !== -1, 'SOLO_TEXTO debe declarar objeto ninguno');
ok(outSolo.indexOf('SIN EXCEPCIONES: aunque el concepto nombre un objeto concreto') !== -1, 'SOLO_TEXTO debe prohibir dibujar el objeto sin excepciones');
ok(count(outSolo, 'CONTROL ABSOLUTO: no dibujar personas') === 1, 'SOLO_TEXTO debe traer CONTROL ABSOLUTO');

/* Modo new con mensaje: el literal del usuario manda, sin copy propuesto */
MOTOR_STATE.workflowMode = 'new';
MOTOR_STATE.message = 'HOLD FAST, SHINE BRIGHT';
const outNew = formatPrompt({ set: { A: ficha('BALANCEADO'), B: ficha('TEXTO_DOMINANTE'), C: ficha('OBJETO_DOMINANTE') } });
ok(count(outNew, 'HOLD FAST, SHINE BRIGHT') >= 3, 'Modo new: el mensaje literal debe estar en las 3 fichas');
ok(outNew.indexOf('COPY LITERAL COMPARTIDO') === -1, 'Modo new con mensaje: no debe proponer copy');
ok(outNew.indexOf('/CONTACTSHEET') !== -1, 'Modo new: cabecera CONTACTSHEET');

/* Identidad semántica: el copy deriva del concepto, nunca del banco genérico.
   Regression-lock del caso real: concepto 'niño en brazos del Maestro' debe
   dar su propio texto, jamás 'NACIDO PARA RODAR'. */
MOTOR_STATE.workflowMode = 'explore';
MOTOR_STATE.message = '';
MOTOR_STATE.concept = 'niño en brazos del Maestro sin miedo';
MOTOR_STATE.explorationBrief = null;
const outNino = formatPrompt({ set: { A: ficha('BALANCEADO'), B: ficha('TEXTO_DOMINANTE'), C: ficha('OBJETO_DOMINANTE') } });
const litsNino = outNino.match(/COPY LITERAL COMPARTIDO A\/B\/C \(propuesto por el motor\): «([^»]+)»/g) || [];
ok(litsNino.length === 3 && new Set(litsNino).size === 1, 'concepto gospel: copy literal idéntico en A/B/C');
ok(outNino.indexOf('«NIÑO EN BRAZOS DEL MAESTRO SIN MIEDO»') !== -1, 'el copy debe derivar del concepto literal');
ok(outNino.indexOf('NACIDO PARA RODAR') === -1, 'el banco genérico no debe decidir sobre un concepto real');
ok(outNino.indexOf('MENSAJE EXACTO: NIÑO EN BRAZOS DEL MAESTRO SIN MIEDO') !== -1, 'la cabecera muestra el derivado');

/* Contacto sin mensaje: literal derivado, no invención por ficha */
MOTOR_STATE.workflowMode = 'new';
MOTOR_STATE.message = '';
MOTOR_STATE.concept = 'cruz y roca firme';
MOTOR_STATE.explorationBrief = null;
const outContact = formatPrompt({ set: { A: ficha('BALANCEADO'), B: ficha('TEXTO_DOMINANTE'), C: ficha('OBJETO_DOMINANTE') } });
ok(outContact.indexOf('COPY PROPUESTO: escribir frase') === -1, 'contacto sin mensaje: no debe delegar inventar');
ok(count(outContact, '«CRUZ Y ROCA FIRME»') >= 3, 'contacto sin mensaje: literal derivado en las 3 fichas');

/* Vacío total: el banco solo cubre la ausencia de concepto y brief */
MOTOR_STATE.workflowMode = 'explore';
MOTOR_STATE.message = '';
MOTOR_STATE.concept = '';
MOTOR_STATE.explorationBrief = { concept: '', familyId: null, familyLabel: 'x' };
const outVacio = formatPrompt({ set: { A: ficha('BALANCEADO'), B: ficha('TEXTO_DOMINANTE'), C: ficha('OBJETO_DOMINANTE') } });
const litsVacio = outVacio.match(/COPY LITERAL COMPARTIDO A\/B\/C \(propuesto por el motor\): «([^»]+)»/g) || [];
ok(litsVacio.length === 3 && new Set(litsVacio).size === 1, 'vacío total: el banco da literal idéntico como último recurso');

const passed = failures.length === 0;
console.log((passed ? 'PASS' : 'FAIL') + '  prompt-fixes  (' + checks + ' aserciones, ' + failures.length + ' fallos)');
failures.forEach(function (f) { console.log('  X ' + f); });
process.exit(passed ? 0 : 1);
