/* CARGA POR EDAD: la edad del perfil da el TONO de cada ficha (adulto sobrio,
   joven limpio-impactante, infantil simple) en las 3 estructuras
   HEAVY/SOFT/MODERN, sin tocar selecciones, pools ni modos.
   Ejecutar: node tests/edad-carga.test.js */

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
function bloqueDe(out, n) {
  const orden = ['01A', '01B', '01C'];
  const i = out.indexOf('### ' + n + ' ');
  const sig = orden[orden.indexOf(n) + 1];
  const j = sig ? out.indexOf('### ' + sig + ' ') : -1;
  return i === -1 ? '' : out.slice(i, j === -1 ? out.length : j);
}

function ficha(jerarquia, extra) {
  const base = {
    estilo: 'Minimal Modern', audiencia: 'coste_adulto_m', jerarquiaVisual: jerarquia,
    objeto: 'campfire small enough to hold in talk',
    arquitectura: 'a', composicion: 'b', layout: 'Columna apilada',
    placement: 'pecho centrado', escalaProducto: 'media',
    formaSimbolo: 'c', tecnica: 'd', tratamiento: 'e',
    textoPrincipal: 'T', textoApoyo: 'A', textoTerciario: 'S',
    tipografia: 'Slab pesada', paleta: 'pal (modo: X)', familiaColor: 'f',
    fitAudiencia: 70, fitProducto: 60, densidad: 'Media', negativeSpace: 'abierto',
    distribucionTexto: 'TEXTO ARRIBA, motivo debajo', integracionTexto: 'w', relacion: 'r'
  };
  if (extra) Object.keys(extra).forEach(function (k) { base[k] = extra[k]; });
  return base;
}

/* --- 0) Fuente --- */
ok(motorSrc.includes('CARGA POR EDAD'), 'la línea CARGA POR EDAD existe en el motor');
ok(motorSrc.includes("adulto: 'adulto → sobrio y de peso") && motorSrc.includes("joven: 'joven → impacto inmediato") && motorSrc.includes("infantil: 'infantil → simple y redondeada"),
  'las 3 variantes por edad existen en la fuente');
ok(motorSrc.includes('no cambia el esqueleto estructural ni la jerarquía de la ficha'),
  'la línea declara subordinación al esqueleto y la jerarquía');

/* --- 1) Set manual mixto: variante correcta por ficha (determinista) --- */
MOTOR_STATE.workflowMode = 'explore';
MOTOR_STATE.designMode = '';
MOTOR_STATE.market = 'colombia';
MOTOR_STATE.language = 'es';
MOTOR_STATE.product = 'CAMISETA SOFT';
MOTOR_STATE.subniche = 'humor_costeno';
MOTOR_STATE.concept = 'fogata pequeña para contar historias';
MOTOR_STATE.message = '';
MOTOR_STATE.support = '';
MOTOR_STATE.explorationBrief = null;

const mixto = {
  A: ficha('BALANCEADO', { audiencia: 'coste_adulto_m' }),
  B: ficha('TEXTO_DOMINANTE', { audiencia: 'coste_joven_m' }),
  C: ficha('OBJETO_DOMINANTE', { audiencia: 'infantil_col' })
};
ok(AUD_PROFILES.coste_adulto_m && AUD_PROFILES.coste_adulto_m.edad === 'adulto', 'datos: coste_adulto_m es adulto');
ok(AUD_PROFILES.coste_joven_m && AUD_PROFILES.coste_joven_m.edad === 'joven', 'datos: coste_joven_m es joven');
ok(AUD_PROFILES.infantil_col && AUD_PROFILES.infantil_col.edad === 'infantil', 'datos: infantil_col es infantil');

const outMix = formatPrompt({ set: mixto });
ok(count(outMix, 'CARGA POR EDAD:') === 3, 'exactamente una línea por ficha (hay ' + count(outMix, 'CARGA POR EDAD:') + ')');
ok(bloqueDe(outMix, '01A').indexOf('CARGA POR EDAD: adulto → sobrio y de peso') !== -1, '01A (HEAVY) recibe la variante adulto');
ok(bloqueDe(outMix, '01B').indexOf('CARGA POR EDAD: joven → impacto inmediato') !== -1, '01B recibe la variante joven');
ok(bloqueDe(outMix, '01C').indexOf('CARGA POR EDAD: infantil → simple y redondeada') !== -1, '01C recibe la variante infantil');
ok(bloqueDe(outMix, '01A').indexOf('joven →') === -1 && bloqueDe(outMix, '01B').indexOf('adulto →') === -1,
  'ninguna ficha mezcla variantes de otra edad');
ok(count(outMix, 'no cambia el esqueleto estructural ni la jerarquía de la ficha') === 3, 'el remate de subordinación va en las 3 fichas');

/* --- 2) Rangos numéricos normalizados; edad amplia no inventa línea --- */
const rango = {
  A: ficha('BALANCEADO', { audiencia: 'global_adult_en' }),
  B: ficha('TEXTO_DOMINANTE', { audiencia: 'global_young_en' }),
  C: ficha('OBJETO_DOMINANTE', { audiencia: 'gospel_family_faith' })
};
ok(AUD_PROFILES.global_adult_en.edad === '35-55', 'datos: global_adult_en es 35-55');
ok(AUD_PROFILES.global_young_en.edad === '18-34', 'datos: global_young_en es 18-34');
ok(AUD_PROFILES.gospel_family_faith.edad === 'all', 'datos: gospel_family_faith es all');
const outRango = formatPrompt({ set: rango });
ok(bloqueDe(outRango, '01A').indexOf('CARGA POR EDAD: adulto →') !== -1, 'rango 35-55 se normaliza a adulto');
ok(bloqueDe(outRango, '01B').indexOf('CARGA POR EDAD: joven →') !== -1, 'rango 18-34 se normaliza a joven');
ok(count(bloqueDe(outRango, '01C'), 'CARGA POR EDAD:') === 0, 'edad amplia (all/todas/mixta/amplia) no inventa tono');

/* --- 3) Set real: la línea sale o no según el tono normalizado --- */
MOTOR_STATE.market = 'colombia';
MOTOR_STATE.region = 'todas';
MOTOR_STATE.audienceSet = 'Auto';
MOTOR_STATE.audienceMulti = 'si';
MOTOR_STATE.groupMode = 'distintos';
MOTOR_STATE.stampSide = 'auto';
const TONO = { adulto: 'adulto', '35-55': 'adulto', '29-55': 'adulto', joven: 'joven', '18-34': 'joven', '16-28': 'joven', infantil: 'infantil' };
const estructurasVistas = [];
for (let ronda = 0; ronda < 6; ronda++) {
  clearLocks(memLocksMarket(), 'CAMISETA SOFT');
  MOTOR_STATE._rerollNonce = ronda;
  const res = buildCandidate(resolveAudiences(), null);
  const out = formatPrompt({ set: res });
  let esperadas = 0;
  ['A', 'B', 'C'].forEach(function (k) {
    const fk = res[k];
    const perfil = String(fk.perfilEstructural || fk.tratamiento || '').toUpperCase();
    if (['HEAVY', 'SOFT', 'MODERN'].indexOf(perfil) !== -1 && estructurasVistas.indexOf(perfil) === -1) estructurasVistas.push(perfil);
    const tono = TONO[(AUD_PROFILES[fk.audiencia] || {}).edad];
    const bloque = bloqueDe(out, '01' + k);
    if (tono) {
      esperadas++;
      ok(bloque.indexOf('CARGA POR EDAD: ' + tono + ' →') !== -1,
        'ficha ' + k + ' (' + perfil + ', ' + tono + ') recibe su variante (ronda ' + ronda + ')');
    } else {
      ok(count(bloque, 'CARGA POR EDAD:') === 0,
        'ficha ' + k + ' (' + perfil + ', edad amplia) no recibe línea (ronda ' + ronda + ')');
    }
  });
  ok(count(out, 'CARGA POR EDAD:') === esperadas,
    'set real ronda ' + ronda + ': ' + esperadas + ' esperadas, hay ' + count(out, 'CARGA POR EDAD:'));
}
ok(new Set(estructurasVistas).size === 3,
  'la línea se observa en las 3 estructuras HEAVY/SOFT/MODERN (vistas: ' + estructurasVistas.join('/') + ')');

/* --- 3) Perfil sin edad declarada: no se inventa la línea --- */
const sinEdad = {
  A: ficha('BALANCEADO', { audiencia: 'aud_inexistente_xyz' }),
  B: ficha('TEXTO_DOMINANTE', { audiencia: 'aud_inexistente_xyz' }),
  C: ficha('OBJETO_DOMINANTE', { audiencia: 'aud_inexistente_xyz' })
};
const outSin = formatPrompt({ set: sinEdad });
ok(count(outSin, 'CARGA POR EDAD:') === 0, 'sin edad no se emite la línea (nada inventado)');
ok(count(outSin, 'ID DE VALIDACIÓN DE AUDIENCIA:') === 3, 'las demás líneas de la ficha siguen intactas');

/* --- 4) Blindaje de lo construido (conteos exactos) --- */
ok(count(outMix, 'REGLAS COMUNES A LAS 3 FICHAS:') === 1, 'REGLAS COMUNES sigue en 1');
ok(count(outMix, 'LAYOUT (ubicación):') === 3, 'LAYOUT sigue en 3');
ok(count(outMix, 'TÉCNICA GLOBAL:') === 3, 'TÉCNICA GLOBAL sigue en 3');
ok(count(outMix, 'ESQUELETO ESTRUCTURAL (MANDA):') === 3, 'ESQUELETO (MANDA) sigue en 3');
ok(count(outMix, 'ACABADO DE ESTILO (SUBORDINADO):') === 3, 'ACABADO (SUBORDINADO) sigue en 3');
ok(count(outMix, 'CONTROL DE ELEMENTOS:') === 1, 'CONTROL DE ELEMENTOS sigue izado en 1');
ok(motorSrc.includes('(manda)') === false || !/\(manda\)/.test(motorSrc), 'sin (manda) en la fuente');

const passed = failures.length === 0;
console.log((passed ? 'PASS' : 'FAIL') + '  edad-carga  (' + checks + ' aserciones, ' + failures.length + ' fallos)');
failures.forEach(function (f) { console.log('  X ' + f); });
process.exit(passed ? 0 : 1);
