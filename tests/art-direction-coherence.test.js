/* Fase 4 (Red Team): direccion artistica coherente en el scoring y el gate.
   - _artDirectionCoherence evalua coherencia arquitectura/layout/integracion/densidad/negocio.
   - scoreSet expone artDirectionMin/artDirectionAvg/artDirection.
   - evaluaSetOk aplica el gate de coherencia artistica min 65 y nombra el fallo.
   Ejecutar:  node tests/art-direction-coherence.test.js
   Sale con codigo 1 si falla cualquier asercion. */

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
['data-mercados.js', 'data-audiencias.js', 'data-bancos.js', 'banco-global.js', 'banco-gospel-es.js', 'data-estilos.js',
 'dominios.js', 'data-productos.js', 'memoria-local.js', 'motor-nucleo.js'
].forEach(function (f) { vm.runInThisContext(fs.readFileSync(path.join(JS, f), 'utf8'), { filename: f }); });

MOTOR_STATE.workflowMode = 'explore';
MOTOR_STATE.designMode = 'contacto';
MOTOR_STATE.market = 'colombia';
MOTOR_STATE.region = 'global';
MOTOR_STATE.product = 'CAMISETA SOFT';

function ficha(over) {
  const base = {
    estilo: 'E0', layout: 'L0', tipografia: 'T0', formaSimbolo: 'F0',
    integracionTexto: 'I0', distribucionTexto: 'D0', familiaColor: 'C0', tecnica: 'X0',
    jerarquiaVisual: 'BALANCEADO', tratamiento: 'HEAVY: x', densidad: 'media equilibrada',
    negativeSpace: 'aire A', objeto: 'fogata', audiencia: 'coste_adulto_m', fitAudiencia: 80, fitProducto: 80
  };
  return Object.assign({}, base, over || {});
}

const incoherente = _artDirectionCoherence(ficha({ layout: 'L0', distribucionTexto: 'D0' }));
ok(typeof incoherente.score === 'number', 'F4: _artDirectionCoherence devuelve score numerico');
ok(Array.isArray(incoherente.issues), 'F4: _artDirectionCoherence devuelve issues array');
ok(incoherente.score < 100, 'F4: ficha con arquitectura/layout incoherente baja el score');
ok(_artDirectionCoherence(null).score === 0, 'F4: ficha ausente punta en cero');

const set = { A: ficha({}), B: ficha({}), C: ficha({}) };
const m = scoreSet(set);
ok(typeof m.artDirectionMin === 'number', 'F4: scoreSet expone artDirectionMin numerico');
ok(typeof m.artDirectionAvg === 'number', 'F4: scoreSet expone artDirectionAvg numerico');
ok(Array.isArray(m.artDirection), 'F4: scoreSet expone artDirection array');

const incohSet = {
  A: ficha({ layout: 'Columna apilada lateral: texto arriba', distribucionTexto: 'DIAGONAL ascendente izquierda-derecha; cruza espacio negativo sin tapar la silueta.', integracionTexto: 'la cintura envuelve el texto y el motivo' }),
  B: ficha({ layout: 'BLOQUE INFERIOR desplazado a un lado; motivo arriba y fuera del eje central.', distribucionTexto: 'BLOQUE INFERIOR desplazado a un lado; motivo arriba y fuera del eje central.', integracionTexto: 'separacion limpia entre texto y motivo' }),
  C: ficha({ layout: 'DIAGONAL ascendente izquierda-derecha; cruza espacio negativo sin tapar la silueta.', distribucionTexto: 'DIAGONAL ascendente izquierda-derecha; cruza espacio negativo sin tapar la silueta.', integracionTexto: 'separacion limpia entre texto y motivo' })
};
const evIncoh = evaluaSetOk(incohSet);
ok(evIncoh.detalle.some(function (d) { return d.indexOf('coherencia art') !== -1; }), 'F4: gate marca coherencia artistica fallida');
ok(evIncoh.passed === false, 'F4: gate rechaza set incoherente en coherencia');

const okSet = {
  A: ficha({ layout: 'BLOQUE INFERIOR desplazado a un lado; motivo arriba y fuera del eje central.', distribucionTexto: 'BLOQUE INFERIOR desplazado a un lado; motivo arriba y fuera del eje central.', integracionTexto: 'separacion limpia entre texto y motivo' }),
  B: ficha({ layout: 'DIAGONAL ascendente izquierda-derecha; cruza espacio negativo sin tapar la silueta.', distribucionTexto: 'DIAGONAL ascendente izquierda-derecha; cruza espacio negativo sin tapar la silueta.', integracionTexto: 'separacion limpia entre texto y motivo' }),
  C: ficha({ layout: 'BLOQUE INFERIOR desplazado a un lado; motivo arriba y fuera del eje central.', distribucionTexto: 'BLOQUE INFERIOR desplazado a un lado; motivo arriba y fuera del eje central.', integracionTexto: 'separacion limpia entre texto y motivo' })
};
const evOkSet = evaluaSetOk(okSet);
ok(!evOkSet.detalle.some(function (d) { return d.indexOf('coherencia art') !== -1; }), 'F4: gate no marca coherencia cuando no hay fallo');

if (failures.length) {
  failures.forEach(function (f) { console.error('FAIL: ' + f); });
  process.exit(1);
}
console.log('PASS art-direction-coherence (' + checks + ' aserciones, 0 fallos)');