/* DEBT-001 — Persistencia de locks
   1) setLockValue propaga si el guardado persistió ({locks, persisted}).
   2) localStorage rechazando la escritura (cuota / modo privado) → setJSON y
      setLockValue devuelven false (antes: siempre true).
   3) El fallback de sesión (mem) sigue siendo legible con getItem (antes: el
      lock se perdía ni siquiera en la sesión).
   4) saveTemplate reporta el error real de almacenamiento (editor-bancos).
   5) La UI avisa en #status cuando el lock no persiste, y setCardLock lo deja
      después del reroll para que no lo pise el mensaje de regeneración.

   Ejecutar:  node tests/locks-persistencia.test.js
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

/* localStorage de prueba: almacenamiento real en memoria del objeto con
   interruptor de fallo (simula cuota llena / escritura rechazada). */
const LS = (function () {
  const o = {};
  let fail = false;
  function def(name, fn) { Object.defineProperty(o, name, { value: fn, enumerable: false }); }
  def('getItem', function (k) {
    return Object.prototype.hasOwnProperty.call(o, k) ? o[k] : null;
  });
  def('setItem', function (k, v) {
    if (fail) throw new Error('QuotaExceededError');
    o[k] = String(v);
  });
  def('removeItem', function (k) {
    if (fail) throw new Error('QuotaExceededError');
    delete o[k];
  });
  def('clear', function () { Object.keys(o).forEach(function (k) { delete o[k]; }); });
  def('key', function (i) { return Object.keys(o)[i] || null; });
  def('setFail', function (f) { fail = !!f; });
  return o;
})();
global.localStorage = LS;

const STATUS = { textContent: '', className: 'status info' };
global.document = {
  getElementById: function (id) { return id === 'status' ? STATUS : null; },
  querySelectorAll: function () { return []; },
  addEventListener: function () {}
};

const JS = path.join(ROOT, 'js');
['data-mercados.js', 'data-audiencias.js', 'data-bancos.js', 'data-estilos.js',
 'dominios.js', 'data-productos.js', 'memoria-local.js', 'motor-nucleo.js'
].forEach(function (f) {
  vm.runInThisContext(fs.readFileSync(path.join(JS, f), 'utf8'), { filename: f });
});

MOTOR_STATE.market = 'colombia';
MOTOR_STATE.region = 'global';
MOTOR_STATE.product = 'CAMISETA SOFT';

const MK = 'colombia|todas';
const PRD = 'CAMISETA SOFT';

/* ---------- 1. Escritura normal: persisted=true y lock legible ---------- */
const r1 = setLockValue(MK, PRD, 'estilo', 'A', 'Estilo Normal');
ok(r1 && r1.persisted === true, 'con storage sano setLockValue reporta persisted=true');
ok(r1 && r1.locks && r1.locks.estilo.A === 'Estilo Normal', 'setLockValue devuelve los locks actualizados');
ok(loadLocks(MK, PRD).estilo.A === 'Estilo Normal', 'el lock se lee tras guardarse');

/* ---------- 2. Sin fallo no hay aviso ---------- */
STATUS.textContent = '';
ok(_avisoLockSinPersistir(r1, 'estilo', 'A') === false, 'persisted=true no dispara aviso');
ok(STATUS.textContent === '', '#status queda intacto cuando el lock sí persistió');

/* ---------- 3. localStorage rechaza la escritura ---------- */
LS.setFail(true);
const r2 = setLockValue(MK, PRD, 'estilo', 'B', 'Estilo Sin Cuota');
ok(r2 && r2.persisted === false, 'setLockValue propaga persisted=false cuando la escritura es rechazada');
const l2 = loadLocks(MK, PRD);
ok(l2.estilo.B === 'Estilo Sin Cuota', 'el fallback de sesión sigue legible (getItem cae a mem)');
ok(l2.estilo.A === 'Estilo Normal', 'los locks guardados antes del fallo siguen intactos');
ok(savePatternConfig({ window: 7 }) === false, 'setJSON devuelve false cuando el storage rechaza (savePatternConfig)');
LS.setFail(false);
ok(savePatternConfig({ window: 7 }) === true, 'setJSON vuelve a true con el storage sano');
LS.setFail(true);

/* ---------- 4. saveTemplate reporta el error real (editor-bancos) ---------- */
const tBad = saveTemplate({ nombre: 'Locks test', producto: 'MOCHILA', imagen: 'data:image/png;base64,xx', notas: '' });
ok(tBad.ok === false && /almacenamiento/.test(String(tBad.error || '')),
  'saveTemplate devuelve ok=false con error de almacenamiento cuando no persiste (obtenido: ' + JSON.stringify(tBad) + ')');
LS.setFail(false);
const tOk = saveTemplate({ nombre: 'Locks test', producto: 'MOCHILA', imagen: 'data:image/png;base64,xx', notas: '' });
ok(tOk.ok === true && tOk.id, 'saveTemplate ok=true con storage sano');

/* ---------- 5. Aviso de UI cuando no persiste ---------- */
LS.setFail(true);
STATUS.textContent = ''; STATUS.className = 'status info';
ok(_avisoLockSinPersistir({ persisted: false }, 'layout', 'C') === true, 'persisted=false dispara el aviso');
ok(/layout/.test(STATUS.textContent) && /solo en esta sesi/.test(STATUS.textContent),
  'el aviso nombra el bloqueo y aclara que solo vale para la sesión');
ok(STATUS.className === 'bad', 'el aviso marca #status como malo');
ok(_avisoLockSinPersistir({ persisted: true }, 'layout', 'C') === false, 'persisted=true no reescribe el aviso');
ok(_avisoLockSinPersistir(undefined, 'layout', 'C') === false,
  'wrapper sin retorno no causa aviso falso (compatibilidad con el fallback _setLockValue)');

/* ---------- 6. setCardLock end-to-end ---------- */
let rerolled = null;
syncContext = function () {};
rerollSingle = function (k) { rerolled = k; };
const selMock = {
  getAttribute: function (n) {
    if (n === 'data-card') return 'C';
    if (n === 'data-lock') return 'layout';
    return null;
  },
  value: 'Axial centrado (test)'
};

LS.setFail(true);
STATUS.textContent = '';
setCardLock(selMock);
ok(rerolled === 'C', 'setCardLock sigue regenerando la ficha aunque el lock no persista');
ok(/layout/.test(STATUS.textContent), 'setCardLock deja el aviso de no-persistencia en #status (tras el reroll)');

LS.setFail(false);
STATUS.textContent = '';
rerolled = null;
setCardLock(selMock);
ok(rerolled === 'C', 'setCardLock regenera con storage sano');
ok(STATUS.textContent === '', 'con storage sano setCardLock no escribe aviso');

LS.setFail(false);

/* ---------- Resultado ---------- */
if (failures.length) {
  console.error('FAIL locks-persistencia (' + checks + ' aserciones, ' + failures.length + ' fallos)');
  failures.forEach(function (f) { console.error('  - ' + f); });
  process.exit(1);
}
console.log('PASS locks-persistencia (' + checks + ' aserciones, 0 fallos)');
