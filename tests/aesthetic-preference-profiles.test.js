'use strict';

/* Preferencias estéticas independientes de demografía: catálogo, integración y sesgos suaves. */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ROOT = path.join(__dirname, '..');
let checks = 0;
const failures = [];
function ok(value, message) { checks++; if (!value) failures.push(message); }

global.window = global;
global.document = { getElementById: function () { return null; }, querySelectorAll: function () { return []; } };
const JS = path.join(ROOT, 'js');
[
  'data-mercados.js', 'data-audiencias.js', 'data-bancos.js', 'data-estilos.js',
  'dominios.js', 'data-productos.js', 'data-territorios.js', 'memoria-local.js', 'motor-nucleo.js'
].forEach(function (file) {
  vm.runInThisContext(fs.readFileSync(path.join(JS, file), 'utf8'), { filename: file });
});

const expected = [
  'minimal_cotidiano', 'clasico_tradicional', 'conservador_visual',
  'contemporaneo_discreto', 'heritage_atemporal', 'editorial_moderno',
  'ilustrativo_artistico', 'urbano_streetwear', 'retro_vintage',
  'experimental_alternativo', 'familiar_amable', 'infantil_narrativo'
];
const validHierarchies = ['SOLO_TEXTO', 'TEXTO_DOMINANTE', 'BALANCEADO', 'OBJETO_DOMINANTE', 'SOLO_OBJETO'];
const validTreatments = ['HEAVY', 'SOFT', 'MODERN'];
const validDensities = ['Minimal', 'Balanced', 'Heavy'];

ok(Object.keys(AESTHETIC_PREFERENCE_PROFILES).length === 12, 'deben existir exactamente 12 perfiles estéticos independientes');
expected.forEach(function (id) {
  const profile = getAestheticPreferenceProfile(id);
  ok(!!profile, 'falta el perfil ' + id);
  if (!profile) return;
  ok(!!profile.label && !!profile.intensity && !!profile.complexity, id + ': faltan label/intensidad/complejidad');
  ['stylePreferred', 'styleSecondary', 'styleAvoid', 'hierarchyPref', 'layoutPref', 'densityPref', 'treatmentPref', 'typographyPref', 'contexts'].forEach(function (field) {
    ok(Array.isArray(profile[field]) && profile[field].length > 0, id + ': falta ' + field);
  });
  profile.stylePreferred.concat(profile.styleSecondary, profile.styleAvoid).forEach(function (style) {
    ok(ESTILOS_LIST.indexOf(style) !== -1, id + ': estilo inexistente en catálogo: ' + style);
  });
  profile.hierarchyPref.forEach(function (mode) {
    ok(validHierarchies.indexOf(mode) !== -1, id + ': jerarquía inválida: ' + mode);
  });
  profile.layoutPref.forEach(function (layout) {
    ok(LAYOUTS.some(function (candidate) { return candidate.indexOf(layout) === 0; }), id + ': layout inválido: ' + layout);
  });
  profile.densityPref.forEach(function (density) {
    ok(validDensities.indexOf(density) !== -1, id + ': densidad inválida: ' + density);
  });
  profile.treatmentPref.forEach(function (treatment) {
    ok(validTreatments.indexOf(treatment) !== -1, id + ': tratamiento inválido: ' + treatment);
  });
  profile.typographyPref.forEach(function (type) {
    ok(TIPOS.some(function (candidate) { return candidate.indexOf(type) === 0; }), id + ': tipografía inválida: ' + type);
  });
  ok(!Object.prototype.hasOwnProperty.call(AUD_PROFILES, id), id + ': el perfil estético no debe ser un perfil demográfico');
});

ok(getAestheticPreferenceProfile('auto') === null, 'Auto no debe fijar una preferencia estética');
const options = getAestheticPreferenceOptions();
ok(options.indexOf('value="auto"') !== -1, 'el selector debe ofrecer Auto');
expected.forEach(function (id) { ok(options.indexOf('value="' + id + '"') !== -1, 'el selector omite ' + id); });

const indexSource = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const motorSource = fs.readFileSync(path.join(JS, 'motor-nucleo.js'), 'utf8');
ok(indexSource.indexOf('id="aestheticPreference"') !== -1, 'index debe exponer el selector estético');
ok(/MOTOR_STATE\.aestheticPreference = v\('aestheticPreference', 'auto'\)/.test(motorSource), 'el motor debe leer la preferencia estética');
ok(/aestheticPreference\.addEventListener\('change'/.test(motorSource), 'el selector debe actualizar MOTOR_STATE');
ok(/aesthetic\.stylePreferred/.test(motorSource) && /aestheticAvoid/.test(motorSource), 'el motor debe ponderar estilos preferidos y evitar estilos solo con penalización suave');
ok(/aesthetic\.hierarchyPref/.test(motorSource), 'las preferencias estéticas deben influir en la puntuación de jerarquía');
ok(/aestheticProfile\.layoutPref/.test(motorSource), 'las preferencias estéticas deben influir en layouts compatibles');
ok(/PREFERENCIA ESTÉTICA INDEPENDIENTE/.test(motorSource), 'el prompt debe declarar la preferencia estética');

MOTOR_STATE.market = 'global_en';
MOTOR_STATE.region = 'global';
MOTOR_STATE.product = 'CAMISETA SOFT';
MOTOR_STATE.subniche = 'auto';
MOTOR_STATE.workflowMode = 'explore';
MOTOR_STATE.designMode = 'contacto';
MOTOR_STATE.audienceSet = 'global_adult_en';
MOTOR_STATE.audienceMulti = 'no';
MOTOR_STATE.groupMode = 'distintos';
MOTOR_STATE.concept = 'A lighthouse standing through a storm';
MOTOR_STATE.message = 'Keep the light';
MOTOR_STATE.support = '';
MOTOR_STATE.creativeTerritory = 'auto';
MOTOR_STATE.aestheticPreference = 'minimal_cotidiano';

const minimal = getAestheticPreferenceProfile(MOTOR_STATE.aestheticPreference);
const candidates = _styleCandidatesForContext();
ok(candidates.every(function (style) { return ESTILOS_LIST.indexOf(style) !== -1; }), 'el perfil estético no debe inventar estilos');
ok(minimal.styleAvoid.every(function (style) { return candidates.indexOf(style) !== -1; }), 'los estilos poco adecuados siguen disponibles; no son exclusiones duras');

const selectedOutside = new Set();
for (let i = 0; i < 60; i++) {
  MOTOR_STATE.concept = 'aesthetic-profile-' + i;
  MOTOR_STATE._rerollNonce = i;
  const selected = resolveEstilos({ A: 'global_adult_en', B: 'global_adult_en', C: 'global_adult_en' });
  ['A', 'B', 'C'].forEach(function (key) {
    if (minimal.stylePreferred.concat(minimal.styleSecondary).indexOf(selected[key]) === -1) selectedOutside.add(selected[key]);
  });
}
ok(selectedOutside.size > 0, 'la preferencia estética debe permitir exploración fuera de sus estilos principales');

MOTOR_STATE.concept = 'A lighthouse standing through a storm';
const set = buildCandidate({ A: 'global_adult_en', B: 'global_adult_en', C: 'global_adult_en' }, null);
const prompt = formatPrompt({ set: set });
ok(prompt.indexOf('PREFERENCIA ESTÉTICA INDEPENDIENTE: Minimalista cotidiano') !== -1, 'el prompt debe llevar el perfil elegido');
ok(prompt.indexOf('sesgo flexible') !== -1, 'el prompt debe indicar que la preferencia no es una prohibición');

console.log((failures.length ? 'FAIL' : 'PASS') + ' aesthetic-preference-profiles (' + checks + ' assertions, ' + failures.length + ' failures)');
failures.forEach(function (failure) { console.error(' - ' + failure); });
process.exit(failures.length ? 1 : 0);
