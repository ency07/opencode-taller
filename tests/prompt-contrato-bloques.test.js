/* Fase 5 / Paso B: contrato de bloques del prompt.
   - _appendPromptBlock omite bloques opcionales no disponibles.
   - _validatePromptContract detecta bloques criticos faltantes y duplicados reales.
   - _promptContractForMode expone el contrato por modo activo.
   Ejecutar:  node tests/prompt-contrato-bloques.test.js
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

MOTOR_STATE.workflowMode = 'contacto';
MOTOR_STATE.designMode = 'contacto';
MOTOR_STATE.market = 'global_en';
MOTOR_STATE.language = 'en';
MOTOR_STATE.product = 'CAMISETA SOFT';
MOTOR_STATE.subniche = 'auto';
MOTOR_STATE.concept = 'campfire small enough to hold in talk';
MOTOR_STATE.message = 'Hold fast';

/* F5B-1: falta un bloque critico -> contrato incompleto */
const c1 = _validatePromptContract('CONTRATO DE ESTILO POR FICHA (INMUTABLE): x', { required: ['CONTRATO DE ESTILO', 'SALIDA: produce'], markers: ['CONTRATO DE ESTILO', 'SALIDA: produce'], unique: ['CONTRATO DE ESTILO', 'SALIDA: produce'] });
ok(!c1.ok, 'F5B: falta un bloque critico -> contrato incompleto');
ok(c1.missing.indexOf('SALIDA: produce') !== -1, 'F5B: el bloque critico faltante se nombra');

/* F5B-2: bloque opcional no disponible se omite */
const o1 = _appendPromptBlock('base', 'optional', 'OPCIONAL TEXTO', { optional: { available: false } });
ok(o1 === 'base', 'F5B: bloque opcional no disponible se omite');
const o2 = _appendPromptBlock('base', 'optional', 'OPCIONAL TEXTO', { optional: { available: true } });
ok(o2 === 'baseOPCIONAL TEXTO', 'F5B: bloque opcional disponible se agrega');

/* F5B-3: contrato completo con bloques criticos presentes pasa */
const c2 = _validatePromptContract('CONTRATO DE ESTILO POR FICHA (INMUTABLE): x SALIDA: produce solo el arte', { required: ['CONTRATO DE ESTILO', 'SALIDA: produce'], markers: ['CONTRATO DE ESTILO', 'SALIDA: produce'], unique: ['CONTRATO DE ESTILO', 'SALIDA: produce'] });
ok(c2.ok, 'F5B: contrato completo pasa');

/* F5B-4: cada modo expone su propio contrato */
ok(_promptContractForMode({ isVar: true }).required.indexOf('/VARIATION - TRES DIRECCIONES') !== -1, 'F5B: modo variation exige /VARIATION');
ok(_promptContractForMode({ isPatron: true }).required.indexOf('/PATRON REPETIDO') !== -1, 'F5B: modo patron exige /PATRON');
ok(_promptContractForMode({ isExplore: true }).required.indexOf('/EXPLOR') !== -1, 'F5B: modo exploracion exige /EXPLOR');
ok(_promptContractForMode({ contactDNA: true }).required.indexOf('CONTRATO DE ESTILO') !== -1, 'F5B: modo contacto exige contrato de estilo');

/* F5B-5: duplicado real detectado, sin falsos positivos para BLOQUEO DE ESTILO */
const c3 = _validatePromptContract('CONTRATO DE ESTILO x CONTRATO DE ESTILO y', { required: ['CONTRATO DE ESTILO'], markers: ['CONTRATO DE ESTILO'], unique: ['CONTRATO DE ESTILO'] });
ok(!c3.ok && c3.dupes.indexOf('CONTRATO DE ESTILO') !== -1, 'F5B: duplicado real detectado');
const c4 = _validatePromptContract('BLOQUEO DE ESTILO global y BLOQUEO DE ESTILO 01A', { required: ['BLOQUEO DE ESTILO'], markers: ['BLOQUEO DE ESTILO'], unique: ['CONTRATO DE ESTILO'] });
ok(c4.ok, 'F5B: BLOQUEO DE ESTILO repetido no es duplicado (fuera de unique)');

/* F5B-6: concepto y mensaje exacto sobreviven a la construccion */
function ficha(jerarquia) {
  return { estilo: 'Minimal Modern', audiencia: 'global_adult_en', jerarquiaVisual: jerarquia, objeto: 'campfire small enough to hold in talk', layout: 'Columna apilada', distribucionTexto: 'texto en diagonal ascendente', integracionTexto: 'w', densidad: 'Media', negativeSpace: 'abierto', fitAudiencia: 70, fitProducto: 60, textoPrincipal: 'Hold fast', textoApoyo: 'A', textoTerciario: 'S' };
}
const set6 = { A: ficha('BALANCEADO'), B: ficha('TEXTO_DOMINANTE'), C: ficha('OBJETO_DOMINANTE') };
const out6 = formatPrompt({ set: set6 });
ok(String(out6).indexOf('Hold fast') !== -1, 'F5B: el mensaje exacto se conserva');
ok(String(out6).indexOf('campfire small enough to hold in talk') !== -1, 'F5B: el concepto se conserva');

/* F5B-7: contrato A/B/C completo en el prompt de contacto */
ok(String(out6).indexOf('ADN IGUAL EN A/B/C') !== -1, 'F5B: contrato A/B/C completo');

if (failures.length) { failures.forEach(function (f) { console.error('FAIL: ' + f); }); process.exit(1); }
console.log('PASS prompt-contrato-bloques (' + checks + ' aserciones, 0 fallos)');
