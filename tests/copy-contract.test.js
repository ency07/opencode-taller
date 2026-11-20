/* P0: contrato estricto de copy. El mensaje autorizado se conserva literal y
   no se inventa ni se añade texto secundario cuando el apoyo está vacío. */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.join(__dirname, '..');

global.window = global;
global.document = {
  getElementById: () => null,
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

let checks = 0;
const failures = [];
function ok(cond, msg) { checks++; if (!cond) failures.push(msg); }

function promptFor(cfg) {
  MOTOR_STATE.market = cfg.market;
  MOTOR_STATE.region = 'global';
  MOTOR_STATE.product = 'CAMISETA SOFT';
  MOTOR_STATE.subniche = 'auto';
  MOTOR_STATE.audienceSet = cfg.audience;
  MOTOR_STATE.audienceMulti = 'no';
  MOTOR_STATE.groupMode = 'distintos';
  MOTOR_STATE.designMode = 'contacto';
  MOTOR_STATE.support = cfg.support;
  MOTOR_STATE.printMethod = cfg.printMethod || 'auto';
  MOTOR_STATE.explorationBrief = null;
  MOTOR_STATE.workflowMode = 'new';
  MOTOR_STATE.serie = '';
  MOTOR_STATE.concept = cfg.concept;
  MOTOR_STATE.message = cfg.message;
  const set = buildCandidate(resolveAudiences(), null);
  return formatPrompt({ set: set });
}

/* Caso A: The King Reigns — sin mensaje secundario. */
const king = promptFor({
  market: 'gospel_en',
  audience: 'gospel_comunidad',
  concept: 'The King Reigns',
  message: 'THE KING REIGNS FOREVER',
  support: ''
});
ok(king.includes('THE KING REIGNS FOREVER'), 'A: el mensaje principal debe aparecer literalmente');
ok(!king.includes('EVERY KNEE SHALL BOW'), 'A: no debe aparecer el mensaje secundario no autorizado');
ok(!king.includes('no indicado; no se imprime'), 'A: no debe quedar un placeholder interpretable como texto');
ok(king.includes('apoyo: NINGUNO; no imprimir texto secundario'), 'A: el apoyo vacío debe declararse como ninguno');
ok(king.includes('CONTRATO DE COPY A/B/C'), 'A: las tres fichas deben recibir el contrato de copy');
ok(king.includes('RESOLUCIÓN DE CONTRADICCIONES'), 'A: debe resolver contradicciones de layout/firma/marco');
ok(!king.includes('EVERY KNEE'), 'A: no debe haber referencias bíblicas inventadas');

/* Caso B: Fearless Generation — con mensaje secundario autorizado. */
const fearless = promptFor({
  market: 'global_en',
  audience: 'global_family_en',
  concept: 'Fearless Generation',
  message: 'BORN TO STAND FIRM',
  support: 'FEAR DOES NOT DEFINE US'
});
ok(fearless.includes('BORN TO STAND FIRM'), 'B: el mensaje principal debe aparecer literalmente');
ok(fearless.includes('FEAR DOES NOT DEFINE US'), 'B: el mensaje secundario autorizado debe aparecer literalmente');
ok(!fearless.includes('EVERY KNEE SHALL BOW'), 'B: no debe inventarse texto adicional');
ok(fearless.includes('CONTRATO DE COPY A/B/C'), 'B: las tres fichas deben recibir el contrato de copy');
ok(fearless.includes('RESOLUCIÓN DE CONTRADICCIONES'), 'B: debe resolver la contradicción del layout con firma');

/* Caso C: Camina por fe — gospel ES, con apoyo autorizado. */
const camina = promptFor({
  market: 'gospel_es',
  audience: 'gospel_comunidad',
  concept: 'Camina por fe',
  message: 'CAMINA POR FE',
  support: 'DIOS GUÍA CADA PASO'
});
ok(camina.includes('CAMINA POR FE'), 'C: el mensaje principal no debe traducirse');
ok(camina.includes('DIOS GUÍA CADA PASO'), 'C: el mensaje secundario debe conservarse literal');
ok(!camina.includes('EVERY KNEE SHALL BOW'), 'C: no debe añadirse texto no autorizado');
ok(camina.includes('CONTRATO DE COPY A/B/C'), 'C: las tres fichas deben recibir el contrato de copy');
ok(camina.includes('RESOLUCIÓN DE CONTRADICCIONES'), 'C: debe resolver la superposición cuando el layout separa');

/* Preparación DTF: la misma identidad artística, con verificaciones técnicas. */
const dtf = promptFor({
  market: 'gospel_en',
  audience: 'gospel_comunidad',
  concept: 'The King Reigns',
  message: 'THE KING REIGNS FOREVER',
  support: '',
  printMethod: 'dtf'
});
ok(dtf.includes('PREPARACIÓN DTF'), 'DTF: debe incluir la preparación técnica');
ok(dtf.includes('grosor de trazo') && dtf.includes('separación visible') && dtf.includes('contraste adecuado'), 'DTF: debe verificar trazo, separación y contraste');
ok(dtf.includes('transparencias solo si el flujo RIP las respalda'), 'DTF: no debe asumir transparencias sin confirmar');
ok(dtf.includes('no añadas degradados ambientales ni de fondo'), 'DTF: no debe autorizar degradados de fondo');

if (failures.length) {
  console.error('FAIL copy-contract');
  failures.forEach(f => console.error(' - ' + f));
  process.exit(1);
}
console.log('PASS copy-contract: ' + checks + ' aserciones, 0 fallos');
