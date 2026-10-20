/* Copy derivado: el concepto se usa natural (sin VERSALES), el banco queda
   como último recurso. Ejecutar: node tests/copy-derivado.test.js */

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

/* --- 1) concepto descriptivo: natural, no VERSALES --- */
ok(_resolveSharedCopy('zapato dejado en la puerta de la iglesia', 'global_es') === 'Zapato dejado en la puerta de la iglesia',
  'concepto descriptivo se usa tal cual, sin convertir a VERSALES');
ok(_resolveSharedCopy('   niño   en brazos   del  maestro  ', 'global_es') === 'Niño en brazos del maestro',
  'normaliza espacios y respeta el contenido');
ok(_resolveSharedCopy('AGUILA CALVA', 'global_en') === 'AGUILA CALVA',
  'un concepto que el usuario escribió en versales NO se baja (init: idioma del usuario)');
ok(_resolveSharedCopy('nuevo amanecer', 'global_es') === 'Nuevo amanecer',
  'primera letra en mayúscula, resto natural');

/* --- 2) vacío total: banco como último recurso --- */
const bank = _resolveSharedCopy('', 'global_en');
ok(bank.length > 0 && bank === bank.toUpperCase(), 'sin concepto ni mensaje: frase del banco (versales por diseño)');
ok(SHARED_EXPLORE_COPY.en.indexOf(bank) !== -1, 'la frase de respaldo proviene del banco conocido');

/* --- 3) integración en el prompt (explore sin mensaje, con concepto) --- */
MOTOR_STATE.market = 'global_es';
MOTOR_STATE.region = 'global';
MOTOR_STATE.product = 'CAMISETA SOFT';
MOTOR_STATE.subniche = 'easter_global';
MOTOR_STATE.audienceSet = 'Auto';
MOTOR_STATE.audienceMulti = 'si';
MOTOR_STATE.groupMode = 'distintos';
MOTOR_STATE.designMode = 'contacto';
MOTOR_STATE.support = '';
MOTOR_STATE.explorationBrief = null;
MOTOR_STATE.stampSide = 'auto';
MOTOR_STATE.workflowMode = 'explore';
MOTOR_STATE.concept = 'zapato dejado en la puerta de la iglesia';
MOTOR_STATE.message = '';
let set = buildCandidate(resolveAudiences(), null);
let prompt = formatPrompt({ set: set });
ok(prompt.indexOf('MENSAJE EXACTO: Zapato dejado en la puerta de la iglesia') !== -1,
  'el header de explore cita el concepto natural');
ok(prompt.toLowerCase().indexOf('ZAPATO DEJADO EN LA PUERTA') === -1,
  'la IA de imagen nunca recibe el concepto convertido en VERSALES');
ok(prompt.indexOf('COPY LITERAL COMPARTIDO A/B/C (propuesto por el motor): «Zapato dejado en la puerta de la iglesia»') !== -1,
  'la ficha usa el copy derivado natural');
ok(prompt.toLowerCase().indexOf('ZAPATO DEJADO EN LA PUERTA DE LA IGLESIA»') === -1,
  'la ficha tampoco lo recibe en VERSALES');

/* --- 3b) modo contacto sin mensaje: la línea "derivado del concepto" --- */
MOTOR_STATE.workflowMode = 'new';
set = buildCandidate(resolveAudiences(), null);
prompt = formatPrompt({ set: set });
ok(prompt.indexOf('COPY LITERAL (derivado del concepto): «Zapato dejado en la puerta de la iglesia»') !== -1,
  'en modo contacto el copy derivado llega natural a las fichas');

/* --- 4) con mensaje del usuario, el mensaje manda y el concepto no se copia --- */
MOTOR_STATE.message = 'Vive por fe';
set = buildCandidate(resolveAudiences(), null);
prompt = formatPrompt({ set: set });
ok(prompt.indexOf('MENSAJE: Vive por fe') !== -1 || prompt.indexOf('MENSAJE EXACTO: Vive por fe') !== -1,
  'con mensaje explícito ese es el copy');
ok(prompt.indexOf('«Zapato dejado') === -1, 'el concepto no se estampa como copy cuando hay mensaje');

console.log((failures.length ? 'FAIL' : 'PASS') + ' copy-derivado (' + checks + ' aserciones, ' + failures.length + ' fallos)');
failures.forEach(function (msg) { console.error(' - ' + msg); });
process.exit(failures.length ? 1 : 0);
