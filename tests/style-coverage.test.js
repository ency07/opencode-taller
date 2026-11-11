/* Test de cobertura de estilos: los 57 estilos visuales deben ser alcanzables en Auto; los 12 tratamientos se mantienen separados.
   Regresión del bug donde AUD_STYLE_PREF (3 estilos/audiencia) actuaba como
   candado duro y solo 8 estilos salían en la práctica (20 inalcanzables).

   Ejecutar:  node tests/style-coverage.test.js
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
const motorSourceForTest = fs.readFileSync(path.join(__dirname, '..', 'js', 'motor-nucleo.js'), 'utf8');
const ORDER = [
  'data-mercados.js',
  'data-audiencias.js',
  'data-bancos.js',
  'data-estilos.js',
  'data-territorios.js',
  'dominios.js',
  'data-productos.js',
  'memoria-local.js',
  'motor-nucleo.js'
];
ORDER.forEach(function (f) {
  vm.runInThisContext(fs.readFileSync(path.join(JS, f), 'utf8'), { filename: f });
});

/* ---------- 1. Catálogo: 57 estilos visuales + 12 tratamientos separados ---------- */
ok(typeof ESTILOS_LIST !== 'undefined', 'ESTILOS_LIST no cargado');
ok(ESTILOS_LIST.length === 69, 'el catálogo debe conservar 69 elementos (57 visuales + 12 tratamientos), tiene ' + (ESTILOS_LIST && ESTILOS_LIST.length));

const DTF = [
  'Indexed Palette / Paleta indizada',
  'Vector Flat / Plano vectorial',
  'Spot Color Simulated / Tintas planas simuladas',
  'Halftone Controlled / Tramado controlado',
  'Knockout / Reserva blanca',
  'Choke/Spread Trapping',
  'Distress Production / Desgaste de producción',
  'White Ink Optimized / Tinta blanca optimizada',
  'CMYK Safe Gamut / Gamut CMYK seguro',
  'Metallic Foil Ready / Listo para foil',
  'Glitter Zone / Zona glitter',
  'Glow Zone / Zona fosforescente'
];
const VISUAL_STYLES = ESTILOS_LIST.filter(function (s) { return DTF.indexOf(s) === -1; });
ok(VISUAL_STYLES.length === 57, 'deben existir 57 lenguajes visuales separados de los tratamientos');
DTF.forEach(function (s) {
  ok(ESTILOS_LIST.indexOf(s) !== -1, 'falta estilo DTF en ESTILO_INFO: ' + s);
  ok(STYLE_POOLS[s] && STYLE_POOLS[s].arquitectura && STYLE_POOLS[s].arquitectura.length >= 4, 'STYLE_POOLS incompleto: ' + s);
  ok(Array.isArray(SATURACION[s]) && SATURACION[s].length >= 2, 'SATURACION incompleta: ' + s);
  ok(Array.isArray(STYLE_COLOR_PREF[s]) && STYLE_COLOR_PREF[s].length >= 2, 'STYLE_COLOR_PREF incompleto: ' + s);
  ok(Array.isArray(STYLE_TIPO_PREF[s]) && STYLE_TIPO_PREF[s].length >= 2, 'STYLE_TIPO_PREF incompleto: ' + s);
});
ESTILOS_LIST.forEach(function (s) {
  ok(STYLE_POOLS[s], 'STYLE_POOLS sin entrada: ' + s);
  ok(SATURACION[s], 'SATURACION sin entrada: ' + s);
  ok(STYLE_COLOR_PREF[s], 'STYLE_COLOR_PREF sin entrada: ' + s);
  ok(STYLE_TIPO_PREF[s], 'STYLE_TIPO_PREF sin entrada: ' + s);
});

/* Los estilos derivados deben tener arquitectura y composición diferenciadas.
   La mera existencia de arrays no garantiza una identidad visual propia. */
const DERIVED_VISUAL_STYLES = [
  'Neón punk', 'Cómic grunge', 'Noir gráfico', 'Superflat', 'Neoexpresionismo',
  'Cartoon moderno', 'Constructivismo', 'Caricatura', 'Art déco', 'Bauhaus',
  'Line art minimalista', 'Pop art', 'Pintura al óleo', 'Cartoon retro',
  'Flat geométrico', 'Doodle a dos colores', 'Línea a dos tintas',
  'Línea art de una tinta', 'Blanco y negro'
];
DERIVED_VISUAL_STYLES.forEach(function (style) {
  const pool = STYLE_POOLS[style] || {};
  ok(Array.isArray(pool.arquitectura) && pool.arquitectura.length >= 4,
    style + ': arquitectura debe tener al menos 4 direcciones');
  ok(Array.isArray(pool.composicion) && pool.composicion.length >= 4,
    style + ': composición debe tener al menos 4 direcciones');
  ok(pool.arquitectura !== pool.composicion,
    style + ': arquitectura y composición no deben compartir la misma referencia');
  ok(JSON.stringify(pool.arquitectura) !== JSON.stringify(pool.composicion),
    style + ': arquitectura y composición no deben ser listas idénticas');
});

/* ---------- 2. Integridad de los 19 territorios creativos ---------- */
const TERRITORY_IDS = Object.keys(POD_CREATIVE_TERRITORIES || {});
const VALID_TREATMENTS = ['HEAVY', 'SOFT', 'MODERN'];
const VALID_MARKETS = Object.keys(POD_MARKETS || {});
const PRODUCTION_TREATMENTS = [
  'Indexed Palette / Paleta indizada', 'Vector Flat / Plano vectorial',
  'Spot Color Simulated / Tintas planas simuladas', 'Halftone Controlled / Tramado controlado',
  'Knockout / Reserva blanca', 'Choke/Spread Trapping', 'Distress Production / Desgaste de producción',
  'White Ink Optimized / Tinta blanca optimizada', 'CMYK Safe Gamut / Gamut CMYK seguro',
  'Metallic Foil Ready / Listo para foil', 'Glitter Zone / Zona glitter', 'Glow Zone / Zona fosforescente'
];
ok(TERRITORY_IDS.length === 19, 'deben cargarse exactamente 19 territorios; cargados: ' + TERRITORY_IDS.length);
TERRITORY_IDS.forEach(function (id) {
  const rec = POD_CREATIVE_TERRITORIES[id] || {};
  ok(rec.id === id, id + ': id interno distinto de la clave');
  ok(!!rec.label && !!rec.label_es && !!rec.label_en, id + ': faltan etiquetas');
  ok(!!rec.description && !!rec.promptDirective, id + ': falta descripción o directriz operativa');
  ok(Array.isArray(rec.compatibleStyles) && rec.compatibleStyles.length > 0,
    id + ': debe declarar estilos compatibles');
  ok((rec.compatibleStyles || []).every(function (style) {
    return ESTILOS_LIST.indexOf(style) !== -1 && PRODUCTION_TREATMENTS.indexOf(style) === -1;
  }), id + ': contiene estilos inexistentes o tratamientos de producción en compatibleStyles');
  ok(Array.isArray(rec.compatibleTreatments) && rec.compatibleTreatments.length > 0
    && rec.compatibleTreatments.every(function (t) { return VALID_TREATMENTS.indexOf(t) !== -1; }),
    id + ': contiene tratamientos vacíos o inválidos');
  ok(Array.isArray(rec.compatibleMarkets) && rec.compatibleMarkets.length > 0
    && rec.compatibleMarkets.every(function (m) { return VALID_MARKETS.indexOf(m) !== -1; }),
    id + ': compatibleMarkets debe contener exclusivamente IDs reales');
  ok(!rec.compatibleMarketTags || (Array.isArray(rec.compatibleMarketTags)
    && rec.compatibleMarketTags.every(function (tag) { return typeof tag === 'string' && !!tag.trim(); })),
    id + ': compatibleMarketTags debe contener solo etiquetas descriptivas');

  const compatibleRealMarkets = rec.compatibleMarkets;
  compatibleRealMarkets.forEach(function (market) {
    MOTOR_STATE.market = market;
    ok(_creativeTerritoryCompatibleWithMarket(id) === id,
      id + ': rechaza su mercado declarado ' + market);
  });
  const incompatibleMarket = VALID_MARKETS.filter(function (m) {
    return compatibleRealMarkets.indexOf(m) === -1;
  })[0];
  if (incompatibleMarket) {
    MOTOR_STATE.market = incompatibleMarket;
    ok(_creativeTerritoryCompatibleWithMarket(id) === 'auto',
      id + ': acepta mercado no compatible ' + incompatibleMarket);
  }

  MOTOR_STATE.creativeTerritory = id;
  const filteredTreatments = _territoryTreatmentFilter(VALID_TREATMENTS);
  ok(filteredTreatments.length > 0 && filteredTreatments.every(function (t) {
    return rec.compatibleTreatments.indexOf(t) !== -1;
  }), id + ': el filtro de tratamientos no respeta el contrato');
});
MOTOR_STATE.market = 'global_es';
MOTOR_STATE.creativeTerritory = 'auto';

/* ---------- 3. AUD_STYLE_PREF ampliado (no solo 3/audiencia) ---------- */
const audIds = Object.keys(AUD_STYLE_PREF);
ok(audIds.length >= 20, 'AUD_STYLE_PREF debe tener 20+ audiencias, tiene ' + audIds.length);
const thin = audIds.filter(function (a) { return (AUD_STYLE_PREF[a] || []).length < 6; });
ok(thin.length === 0, 'audiencias con menos de 6 prefs (candado residual): ' + thin.join(', '));
const union = {};
audIds.forEach(function (a) { (AUD_STYLE_PREF[a] || []).forEach(function (s) { union[s] = true; }); });
const missing = VISUAL_STYLES.filter(function (s) { return !union[s]; });
ok(missing.length === 0, 'estilos en 0 prefs (inalcanzables por bias): ' + missing.join(' | '));

/* ---------- 3. Simulación dinámica con PRNG determinista ---------- */
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
Math.random = mulberry32(20261008);

// Configurar estado del motor sin DOM
const marketsForStyleCoverage = ['colombia','global_en','global_es','gospel_es','gospel_en','anglo','latam','spain','diaspora_col','custom'];
const gospelAllowed = ["Folk Popular", "Vitral / Mosaico", "Barroco Ornamental", "Grabado / Linóleo", "Hand-Drawn", "Acuarela Suelta", "Sumi-e / Tinta Lavada", "Minimal Modern", "Bordado / Puntada", "Ukiyo-e / Woodblock", "Retro 70s", "Kids Storybook", "Collage Cut-Paper", "Papercraft 3D", "Airbrush Smooth", "Foil Stamp / Metallic", "Vintage Desgastado", "Bohemian"];
marketsForStyleCoverage.forEach(function (market) {
  MOTOR_STATE.market = market;
  const pool = _styleCandidatesForContext();
  const expectedPoolLen = VISUAL_STYLES.length;
  ok(pool.length === expectedPoolLen && VISUAL_STYLES.every(function (s) { return pool.indexOf(s) !== -1; }) && pool.every(function (s) { return DTF.indexOf(s) === -1; }), market + ': debe permitir los ' + expectedPoolLen + ' estilos visuales y excluir los 12 tratamientos');
});
MOTOR_STATE.market = 'global_es';
MOTOR_STATE.region = 'global';
MOTOR_STATE.subniche = 'auto';
MOTOR_STATE.product = 'CAMISETA SOFT';
MOTOR_STATE.groupMode = 'distintos';
MOTOR_STATE.audienceMulti = 'no';

const testAuds = ['unisex_nacional', 'global_joven_es', 'global_adulto_es', 'global_familia_es',
  'coste_joven_m', 'andino_adulto_m', 'llanos_identidad', 'infantil_col'];

const seen = {};
let noRepeatViolations = 0;
let quotaViolations = 0;
const GENS = 300;
for (let g = 0; g < GENS; g++) {
  MOTOR_STATE.concept = 'style-coverage-generation-' + g;
  const aud = testAuds[g % testAuds.length];
  const audsPerKey = { A: aud, B: aud, C: aud };
  const out = resolveEstilos(audsPerKey);
  const vals = [out.A, out.B, out.C];
  vals.forEach(function (s) { seen[s] = (seen[s] || 0) + 1; });
  // Sin repetidos intra-set en modo distintos
  if (new Set(vals).size !== 3) noRepeatViolations++;
  // Cuota: al menos 1 fuera del top-3 de la audiencia
  const top3 = (AUD_STYLE_PREF[aud] || []).slice(0, 3);
  const outside = vals.filter(function (s) { return top3.indexOf(s) === -1; });
  if (outside.length < 1) quotaViolations++;
}
const seenList = Object.keys(seen);
ok(noRepeatViolations === 0, 'repetidos intra-set en ' + noRepeatViolations + '/' + GENS + ' generaciones (modo distintos)');
ok(quotaViolations === 0, 'cuota de exploración falló en ' + quotaViolations + '/' + GENS + ' generaciones');
ok(seenList.length >= 32, 'cobertura pobre: solo ' + seenList.length + '/57 estilos visuales en ' + GENS + ' gens (mín 32). Vistos: ' + seenList.join(' | '));

// Todos los 49 alcanzables: barrido exhaustivo por audiencia × semilla
const reachSeen = {};
testAuds.forEach(function (aud, ai) {
  Math.random = mulberry32(9000 + ai);
  for (let g = 0; g < 60; g++) {
    MOTOR_STATE.concept = 'style-reachability-' + ai + '-' + g;
    const out = resolveEstilos({ A: aud, B: aud, C: aud });
    [out.A, out.B, out.C].forEach(function (s) { reachSeen[s] = true; });
  }
});
const unreachable = VISUAL_STYLES.filter(function (s) { return !reachSeen[s]; });
ok(unreachable.length === 0, 'estilos visuales inalcanzables en Auto: ' + unreachable.join(' | '));

// STYLE_CANDIDATES y AUD_STYLE_PREF no deben excluir estilos en mercados no Gospel.
MOTOR_STATE.market = 'global_en';
MOTOR_STATE.subniche = 'skate_culture';
const candidatesWithSubniche = _styleCandidatesForContext();
ok(candidatesWithSubniche.length === VISUAL_STYLES.length, 'STYLE_CANDIDATES no debe filtrar los 57 estilos visuales en mercados no Gospel');
ok(VISUAL_STYLES.every(function (s) { return candidatesWithSubniche.indexOf(s) !== -1; }), 'todos los estilos visuales deben seguir disponibles');
MOTOR_STATE.market = 'global_es';
MOTOR_STATE.subniche = 'auto';

// Cobertura de uso: al menos 20 estilos distintos en 10 generaciones por mercado.
['global_en', 'colombia'].forEach(function (market) {
  MOTOR_STATE.market = market;
  MOTOR_STATE.region = market === 'colombia' ? 'colombia' : 'global';
  MOTOR_STATE.groupMode = 'distintos';
  MOTOR_STATE.subniche = 'auto';
  const seenInTenSets = {};
  for (let g = 0; g < 10; g++) {
    MOTOR_STATE.concept = 'ten-set-style-coverage-' + market + '-' + g;
    const out = resolveEstilos({ A: 'unisex_nacional', B: 'unisex_nacional', C: 'unisex_nacional' });
    [out.A, out.B, out.C].forEach(function (style) { seenInTenSets[style] = true; });
  }
  ok(Object.keys(seenInTenSets).length >= 20, market + ': en 10 generaciones deben aparecer al menos 20 estilos distintos; aparecieron ' + Object.keys(seenInTenSets).length);
});
MOTOR_STATE.market = 'global_es';
MOTOR_STATE.region = 'global';


// Anti-repetición: la selección consulta y guarda únicamente los últimos 3 sets.
// Los estilos recientes reciben un peso menor, pero nunca cero.
ok(motorSourceForTest.indexOf("recentSets.slice(-3)") !== -1, 'la selección debe consultar los últimos 3 sets');
ok(motorSourceForTest.indexOf("recentStyles.has(style) ? 0.35 : 1") !== -1 || motorSourceForTest.indexOf("recentStyles.has(style) ? 0.7 : 2") !== -1, 'los estilos recientes deben conservar peso positivo');

/* ---------- 4. groupMode mismo: 1 solo estilo ---------- */
Math.random = mulberry32(777);
MOTOR_STATE.groupMode = 'mismo';
const mismoOut = resolveEstilos({ A: 'unisex_nacional', B: 'unisex_nacional', C: 'unisex_nacional' });
ok(mismoOut.A === mismoOut.B && mismoOut.B === mismoOut.C, 'groupMode mismo debe dar 1 estilo en A/B/C');
ok(ESTILOS_LIST.indexOf(mismoOut.A) !== -1, 'estilo de groupMode mismo fuera de lista: ' + mismoOut.A);
MOTOR_STATE.groupMode = 'distintos';

/* ---------- 5. Funciones de contador expuestas ---------- */
ok(typeof getStyleUsageCounter === 'function', 'falta getStyleUsageCounter en memoria-local.js');
ok(typeof recordStyleUse === 'function', 'falta recordStyleUse en memoria-local.js');
recordStyleUse('global_es', 'CAMISETA SOFT', 'Vector Flat / Plano vectorial');
const counter = getStyleUsageCounter('global_es', 'CAMISETA SOFT');
ok(counter['Vector Flat / Plano vectorial'] > 0, 'recordStyleUse no registra uso');


/* ---------- 6. Aislamiento de locks por mercado, región y producto ---------- */
const lockCtxA = 'global_en|global';
const lockCtxB = 'gospel_es|spain';
setLockValue(lockCtxA, 'CAMISETA SOFT', 'estilo', 'A', 'Dark Tattoo');
const locksA = loadLocks(lockCtxA, 'CAMISETA SOFT');
const locksB = loadLocks(lockCtxB, 'CAMISETA SOFT');
const locksOtherProduct = loadLocks(lockCtxA, 'HOODIE');
ok(locksA.estilo.A === 'Dark Tattoo', 'el lock debe persistir en su contexto original');
ok(locksB.estilo.A === 'Auto', 'un mercado/región distinto no debe heredar locks');
ok(locksOtherProduct.estilo.A === 'Auto', 'un producto distinto no debe heredar locks');

/* ---------- 7. Bancos nombrados aislados por subnicho ---------- */
const skateBank = createPersonalBank('global_en', 'RT Bank Skate', 'skate_culture');
ok(skateBank.ok, 'debe poder crearse un banco especializado');
ok(setActivePersonalBank('global_en', 'skate_culture', skateBank.id).ok,
  'el banco debe poder activarse en su subnicho');
const crossSubnicheActivation = setActivePersonalBank('global_en', 'gospel_es', skateBank.id);
ok(!crossSubnicheActivation.ok, 'no debe permitirse activar un banco en otro subnicho');
ok(getActivePersonalBank('global_en', 'gospel_es') === null,
  'un subnicho no debe recuperar el banco especializado de otro');

const namedBanksKey = memKey(['personalBanks', 'global_en']);
const namedBanksData = getJSON(namedBanksKey, {});
namedBanksData.active.gospel_es = skateBank.id; // simula un registro heredado/corrupto
setJSON(namedBanksKey, namedBanksData);
ok(getActivePersonalBank('global_en', 'gospel_es') === null,
  'la lectura debe rechazar asignaciones cruzadas antiguas aunque estén guardadas');

const commonBank = createPersonalBank('global_en', 'RT Bank Common', COMMON_BANK_KEY);
ok(commonBank.ok && setActivePersonalBank('global_en', COMMON_BANK_KEY, commonBank.id).ok,
  'el banco común debe poder activarse como fallback del mercado');
ok(getActivePersonalBank('global_en', 'gospel_es').id === commonBank.id,
  'el fallback compartido debe ser exclusivamente el banco común del mismo mercado');
ok(getActivePersonalBank('gospel_es', 'skate_culture') === null,
  'los bancos nombrados tampoco deben cruzar mercados');

/* ---------- 8. LAST_RESULT no se puede preservar fuera de su contexto ---------- */
MOTOR_STATE.market = 'gospel_es';
MOTOR_STATE.region = 'spain';
MOTOR_STATE.product = 'CAMISETA SOFT';
LAST_RESULT = {
  set: { A: {}, B: {}, C: {} },
  context: { market: 'global_en', region: 'global', product: 'CAMISETA SOFT' }
};
ok(!_lastResultMatchesContext(), 'no debe preservar fichas de otro mercado/región');
LAST_RESULT.context = { market: 'gospel_es', region: 'spain', product: 'CAMISETA SOFT' };
ok(_lastResultMatchesContext(), 'debe preservar fichas del mismo contexto');
MOTOR_STATE.region = 'colombia';
ok(!_lastResultMatchesContext(), 'no debe preservar fichas de otra región');
MOTOR_STATE.region = 'spain';
MOTOR_STATE.product = 'HOODIE';
ok(!_lastResultMatchesContext(), 'no debe preservar fichas de otro producto');
LAST_RESULT.context = null;
ok(!_lastResultMatchesContext(), 'un resultado antiguo sin contexto debe tratarse como no compatible');

/* El dado introduce una nueva semilla de variación, sin afectar la generación
   normal del mismo contexto. */
const motorSource = fs.readFileSync(path.join(JS, 'motor-nucleo.js'), 'utf8');
ok(/MOTOR_STATE\._rerollNonce\s*=\s*\(Number\(MOTOR_STATE\._rerollNonce\)\s*\|\|\s*0\)\s*\+\s*1/.test(motorSource), 'el dado debe incrementar la semilla de regeneración');
ok(/MOTOR_STATE\.message, MOTOR_STATE\._rerollNonce \|\| 0, k/.test(motorSource), 'la audiencia Auto por tarjeta debe variar al regenerar');
ok(/MOTOR_STATE\.groupMode, MOTOR_STATE\._rerollNonce \|\| 0\]\.join\('\|'\)/.test(motorSource), 'la selección automática de estilos debe variar al regenerar');

const passed = failures.length === 0;
console.log((passed ? 'PASS' : 'FAIL') + '  style-coverage  (' + checks + ' aserciones, ' + failures.length + ' fallos)');
failures.forEach(function (f) { console.log('  X ' + f); });
process.exit(passed ? 0 : 1);
