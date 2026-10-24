/* C3 — audiencias propias (usuario): 3 personas nuevas redactadas por Grok e
   integradas solo como entradas nuevas. Valida esquema, catálogos, registros
   de pools/subnichos y sentinels de "no se tocó nada existente".
   Ejecutar: node tests/aud-propias-c3.test.js */

'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
let checks = 0;
const failures = [];
function ok(cond, msg) { checks++; if (!cond) failures.push(msg); }

global.window = global;
global.document = {
  getElementById: function () { return null; },
  querySelectorAll: function () { return []; },
  readyState: 'complete',
  addEventListener: function () {}
};

const JS = path.join(ROOT, 'js');
['data-mercados.js', 'data-audiencias.js', 'data-bancos.js', 'data-estilos.js',
 'dominios.js', 'data-productos.js', 'memoria-local.js', 'motor-nucleo.js',
 'banco-gospel-es.js', 'banco-global.js'
].forEach(function (f) {
  vm.runInThisContext(fs.readFileSync(path.join(JS, f), 'utf8'), { filename: f });
});

const NUEVOS = ['costeno_costenol', 'gospel_antiherejia', 'global_tattoo_es'];
const pre = function (s) { return String(s).split(':')[0].trim(); };
const tipos = new Set(TIPOS.map(pre));
const layouts = new Set(LAYOUTS.map(pre));
const formas = new Set(FORMAS.map(pre));
const modos = new Set(COLOR_MODES.map(pre));
const estilos = new Set(Array.isArray(ESTILOS_LIST) ? ESTILOS_LIST : Object.keys(ESTILOS_LIST));
const densidades = new Set([].concat.apply([], Object.values(AUD_DENSITY_PREF).filter(function (v, i, a) { return a.indexOf(v) === i && typeof v !== 'undefined'; })));
const jerarquias = new Set(['TEXTO_DOMINANTE', 'SOLO_TEXTO', 'BALANCEADO', 'OBJETO_DOMINANTE', 'SOLO_OBJETO']);
const generosOk = new Set(['masculino', 'femenino', 'unisex', 'infantil', 'familia', 'pareja']);
const edadesOk = new Set(['joven', 'adulto', 'infantil', 'amplia', '18-34', '35-55', 'todas', '16-28', '29-55', 'all', 'mixta']);

/* --- 1) Esquema completo de los 3 perfiles (13 campos base) --- */
const CAMPOS = ['label', 'region', 'genero', 'edad', 'perfil', 'codigos', 'rechaza',
  'contexto', 'directiva', 'tipoPref', 'modoCol', 'tratPref', 'formaPref'];
NUEVOS.forEach(function (id) {
  const p = AUD_PROFILES[id];
  ok(!!p, id + ' existe en AUD_PROFILES');
  if (!p) return;
  CAMPOS.forEach(function (c) {
    ok(typeof p[c] !== 'undefined' && p[c] !== null && p[c] !== '',
      id + ' tiene campo no vacío: ' + c);
  });
  ok(generosOk.has(p.genero), id + ' genero válido: ' + p.genero);
  ok(edadesOk.has(p.edad), id + ' edad válida: ' + p.edad);
  ok(AUD_NAMES.indexOf(id) !== -1, id + ' presente en AUD_NAMES');
});

/* --- 2) Catálogos: cada valor de preferencia existe en el motor --- */
NUEVOS.forEach(function (id) {
  const p = AUD_PROFILES[id];
  p.tipoPref.forEach(function (t) { ok(tipos.has(pre(t)), id + ' tipoPref en catálogo: ' + t); });
  ok(p.tipoPref.indexOf('Hand-Drawn') === -1, id + ' sin estilos disfrazados de tipo (regresión forma C3)');
  p.modoCol.forEach(function (m) { ok(modos.has(m), id + ' modoCol en catálogo: ' + m); });
  p.tratPref.forEach(function (t) { ok(['HEAVY', 'SOFT', 'MODERN'].indexOf(t) !== -1, id + ' tratPref válido: ' + t); });
  p.formaPref.forEach(function (f) { ok(formas.has(f), id + ' formaPref en catálogo: ' + f); });
  AUD_STYLE_PREF[id].forEach(function (s) { ok(estilos.has(s), id + ' prefStyle en catálogo: ' + s); });
  ok(AUD_STYLE_PREF[id].length >= 3, id + ' prefStyle con variedad suficiente');
  AUD_HIERARCHY_PREF[id].forEach(function (h) { ok(jerarquias.has(h), id + ' prefJerarquia válida: ' + h); });
  AUD_DENSITY_PREF[id].forEach(function (d) { ok(densidades.has(d), id + ' prefDensity válida: ' + d); });
  AUD_LAYOUT_PREF[id].forEach(function (l) { ok(layouts.has(pre(l)), id + ' prefLayout en catálogo: ' + l); });
});

/* --- 3) Registros: pools por mercado/región --- */
const poolCT = getAudiencesForMarketRegion('colombia', 'todas');
ok(poolCT.length === 14, 'colombia/todas tiene 14 (13 + costeno_costenol)');
ok(poolCT.slice(0, 13).join(',') === 'coste_joven_m,coste_joven_f,coste_adulto_m,coste_adulta_f,andino_joven_m,andino_joven_f,andino_adulto_m,andino_adulta_f,pacifico_raiz,llanos_identidad,amazonia_territorio,infantil_col,unisex_nacional',
  'colombia/todas: los 13 originales intactos y en orden');
ok(poolCT[13] === 'costeno_costenol', 'costeno_costenol al final de colombia/todas');

const cc = getAudiencesForRegion('costa_caribe');
ok(cc.indexOf('costeno_costenol') !== -1, 'costa_caribe incluye costeno_costenol');
ok(cc[0] === 'coste_joven_m' && cc.indexOf('infantil_col') !== -1, 'costa_caribe conserva perfiles base');

const ges = getAudiencesForMarketRegion('gospel_es', 'todas');
ok(ges.length === 7 && ges[ges.length - 1] === 'gospel_antiherejia', 'gospel_es: 7 con gospel_antiherejia al final');
const genEn = getAudiencesForMarketRegion('gospel_en', 'todas');
ok(genEn.length === 6 && genEn.indexOf('gospel_antiherejia') === -1, 'gospel_en intacto (6, sin la persona ES)');

const gle = getAudiencesForMarketRegion('global_es', 'global_es');
ok(gle.length === 4 && gle[3] === 'global_tattoo_es', 'global_es: neutral_es + global_tattoo_es');
ok(getAudiencesForMarketRegion('spain', 'spain').length === 3
  && getAudiencesForMarketRegion('spain', 'spain').indexOf('global_tattoo_es') === -1,
  'spain intacto (3, sin tattoo)');
ok(getAudiencesForMarketRegion('latam', 'latam').indexOf('global_tattoo_es') === -1, 'latam sin tattoo');

/* --- 4) Subnichos --- */
const hc = POD_SUBNICHES.humor_costeno.audiencias;
ok(hc.length === 6 && hc[5] === 'costeno_costenol', 'humor_costeno.audiencias: costeno_costenol al final');
ok(hc.slice(0, 5).join(',') === 'coste_joven_m,coste_joven_f,coste_adulto_m,coste_adulta_f,unisex_nacional',
  'humor_costeno: las 5 audiencias previas intactas');
const subHumor = getAudiencesForSubniche('humor_costeno', 'todas');
ok(subHumor.indexOf('costeno_costenol') !== -1 && subHumor.length === 6,
  'getAudiencesForSubniche(humor_costeno, todas) incluye la nueva');

ok(POD_SUBNICHES.tattoo_lifestyle.audiencias.indexOf('global_tattoo_es') !== -1,
  'tattoo_lifestyle.audiencias incluye global_tattoo_es');
ok(POD_SUBNICHES.tattoo_lifestyle.audiencias.indexOf('global_joven_es') !== -1,
  'tattoo_lifestyle conserva las audiencias base del mercado');
const subTat = getAudiencesForSubniche('tattoo_lifestyle', 'global_es');
ok(subTat.indexOf('global_tattoo_es') !== -1, 'getAudiencesForSubniche(tattoo_lifestyle, global_es) incluye la nueva');

/* E2E del cruce selector (updateAudienceSelect): pool ∩ subPool. */
const cruzeHumor = poolCT.filter(function (a) { return subHumor.indexOf(a) !== -1; });
ok(cruzeHumor.length === 6 && cruzeHumor.indexOf('costeno_costenol') !== -1,
  'cruce colombia/todas × humor_costeno = 6 con la nueva');
const cruzeTattoo = gle.filter(function (a) { return subTat.indexOf(a) !== -1; });
ok(cruzeTattoo.indexOf('global_tattoo_es') !== -1, 'cruce global_es × tattoo incluye la nueva');

/* --- 5) Sentinels: lo existente no cambió --- */
ok(Object.keys(AUD_PROFILES).length === 34, '34 perfiles (31 + 3 nuevos)');
ok(AUD_NAMES.length === 34, 'AUD_NAMES refleja los 34');
ok(AUD_PROFILES.gospel_hombre.label === 'Hombre cristiano'
  && AUD_STYLE_PREF.gospel_hombre.length === 7
  && AUD_HIERARCHY_PREF.gospel_hombre.join(',') === 'OBJETO_DOMINANTE,BALANCEADO',
  'gospel_hombre intacto (label, styles, jerarquía)');
ok(AUD_PROFILES.coste_joven_m.label !== undefined && AUD_LAYOUT_PREF.coste_joven_m.length === 3, 'coste_joven_m intacto');
ok(MARKET_AUDIENCE_LISTS.neutral_es.join(',') === 'global_joven_es,global_adulto_es,global_familia_es',
  'MARKET_AUDIENCE_LISTS.neutral_es intacto (3)');
ok(POD_SUBNICHES.gospel_es.audiencias.join(',') === 'unisex_nacional',
  'POD_SUBNICHES.gospel_es.audiencias intacto (decisión: no estrechar el pool gospel)');
ok(getAudiencesForMarketRegion('colombia', 'andina').indexOf('costeno_costenol') === -1,
  'andina no hereda la persona costeña');
ok(getAudiencesForRegion('universal_es').indexOf('gospel_antiherejia') === -1,
  'universal_es (gospel EN) no hereda la persona ES');

/* --- 6) El prompt real puede usar la audiencia nueva --- */
MOTOR_STATE.workflowMode = 'explore';
MOTOR_STATE.market = 'colombia';
MOTOR_STATE.language = 'es';
MOTOR_STATE.product = 'CAMISETA SOFT';
MOTOR_STATE.concept = 'bochinche de esquina';
MOTOR_STATE.message = '';
MOTOR_STATE.support = '';
MOTOR_STATE.audienceSet = 'costeno_costenol';
MOTOR_STATE.explorationBrief = null;
const fichaBase = {
  estilo: 'Stencil Urbano', audiencia: 'costeno_costenol', jerarquiaVisual: 'TEXTO_DOMINANTE',
  objeto: 'mamagallismo de esquina', arquitectura: 'a', composicion: 'b', layout: 'Sangrado total',
  placement: 'pecho centrado', escalaProducto: 'media', formaSimbolo: 'silueta sólida a una tinta',
  tecnica: 'd', tratamiento: 'e', textoPrincipal: 'T', textoApoyo: 'A', textoTerciario: 'S',
  tipografia: 'Grotesca black condensada', paleta: 'pal (modo: X)', familiaColor: 'f',
  fitAudiencia: 70, fitProducto: 60, densidad: 'Heavy', negativeSpace: 'abierto',
  distribucionTexto: 'TEXTO ARRIBA', integracionTexto: 'w', relacion: 'r'
};
const set = { A: fichaBase, B: Object.assign({}, fichaBase, { estilo: 'Grunge / DIY', jerarquiaVisual: 'OBJETO_DOMINANTE' }), C: Object.assign({}, fichaBase, { estilo: 'Folk Popular', jerarquiaVisual: 'BALANCEADO' }) };
const prompt = formatPrompt({ set: set });
ok(prompt.indexOf('costeno_costenol') !== -1, 'el prompt real menciona el id costeno_costenol');
ok(prompt.indexOf('Costeño costeñol') !== -1, 'el prompt real incluye el label "Costeño costeñol"');
ok(prompt.indexOf('mamagallismo') !== -1, 'el prompt real conserva el vocabulario de Grok (códigos)');

const passed = failures.length === 0;
console.log((passed ? 'PASS' : 'FAIL') + '  aud-propias-c3  (' + checks + ' aserciones, ' + failures.length + ' fallos)');
failures.forEach(function (f) { console.log('  X ' + f); });
process.exit(passed ? 0 : 1);
