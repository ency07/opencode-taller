/* Umbral de pertinencia con diente (rama fix/umbral-qc).
   - Constantes únicas (50/40) para gate, pills y bloqueo.
   - Mensaje específico que nombra el gate caído y cómo salir.
   - Copiar prompt se bloquea bajo umbral (headless con DOM simulado).

   Ejecutar:  node tests/umbral-qc.test.js
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

function finish() {
  const passed = failures.length === 0;
  console.log((passed ? 'PASS' : 'FAIL') + '  umbral-qc  (' + checks + ' aserciones, ' + failures.length + ' fallos)');
  failures.forEach(function (f) { console.log('  X ' + f); });
  process.exit(passed ? 0 : 1);
}

/* Constantes únicas */
ok(UMBRAL_AUDIENCIA_MIN === 50, 'UMBRAL_AUDIENCIA_MIN debe ser 50');
ok(UMBRAL_PRODUCTO_MIN === 40, 'UMBRAL_PRODUCTO_MIN debe ser 40');

/* Mensaje específico por gate caído */
const msgAud = _mensajeUmbral({ fitAudienciaMin: 43, fitProductoMin: 80 });
ok(msgAud.indexOf('audiencia mín 43/100') !== -1, 'debe nombrar audiencia caída con valor');
ok(msgAud.indexOf('(umbral 50)') !== -1, 'debe citar el umbral 50');
ok(msgAud.indexOf('Regenera o ajusta') !== -1, 'debe decir cómo salir');
const msgProd = _mensajeUmbral({ fitAudienciaMin: 90, fitProductoMin: 20 });
ok(msgProd.indexOf('producto mín 20/100') !== -1, 'debe nombrar producto caído con valor');
ok(_mensajeUmbral({ fitAudienciaMin: 50, fitProductoMin: 40 }) === '', 'en el umbral exacto no hay mensaje');
ok(_mensajeUmbral({ fitAudienciaMin: 99, fitProductoMin: 99 }) === '', 'sobre el umbral no hay mensaje');
ok(_mensajeUmbral(null) === '', 'sin score no hay mensaje');

/* Fuente única: gate y pills usan las constantes */
const motorSrc = fs.readFileSync(path.join(JS, 'motor-nucleo.js'), 'utf8');
ok(/m\.fitAudienciaMin >= UMBRAL_AUDIENCIA_MIN/.test(motorSrc), 'pertinenciaOk debe usar la constante');
ok(/m\.fitProductoMin >= UMBRAL_PRODUCTO_MIN/.test(motorSrc), 'pertinenciaOk producto debe usar la constante');
ok(/fitAudienciaMin >= UMBRAL_AUDIENCIA_MIN \? 'good'/.test(motorSrc), 'pill audiencia debe usar la constante');
ok(/fitProductoMin >= UMBRAL_PRODUCTO_MIN \? 'good'/.test(motorSrc), 'pill producto debe usar la constante');

/* Bloqueo de copiado: stub de DOM + LAST_RESULT vía vm */
function stubDoc(outValue) {
  const els = { out: { value: outValue }, status: { innerHTML: '' } };
  global.document = {
    getElementById: function (id) { return els[id] || null; },
    querySelectorAll: function () { return []; }
  };
  return els;
}

(async function () {
  try {
    // Caso A: bajo umbral → bloquea y nombra el gate
    let els = stubDoc('PROMPT VÁLIDO');
    vm.runInThisContext('LAST_RESULT = { set: null, score: { fitAudienciaMin: 43, fitProductoMin: 60 }, passed: false };');
    await copiarPrompt();
    ok(els.status.innerHTML.indexOf('Copiado bloqueado') !== -1, 'copiar bajo umbral debe bloquearse');
    ok(els.status.innerHTML.indexOf('audiencia mín 43/100') !== -1, 'el bloqueo debe nombrar el gate caído');

    // Caso B: sobre umbral → no bloquea (falla solo por falta de portapapeles en Node)
    els = stubDoc('PROMPT VÁLIDO');
    vm.runInThisContext('LAST_RESULT = { set: null, score: { fitAudienciaMin: 80, fitProductoMin: 70 }, passed: true };');
    await copiarPrompt();
    ok(els.status.innerHTML.indexOf('Copiado bloqueado') === -1, 'copiar sobre umbral no debe bloquearse');

    // Caso C: sin score (prompt pegado a mano) → no bloquea
    els = stubDoc('PROMPT PEGADO');
    vm.runInThisContext('LAST_RESULT = null;');
    await copiarPrompt();
    ok(els.status.innerHTML.indexOf('Copiado bloqueado') === -1, 'sin score no debe bloquearse');
  } catch (e) {
    ok(false, 'el flujo de copiado lanzó excepción: ' + (e && e.message));
  }
  finish();
})();
