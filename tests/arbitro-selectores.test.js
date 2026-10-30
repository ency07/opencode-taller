/* Árbitro de selectores → prompt (determinista, sin IA).
   - Verifica que cada selector elegido llegó al prompt final y a las fichas.
   - Detecta mercado ausente, ejes duros repetidos y layout fuera del catálogo.
   - Comprueba el cableado de UI (panel + botón) y la exposición global.

   Ejecutar:  node tests/arbitro-selectores.test.js
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

MOTOR_STATE.market = 'colombia';
MOTOR_STATE.region = 'global';
MOTOR_STATE.language = 'auto';
MOTOR_STATE.marketplace = 'generic';
MOTOR_STATE.product = 'CAMISETA SOFT';
MOTOR_STATE.concept = 'Fogata de fe';
MOTOR_STATE.message = 'SIGUE LA LUZ';

const NAMES = ['01A', '01B', '01C'];

function ficha(suf, jer) {
  return {
    estilo: 'Estilo ' + suf, audiencia: 'Adultos ' + suf, jerarquiaVisual: jer,
    objeto: 'objeto ' + suf, layout: 'Layout ' + suf + ': variante',
    tipografia: 'Tipo ' + suf, formaSimbolo: 'Forma ' + suf, tratamiento: 'TRAT ' + suf,
    integracionTexto: 'Int ' + suf, distribucionTexto: 'Dist ' + suf, tecnica: 'Tec ' + suf,
    paleta: 'Paleta ' + suf, familiaColor: 'Fam ' + suf,
    _esquema: { bg: '#111111', dom: '#222222', acc: '#333333', ink: '#444444' }
  };
}
function buenSet() {
  return {
    A: ficha('A', 'BALANCEADO'),
    B: ficha('B', 'TEXTO_DOMINANTE'),
    C: ficha('C', 'OBJETO_DOMINANTE')
  };
}

/* Prompt sintético con las anclas que el árbitro busca. */
function buildPrompt(set, product) {
  const mock = (typeof getMockupRule === 'function') ? getMockupRule(product) : '';
  let p = '/CONTACTSHEET\n';
  p += 'MERCADO: ' + MOTOR_STATE.market + ' | PRODUCTO: ' + product + '\n';
  p += 'CONCEPTO: ' + MOTOR_STATE.concept + ' | MENSAJE: ' + MOTOR_STATE.message + '\n';
  p += 'PRODUCTO / UBICACION / ESCALA: ' + product + '\n';
  p += (mock ? 'PRESENTACION: ' + mock + '\n' : '');
  p += 'REGLAS INQUEBRANTABLES:\n';
  p += 'IDIOMA: directiva\nCULTURA: directiva\nLEGAL: directiva\n';
  ['A', 'B', 'C'].forEach(function (k, i) {
    const v = set[k];
    p += '### ' + NAMES[i] + ' · ' + v.estilo + ' · ' + v.audiencia + '\n';
    p += 'RECAP ' + NAMES[i] + ': objeto=«' + v.objeto + '»\n';
    p += 'JERARQUÍA: ' + v.jerarquiaVisual + '\n';
    p += 'PALETA: ' + v.paleta + '\n';
  });
  return p;
}

function findCheck(info, needle) {
  return info.checks.filter(function (c) {
    return c.etiqueta.indexOf(needle) !== -1 || c.grupo.indexOf(needle) !== -1;
  })[0];
}

/* 1. Set sano con prompt completo → todo verde */
const setOk = buenSet();
const promptOk = buildPrompt(setOk, 'CAMISETA SOFT');
const infoOk = arbitroSelectores(promptOk, { set: setOk });
ok(!!infoOk && Array.isArray(infoOk.checks), 'arbitroSelectores devuelve checks');
ok(infoOk.total === infoOk.checks.length && infoOk.total > 5, 'el árbitro evalúa varios puntos');
ok(infoOk.ok === true && infoOk.fallos === 0, 'set sano y prompt completo pasan sin fallos');

/* 2. Mercado ausente → falla el punto de contexto */
const infoMarket = arbitroSelectores(buildPrompt(setOk, 'CAMISETA SOFT').replace('MERCADO: ', 'MARKET: '), { set: setOk });
const chMarket = findCheck(infoMarket, 'Mercado:');
ok(chMarket && chMarket.ok === false, 'mercado ausente se marca como fallo');
ok(infoMarket.ok === false && infoMarket.fallos >= 1, 'el árbitro global falla si el mercado falta');

/* 3. Eje duro repetido (tipografía) → falla la diferencia A/B/C */
const setRep = buenSet();
setRep.B.tipografia = setRep.A.tipografia;
const infoRep = arbitroSelectores(buildPrompt(setRep, 'CAMISETA SOFT'), { set: setRep });
const chRep = findCheck(infoRep, 'Ejes duros sin repetir');
ok(chRep && chRep.ok === false, 'tipografía repetida rompe la diferencia dura');
ok(chRep.detalle.indexOf('tipografia') !== -1, 'el detalle nombra el eje repetido');

/* 4. Layout fuera del catálogo del producto (MOCHILA) */
MOTOR_STATE.product = 'MOCHILA';
const setMochila = buenSet();
setMochila.A.layout = 'Emblema circular: centrado';
setMochila.B.layout = 'Banda horizontal: inferior';
setMochila.C.layout = 'Diagonal ascendente: izquierda';
const infoMochilaOk = arbitroSelectores(buildPrompt(setMochila, 'MOCHILA'), { set: setMochila });
ok(infoMochilaOk.ok === true, 'layouts permitidos de MOCHILA pasan');
setMochila.C.layout = 'Foo raro: inventado';
const infoMochilaBad = arbitroSelectores(buildPrompt(setMochila, 'MOCHILA'), { set: setMochila });
const chFichaC = findCheck(infoMochilaBad, 'Ficha 01C');
ok(chFichaC && chFichaC.ok === false, 'layout fuera del catálogo se marca como fallo');
ok(chFichaC.detalle.indexOf('layout') !== -1, 'el detalle nombra el layout inválido');
MOTOR_STATE.product = 'CAMISETA SOFT';

/* 5. Sin diseños → null */
vm.runInThisContext('LAST_RESULT = null;');
ok(arbitroSelectores() === null, 'sin set no hay veredicto');

/* 6. Cableado de UI y exposición */
const indexHtml = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
ok(indexHtml.indexOf('id="arbitro"') !== -1, 'index trae el contenedor arbitro');
ok(indexHtml.indexOf('id="arbitroEstado"') !== -1, 'index trae el estado del árbitro');
ok(indexHtml.indexOf('id="btnArbitro"') !== -1, 'index trae el botón Verificar de nuevo');
ok((indexHtml.match(/type="checkbox"/g) || []).length === 1, 'panel QA con una sola casilla');

const motorSrc = fs.readFileSync(path.join(ROOT, 'js', 'motor-nucleo.js'), 'utf8');
ok(/function arbitroSelectores\(/.test(motorSrc), 'motor define arbitroSelectores');
ok(/window\.arbitroSelectores = arbitroSelectores;/.test(motorSrc), 'motor expone arbitroSelectores');
ok(motorSrc.indexOf('renderArbitro(result);') !== -1, 'crearLos3Disenos renderiza el árbitro');
ok(/Falta: /.test(motorSrc), 'el arbitro debe mostrar el motivo del fallo con separador legible (Falta: <detalle>)');

const analisisSrc = fs.readFileSync(path.join(ROOT, 'js', 'ia-analisis.js'), 'utf8');
ok(/on\('btnArbitro', 'click'/.test(analisisSrc), 'ia-analisis cablea el botón del árbitro');

const passed = failures.length === 0;
console.log((passed ? 'PASS' : 'FAIL') + '  arbitro-selectores  (' + checks + ' aserciones, ' + failures.length + ' fallos)');
failures.forEach(function (f) { console.log('  X ' + f); });
process.exit(passed ? 0 : 1);
