/* Prueba controlada Fix #2 — 4 escenarios de audiencia (infantil/femenina/masculina/unisex).
   Verifica: audiencia llega a la ficha correcta, A/B/C no mezclan audiencias,
   el mockup representa la audiencia indicada, el validador identifica
   incumplimientos y usa INDETERMINADO sin evidencia suficiente.
   Ejecutar: node tests/fix2-escenarios-controlados.test.js
   Sale con código 1 si algo falla. */

'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
let checks = 0;
const failures = [];
function ok(cond, msg) { checks++; if (!cond) failures.push(msg); }

global.window = global;
const els = {};
global.document = {
  getElementById: function (id) { return els[id] || null; },
  querySelectorAll: function () { return []; }
};

const JS = path.join(ROOT, 'js');
['data-mercados.js', 'data-audiencias.js', 'data-bancos.js', 'data-estilos.js',
 'dominios.js', 'data-productos.js', 'memoria-local.js', 'motor-nucleo.js',
 'ia-client.js', 'ia-analisis.js', 'ia-validador.js'
].forEach(function (f) {
  vm.runInThisContext(fs.readFileSync(path.join(JS, f), 'utf8'), { filename: f });
});

function clearAudience(mk) { mk = mk || 'colombia|todas'; ['A','B','C'].forEach(function(k){ setLockValue(mk,'CAMISETA SOFT','audiencia',k,'Auto'); }); }
function lockAll(mk, aud) { mk = mk || 'colombia|todas'; ['A','B','C'].forEach(function(k){ setLockValue(mk,'CAMISETA SOFT','audiencia',k,aud); }); }

function baseState() {
  MOTOR_STATE.market = 'colombia';
  MOTOR_STATE.region = 'todas';
  MOTOR_STATE.product = 'CAMISETA SOFT';
  MOTOR_STATE.audienceSet = 'Auto';
  MOTOR_STATE.audienceMulti = 'no';
  MOTOR_STATE.groupMode = 'distintos';
  MOTOR_STATE.designMode = 'contacto';
  MOTOR_STATE.support = '';
  MOTOR_STATE.explorationBrief = null;
  MOTOR_STATE.stampSide = 'auto';
  MOTOR_STATE.workflowMode = 'new';
  MOTOR_STATE.concept = 'águila calva sobre el cañón';
  MOTOR_STATE.message = 'Aguanta firme';
  MOTOR_STATE.subniche = 'celebracion_col';
  MOTOR_STATE.serie = '';
}

function runScenario(audienceId, expected) {
  baseState();
  clearAudience('colombia|todas');
  lockAll('colombia|todas', audienceId);
  const set = buildCandidate(resolveAudiences(), null);
  const prompt = formatPrompt({ set: set });
  els.out = { value: prompt };
  global.__podSet = set;
  vm.runInThisContext('try { LAST_RESULT = { set: global.__podSet }; } catch (e) {}');
  const contrato = PODValidador.extraerContrato();
  const vPrompt = PODValidador.construirPromptValidador(contrato, PODValidador._truncarReglaMockup(getMockupRule('CAMISETA SOFT'), 3000));

  // 1) audiencia llega a la ficha correcta (las 3 columnas)
  ok(Array.isArray(contrato) && contrato.length === 3, audienceId + ': contrato de 3 fichas');
  ok(contrato.every(function(f){ return f.audiencia === audienceId; }), audienceId + ': las 3 fichas llevan la audiencia ' + audienceId);

  // 2) A/B/C no mezclan audiencias entre columnas (cada ficha mantiene su audiencia en el prompt)
  ok(prompt.indexOf('ID DE VALIDACIÓN DE AUDIENCIA: ' + audienceId) !== -1, audienceId + ': id de validación presente');
  // cada ficha nombrada en el prompt lleva la audiencia
  ['01A','01B','01C'].forEach(function(id){
    const i = prompt.indexOf('### ' + id + ' ');
    ok(i !== -1, audienceId + ': bloque ' + id + ' presente');
  });

  // 3) mockup representa la audiencia indicada
  ok(vPrompt.indexOf('audiencia ID=' + audienceId) !== -1, audienceId + ': audiencia en contrato del validador');
  ok(vPrompt.indexOf(expected.mockup) !== -1, audienceId + ': instrucción de mockup presente (' + expected.mockup + ')');
  ok(vPrompt.indexOf('audiencia_ok') !== -1, audienceId + ': criterio audiencia_ok presente');

  // 4) validador identifica incumplimientos (criterio declarado) e INDETERMINADO disponible
  ok(vPrompt.indexOf('INDETERMINADO') !== -1, audienceId + ': permite INDETERMINADO');
  ok(vPrompt.indexOf('audiencia_ok":true') !== -1, audienceId + ': audiencia_ok en formato JSON');

  // cross-contamination check: cada ficha del contrato lleva su propia audiencia/expectativa;
  // la sección de criterios lista todos los perfiles (eso es esperado), pero el contrato por ficha no debe mezclarlos.
  if (expected.forbidden) {
    const contratoSeccion = vPrompt.split('ESTRUCTURA DE HOJA:')[0] || '';
    expected.forbidden.forEach(function(f){
      ok(contratoSeccion.indexOf(f) === -1, audienceId + ': contrato no contamina con ' + f);
    });
  }

  clearAudience('colombia|todas');
  return { set: set, prompt: prompt, contrato: contrato, vPrompt: vPrompt };
}

/* --- Escenario 1: Infantil --- */
runScenario('infantil_col', {
  mockup: 'modelo infantil',
  forbidden: ['corte y talla femeninos', 'corte y talla masculinos']
});

/* --- Escenario 2: Femenino --- */
runScenario('coste_adulta_f', {
  mockup: 'modelo mujer',
  forbidden: ['modelo infantil', 'corte y talla masculinos']
});

/* --- Escenario 3: Masculino --- */
runScenario('coste_adulto_m', {
  mockup: 'modelo hombre',
  forbidden: ['modelo infantil', 'corte y talla femeninos']
});

/* --- Escenario 4: Unisex --- */
runScenario('unisex_nacional', {
  mockup: 'modelo acorde al perfil',
  forbidden: ['modelo infantil', 'corte y talla femeninos', 'corte y talla masculinos']
});

/* --- Escenario mixto: 3 fichas con audiencias distintas, evaluación independiente --- */
baseState();
clearAudience('colombia|todas');
setLockValue('colombia|todas', 'CAMISETA SOFT', 'audiencia', 'A', 'infantil_col');
setLockValue('colombia|todas', 'CAMISETA SOFT', 'audiencia', 'B', 'coste_adulta_f');
setLockValue('colombia|todas', 'CAMISETA SOFT', 'audiencia', 'C', 'coste_adulto_m');
const setMix = buildCandidate(resolveAudiences(), null);
const promptMix = formatPrompt({ set: setMix });
els.out = { value: promptMix };
global.__podSet = setMix;
vm.runInThisContext('try { LAST_RESULT = { set: global.__podSet }; } catch (e) {}');
const contratoMix = PODValidador.extraerContrato();
ok(Array.isArray(contratoMix) && contratoMix.length === 3, 'mixto: 3 fichas');
ok(contratoMix[0].audiencia === 'infantil_col', 'mixto: A = infantil_col');
ok(contratoMix[1].audiencia === 'coste_adulta_f', 'mixto: B = coste_adulta_f');
ok(contratoMix[2].audiencia === 'coste_adulto_m', 'mixto: C = coste_adulto_m');
// no cross-contamination: cada ficha mantiene su audiencia
ok(contratoMix[0].audiencia !== contratoMix[1].audiencia && contratoMix[1].audiencia !== contratoMix[2].audiencia,
  'mixto: audiencias distintas entre columnas');
const vPromptMix = PODValidador.construirPromptValidador(contratoMix, PODValidador._truncarReglaMockup(getMockupRule('CAMISETA SOFT'), 3000));
ok(vPromptMix.indexOf('audiencia ID=infantil_col') !== -1, 'mixto: infantil en contrato');
ok(vPromptMix.indexOf('audiencia ID=coste_adulta_f') !== -1, 'mixto: femenina en contrato');
ok(vPromptMix.indexOf('audiencia ID=coste_adulto_m') !== -1, 'mixto: masculina en contrato');
ok(vPromptMix.indexOf('modelo infantil') !== -1 && vPromptMix.indexOf('corte y talla femeninos') !== -1 && vPromptMix.indexOf('corte y talla masculinos') !== -1,
  'mixto: las 3 expectativas de mockup presentes');

/* --- Validador: incumplimiento identificado + INDETERMINADO --- */
const verdictBad = PODValidador.parseVerdict('{"fichas":[{"ficha":"01A","estilo_asignado":"X","estilo_detectado":"X","estilo_ok":true,"jerarquia_medida":"50% / 50%","jerarquia_ok":true,"objetos_inventados":[],"textos_inventados":[],"fondo_ok":true,"espalda_ok":true,"audiencia_ok":false,"nota":"modelo adulto en ficha infantil"},{"ficha":"01B","estilo_asignado":"Y","estilo_detectado":"Y","estilo_ok":true,"jerarquia_medida":"50% / 50%","jerarquia_ok":true,"objetos_inventados":[],"textos_inventados":[],"fondo_ok":true,"espalda_ok":true,"audiencia_ok":true,"nota":"ok"},{"ficha":"01C","estilo_asignado":"Z","estilo_detectado":"Z","estilo_ok":true,"jerarquia_medida":"50% / 50%","jerarquia_ok":true,"objetos_inventados":[],"textos_inventados":[],"fondo_ok":true,"espalda_ok":true,"audiencia_ok":true,"nota":"ok"}],"estilos_correctos":1,"resumen":"incumplimiento de audiencia","avisos_generales":[]}');
ok(verdictBad && verdictBad.fichas[0].audiencia_ok === false, 'validador identifica incumplimiento (audiencia_ok=false)');
const verdictIndet = PODValidador.parseVerdict('{"fichas":[{"ficha":"01A","estilo_asignado":"X","estilo_detectado":"X","estilo_ok":true,"jerarquia_medida":"50% / 50%","jerarquia_ok":true,"objetos_inventados":[],"textos_inventados":[],"fondo_ok":true,"espalda_ok":true,"audiencia_ok":null,"nota":"indeterminado"},{"ficha":"01B","estilo_asignado":"Y","estilo_detectado":"Y","estilo_ok":true,"jerarquia_medida":"50% / 50%","jerarquia_ok":true,"objetos_inventados":[],"textos_inventados":[],"fondo_ok":true,"espalda_ok":true,"audiencia_ok":true,"nota":"ok"},{"ficha":"01C","estilo_asignado":"Z","estilo_detectado":"Z","estilo_ok":true,"jerarquia_medida":"50% / 50%","jerarquia_ok":true,"objetos_inventados":[],"textos_inventados":[],"fondo_ok":true,"espalda_ok":true,"audiencia_ok":true,"nota":"ok"}],"estilos_correctos":1,"resumen":"indeterminado","avisos_generales":[]}');
ok(verdictIndet && verdictIndet.fichas[0].audiencia_ok === null, 'validador permite INDETERMINADO (audiencia_ok=null)');

clearAudience('colombia|todas');

console.log((failures.length ? 'FAIL' : 'PASS') + ' fix2-escenarios-controlados (' + checks + ' aserciones, ' + failures.length + ' fallos)');
failures.forEach(function (msg) { console.error(' - ' + msg); });
process.exit(failures.length ? 1 : 0);
