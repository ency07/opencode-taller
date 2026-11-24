/* Etapa 2 (multiproducto): coherencia de copy en modo exploración.
   Cuando el usuario proporciona un mensaje explícito, ese mensaje es el copy
   literal autorizado: MENSAJE EXACTO, COPY y TEXTO deben coincidir.
   Sin mensaje, se mantiene el comportamiento del motor (canónico derivado del
   concepto / brief, o bloqueo cuando no hay nada autorizado). */
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

const MERCADOS = [
  { market: 'colombia', engine: 'secular', mensaje: 'Que tu luz alumbre el camino', concepto: 'farolito de papel en la noche' },
  { market: 'global_es', engine: 'secular', mensaje: 'Camino firme', concepto: 'semilla de mostaza' },
  { market: 'gospel_es', engine: 'gospel', mensaje: 'Cristo es mi esperanza', concepto: 'Esperanza en medio de la tormenta' },
  { market: 'gospel_en', engine: 'gospel', mensaje: 'Christ is my hope', concepto: 'Grace in the storm' }
];

function promptFor(market, message, concepto, workflowMode) {
  MOTOR_STATE.market = market;
  MOTOR_STATE.region = 'global';
  MOTOR_STATE.product = 'CAMISETA SOFT';
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
  MOTOR_STATE.workflowMode = workflowMode || 'explore';
  MOTOR_STATE.serie = '';
  MOTOR_STATE.concept = concepto || '';
  MOTOR_STATE.message = message || '';
  const set = buildCandidate(resolveAudiences(), null);
  return formatPrompt({ set: set });
}

function ocurrencias(texto, aguja) {
  const re = new RegExp(aguja.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
  return (texto.match(re) || []).length;
}

function mensajeExacto(prompt) {
  const m = prompt.match(/MENSAJE EXACTO: ([^\n]+)/);
  return m ? m[1].trim() : '';
}

for (const caso of MERCADOS) {
  /* --- con mensaje explícito --- */
  const p = promptFor(caso.market, caso.mensaje, caso.concepto, 'explore');
  ok(p.includes('MENSAJE EXACTO: ' + caso.mensaje), caso.market + ': MENSAJE EXACTO debe ser el mensaje del usuario');
  ok(!p.includes('no hay mensaje ni concepto autorizado'), caso.market + ': no debe negar el copy cuando hay mensaje (secular)');
  ok(!p.includes('no hay texto autorizado'), caso.market + ': no debe negar el copy cuando hay mensaje (global)');
  ok(p.includes('«' + caso.mensaje + '»'), caso.market + ': el bloque COPY debe autorizar el literal');
  ok(ocurrencias(p, caso.mensaje) >= 3, caso.market + ': el literal debe aparecer en cabecera, COPY y fichas');
  ok((p.match(/TEXTO: COPY PRINCIPAL LITERAL: «/g) || []).length >= 1,
    caso.market + ': las fichas deben usar el copy principal literal');

  /* --- sin mensaje: se mantiene el canónico derivado del concepto --- */
  const s = promptFor(caso.market, '', caso.concepto, 'explore');
  const me = mensajeExacto(s);
  ok(me.length > 0, caso.market + ': explore sin mensaje debe fijar un MENSAJE EXACTO derivado');
  ok(s.includes('COPY CANÓNICO'), caso.market + ': sin mensaje debe conservar el copy canónico');
  ok(s.includes('«' + me + '»'), caso.market + ': COPY y MENSAJE EXACTO deben coincidir sin mensaje');
  ok(!s.includes('«' + caso.mensaje + '»'), caso.market + ': no debe colarse el mensaje del caso anterior');
}

/* El cambio está acotado a explore: modo new con mensaje conserva su contrato. */
const nuevo = promptFor('colombia', 'HOLD FAST, SHINE BRIGHT', 'ancla y roca', 'new');
ok(nuevo.includes('MENSAJE PRINCIPAL literal'), 'modo new con mensaje conserva su contrato (ajeno a esta etapa)');
ok(!nuevo.includes('/EXPLORACIÓN'), 'modo new no debe renderizar la cabecera de exploración');

if (failures.length) {
  console.error('FAIL copy-explore-coherencia');
  failures.forEach(f => console.error(' - ' + f));
  process.exit(1);
}
console.log('PASS copy-explore-coherencia: ' + checks + ' aserciones, 0 fallos');
