/* PR 1 — Fichas: audiencia Auto coherente, símbolo trazable al concepto en
   Exploración y contexto de serie en las tarjetas.
   Ejecutar: node tests/fichas-contexto.test.js
   No requiere DOM real ni proveedores. Sale con código 1 si algo falla. */

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

const motorSource = fs.readFileSync(path.join(JS, 'motor-nucleo.js'), 'utf8');
const cssSource = fs.readFileSync(path.join(ROOT, 'styles.css'), 'utf8');

function baseState() {
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
  MOTOR_STATE.explorationBrief = null;
}

/* --- 1) Audiencia Auto: el pool debe filtrarse por el subnicho DETECTADO --- */
baseState();
MOTOR_STATE.workflowMode = 'explore';
MOTOR_STATE.concept = 'motor en ruta por la carretera con mi moto';
MOTOR_STATE.message = '';
ok(effectiveSubniche() === 'viaje_ruta_col', 'un concepto de ruta/moto debe detectar la familia viaje_ruta_col');
const poolMoto = getCurrentAudiencePool();
ok(poolMoto.length > 0, 'el pool de audiencias no debe quedar vacío con un concepto de motos');
ok(poolMoto.indexOf('infantil_col') === -1,
  'un concepto de motos NO debe ofrecer audiencia infantil: auto debe resolver el subnicho detectado');

baseState();
MOTOR_STATE.workflowMode = 'explore';
MOTOR_STATE.concept = 'diseño para la familia y los niños en casa';
MOTOR_STATE.message = '';
ok(effectiveSubniche() === 'familia_roles_col', 'un concepto familiar debe detectar la familia familia_roles_col');
const poolCole = getCurrentAudiencePool();
ok(poolCole.indexOf('infantil_col') !== -1,
  'un concepto familiar SÍ debe ofrecer audiencia infantil');

/* La corrección vive en la función: no debe filtrar con el "auto" crudo. */
ok(/const subniche = \(MOTOR_STATE\.subniche && MOTOR_STATE\.subniche !== 'auto'\)[\s\S]*?effectiveSubniche\(\)/.test(motorSource),
  'getCurrentAudiencePool debe resolver el subnicho efectivo cuando el selector está en auto');

/* --- 2) Exploración: el símbolo es el CONCEPTO del usuario (trazable) ---
   (Antes se exigían símbolos A/B/C distintos; ahora mandan coherencia y
   trazabilidad: la familia sesga estilo, no decide qué se ve.) */
let trazableOk = true;
const GENS = 20;
const CONCEPTO = 'motero en ruta con su motocicleta';
for (let g = 0; g < GENS; g++) {
  baseState();
  MOTOR_STATE.workflowMode = 'explore';
  MOTOR_STATE.concept = CONCEPTO;
  MOTOR_STATE.message = 'La libertad se conquista en el camino';
  const set = buildCandidate(resolveAudiences(), null);
  const objs = ['A', 'B', 'C'].map(function (k) { return String(set[k].objeto || '').trim(); });
  const divergentes = objs.filter(function (o) { return o !== CONCEPTO; });
  if (divergentes.length) {
    trazableOk = false;
    failures.push('explore gen' + g + ': símbolo no trazable al concepto [' + objs.join(' | ') + ']');
    checks++;
  } else { checks++; }
}
ok(trazableOk, 'en Exploración el símbolo debe derivar del concepto del usuario (coherencia y trazabilidad)');

/* --- 3) La constancia de símbolo deja de exigirse en Exploración --- */
ok(motorSource.includes('function _isSymbolConstancyRequired()'),
  'debe existir un helper que decida si el símbolo debe ser constante');
ok(/function _isSymbolConstancyRequired\(\)\s*\{\s*return MOTOR_STATE\.workflowMode !== 'explore';/.test(motorSource),
  'la constancia de símbolo NO debe exigirse en Exploración');
ok(motorSource.includes("(symbolRequired ? (symbolStable ? 20 : -50) : 0)"),
  'la puntuación no debe penalizar símbolos distintos cuando no se exige constancia');
ok(motorSource.includes('Símbolos por ficha'),
  'en Exploración la matriz debe mostrar "Símbolos por ficha" en vez de un badge rojo');

/* --- 4) renderCards: contexto de serie + Dominio fuera de las fichas --- */
ok(motorSource.includes("cx.className = 'cards-context'"),
  'las tarjetas deben mostrar un bloque de contexto de serie');
ok(motorSource.includes("['Dominio', dominioEfectivo() || MOTOR_STATE.subniche]") === false,
  'el Dominio no debe repetirse como fila en cada ficha');
ok(motorSource.includes("<details class=\"vmore\">"),
  'los campos secundarios deben ser plegables para aligerar la ficha');
ok(/\.cards-context\s*\{[\s\S]*?grid-column:\s*1\s*\/\s*-1/.test(cssSource),
  'el contexto de serie debe ocupar todo el ancho del grid de tarjetas');

console.log((failures.length ? 'FAIL' : 'PASS') + ' fichas-contexto (' + checks + ' aserciones, ' + failures.length + ' fallos)');
failures.forEach(function (msg) { console.error(' - ' + msg); });
process.exit(failures.length ? 1 : 0);
