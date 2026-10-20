/* Jerarquía SOLO_OBJETO (TIPO 5): cero letras, elementos secundarios no
   textuales permitidos bajo contrato. Ejecutar: node tests/jerarquia-solo-objeto.test.js */

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
 'dominios.js', 'data-productos.js', 'memoria-local.js', 'motor-nucleo.js',
 'ia-analisis.js', 'ia-validador.js'
].forEach(function (f) {
  vm.runInThisContext(fs.readFileSync(path.join(JS, f), 'utf8'), { filename: f });
});

function ficha(jer) {
  return {
    jerarquiaVisual: jer, estilo: 'Barroco Ornamental', objeto: 'zapato junto a la puerta',
    audiencia: 'gospel_adulto_fe', tratamiento: 'HEAVY: masas y contraste', perfilEstructural: 'HEAVY',
    layout: 'central: símbolo dominante con respiración', tipografia: 'Slab de oficio',
    tecnica: 'Claroscuro dramático', formaSimbolo: 'silueta pesada', tratamientoDetalle: '',
    paleta: 'sepia clásica', densidad: 'media', negativeSpace: 'generoso',
   cara: 'frente', distribucionTexto: 'bloque central', integracionTexto: 'integrado',
    textoPrincipal: 'x / y / z', fitAudiencia: 80, fitProducto: 80
  };
}

MOTOR_STATE.market = 'colombia';
MOTOR_STATE.region = 'todas';
MOTOR_STATE.product = 'CAMISETA SOFT';
MOTOR_STATE.subniche = 'fe_popular_col';
MOTOR_STATE.audienceSet = 'Auto';
MOTOR_STATE.audienceMulti = 'no';
MOTOR_STATE.groupMode = 'distintos';
MOTOR_STATE.designMode = 'contacto';
MOTOR_STATE.support = '';
MOTOR_STATE.explorationBrief = null;
MOTOR_STATE.stampSide = 'auto';
MOTOR_STATE.workflowMode = 'new';
MOTOR_STATE.serie = '';
MOTOR_STATE.concept = 'nueva vida al cruzar la puerta';
MOTOR_STATE.message = 'Vivir por fe';

/* --- 1) Ficha SOLO_OBJETO: contrato en el prompt --- */
const set = { A: ficha('BALANCEADO'), B: ficha('TEXTO_DOMINANTE'), C: ficha('SOLO_OBJETO') };
const prompt = formatPrompt({ set: set });
ok(prompt.indexOf('RECAP 01C: jerarquía=SOLO_OBJETO') !== -1, 'RECP 01C con la jerarquía nueva');
ok(prompt.indexOf('símbolo 100% del área · texto 0% — el arte completo es el objeto autorizado; CERO letras') !== -1, 'PESO VISUAL de SOLO_OBJETO: 100% objeto, 0% texto');
ok(prompt.indexOf('CERO TEXTO (SOLO_OBJETO)') !== -1, 'bloque CERO TEXTO presente');
ok(prompt.indexOf('even') === -1 && prompt.indexOf('ELEMENTOS SECUNDARIOS ADMITIDOS') !== -1, 'elementos secundarios no textuales admitidos por contrato');
ok(prompt.split('CERO TEXTO (SOLO_OBJETO)').length === 2, 'el bloque CERO TEXTO sale solo en la ficha SOLO_OBJETO');
ok(prompt.indexOf('TEXTO: NINGUNO (jerarquía SOLO_OBJETO)') !== -1, 'la ficha declara TEXTO: NINGUNO');
ok(prompt.split('TEXTO: NINGUNO (jerarquía SOLO_OBJETO)').length === 2, 'TEXTO NINGUNO solo en esa ficha');
ok(prompt.indexOf('SOLO_OBJETO: el objeto autorizado («zapato junto a la puerta») ocupa el 100% visual') !== -1, 'directiva de jerarquía con el objeto real');
ok(prompt.indexOf('Diferéncialo de OBJETO_DOMINANTE') !== -1, 'contrato anti-convergencia con OBJETO_DOMINANTE explícito');
ok(prompt.indexOf('TEXTO SUBORDINADO:') === -1, 'sin ficha OBJETO_DOMINANTE no debe haber TEXTO SUBORDINADO');

/* --- 2) Registro de jerarquías y select UI --- */
const motorSrc = fs.readFileSync(path.join(JS, 'motor-nucleo.js'), 'utf8');
ok(motorSrc.indexOf("SOLO_OBJETO: 'TIPO 5 · Solo objeto (cero letras)'") !== -1, 'TIPO 5 registrada en MODES');
ok(motorSrc.indexOf("['SOLO_TEXTO', 'TEXTO_DOMINANTE', 'BALANCEADO', 'OBJETO_DOMINANTE', 'SOLO_OBJETO']") !== -1, 'la UI del lock incluye SOLO_OBJETO');
ok(motorSrc.indexOf('SOLO_OBJETO += 1') !== -1, 'el bias de conceptos largos considera SOLO_OBJETO');

/* --- 3) Lock manual TIPO 5 se respeta en el reparto --- */
setLockValue(memLocksMarket(), 'CAMISETA SOFT', 'jerarquia', 'C', 'SOLO_OBJETO');
let res = resolveTextImageModes(['Barroco Ornamental', 'Hand-Drawn', 'Acuarela editorial'], { A: 'gospel_adulto_fe', B: 'gospel_adulto_fe', C: 'gospel_adulto_fe' });
ok(res.C === 'SOLO_OBJETO', 'lock manual de jerarquía TIPO 5 se respeta');
ok(res.A !== res.B || res.A !== res.C, 'el resto del reparto sigue sin repetirse o cabe');
clearLocks(memLocksMarket(), 'CAMISETA SOFT');

/* --- 4) Validador: peso de SOLO_OBJETO --- */
const vp = PODValidador.construirPromptValidador([{ ficha: '01C', estilo: 'Barroco Ornamental', jerarquia: 'SOLO_OBJETO', objeto: 'zapato', cara: 'frente', peso: 'símbolo 100% / texto 0% (cero letras)' }]);
ok(vp.indexOf('símbolo 100% / texto 0%') !== -1, 'el validador comprende el peso de TIPO 5');

console.log((failures.length ? 'FAIL' : 'PASS') + ' jerarquia-solo-objeto (' + checks + ' aserciones, ' + failures.length + ' fallos)');
failures.forEach(function (msg) { console.error(' - ' + msg); });
process.exit(failures.length ? 1 : 0);
