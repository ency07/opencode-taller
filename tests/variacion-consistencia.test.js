/* Consistencia de Variación guiada.
   - A/B/C fijan perfil estructural Y tratamiento (como CONTACTSHEET/exploración):
     se elimina la contradicción PERFIL ESTRUCTURAL ↔ ARTE de la misma ficha.
   - El bloque VARIACIÓN lista el perfil real por dirección (sin hardcode A/B/C).
   - El encabezado de variación declara SERIE.
   - La audiencia se imprime legible (palabras del mercado), no el id interno.

   Ejecutar:  node tests/variacion-consistencia.test.js
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
 'dominios.js', 'data-productos.js', 'memoria-local.js', 'motor-nucleo.js'
].forEach(function (f) {
  vm.runInThisContext(fs.readFileSync(path.join(JS, f), 'utf8'), { filename: f });
});

const motor = fs.readFileSync(path.join(JS, 'motor-nucleo.js'), 'utf8');
const NAMES = ['01A', '01B', '01C'];
const KEYS = ['HEAVY', 'SOFT', 'MODERN'];

/* 1) Estático: el tratamiento fijo se aplica también en variación. */
ok(/const fixedTreatment = \(contactIdentity \|\| MOTOR_STATE\.workflowMode === 'explore' \|\| MOTOR_STATE\.workflowMode === 'variation'\) \? _CONTACT_TREATMENT_ORDER\[k\] : '';/.test(motor),
  'variación debe fijar el tratamiento A/B/C igual que CONTACTSHEET y exploración');

/* 2) Estático: audiencia legible en ficha y en el árbitro. */
ok(/function _audienceDisplay\(/.test(motor), 'debe existir el helper de audiencia legible');
ok(motor.includes("' · ' + _audienceDisplay(v.audiencia) + '"), 'el encabezado de ficha debe usar la audiencia legible');
ok(motor.includes('_arbHas(text, _audienceDisplay(v.audiencia))'), 'el árbitro debe aceptar la audiencia legible');

/* 3) Estático: SERIE en variación y mapa de perfiles sin hardcode. */
ok(/MODO: variacion guiada \| MERCADO: ' \+ MOTOR_STATE\.market \+ ' \| PRODUCTO: ' \+ MOTOR_STATE\.product \+ ' \| SERIE: '/.test(motor),
  'el encabezado de variación debe declarar la SERIE');
ok(!motor.includes('A/HEAVY: masas compactas'), 'el bloque VARIACIÓN no debe hardcodear el mapa A/B/C');

/* 4) Conducta: buildCandidate en variación fija perfil y tratamiento coherentes. */
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
MOTOR_STATE.stampSide = 'auto';
MOTOR_STATE.workflowMode = 'variation';
MOTOR_STATE.variationOptions = { simbolo: 'sustituir', paleta: 'renovar', textos: 'mismo_mensaje', esencia: '' };
MOTOR_STATE.imageReference = null;
MOTOR_STATE.imageAnalysis = null;
MOTOR_STATE.concept = 'fogata de fe que abriga a la familia';
MOTOR_STATE.message = 'SIGUE LA LUZ';

const set = buildCandidate(resolveAudiences(), null);
['A', 'B', 'C'].forEach(function (k, i) {
  const key = _treatmentKey(set[k].tratamiento);
  ok(key === KEYS[i], 'variación: ' + k + ' debe usar tratamiento ' + KEYS[i] + ' (obtuvo ' + key + ')');
  ok(String(set[k].perfilEstructural || '') === KEYS[i], 'variación: ' + k + ' debe declarar perfil estructural ' + KEYS[i]);
});
ok(new Set(['A', 'B', 'C'].map(function (k) { return set[k].tratamiento; })).size === 3,
  'variación: los tres tratamientos deben seguir siendo distintos');

/* 5) Conducta: prompt sin contradicción, con SERIE y audiencia legible. */
const prompt = formatPrompt({ set: set });
ok(/MODO: variacion guiada \| MERCADO: colombia \| PRODUCTO: CAMISETA SOFT \| SERIE:/.test(prompt),
  'el prompt de variación debe incluir SERIE');
ok(prompt.includes('01A/HEAVY:') && prompt.includes('01B/SOFT:') && prompt.includes('01C/MODERN:'),
  'el bloque VARIACIÓN debe listar el perfil real por dirección');

['A', 'B', 'C'].forEach(function (k, i) {
  const start = prompt.indexOf('### ' + NAMES[i]);
  const seg = prompt.slice(start, start + 600);
  const label = _audienceDisplay(set[k].audiencia);
  ok(seg.includes('PERFIL ESTRUCTURAL: ' + KEYS[i]), 'ficha ' + NAMES[i] + ' debe declarar PERFIL ' + KEYS[i]);
  ok(seg.includes(' · ' + label), 'ficha ' + NAMES[i] + ' debe mostrar la audiencia legible (' + label + ')');
  ok(label === set[k].audiencia || seg.indexOf(set[k].audiencia) === -1,
    'ficha ' + NAMES[i] + ' no debe exponer el id interno de audiencia');
  if (set[k].jerarquiaVisual !== 'SOLO_TEXTO') {
    ok(seg.indexOf(KEYS[i]) !== -1, 'ficha ' + NAMES[i] + ' debe mantener perfil y tratamiento alineados');
  }
});

console.log((failures.length ? 'FAIL' : 'PASS') + '  variacion-consistencia  (' + checks + ' aserciones, ' + failures.length + ' fallos)');
failures.forEach(function (msg) { console.log('  X ' + msg); });
process.exit(failures.length ? 1 : 0);
