/* DEBT-005 + DEBT-006 — Región en contador de estilos y transparencia del pool.
   DEBT-005: el contador de uso de estilos se guarda por market|region (misma
   convención que los locks); las regiones de un mercado no se mezclan.
   DEBT-006: _audiencePoolIsMarketFallback detecta cuándo el subnicho elegido no
   restringe el catálogo y el pool es el del mercado; getCurrentAudiencePool lo
   expone en MOTOR_STATE._audPoolFallback para la UI.

   Ejecutar:  node tests/region-estilos-audiencias.test.js
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

/* ---------- DEBT-005: contador de estilos por market|region ---------- */
MOTOR_STATE.market = 'colombia';
MOTOR_STATE.region = 'costa_caribe';
MOTOR_STATE.product = 'CAMISETA SOFT';
const STYLE = 'Estilo Region Test';
const keyCosta = memLocksMarket();
ok(keyCosta === 'colombia|costa_caribe', 'memLocksMarket = market|region (obtenido: ' + keyCosta + ')');

clearStyleUsage(keyCosta, MOTOR_STATE.product);
clearStyleUsage('colombia', MOTOR_STATE.product);

_recordStyleUse(STYLE);
let cCosta = getStyleUsageCounter(keyCosta, MOTOR_STATE.product) || {};
ok((cCosta[STYLE] || 0) > 0, 'el uso se registra bajo la clave market|region');
let cClaveVieja = getStyleUsageCounter('colombia', MOTOR_STATE.product) || {};
ok(!(cClaveVieja[STYLE] > 0), 'la clave vieja solo-mercado ya NO recibe usos (clave anterior muerta)');

MOTOR_STATE.region = 'andina';
const keyAndina = memLocksMarket();
ok(keyAndina === 'colombia|andina', 'otra región genera otra clave');
let cAndina = getStyleUsageCounter(keyAndina, MOTOR_STATE.product) || {};
ok(!(cAndina[STYLE] > 0), 'la región andina no hereda usos de la costa (contadores independientes)');
_recordStyleUse(STYLE);
cAndina = getStyleUsageCounter(keyAndina, MOTOR_STATE.product) || {};
cCosta = getStyleUsageCounter(keyCosta, MOTOR_STATE.product) || {};
ok((cAndina[STYLE] || 0) > 0 && (cCosta[STYLE] || 0) > 0,
  'cada región acumula su propio contador');
ok(typeof _getStyleUsageScore(STYLE) === 'number', '_getStyleUsageScore sigue devolviendo número con la clave regional');

/* ---------- DEBT-006: pool de audiencias transparente ---------- */
ok(_audiencePoolIsMarketFallback('todas', 'colombia', 'auto') === false,
  'con subnicho Auto no hay aviso (el usuario no está filtrando)');

ok(_audiencePoolIsMarketFallback('todas', 'colombia', 'subnicho_sin_perfiles_test') === true,
  'subnicho inexistente/sin perfiles → el pool es el del mercado y se marca');

ok(_audiencePoolIsMarketFallback('todas', 'colombia', 'humor_costeno') === false,
  'subnicho que sí estrecha el catálogo (humor costeño) → no hay fallback');

ok(_audiencePoolIsMarketFallback('todas', 'colombia', 'skate_culture') === true,
  'subnicho cuyos perfiles no pertenecen al mercado activo → el motor cae al mercado y se marca');

MOTOR_STATE.market = 'colombia';
MOTOR_STATE.region = 'todas';
MOTOR_STATE.subniche = 'subnicho_sin_perfiles_test';
let pool = getCurrentAudiencePool();
ok(MOTOR_STATE._audPoolFallback === true, 'getCurrentAudiencePool marca _audPoolFallback=true cuando el subnicho no restringe');
const marketPool = getAudiencesForMarketRegion('colombia', 'todas');
ok(pool.length === marketPool.length, 'el pool resultante es el del mercado');

MOTOR_STATE.subniche = 'humor_costeno';
pool = getCurrentAudiencePool();
ok(MOTOR_STATE._audPoolFallback === false, 'con subnicho restringido no se marca fallback');
ok(pool.length < marketPool.length, 'el pool del subnicho humor costeño es más estrecho que el mercado');
ok(pool.length === 6, 'humor_costeno aporta sus 6 perfiles propios (5 + costeno_costenol; obtenido: ' + pool.length + ')');

/* ---------- Resultado ---------- */
if (failures.length) {
  console.error('FAIL region-estilos-audiencias (' + checks + ' aserciones, ' + failures.length + ' fallos)');
  failures.forEach(function (f) { console.error('  - ' + f); });
  process.exit(1);
}
console.log('PASS region-estilos-audiencias (' + checks + ' aserciones, 0 fallos)');
