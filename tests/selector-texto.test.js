/* Selector de texto en Variación (PR fix/selector-texto).
   Regla: manda la opción elegida por el usuario y su efecto depende del modo.
   - conservar_palabras: el mensaje escrito se conserva LITERALMENTE.
   - mismo_mensaje: mantiene significado/intención/audiencia, permite otra redacción.
   - nuevo_texto: crea un mensaje NUEVO desde concepto/familia/audiencia.
   La frase no autoriza introducir objetos ni alterar el concepto.

   Ejecutar: node tests/selector-texto.test.js
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
['data-mercados.js', 'data-audiencias.js', 'data-bancos.js', 'banco-global.js', 'data-estilos.js',
 'dominios.js', 'data-productos.js', 'memoria-local.js', 'motor-nucleo.js'
].forEach(function (f) {
  vm.runInThisContext(fs.readFileSync(path.join(JS, f), 'utf8'), { filename: f });
});

const FRASE = 'DIOS ESTÁ OBRANDO';
const MSG_RULE = 'La frase no autoriza por sí sola a introducir objetos ni a alterar el concepto.';

function promptFor(mode, message) {
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
  MOTOR_STATE.workflowMode = 'variation';
  MOTOR_STATE.concept = 'concepto base';
  MOTOR_STATE.message = message;
  MOTOR_STATE.imageReference = { name: 'x.png', size: 1, lastModified: 1, signature: 'x' };
  MOTOR_STATE.imageAnalysis = { concepto: 'idea', mensaje_visible: 'algo visible', simbolo_descripcion: 'un símbolo', funcion_simbolica: 'f', esencia_a_conservar: 'e' };
  MOTOR_STATE.variationOptions = { simbolo: 'conservar', paleta: 'renovar', textos: mode, esencia: '' };
  const set = buildCandidate(resolveAudiences(), null);
  return formatPrompt({ set: set });
}

/* --- conservar_palabras: mensaje literal --- */
const pConservar = promptFor('conservar_palabras', FRASE);
ok(pConservar.indexOf('conservar LITERALMENTE el mensaje proporcionado «' + FRASE + '»') !== -1,
  'conservar_palabras debe conservar literalmente el mensaje escrito');
ok(pConservar.indexOf('conservar literalmente las frases visibles de la referencia') === -1,
  'con el mensaje escrito, conservar_palabras NO debe mandar a la imagen');
ok(pConservar.indexOf(MSG_RULE) !== -1, 'debe incluir la regla del mensaje (no autoriza objetos)');

/* --- mismo_mensaje: reescribir manteniendo significado --- */
const pMismo = promptFor('mismo_mensaje', FRASE);
ok(pMismo.indexOf('mantener el significado, la intención y la audiencia del mensaje proporcionado «' + FRASE + '»') !== -1,
  'mismo_mensaje debe mantener significado/intención/audiencia del mensaje escrito');
ok(/redactar una frase nueva/.test(pMismo), 'mismo_mensaje debe permitir redacción distinta');
ok(pMismo.indexOf('conservar LITERALMENTE el mensaje proporcionado') === -1,
  'mismo_mensaje NO debe exigir literalidad');
ok(pMismo.indexOf(MSG_RULE) !== -1, 'mismo_mensaje debe incluir la regla del mensaje');

/* --- nuevo_texto: mensaje nuevo desde concepto (valor correcto, no 'nuevo') --- */
const pNuevo = promptFor('nuevo_texto', FRASE);
ok(pNuevo.indexOf('crear un mensaje NUEVO') !== -1, 'nuevo_texto debe crear un mensaje nuevo');
ok(pNuevo.indexOf('crea un copy nuevo, breve y pertinente al concepto, la familia y el mercado') !== -1,
  'nuevo_texto debe aparecer en los SELECTORES (bug: antes comparaba "nuevo")');
ok(pNuevo.indexOf('respeta literalmente la configuración de texto elegida') === -1,
  'nuevo_texto no debe caer en la rama vacía de SELECTORES');
ok(pNuevo.indexOf('conservar LITERALMENTE el mensaje proporcionado') === -1,
  'nuevo_texto no obliga a conservar el mensaje');
ok(pNuevo.indexOf(MSG_RULE) !== -1, 'nuevo_texto debe incluir la regla del mensaje');

/* --- La opción conservar_palabras en SELECTORES refleja el mensaje escrito --- */
ok(pConservar.indexOf('conserva LITERALMENTE el mensaje proporcionado «' + FRASE + '»') !== -1,
  'SELECTORES debe conservar literalmente el mensaje escrito');

console.log((failures.length ? 'FAIL' : 'PASS') + ' selector-texto (' + checks + ' aserciones, ' + failures.length + ' fallos)');
failures.forEach(function (m) { console.error(' - ' + m); });
process.exit(failures.length ? 1 : 0);
