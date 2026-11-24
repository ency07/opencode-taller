/* Etapa 1 (multiproducto): el bloque «REGLAS DEL MOCKUP COMERCIAL» debe usar
   lenguaje acorde a la superficie del producto:
     - prenda : CAMISETA SOFT, CAMISETA APPAREL, HOODIE, ILUSTRACION PREMIUM APPAREL
     - pared  : DISPLATE (nunca sobre cuerpo humano)
     - objeto : GORRA, MUG, MOCHILA, TOTE BAG, FUNDA MÓVIL
   No debe imponerse lenguaje textil a pared ni a objetos, y deben conservarse
   las reglas específicas de cada producto (regla, placement, vista, prep). */
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

const PRODUCTOS = [
  'CAMISETA SOFT', 'CAMISETA APPAREL', 'HOODIE', 'ILUSTRACION PREMIUM APPAREL',
  'DISPLATE', 'GORRA', 'MUG', 'MOCHILA', 'TOTE BAG', 'FUNDA MÓVIL'
];
const SUPERFICIE = {
  'CAMISETA SOFT': 'prenda', 'CAMISETA APPAREL': 'prenda',
  'HOODIE': 'prenda', 'ILUSTRACION PREMIUM APPAREL': 'prenda',
  'DISPLATE': 'pared',
  'GORRA': 'objeto', 'MUG': 'objeto', 'MOCHILA': 'objeto',
  'TOTE BAG': 'objeto', 'FUNDA MÓVIL': 'objeto'
};
const VISTA = {
  'CAMISETA SOFT': 'camiseta',
  'CAMISETA APPAREL': 'prenda fashion',
  'HOODIE': 'hoodie',
  'ILUSTRACION PREMIUM APPAREL': 'prenda premium',
  'DISPLATE': 'placa mural',
  'GORRA': 'gorra',
  'MUG': 'taza',
  'MOCHILA': 'mochila',
  'TOTE BAG': 'bolso',
  'FUNDA MÓVIL': 'funda'
};

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

ok(typeof getProductSurface === 'function', 'getProductSurface está disponible');
ok(PRODUCTOS.length === Object.keys(PRODUCT_BIAS).length,
  'los 10 productos del catálogo quedan cubiertos por el contrato');

for (const product of PRODUCTOS) {
  const surface = getProductSurface(product);
  const prompt = promptFor(product);

  /* Reglas específicas conservadas */
  ok(surface === SUPERFICIE[product], product + ': superficie esperada ' + SUPERFICIE[product]);
  ok(prompt.includes('PRODUCTO: ' + product), product + ': falta la regla de producto');
  ok(prompt.includes(String(PRODUCT_RULES[product] || '')), product + ': regla de producto alterada');
  ok(prompt.includes(String(PLACEMENT[product] || '')), product + ': falta el placement del producto');
  ok(prompt.includes('PRODUCTO / UBICACION / ESCALA'), product + ': falta ubicación/escala');
  ok(prompt.includes('REGLAS DEL MOCKUP COMERCIAL'), product + ': falta el bloque de mockup');
  ok(prompt.includes('ACABADO / PREPARACION TECNICA'), product + ': falta la preparación técnica');
  ok(prompt.includes(VISTA[product]), product + ': falta la vista específica (' + VISTA[product] + ')');

  if (surface === 'prenda') {
    ok(/el modelo que lleva la prenda/.test(prompt), product + ': conserva el lenguaje de prenda');
    ok(prompt.includes('camiseta de corte y talla infantil'), product + ': detalle de talla propio de prenda');
  } else if (surface === 'pared') {
    ok(!/el modelo que lleva la prenda/.test(prompt), 'DISPLATE: lenguaje de prenda impropio');
    ok(!/camiseta de corte y talla/.test(prompt), 'DISPLATE: instrucción textil impropia');
    ok(!/El mockup DEBE mostrar una persona/.test(prompt), 'DISPLATE: no debe pedir persona');
    ok(/la pieza de pared en su ambiente/.test(prompt), 'DISPLATE: cabecera de pared');
    ok(/NUNCA sobre cuerpo humano/.test(prompt), 'DISPLATE: nunca sobre cuerpo humano');
    ok(/placa mural metálica/.test(prompt), 'DISPLATE: presentación en pared');
    ok(prompt.includes('margen de seguridad mínimo del 5%'), 'DISPLATE: margen de montaje 5%');
  } else {
    ok(!/el modelo que lleva la prenda/.test(prompt), product + ': lenguaje de prenda impropio');
    ok(!/camiseta de corte y talla/.test(prompt), product + ': instrucción textil impropia');
    ok(/el objeto en uso o en escena/.test(prompt), product + ': lenguaje de objeto');
    ok(/presentación acorde al perfil/.test(prompt), product + ': audiencia sin imposición textil');
  }
}

if (failures.length) {
  console.error('FAIL mockup-superficie');
  failures.forEach(f => console.error(' - ' + f));
  process.exit(1);
}
console.log('PASS mockup-superficie: ' + checks + ' aserciones, 0 fallos');
