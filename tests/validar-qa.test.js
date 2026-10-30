/* Validar-sin-regenerar + checklist QA visual (deudas botón y QA).
   - validarSetActual() valida el set en pantalla sin tocarlo.
   - evaluaSetOk().detalle nombra cada gate caído.
   - Checklist manual cierra 'QA visual pendiente' con firma y fecha.

   Ejecutar:  node tests/validar-qa.test.js
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

MOTOR_STATE.workflowMode = 'explore';
MOTOR_STATE.designMode = 'contacto';
MOTOR_STATE.market = 'colombia';
MOTOR_STATE.region = 'global';
MOTOR_STATE.product = 'CAMISETA SOFT';

function densSuf(suf) { const ps = { A: 'Media', B: 'Baja suave', C: 'Alta core' }; return ps[suf]; }
function ficha(suf, jer, tr) {
  return {
    estilo: 'Estilo' + suf, audiencia: 'coste_adulto_m', jerarquiaVisual: jer,
    objeto: 'fogata prueba', layout: 'Layout' + suf, tipografia: 'Tipo' + suf,
    formaSimbolo: 'Forma' + suf, tratamiento: tr, integracionTexto: 'Int' + suf,
    distribucionTexto: 'Dist' + suf, familiaColor: 'Fam' + suf, tecnica: 'Tec' + suf,
    densidad: densSuf(suf), negativeSpace: 'aire ' + suf, fitAudiencia: 80, fitProducto: 80,
    funcionSimbolica: 'f', intencionEmocional: 'e'
  };
}
function buenSet() {
  return {
    A: ficha('A', 'BALANCEADO', 'HEAVY: contornos gruesos, masas sólidas dominantes, contraste alto; letras grandes legibles'),
    B: ficha('B', 'TEXTO_DOMINANTE', 'SOFT: formas abiertas, aire y textura ligera; contraste suficiente para separar símbolo y texto al imprimir'),
    C: ficha('C', 'OBJETO_DOMINANTE', 'MODERN: geometría limpia, bordes nítidos y tintas planas; silueta clara y sin ruido')
  };
}

/* evaluaSetOk con detalle */
const evOk = evaluaSetOk(buenSet());
ok(evOk.passed === true, 'set sano debe pasar');
ok(Array.isArray(evOk.detalle) && evOk.detalle.length === 0, 'set sano sin detalle de fallos');
const setLayout = buenSet();
setLayout.B.layout = setLayout.A.layout;
const evLayout = evaluaSetOk(setLayout);
ok(evLayout.passed === false, 'layout repetido no debe pasar');
ok(evLayout.detalle.some(function (d) { return d.indexOf('layout repetida') !== -1; }), 'el detalle debe nombrar layout');
const setFit = buenSet();
setFit.A.fitAudiencia = 10;
const evFit = evaluaSetOk(setFit);
ok(evFit.detalle.some(function (d) { return d.indexOf('audiencia mín') !== -1; }), 'el detalle debe nombrar audiencia bajo umbral');

/* validarSetActual con DOM simulado */
function stubBase() {
  const els = { status: { innerHTML: '' } };
  global.document = {
    getElementById: function (id) { return els[id] || null; },
    querySelectorAll: function () { return []; }
  };
  return els;
}
vm.runInThisContext('LAST_RESULT = null;');
let els = stubBase();
let r = validarSetActual();
ok(r.ok === false && els.status.innerHTML.indexOf('No hay diseños') !== -1, 'sin diseños debe pedir crearlos sin regenerar');

vm.runInThisContext('LAST_RESULT = null;');
els = stubBase();
global.__SETBUENO__ = buenSet();
vm.runInThisContext('LAST_RESULT = { set: global.__SETBUENO__, score: null, passed: false };');
r = validarSetActual();
ok(r.ok === true, 'set sano debe validar OK');
ok(els.status.innerHTML.indexOf('Validación OK') !== -1, 'status debe confirmar validación');
ok(vm.runInThisContext('LAST_RESULT.passed === true && !!LAST_RESULT.score;'), 'debe recalcular score/passed');
/* Contradicción del audit resuelta: si el score pasa pero el Árbitro falla,
   el status NO puede quedar en verde ('Validación OK'). Regresión del punto crítico. */
vm.runInThisContext('LAST_RESULT = null;');
els = stubBase();
global.__SETBUENO__ = buenSet();
vm.runInThisContext('LAST_RESULT = { set: global.__SETBUENO__, score: null, passed: true };');
const realArb = arbitroSelectores;
global.arbitroSelectores = function () { return { ok: false, fallos: 2, total: 12, checks: [], detalle: 'estilo' }; };
r = validarSetActual();
ok(r.ok === false, 'verde en score + árbitro rojo => la validacion no queda en verde');
ok(els.status.innerHTML.indexOf('Árbitro') !== -1, 'status debe reportar el fallo del arbitro, no callarse en verde');
ok(els.status.innerHTML.indexOf('Validación OK') === -1, 'status NO debe decir Validación OK cuando el arbitro falla');
global.arbitroSelectores = realArb;
const motorSrcForCheck = fs.readFileSync(path.join(ROOT, 'js', 'motor-nucleo.js'), 'utf8');
ok(/function _estadoUnificado\(/.test(motorSrcForCheck), 'motor expone estado unificado del set (score + arbitro)');
ok(/statusEl\.innerHTML = verdict\.html/.test(motorSrcForCheck), 'crearLos3Disenos aplica el veredicto unificado al status');

const setMalo = buenSet();
setMalo.C.tipografia = setMalo.A.tipografia;
vm.runInThisContext('LAST_RESULT = null;');
els = stubBase();
global.__SETMALO__ = setMalo;
vm.runInThisContext('LAST_RESULT = { set: global.__SETMALO__, score: null, passed: true };');
r = validarSetActual();
ok(r.ok === false && els.status.innerHTML.indexOf('tipografía repetida') !== -1, 'set roto: nombra tipografía y passed=false');

/* Checklist QA con DOM simulado */
function stubQA(marcados) {
  const boxes = marcados.map(function (c) { return { checked: !!c }; });
  const estado = { innerHTML: '' };
  global.document = {
    getElementById: function (id) {
      if (id === 'qaVisual') return { querySelectorAll: function () { return boxes; } };
      if (id === 'qaEstado') return estado;
      return null;
    },
    querySelectorAll: function () { return []; }
  };
  return { boxes: boxes, estado: estado };
}
let qa = stubQA([true, true, false]);
let st = actualizarQAVisual();
ok(st.marcados === 2 && st.total === 3, 'conteo 2/3');
ok(qa.estado.innerHTML.indexOf('2/3') !== -1 && qa.estado.innerHTML.indexOf('verificada') === -1, 'parcial sin sello');
qa = stubQA([true, true, true]);
st = actualizarQAVisual();
ok(st.marcados === 3 && qa.estado.innerHTML.indexOf('verificada') !== -1, 'completo sella con fecha');
qa = stubQA([true, false, true]);
limpiarQAVisual();
ok(qa.boxes.every(function (b) { return !b.checked; }), 'limpiar desmarca todo');
ok(qa.estado.innerHTML.indexOf('pendiente') !== -1, 'limpiar vuelve a pendiente');

/* Cableado: botón valida, panel QA con una sola casilla */
const analisisSrc = fs.readFileSync(path.join(ROOT, 'js', 'ia-analisis.js'), 'utf8');
ok(/hasSet && typeof validarSetActual === 'function'/.test(analisisSrc), 'btnBuild debe validar si hay diseños');ok(/typeof crearLos3Disenos === 'function'/.test(analisisSrc), 'btnBuild debe generar si está vacío');
const indexHtml = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
ok(indexHtml.indexOf('id="qaVisual"') !== -1, 'index debe traer panel qaVisual');
ok(indexHtml.indexOf('id="qaEstado"') !== -1, 'index debe traer estado qaEstado');
ok((indexHtml.match(/type="checkbox"/g) || []).length === 1, 'panel QA con una sola casilla');
ok(indexHtml.indexOf('Revisé la imagen generada y apruebo este set') !== -1, 'la casilla habla en lenguaje normal');

const passed = failures.length === 0;
console.log((passed ? 'PASS' : 'FAIL') + '  validar-qa  (' + checks + ' aserciones, ' + failures.length + ' fallos)');
failures.forEach(function (f) { console.log('  X ' + f); });
process.exit(passed ? 0 : 1);
