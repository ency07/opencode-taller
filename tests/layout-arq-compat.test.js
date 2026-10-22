/* P1-P5 (opinión experta) + compresión del prompt:
   - Arquitectura textual compatible con el layout final de cada ficha.
   - Integración envolvente bloqueada contra disposición vertical.
   - Interpretación literal del concepto ambiguo (P3).
   - Orden de degradación de la hoja si no cabe (P4).
   - MODERN conserva la textura propia del estilo (P5).
   - Bloque REGLAS COMUNES: CONTROL/FIGURAS/ARQUITECTURA emitidos una sola vez.
   Ejecutar: node tests/layout-arq-compat.test.js */

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

const motorSrc = fs.readFileSync(path.join(JS, 'motor-nucleo.js'), 'utf8');
function count(txt, sub) { return txt.split(sub).length - 1; }

/* --- 0) Helpers de compatibilidad presentes --- */
ok(motorSrc.includes('function _familiaLayoutArq(layout)'), 'existe la familia de layout para arquitectura');
ok(motorSrc.includes('function _arquitecturaCompatible(arch, layout)'), 'existe el validador layout × arquitectura');
ok(motorSrc.includes('function _integracionCompatible(layout, integracion)'), 'existe el validador integración × disposición');
ok(typeof _familiaLayoutArq === 'function' && typeof _arquitecturaCompatible === 'function' && typeof _integracionCompatible === 'function', 'los helpers están cargados en tiempo de ejecución');

/* --- 1) Unidades de la familia --- */
ok(_familiaLayoutArq('Columna apilada: símbolo arriba, textos apilados debajo') === 'lateral', 'Columna apilada es familia lateral');
ok(_familiaLayoutArq('Diagonal ascendente') === 'diagonal', 'Diagonal es familia diagonal');
ok(_familiaLayoutArq('Axial centrado') === 'central', 'Axial es familia central');

/* --- 2) Incompatibilidades del caso real (01B: Columna apilada + TEXTO DIVIDIDO) --- */
ok(_arquitecturaCompatible('TEXTO DIVIDIDO a ambos lados del motivo; lectura natural y pausa visual central.', 'Columna apilada') === false,
  'Columna apilada no admite TEXTO DIVIDIDO (caso real 01B)');
ok(_arquitecturaCompatible('TEXTO DIVIDIDO a ambos lados del motivo; lectura natural y pausa visual central.', 'Axial centrado') === true,
  'Axial centrado sí admite TEXTO DIVIDIDO');
ok(_arquitecturaCompatible('COLUMNA LATERAL izquierda; motivo al lado opuesto; líneas cortas y corredor de espacio negativo.', 'Diagonal ascendente') === false,
  'Diagonal no admite COLUMNA LATERAL');
ok(_arquitecturaCompatible('TEXTO ARRIBA, motivo debajo; alineación izquierda irregular; franja horizontal y separación amplia.', 'Columna apilada') === true,
  'Columna apilada sí admite TEXTO ARRIBA');

/* --- 3) Integración envolvente vs disposición vertical (01B: cinta) --- */
const cintaEnvolvedora = 'el texto corre por el contorno del símbolo como una cinta que lo envuelve sin esconderlo';
const integOk = _integracionCompatible('Columna apilada', cintaEnvolvedora);
ok(integOk.indexOf('cinta') !== -1 && integOk.indexOf('sin cintas') !== -1, 'la integración de columna apilada rechaza la envolviente y lo declara');
ok(_integracionCompatible('Axial centrado', cintaEnvolvedora) === cintaEnvolvedora, 'familias no laterales conservan su integración');

/* --- 4) buildCandidate real: compatibilidad en cada set --- */
MOTOR_STATE.market = 'colombia';
MOTOR_STATE.region = 'todas';
MOTOR_STATE.workflowMode = 'explore';
MOTOR_STATE.product = 'CAMISETA SOFT';
MOTOR_STATE.subniche = 'humor_costeno';
MOTOR_STATE.audienceSet = 'Auto';
MOTOR_STATE.audienceMulti = 'si';
MOTOR_STATE.groupMode = 'distintos';
MOTOR_STATE.designMode = '';
MOTOR_STATE.explorationBrief = null;
MOTOR_STATE.stampSide = 'auto';
MOTOR_STATE.concept = 'corona de hijo sobre la cabeza de un padre';
MOTOR_STATE.message = '';

let setsConLateral = 0;
for (let ronda = 0; ronda < 12; ronda++) {
  clearLocks(memLocksMarket(), 'CAMISETA SOFT');
  MOTOR_STATE._rerollNonce = ronda;
  const res = buildCandidate(resolveAudiences(), null);
  const arqs = ['A', 'B', 'C'].map(function (k) { return res[k].distribucionTexto; });
  ok(new Set(arqs).size === 3, 'P1: la arquitectura textual sigue distinta en A/B/C (ronda ' + ronda + ')');
  ['A', 'B', 'C'].forEach(function (k) {
    const fk = res[k];
    ok(_arquitecturaCompatible(fk.distribucionTexto, fk.layout),
      'P1: ' + String(fk.distribucionTexto).slice(0, 28) + ' debe ser compatible con «' + String(fk.layout).slice(0, 40) + '» (ronda ' + ronda + ')');
    if (_familiaLayoutArq(fk.layout) === 'lateral') {
      setsConLateral++;
      ok(!/como una cinta que lo envuelve|corre por el contorno|las letras brotan|se entrelazan/i.test(String(fk.integracionTexto || '')),
        'P1: sin integración envolvente en disposición vertical (ronda ' + ronda + ', ficha ' + k + ')');
    }
  });
}
ok(setsConLateral > 0, 'al menos un set debe probar la familia lateral en las 12 rondas');

/* --- 5) Prompt emitido: bloques comunes una sola vez + frases P2-P4 --- */
MOTOR_STATE._rerollNonce = 7;
clearLocks(memLocksMarket(), 'CAMISETA SOFT');
const resFinal = buildCandidate(resolveAudiences(), null);
const out = formatPrompt({ set: resFinal });
ok(count(out, 'REGLAS COMUNES A LAS 3 FICHAS:') === 1, 'D: REGLAS COMUNES aparece una vez');
ok(count(out, 'CONTROL DE ELEMENTOS:') === 1, 'D: CONTROL DE ELEMENTOS izado, una sola vez');
ok(count(out, 'FIGURAS HUMANAS:') <= 1, 'D: FIGURAS HUMANAS ya no triplica el prompt');
ok(count(out, 'ARQUITECTURA DOMINANTE') === 1, 'D: ARQUITECTURA DOMINANTE izada, una sola vez');
ok(count(out, 'La jerarquía fija tamaño, área y peso; el layout solo ubicación.') === 1, 'D: la regla de precedencia jerárquica se emite una vez');
ok(out.indexOf('INTERPRETACIÓN DEL CONCEPTO:') !== -1, 'P3: interpretación literal del concepto ambiguo');
ok(out.indexOf('lectura más literal de sus palabras') !== -1, 'P3: elige la lectura más literal');
ok(out.indexOf('conserva el área de la jerarquía y une texto y objeto por solapamiento simple') !== -1, 'P2: integración no viable degrada a solapamiento simple');
ok(out.indexOf('entrega por prioridad:') !== -1 && out.indexOf('mejor un parcial limpio que columnas incompletas') !== -1, 'P4: orden de degradación de la hoja');

/* --- 6) P5 en fuente (MODERN) --- */
ok(motorSrc.includes('textura propia del estilo') && motorSrc.includes('se conserva como técnica'), 'P5: MODERN conserva la textura propia del estilo');
ok(motorSrc.includes('Prohibido: ornamento decorativo, ruido de fondo y asimetría accidental.'), 'P5: la prohibición de MODERN ya no prohíbe la textura del estilo');

/* --- 7) Guard de prompt obsoleto --- */
ok(motorSrc.includes('function _promptSignature()'), 'B: existe la firma de la configuración');
ok(motorSrc.includes('window._PROMPT_SIG = _promptSignature()'), 'B: formatPrompt registra la firma al emitir');
ok(motorSrc.includes('_promptSignature() !== window._PROMPT_SIG'), 'B: copiarPrompt detecta la desconexión interfaz ↔ prompt');
ok(typeof _promptSignature === 'function', 'B: _promptSignature está cargada');

const passed = failures.length === 0;
console.log((passed ? 'PASS' : 'FAIL') + '  layout-arq-compat  (' + checks + ' aserciones, ' + failures.length + ' fallos)');
failures.forEach(function (f) { console.log('  X ' + f); });
process.exit(passed ? 0 : 1);
