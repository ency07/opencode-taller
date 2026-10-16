/* Reglas estrictas de figuras humanas + mockups por tono (rama fix/figuras-mockups).
   Black-box: ejecuta formatPrompt() y verifica lo emitido por ficha.
   - Gesto facial (reír/llorar/cantar) autoriza SOLO rostro + calidad anatómica.
   - Concepto con personas nombra solo lo nombrado + calidad anatómica.
   - Concepto neutro prohíbe toda figura.
   - Mockups: ficha serie comercial (franja, 3 columnas, colores, adicionales, paleta).

   Ejecutar:  node tests/figuras-mockups.test.js
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

function ficha(jerarquia, objeto) {
  return {
    estilo: 'Minimal Modern', audiencia: 'coste_adulto_m', jerarquiaVisual: jerarquia,
    objeto: objeto, arquitectura: 'a', composicion: 'b', layout: 'Columna apilada',
    placement: 'pecho centrado', escalaProducto: 'media',
    formaSimbolo: 'c', tecnica: 'd', tratamiento: 'e',
    textoPrincipal: 'T', textoApoyo: 'A', textoTerciario: 'S',
    tipografia: 'Slab pesada', paleta: 'pal (modo: X)', familiaColor: 'f',
    fitAudiencia: 70, fitProducto: 60, densidad: 'Media', negativeSpace: 'abierto',
    distribucionTexto: 'texto en diagonal', integracionTexto: 'w', relacion: 'r'
  };
}
function count(out, sub) { return out.split(sub).length - 1; }
function setup(concept) {
  MOTOR_STATE.workflowMode = 'explore';
  MOTOR_STATE.designMode = 'contacto';
  MOTOR_STATE.market = 'colombia';
  MOTOR_STATE.region = 'barranquilla';
  MOTOR_STATE.language = 'es';
  MOTOR_STATE.product = 'CAMISETA SOFT';
  MOTOR_STATE.subniche = 'auto';
  MOTOR_STATE.dominio = 'auto';
  MOTOR_STATE.dominioDetectado = 'auto';
  MOTOR_STATE.concept = concept;
  MOTOR_STATE.message = '';
  MOTOR_STATE.support = '';
  MOTOR_STATE.explorationBrief = null;
}
function set3(objeto) {
  return { A: ficha('BALANCEADO', objeto), B: ficha('TEXTO_DOMINANTE', objeto), C: ficha('OBJETO_DOMINANTE', objeto) };
}

/* Gesto facial: autoriza SOLO rostro + calidad anatómica */
setup('carcajada que se escucha de esquina a esquina');
const outGesto = formatPrompt({ set: set3('carcajada que se escucha de esquina a esquina') });
ok(count(outGesto, 'FIGURAS HUMANAS:') === 3, 'gesto: las 3 fichas deben traer línea FIGURAS (hay ' + count(outGesto, 'FIGURAS HUMANAS:') + ')');
ok(outGesto.indexOf('autorizado SOLO el rostro en gesto') !== -1, 'gesto: debe autorizar solo rostro en gesto');
ok(outGesto.indexOf('prohibidos manos, brazos, cuerpo') !== -1, 'gesto: debe prohibir manos/brazos/cuerpo');
ok(outGesto.indexOf('CALIDAD ANATÓMICA OBLIGATORIA') !== -1, 'gesto: debe exigir calidad anatómica');
ok(outGesto.indexOf('5 dedos por mano') !== -1, 'gesto: la calidad debe cuantificar (dedos/ojos)');

/* Concepto neutro: prohibición total */
setup('campfire small enough to hold in talk');
const outNeutro = formatPrompt({ set: set3('campfire small enough to hold in talk') });
ok(outNeutro.indexOf('no autoriza figuras') !== -1, 'neutro: debe prohibir figuras');
ok(outNeutro.indexOf('prohibidos rostros, manos, personas') !== -1, 'neutro: prohibición explícita de rostros/manos/personas');

/* Personas nombradas: solo lo nombrado + calidad */
setup('hombre con sombrero vueltiao riendo');
const outNombrado = formatPrompt({ set: set3('hombre con sombrero vueltiao riendo') });
ok(outNombrado.indexOf('dibuja SOLO lo nombrado') !== -1, 'nombrado: debe limitarse a lo nombrado');
ok(outNombrado.indexOf('sin añadir otras personas ni multitudes') !== -1, 'nombrado: debe prohibir multitudes añadidas');
ok(outNombrado.indexOf('CALIDAD ANATÓMICA OBLIGATORIA') !== -1, 'nombrado: debe exigir calidad anatómica');

/* SOLO_TEXTO no lleva línea FIGURAS (no hay objeto) */
const outSolo = formatPrompt({ set: { A: ficha('SOLO_TEXTO', 'x'), B: ficha('TEXTO_DOMINANTE', 'x'), C: ficha('BALANCEADO', 'x') } });
ok(count(outSolo, 'FIGURAS HUMANAS:') === 2, 'SOLO_TEXTO no debe llevar FIGURAS (2/3 esperado)');

/* FICHA SERIE: franja metadata + 3 columnas por audiencia + colores + adicionales + paleta */
ok(outGesto.indexOf('FICHA SERIE (CAMISETA SOFT)') !== -1, 'mockups: contrato de ficha serie');
ok(outGesto.indexOf('Franja superior: SERIE, CONCEPTO, MENSAJE') !== -1, 'mockups: franja superior con metadata');
ok(outGesto.indexOf('Hoja de 3 columnas, una por ficha del set') !== -1, 'mockups: 3 columnas por ficha');
ok(outGesto.indexOf("recuadro 'vista frontal' con el arte en plano") !== -1, 'mockups: recuadro frontal por defecto');
ok(outGesto.indexOf('Por defecto TODO es frontal') !== -1, 'mockups: frontal por defecto');
ok(outGesto.indexOf('SOLO si la ficha de esa columna indica estampado en espalda') !== -1, 'mockups: espalda solo a pedido');
ok(outGesto.indexOf('prohibido inventar vistas de espalda no pedidas') !== -1, 'mockups: prohíbe espaldas inventadas');
ok(outGesto.indexOf('Fila COLORES SUGERIDOS por columna: 5 frontales planos') !== -1, 'mockups: colores sugeridos con nombres');
ok(outGesto.indexOf('Fila MOCKUPS ADICIONALES en ambiente lifestyle') !== -1, 'mockups: fila de adicionales');
ok(outGesto.indexOf('Franja PALETA GENERAL DE LA SERIE') !== -1, 'mockups: paleta general con nombres');
ok(outGesto.indexOf("Rotulación permitida SOLO para: serie, audiencia, nombres de color, 'vista frontal' y 'vista espalda'") !== -1, 'mockups: rotulación editorial acotada con ambas vistas');
ok(outGesto.indexOf('Prohibido pintar códigos de ficha (01A/01B/01C)') !== -1, 'mockups: prohibidos rótulos técnicos');
ok(outGesto.indexOf('omitir tonos que destruyan contraste o legibilidad') !== -1, 'mockups: omite tonos incompatibles');
ok(outGesto.indexOf('12 vistas en total') === -1, 'mockups: no debe sobrevivir el contrato de 12 fijas');

/* INTEGRACIÓN DE LA FICHA: la matriz UI por fin llega al prompt (BAL+OBJ) */
ok(count(outGesto, 'INTEGRACIÓN DE LA FICHA:') === 2, 'integración de ficha en BALANCEADO y OBJETO (2/3, TEXTO usa su bloque)');
ok(outSolo.indexOf('INTEGRACIÓN DE LA FICHA:') !== -1, 'SOLO/TEXTO/BAL: BAL conserva su integración');

const passed = failures.length === 0;
console.log((passed ? 'PASS' : 'FAIL') + '  figuras-mockups  (' + checks + ' aserciones, ' + failures.length + ' fallos)');
failures.forEach(function (f) { console.log('  X ' + f); });
process.exit(passed ? 0 : 1);
