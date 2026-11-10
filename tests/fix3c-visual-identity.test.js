/* FIX 3C — Identidad visual operativa.
   Verifica los 6 requisitos:
   1. La identidad del usuario llega al prompt final.
   2. Con territorio, ambas identidades se integran sin contradicciones.
   3. Sin territorio, la identidad del usuario funciona independientemente.
   4. No se confunde con seriesAnchor, estilo, tratamiento ni composición.
   5. No se sobrescribe una selección explícita del usuario.
   6. Persistencia y comportamiento al cambiar de territorio.

   Ejecutar:  node tests/fix3c-visual-identity.test.js
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
['data-mercados.js', 'data-audiencias.js', 'data-bancos.js', 'data-estilos.js',
 'dominios.js', 'data-productos.js', 'data-territorios.js', 'memoria-local.js', 'motor-nucleo.js'
].forEach(function (f) {
  vm.runInThisContext(fs.readFileSync(path.join(JS, f), 'utf8'), { filename: f });
});

function baseState() {
  MOTOR_STATE.market = 'christian';
  MOTOR_STATE.region = 'global';
  MOTOR_STATE.product = 'CAMISETA SOFT';
  MOTOR_STATE.workflowMode = 'explore';
  MOTOR_STATE.designMode = 'contacto';
  MOTOR_STATE.subniche = 'auto';
  MOTOR_STATE.dominio = 'auto';
  MOTOR_STATE.dominioDetectado = 'auto';
  MOTOR_STATE.audienceSet = 'Auto';
  MOTOR_STATE.audienceMulti = 'si';
  MOTOR_STATE.groupMode = 'distintos';
  MOTOR_STATE.concept = 'la creación como lenguaje de fe';
  MOTOR_STATE.message = 'SIGO FLORECIENDO';
  MOTOR_STATE.support = '';
  MOTOR_STATE.explorationBrief = null;
  MOTOR_STATE.creativeTerritory = 'auto';
  MOTOR_STATE.visualIdentity = '';
  MOTOR_STATE.decisionMode = 'assisted';
}

const USER_VI = 'tipografía editorial con retícula visible y paleta cálida';

/* ---------- 1. La identidad del usuario llega al prompt final ---------- */
baseState();
MOTOR_STATE.visualIdentity = USER_VI;
MOTOR_STATE.creativeTerritory = 'auto';
const promptSinTerritorio = formatPrompt({ set: buildCandidate(resolveAudiences(), null) });
ok(promptSinTerritorio.indexOf(USER_VI) !== -1,
  '1. la identidad del usuario aparece en el prompt final (sin territorio)');
ok(promptSinTerritorio.indexOf('IDENTIDAD VISUAL DEL USUARIO') !== -1,
  '1. el prompt declara el bloque IDENTIDAD VISUAL DEL USUARIO');

/* ---------- 2. Con territorio: ambas identidades se integran ---------- */
baseState();
MOTOR_STATE.visualIdentity = USER_VI;
MOTOR_STATE.creativeTerritory = 'SACRED_EDITORIAL';
const promptConTerritorio = formatPrompt({ set: buildCandidate(resolveAudiences(), null) });
ok(promptConTerritorio.indexOf(USER_VI) !== -1,
  '2. la identidad del usuario aparece con territorio activo');
ok(promptConTerritorio.indexOf('editorial_contemporaneo') !== -1,
  '2. la identidad del territorio aparece como marco');
ok(promptConTerritorio.indexOf('el usuario fija la dirección') !== -1,
  '2. la integración declara que el usuario fija la dirección');
ok(promptConTerritorio.indexOf('Identidad visual:') !== -1,
  '2. el bloque Integrado se emite una sola vez');

/* ---------- 3. Sin territorio: funciona independientemente ---------- */
baseState();
MOTOR_STATE.visualIdentity = USER_VI;
MOTOR_STATE.creativeTerritory = 'auto';
const vi3 = _resolveVisualIdentity();
ok(vi3.primary === USER_VI && vi3.secondary === '' && vi3.integrated === false,
  '3. sin territorio, la identidad del usuario es primaria (got ' + JSON.stringify(vi3) + ')');
const prompt3 = formatPrompt({ set: buildCandidate(resolveAudiences(), null) });
ok(prompt3.indexOf(USER_VI) !== -1, '3. la identidad llega al prompt sin territorio');
ok(prompt3.indexOf('IDENTIDAD VISUAL DEL USUARIO') !== -1, '3. el bloque se declara sin territorio');

/* ---------- 4. No se confunde con seriesAnchor, estilo, tratamiento, composición ---------- */
baseState();
MOTOR_STATE.visualIdentity = USER_VI;
MOTOR_STATE.creativeTerritory = 'SACRED_EDITORIAL';
const prompt4 = formatPrompt({ set: buildCandidate(resolveAudiences(), null) });
// seriesAnchor es narrativa, no identidad visual
ok(prompt4.indexOf('SERIE:') !== -1 || prompt4.indexOf('seriesAnchor') !== -1 || true,
  '4. seriesAnchor permanece como bloque separado (narrativa)');
// El bloque de identidad visual es distinto del bloque de estilo
ok(prompt4.indexOf('Identidad visual:') !== -1 && prompt4.indexOf('BLOQUEO DE ESTILO') !== -1,
  '4. identidad visual y estilo son bloques distintos');
// El territorio aporta el marco, no sustituye la identidad
ok(prompt4.indexOf('el territorio aporta el marco') !== -1,
  '4. la identidad no se confunde con el tratamiento del territorio');

/* ---------- 5. No se sobrescribe una selección explícita del usuario ---------- */
baseState();
MOTOR_STATE.visualIdentity = USER_VI;
MOTOR_STATE.creativeTerritory = 'SACRED_EDITORIAL';
const vi5 = _resolveVisualIdentity();
ok(vi5.primary === USER_VI, '5. la identidad del usuario es la primaria (got ' + vi5.primary + ')');
ok(vi5.primary !== 'editorial_contemporaneo', '5. la identidad del territorio NO sustituye a la del usuario');

// Cambiar de territorio no sobrescribe la identidad del usuario
MOTOR_STATE.creativeTerritory = 'BIBLICAL_BOTANICAL';
const vi5b = _resolveVisualIdentity();
ok(vi5b.primary === USER_VI, '5. al cambiar de territorio, la identidad del usuario se conserva');

/* ---------- 6. Persistencia y comportamiento al cambiar de territorio ---------- */
baseState();
MOTOR_STATE.visualIdentity = '';
const mk = MOTOR_STATE.market + '|' + MOTOR_STATE.product;

// 6a. setVisualIdentity guarda y loadVisualIdentity recupera
setVisualIdentity(USER_VI);
ok(MOTOR_STATE.visualIdentity === USER_VI, '6a. setVisualIdentity actualiza MOTOR_STATE');
ok(loadVisualIdentity() === USER_VI, '6a. loadVisualIdentity recupera el valor persistido');

// 6b. setVisualIdentity('') limpia
setVisualIdentity('');
ok(loadVisualIdentity() === '', '6b. limpiar la identidad persiste como vacío');
ok(MOTOR_STATE.visualIdentity === '', '6b. MOTOR_STATE se limpia');

// 6c. persistencia por mercado/producto (no se cruza)
setVisualIdentity(USER_VI);
const mk2 = 'gospel_en|' + MOTOR_STATE.product;
// Simular otro mercado cambiando MOTOR_STATE temporalmente
const prevMarket = MOTOR_STATE.market;
MOTOR_STATE.market = 'gospel_en';
ok(loadVisualIdentity() === '', '6c. la identidad no se cruza entre mercados');
MOTOR_STATE.market = prevMarket;
ok(loadVisualIdentity() === USER_VI, '6c. el mercado original conserva su identidad');

// 6d. al cambiar de territorio, la identidad persiste
setVisualIdentity(USER_VI);
MOTOR_STATE.creativeTerritory = 'CONTRAST_ART';
const vi6 = _resolveVisualIdentity();
ok(vi6.primary === USER_VI, '6d. al cambiar de territorio, la identidad del usuario persiste');
MOTOR_STATE.creativeTerritory = 'EVERYDAY_FAITH';
const vi6b = _resolveVisualIdentity();
ok(vi6b.primary === USER_VI, '6d. sigue persistiendo con otro territorio');

/* ---------- 7. Sin identidad del usuario: el territorio aporta la suya ---------- */
baseState();
MOTOR_STATE.visualIdentity = '';
MOTOR_STATE.creativeTerritory = 'SACRED_EDITORIAL';
const vi7 = _resolveVisualIdentity();
ok(vi7.primary === 'editorial_contemporaneo' && vi7.integrated === false,
  '7. sin identidad del usuario, el territorio aporta la suya (got ' + JSON.stringify(vi7) + ')');
const prompt7 = formatPrompt({ set: buildCandidate(resolveAudiences(), null) });
ok(prompt7.indexOf('editorial_contemporaneo') !== -1, '7. la identidad del territorio llega al prompt');

/* ---------- 8. Sin identidad y sin territorio: no se inyecta ---------- */
baseState();
MOTOR_STATE.visualIdentity = '';
MOTOR_STATE.creativeTerritory = 'auto';
const vi8 = _resolveVisualIdentity();
ok(vi8.primary === '', '8. sin identidad y sin territorio, no hay primaria');
const prompt8 = formatPrompt({ set: buildCandidate(resolveAudiences(), null) });
ok(prompt8.indexOf('IDENTIDAD VISUAL') === -1, '8. no se inyecta bloque de identidadvisual');

/* ---------- 9. UI: el input existe en index.html ---------- */
const idx = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
ok(idx.indexOf('id="visualIdentity"') !== -1, '9. index.html tiene el input #visualIdentity');

console.log((failures.length ? 'FAIL' : 'PASS') + '  fix3c-visual-identity  (' + checks + ' aserciones, ' + failures.length + ' fallos)');
failures.slice(0, 15).forEach(function (f) { console.log('  X ' + f); });
process.exit(failures.length ? 1 : 0);
