/* Objetos coherentes con el subnicho (rama fix/objetos-subnicho).
   - region 'todas' es superconjunto de las regiones del subnicho (no solo 'nacional').
   - En explore, el símbolo sale del banco de la FAMILIA elegida, nunca del banco
     común genérico ("faro", "vaso de barro"...).

   Ejecutar:  node tests/objetos-subnicho.test.js
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

/* --- 1) region 'todas' debe ser superconjunto del banco regional --- */
const bankTodas = getBankForSubniche('humor_costeno', 'todas', 'colombia');
const bankCosta = getBankForSubniche('humor_costeno', 'costa_caribe', 'colombia');
ok(bankTodas.length >= bankCosta.length,
  "'todas' debe traer al menos tantos objetos como la region concreta (" + bankTodas.length + ' vs ' + bankCosta.length + ')');
bankCosta.forEach(function (o) {
  ok(bankTodas.indexOf(o) !== -1, "'todas' debe incluir el objeto regional: " + o);
});

/* --- 2) explore no debe escoger objetos del banco común genérico --- */
MOTOR_STATE.market = 'colombia';
MOTOR_STATE.region = 'todas';
MOTOR_STATE.product = 'CAMISETA SOFT';
MOTOR_STATE.subniche = 'auto';
MOTOR_STATE.dominio = 'humor_costeno';
MOTOR_STATE.dominioDetectado = 'auto';
MOTOR_STATE.audienceSet = 'Auto';
MOTOR_STATE.audienceMulti = 'no';
MOTOR_STATE.groupMode = 'distintos';
MOTOR_STATE.designMode = 'contacto';
MOTOR_STATE.support = '';
MOTOR_STATE.explorationBrief = null;
MOTOR_STATE.stampSide = 'auto';
MOTOR_STATE.workflowMode = 'explore';
MOTOR_STATE.concept = 'burla y bembeo a lo costeño';
MOTOR_STATE.message = 'HABLA CACHON';

const familyBank = getBankForSubniche('humor_costeno', 'todas', 'colombia');
const commonBank = _commonBankForMarket();
const anchor = 'burla y bembeo a lo costeño';

let generados = 0;
for (let i = 0; i < 20; i++) {
  const set = buildCandidate(resolveAudiences(), null);
  ['A', 'B', 'C'].forEach(function (k) {
    const v = set[k];
    if (!v || v.jerarquiaVisual === 'SOLO_TEXTO') return;
    generados++;
    const obj = String(v.objeto || '');
    ok(commonBank.indexOf(obj) === -1,
      'explore no debe usar un objeto del banco común genérico: "' + obj + '"');
    const coherente = familyBank.indexOf(obj) !== -1 || obj === anchor;
    ok(coherente,
      'el objeto debe pertenecer a la familia Humor Costeño o ser el ancla del concepto: "' + obj + '"');
  });
}
ok(generados > 0, 'debe haber generado al menos un objeto con símbolo (no solo tipografía)');

function finish() {
  const passed = failures.length === 0;
  console.log((passed ? 'PASS' : 'FAIL') + '  objetos-subnicho  (' + checks + ' aserciones, ' + failures.length + ' fallos)');
  failures.slice(0, 12).forEach(function (f) { console.log('  X ' + f); });
  process.exit(passed ? 0 : 1);
}
finish();
