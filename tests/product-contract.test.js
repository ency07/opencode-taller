/* Fase 1: contrato por producto. Todos los productos deben llevar regla de
   producto, márgenes de seguridad, mockup comercial y preparación técnica. */
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

function promptFor(product) {
  MOTOR_STATE.market = 'global_en';
  MOTOR_STATE.region = 'global';
  MOTOR_STATE.product = product;
  MOTOR_STATE.subniche = 'auto';
  MOTOR_STATE.audienceSet = 'Auto';
  MOTOR_STATE.audienceMulti = 'no';
  MOTOR_STATE.groupMode = 'distintos';
  MOTOR_STATE.designMode = 'contacto';
  MOTOR_STATE.support = '';
  MOTOR_STATE.printMethod = 'auto';
  MOTOR_STATE.capApplication = 'auto';
  MOTOR_STATE.stampSide = 'auto';
  MOTOR_STATE.aestheticPreference = 'auto';
  MOTOR_STATE.dominio = 'auto';
  MOTOR_STATE.explorationBrief = null;
  MOTOR_STATE.workflowMode = 'new';
  MOTOR_STATE.serie = '';
  MOTOR_STATE.concept = 'The King Reigns';
  MOTOR_STATE.message = 'THE KING REIGNS FOREVER';
  const set = buildCandidate(resolveAudiences(), null);
  return formatPrompt({ set: set });
}

const products = Object.keys(PRODUCT_BIAS);
ok(products.length >= 10, 'deben existir al menos 10 productos con contrato');

for (const product of products) {
  const prompt = promptFor(product);
  const safe = String((PRODUCT_BIAS[product] || {}).safeMargin || '').trim();
  ok(prompt.includes('PRODUCTO / UBICACION / ESCALA'), product + ': falta producto/ubicación/escala');
  ok(prompt.includes('MARGENES DE SEGURIDAD: ' + safe), product + ': falta margen de seguridad específico');
  ok(prompt.includes('PRODUCTO: ' + product), product + ': falta la regla de producto');
  ok(prompt.includes('REGLAS DEL MOCKUP COMERCIAL'), product + ': falta la regla de mockup comercial');
  ok(prompt.includes('ACABADO / PREPARACION TECNICA'), product + ': falta la preparación técnica');
}

if (failures.length) {
  console.error('FAIL product-contract');
  failures.forEach(f => console.error(' - ' + f));
  process.exit(1);
}
console.log('PASS product-contract: ' + checks + ' aserciones, 0 fallos');
