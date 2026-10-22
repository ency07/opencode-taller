/* DEBT-015: el perfil estructural manda de verdad.
   - Modos jerárquicos delimitados por perfil + asignación por permutaciones.
   - Layout del pool del perfil (el pool del producto es límite duro).
   - Texto jerárquico derivado del modo asignado.
   - Prompt: ESQUELETO ESTRUCTURAL (MANDA) + ACABADO (SUBORDINADO), sin (manda).
   Ejecutar: node tests/profile-governs.test.js */

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
  createElement: function () { return { className: '', innerHTML: '', appendChild: function () {}, addEventListener: function () {} }; }
};

const JS = path.join(ROOT, 'js');
['data-mercados.js', 'data-audiencias.js', 'data-bancos.js', 'data-estilos.js',
 'dominios.js', 'data-productos.js', 'memoria-local.js', 'motor-nucleo.js'
].forEach(function (f) {
  vm.runInThisContext(fs.readFileSync(path.join(JS, f), 'utf8'), { filename: f });
});

MOTOR_STATE.market = 'colombia';
MOTOR_STATE.region = 'todas';

/* --- 1) Mapa de modos por perfil (decisión aprobada, MODERN con tercera opción) --- */
ok(typeof PROFILE_VISUAL_MODES === 'object', 'debe existir el mapa PROFILE_VISUAL_MODES');
ok(JSON.stringify(PROFILE_VISUAL_MODES.HEAVY) === JSON.stringify(['TEXTO_DOMINANTE', 'OBJETO_DOMINANTE']), 'HEAVY: texto o símbolo dominante');
ok(JSON.stringify(PROFILE_VISUAL_MODES.SOFT) === JSON.stringify(['BALANCEADO', 'TEXTO_DOMINANTE']), 'SOFT: balanceado o texto dominante (nunca símbolo macizo)');
ok(JSON.stringify(PROFILE_VISUAL_MODES.MODERN) === JSON.stringify(['OBJETO_DOMINANTE', 'BALANCEADO', 'TEXTO_DOMINANTE']), 'MODERN: símbolo/balanceado y TEXTO_DOMINANTE como tercera opción');

/* --- 2) Producción explore, 2 palabras: 3 modos distintos y dentro del perfil --- */
MOTOR_STATE.workflowMode = 'explore';
MOTOR_STATE.product = 'CAMISETA SOFT';
MOTOR_STATE.subniche = 'humor_costeno';
MOTOR_STATE.audienceSet = 'Auto';
MOTOR_STATE.audienceMulti = 'si';
MOTOR_STATE.groupMode = 'distintos';
MOTOR_STATE.designMode = '';
MOTOR_STATE.explorationBrief = null;
MOTOR_STATE.stampSide = 'auto';
MOTOR_STATE.concept = 'fiesta costera';
MOTOR_STATE.message = 'Un abrazo';

const porClave = [_CONTACT_TREATMENT_ORDER.A, _CONTACT_TREATMENT_ORDER.B, _CONTACT_TREATMENT_ORDER.C];
let combosValidos = 0;
for (let ronda = 0; ronda < 40; ronda++) {
  clearLocks(memLocksMarket(), 'CAMISETA SOFT');
  MOTOR_STATE._rerollNonce = ronda;
  const modos = resolveTextImageModes({}, {}, Object.assign({}, _CONTACT_TREATMENT_ORDER));
  const vals = [modos.A, modos.B, modos.C];
  ok(vals.every(function (x) { return x; }), 'explore: todas las fichas reciben modo jerárquico');
  ok(vals.every(function (x, i) { return PROFILE_VISUAL_MODES[porClave[i]].indexOf(x) !== -1; }),
    'A/B/C deben usar modos de su pool de perfil (ronda ' + ronda + ')');
  ok(new Set(vals).size === 3, 'explore: los 3 modos Auto deben ser distintos (ronda ' + ronda + ')');
  if (PROFILE_VISUAL_MODES[porClave[0]].indexOf(vals[0]) !== -1
    && PROFILE_VISUAL_MODES[porClave[1]].indexOf(vals[1]) !== -1
    && PROFILE_VISUAL_MODES[porClave[2]].indexOf(vals[2]) !== -1
    && new Set(vals).size === 3) combosValidos++;
}
ok(combosValidos === 40, 'las 40 rondas deben producir combinaciones válidas (3/permutación permitida)');

/* --- 3) Lock manual de jerarquía: manda aunque esté fuera del pool del perfil --- */
clearLocks(memLocksMarket(), 'CAMISETA SOFT');
setLockValue(memLocksMarket(), 'CAMISETA SOFT', 'jerarquia', 'A', 'SOLO_OBJETO');
const conLock = resolveTextImageModes({}, {}, Object.assign({}, _CONTACT_TREATMENT_ORDER));
ok(conLock.A === 'SOLO_OBJETO', 'el lock jerárquico manual manda incluso fuera del pool del perfil');
ok(new Set([conLock.B, conLock.C]).size === 2, 'las fichas Auto siguen distintas entre sí');
ok(PROFILE_VISUAL_MODES.SOFT.indexOf(conLock.B) !== -1 && PROFILE_VISUAL_MODES.MODERN.indexOf(conLock.C) !== -1, 'B y C siguen respetando su perfil');
clearLocks(memLocksMarket(), 'CAMISETA SOFT');

/* --- 4) buildCandidate real: modos por perfil y layout dentro del pool del perfil --- */
for (let ronda = 0; ronda < 6; ronda++) {
  clearLocks(memLocksMarket(), 'CAMISETA SOFT');
  MOTOR_STATE._rerollNonce = ronda;
  const res = buildCandidate(resolveAudiences(), null);
  ['A', 'B', 'C'].forEach(function (k, i) {
    const fk = res[k];
    ok(fk.jerarquiaVisual === undefined || PROFILE_VISUAL_MODES[porClave[i]].indexOf(fk.jerarquiaVisual) !== -1,
      'cada ficha solo recibe modos de su perfil (ficha ' + k + ', ronda ' + ronda + ')');
    ok(fk.jerarquia === _JERARQUIA_FRANJA_DE_MODO[fk.jerarquiaVisual], 'texto jerárquico derivado del modo (ficha ' + k + ')');
    ok(_STRUCTURAL_PROFILES[porClave[i]].layout.some(function (h) { return String(fk.layout || '').indexOf(h) === 0; }),
      'layout dentro del pool del perfil (ficha ' + k + ', ronda ' + ronda + ')');
  });
  ok(new Set(['A', 'B', 'C'].map(function (k) { return res[k].jerarquiaVisual; })).size === 3, 'modos jerárquicos distintos en el set');
}

/* --- 5) Pool del producto como límite duro (MOCHILA) --- */
MOTOR_STATE.product = 'MOCHILA';
const mochilaCard = _applyStructuralProfile({}, 'HEAVY', {}, {}, {}, '');
ok(structuralPoolsHEAVY().some(function (h) { return mochilaCard.layout.indexOf(h) === 0; }), 'el layout respecta el pool del perfil');
ok(PRODUCT_LAYOUT_ALLOW.MOCHILA.some(function (h) { return mochilaCard.layout.indexOf(h) === 0; }), 'el layout también dentro del allow del producto');
MOTOR_STATE.product = 'CAMISETA SOFT';

function structuralPoolsHEAVY() {
  return _STRUCTURAL_PROFILES.HEAVY.layout;
}

/* --- 6) Contrato del prompt --- */
const motorSrc = fs.readFileSync(path.join(JS, 'motor-nucleo.js'), 'utf8');
ok(motorSrc.includes('ESQUELETO ESTRUCTURAL (MANDA)'), 'el prompt debe declarar el esqueleto estructural de cada ficha');
ok(motorSrc.includes('ACABADO DE ESTILO (SUBORDINADO)'), 'el estilo debe declararse como acabado subordinado');
ok(!/\(manda\)/.test(motorSrc), 'el prompt ya no da la última palabra al estilo con (mandas)');
ok(motorSrc.includes('Prohibido: salpicaduras agresivas'), 'SOFT prohibe salpicaduras agresivas y bordes desgarrados');
ok(motorSrc.includes('Prohibido: líneas finas, microdetalle'), 'HEAVY prohibe líneas finas y microdetalle');
ok(motorSrc.includes('Prohibido: ornamento decorativo, ruido de fondo y asimetría accidental.'), 'MODERN prohibe ornamentación y ruido');
ok(motorSrc.includes('textura propia del estilo') && motorSrc.includes('se conserva como técnica'), 'MODERN conserva la textura propia del estilo (p. ej. puntada de bordado) sin recargar el fondo');
ok(motorSrc.includes('Si el estilo exige un recurso prohibido, redúcelo a acento controlado'), 'los recursos prohibidos se reducen a acento, no se rompe el esqueleto');

if (failures.length) {
  console.error('FAIL profile-governs (' + failures.length + '/' + checks + ' fallos)');
  failures.forEach(function (m) { console.error('  - ' + m); });
  process.exit(1);
}
console.log('PASS profile-governs (' + checks + ' aserciones)');
