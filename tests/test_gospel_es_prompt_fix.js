/*
 * Regresión real del prompt Gospel ES.
 * Ejecutar: node tests/test_gospel_es_prompt_fix.js
 * Carga los módulos del motor y ejecuta formatPrompt(); no simula sus reglas.
 */
'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const JS = path.join(ROOT, 'js');
global.window = global;
global.document = {
  getElementById: function () { return null; },
  querySelectorAll: function () { return []; }
};

[
  'data-mercados.js',
  'data-audiencias.js',
  'data-bancos.js',
  'data-estilos.js',
  'dominios.js',
  'data-productos.js',
  'data-territorios.js',
  'memoria-local.js',
  'motor-nucleo.js'
].forEach(function (file) {
  vm.runInThisContext(fs.readFileSync(path.join(JS, file), 'utf8'), { filename: file });
});

let checks = 0;
function check(condition, message) {
  checks++;
  assert.ok(condition, message);
}

function configureState(options) {
  const opts = options || {};
  MOTOR_STATE.market = 'gospel_es';
  MOTOR_STATE.language = 'auto';
  MOTOR_STATE.marketplace = 'generic';
  MOTOR_STATE.region = 'global';
  MOTOR_STATE.subniche = 'auto';
  MOTOR_STATE.product = 'CAMISETA SOFT';
  MOTOR_STATE.serie = '';
  MOTOR_STATE.concept = opts.concept === undefined ? 'Esperanza en medio de la tormenta' : opts.concept;
  MOTOR_STATE.message = opts.message || '';
  MOTOR_STATE.allowAutoCopy = opts.allowAutoCopy !== false;
  MOTOR_STATE.support = '';
  MOTOR_STATE.audienceSet = 'Auto';
  MOTOR_STATE.audienceMulti = 'no';
  MOTOR_STATE.dominio = 'auto';
  MOTOR_STATE.dominioDetectado = 'auto';
  MOTOR_STATE.domImagen = 'Auto';
  MOTOR_STATE.workflowMode = opts.workflowMode || 'new';
  MOTOR_STATE.explorationBrief = opts.explorationBrief || null;
  MOTOR_STATE.groupMode = 'distintos';
  MOTOR_STATE.objectMode = 'simple';
  MOTOR_STATE.designMode = 'contacto';
  MOTOR_STATE.repeatType = 'medio salto';
  MOTOR_STATE.fmtDense = true;
  MOTOR_STATE.variationOptions = {
    simbolo: 'sustituir',
    textos: 'conservar_palabras',
    paleta: 'renovar',
    esencia: ''
  };
  MOTOR_STATE.capApplication = 'auto';
  MOTOR_STATE.stampSide = 'auto';
  MOTOR_STATE.printMethod = 'auto';
  MOTOR_STATE.imageReference = null;
  MOTOR_STATE.imageAnalysis = null;
  MOTOR_STATE.creativeTerritory = 'auto';
  MOTOR_STATE.visualIdentity = null;
  MOTOR_STATE.decisionMode = 'assisted';
  MOTOR_STATE._audsShort = null;
}

function makeCard(index, hierarchy) {
  const treatments = ['HEAVY', 'SOFT', 'MODERN'];
  const layouts = _LAYOUTS || [];
  const textLayouts = _TEXT_COMPOSITION_BANK || [];
  const audiences = _AUD_NAMES || [];
  return {
    estilo: ['Vector minimalista', 'Grabado lineal', 'Stencil geométrico'][index],
    jerarquiaVisual: hierarchy || ['TEXTO_DOMINANTE', 'BALANCEADO', 'OBJETO_DOMINANTE'][index],
    tratamiento: treatments[index],
    perfilEstructural: treatments[index],
    objeto: 'forma abstracta derivada del concepto',
    audiencia: audiences[index] || audiences[0] || 'adulto',
    guiaSimbolo: 'abstracción fiel al concepto',
    funcionSimbolica: 'expresar esperanza',
    intencionEmocional: 'confianza',
    formaSimbolo: 'forma abstracta ' + index,
    tecnica: 'vector plano',
    distribucionTexto: textLayouts[index] || 'TEXTO ARRIBA',
    tipografia: 'Sans humanista ' + index,
    integracionTexto: 'integración controlada ' + index,
    paleta: 'paleta de alto contraste ' + index,
    fitAudiencia: 90,
    fitProducto: 90,
    densidad: ['Media', 'Ligera', 'Compacta'][index],
    negativeSpace: ['Amplio', 'Abierto', 'Controlado'][index],
    layout: layouts[index] || ('Layout ' + index),
    textoPrincipal: '',
    textoApoyo: '',
    textoTerciario: '',
    familiaColor: 'Familia cromática ' + index,
    placement: 'pecho centrado',
    cara: 'frente',
    _esquema: { bg: '#ffffff', dom: '#111111', acc: '#555555', ink: '#000000' }
  };
}

function buildPrompt(options) {
  configureState(options);
  const set = {
    A: makeCard(0, options && options.hierarchies && options.hierarchies[0]),
    B: makeCard(1, options && options.hierarchies && options.hierarchies[1]),
    C: makeCard(2, options && options.hierarchies && options.hierarchies[2]),
    seriesAnchor: MOTOR_STATE.concept || (MOTOR_STATE.explorationBrief && MOTOR_STATE.explorationBrief.concept) || ''
  };
  return formatPrompt({ set: set, score: 100, passed: true, objectConflicts: opts.objectConflicts || [] });
}

/* 1. Mensaje explícito: prevalece y se conserva literalmente. */
let prompt = buildPrompt({
  concept: 'Esperanza en medio de la tormenta',
  message: 'Cristo es mi esperanza'
});
check(prompt.includes('MENSAJE PRINCIPAL literal: «Cristo es mi esperanza»'),
  'formatPrompt debe conservar el mensaje explícito literal');
check(prompt.includes('COPY: conservar literalmente «Cristo es mi esperanza»'),
  'la regla global de copy debe coincidir con el mensaje explícito');
check(!prompt.includes('COPY CANÓNICO ÚNICO «Esperanza en medio de la tormenta»'),
  'un mensaje explícito no debe ser reemplazado por el concepto');

/* 2. Sin mensaje y con copy automático: una frase canónica compartida. */
prompt = buildPrompt({ concept: 'Esperanza en medio de la tormenta', allowAutoCopy: true });
check(prompt.includes('COPY CANÓNICO ÚNICO «Esperanza en medio de la tormenta»'),
  'el prompt real debe fijar un único copy derivado del concepto');
check((prompt.match(/COPY LITERAL \(derivado del concepto\): «Esperanza en medio de la tormenta»/g) || []).length === 3,
  'A/B/C deben recibir exactamente la misma frase');
check(prompt.includes('COPY CANÓNICO: «Esperanza en medio de la tormenta»'),
  'la regla global debe repetir el mismo copy canónico');
check(!prompt.includes('Propón para cada dirección una frase comercial'),
  'Gospel ES no debe pedir tres frases diferentes');
check(prompt.includes('CONCEPTO: Esperanza en medio de la tormenta'),
  'el concepto del usuario debe permanecer intacto');
check(!prompt.includes('camino a Emaús'),
  'no debe inyectarse una narrativa bíblica no solicitada');
check(prompt.includes('FIDELIDAD GOSPEL ES:'),
  'el prompt debe prohibir narrativas bíblicas inferidas');
check(prompt.includes('IDIOMA: español natural actual'),
  'Gospel ES debe forzar español natural');

/* 3. El concepto activo de explorationBrief también ancla el copy compartido. */
prompt = buildPrompt({
  concept: '',
  allowAutoCopy: true,
  workflowMode: 'explore',
  explorationBrief: { concept: 'Esperanza en medio de la tormenta', familyLabel: 'Gospel', familyId: null }
});
check(prompt.includes('COPY CANÓNICO: «Esperanza en medio de la tormenta»'),
  'exploración debe derivar el copy del concepto activo del brief');
check(prompt.includes('COPY LITERAL COMPARTIDO A/B/C'),
  'exploración debe fijar la misma frase en las tres direcciones');

/* 4. SOLO_TEXTO sigue permitiendo copy; es una jerarquía tipográfica. */
prompt = buildPrompt({
  concept: 'Esperanza en medio de la tormenta',
  allowAutoCopy: true,
  hierarchies: ['SOLO_TEXTO', 'BALANCEADO', 'OBJETO_DOMINANTE']
});
check(prompt.includes('SOLO_TEXTO usa el copy como arte tipográfico'),
  'SOLO_TEXTO no debe confundirse con ausencia de copy');
check(prompt.includes('TEXTO: COPY LITERAL (derivado del concepto): «Esperanza en medio de la tormenta»'),
  'SOLO_TEXTO debe usar la frase canónica');

/* 5. Sin mensaje y con copy automático desactivado: no inventar texto. */
prompt = buildPrompt({
  concept: 'Esperanza en medio de la tormenta',
  allowAutoCopy: false
});
check(prompt.includes('COPY: no autorizado. No generar texto ni placeholders.'),
  'la desactivación de copy debe prohibir texto');
check(prompt.includes('FICHA INCOMPLETA: la jerarquía seleccionada requiere texto'),
  'las fichas que necesitan copy deben marcarse incompletas');
check(!prompt.includes('COPY LITERAL (derivado del concepto): «Esperanza en medio de la tormenta»'),
  'no debe quedar copy derivado cuando está desactivado');

/* 6. Sin mensaje y sin concepto: no recurrir a copy genérico de banco. */
prompt = buildPrompt({ concept: '', allowAutoCopy: true });
check(prompt.includes('COPY: no autorizado. No generar texto ni placeholders.'),
  'sin concepto no debe aparecer una frase genérica automática');
check(!prompt.includes('COPY CANÓNICO ÚNICO «'),
  'no debe existir copy canónico si no hay concepto');

/* 7. SOLO_OBJETO no requiere copy y conserva su regla de cero letras. */
prompt = buildPrompt({
  concept: 'Esperanza en medio de la tormenta',
  allowAutoCopy: false,
  hierarchies: ['SOLO_OBJETO', 'SOLO_OBJETO', 'SOLO_OBJETO']
});
check(prompt.includes('TEXTO: NINGUNO (jerarquía SOLO_OBJETO)'),
  'SOLO_OBJETO debe permanecer sin texto cuando el copy automático está desactivado');
check(!prompt.includes('FICHA INCOMPLETA: la jerarquía seleccionada requiere texto'),
  'SOLO_OBJETO no debe marcarse incompleto por falta de copy');

/* 8. Separación real de instrucciones de estampado y mockup comercial. */
prompt = buildPrompt({ concept: 'Esperanza en medio de la tormenta', allowAutoCopy: true });
const artIndex = prompt.indexOf('REGLAS DEL ARTE ESTAMPADO');
const mockupIndex = prompt.indexOf('REGLAS DEL MOCKUP COMERCIAL');
check(artIndex >= 0, 'el prompt debe contener reglas específicas del arte estampado');
check(mockupIndex >= 0 && mockupIndex !== artIndex,
  'las reglas del mockup deben existir en un bloque independiente del arte');
check(prompt.slice(artIndex, artIndex + 1200).includes('Esta prohibición se refiere exclusivamente al ARTE ESTAMPADO'),
  'la prohibición de figuras humanas debe limitarse al estampado');
check(prompt.slice(mockupIndex).includes('MOCKUP OBLIGATORIO POR AUDIENCIA'),
  'el mockup debe conservar las reglas de representación por audiencia');

/* 10. Concepto y mensaje son campos semánticamente independientes. */
prompt = buildPrompt({
  concept: '',
  message: 'CRISTO ES MI ESPERANZA',
  allowAutoCopy: true
});
check(prompt.includes('CONCEPTO: — | MENSAJE: CRISTO ES MI ESPERANZA'),
  'un mensaje explícito no debe rellenar el campo CONCEPTO');
check(!prompt.includes('ANCLA CONCEPTO: CRISTO ES MI ESPERANZA'),
  'el mensaje no debe convertirse en ANCLA CONCEPTO');
check(!prompt.includes('COPY CANÓNICO ÚNICO «CRISTO ES MI ESPERANZA»'),
  'un mensaje explícito no debe tratarse como copy derivado del concepto');

/* 11. La exploración Gospel no debe elegir un concepto aleatorio del banco. */
configureState({ concept: '', message: 'CRISTO ES MI ESPERANZA', workflowMode: 'explore' });
const briefWithoutConcept = _resolveExplorationBrief();
check(briefWithoutConcept.concept === '',
  'Gospel ES sin concepto explícito debe mantener concept vacío, no elegir un motivo del banco');
check(briefWithoutConcept.message === 'CRISTO ES MI ESPERANZA',
  'el mensaje debe conservarse en su propio campo');

prompt = buildPrompt({
  concept: '',
  message: 'CRISTO ES MI ESPERANZA',
  workflowMode: 'explore'
});
check(prompt.includes('CONCEPTO: CONCEPTO NO PROPORCIONADO: no inventar concepto ni motivo'),
  'la exploración Gospel ES debe declarar que falta concepto aunque exista mensaje');
check(prompt.includes('MENSAJE EXACTO: CRISTO ES MI ESPERANZA'),
  'la exploración debe conservar el mensaje exacto en su campo independiente');

prompt = buildPrompt({
  concept: '',
  message: 'CRISTO ES MI ESPERANZA',
  workflowMode: 'explore',
  objectConflicts: ['Falta el concepto principal. El mensaje no puede sustituirlo ni seleccionar un motivo del banco.']
});
check(prompt.includes('AVISO CONCEPTO AUSENTE:'),
  'el prompt debe marcar explícitamente la ausencia de concepto');
check(prompt.includes('No selecciones objetos del banco') && prompt.includes('no presentes A/B/C como artes definitivos'),
  'sin concepto, el prompt debe bloquear la selección de motivos y la producción definitiva');

/* 12. Sin concepto, el mensaje no puede seleccionar un motivo de banco. */
const motifPlanWithoutConcept = _planExploreMotifs(
  ['cruz', 'paloma', 'biblia'], ['cruz', 'paloma', 'biblia'], '', '', 'CRISTO ES MI ESPERANZA'
);
check(motifPlanWithoutConcept.list.length === 0,
  'sin concepto, el mensaje no debe seleccionar motivos del banco');
check(!!motifPlanWithoutConcept.conflict && motifPlanWithoutConcept.conflict.includes('Falta el concepto principal'),
  'la falta de concepto debe producir un conflicto explícito');

/* 13. El territorio no debe rotular el mensaje como concepto. */
configureState({ concept: '', message: 'CRISTO ES MI ESPERANZA' });
MOTOR_STATE.creativeTerritory = 'SACRED_EDITORIAL';
const territoryWithoutConcept = _resolveTerritoryDirective('SACRED_EDITORIAL');
check(!territoryWithoutConcept.includes('ANCLA CONCEPTO: CRISTO ES MI ESPERANZA'),
  'la directiva territorial no debe convertir el mensaje en ancla de concepto');

const motorSource = fs.readFileSync(path.join(JS, 'motor-nucleo.js'), 'utf8');
check(!/const semanticAnchor = String\(analysis\.concepto \|\| MOTOR_STATE\.concept \|\| MOTOR_STATE\.message/.test(motorSource),
  'la variación desde imagen no debe usar el mensaje como sustituto del concepto');

/* 14. Con concepto y mensaje distintos, el ancla usa solo el concepto. */
configureState({
  concept: 'Calendario de papel con una marca de racha',
  message: 'CRISTO ES MI ESPERANZA'
});
MOTOR_STATE.creativeTerritory = 'SACRED_EDITORIAL';
const territoryWithBoth = _resolveTerritoryDirective('SACRED_EDITORIAL');
check(territoryWithBoth.includes('ANCLA CONCEPTO: Calendario de papel con una marca de racha'),
  'la directiva debe anclar el concepto explícito');
check(!territoryWithBoth.includes('ANCLA CONCEPTO: CRISTO ES MI ESPERANZA'),
  'la directiva no debe reemplazar el concepto por el mensaje');

/* 9. El helper de copy debe distinguir los cuatro estados. */
let resolved = _resolveGospelESCopy('Mensaje literal', 'Concepto', true);
check(resolved.text === 'Mensaje literal' && resolved.source === 'user',
  'el helper debe priorizar el mensaje del usuario');
resolved = _resolveGospelESCopy('', 'Concepto de prueba', true);
check(resolved.text === 'Concepto de prueba' && resolved.source === 'concept',
  'el helper debe derivar el copy del concepto');
resolved = _resolveGospelESCopy('', 'Concepto de prueba', false);
check(resolved.text === '' && resolved.source === 'disabled',
  'el helper debe devolver vacío si se desactiva el copy');
resolved = _resolveGospelESCopy('', '', true);
check(resolved.text === '' && resolved.source === 'missing-concept',
  'el helper no debe recurrir al banco cuando falta concepto');

console.log('Gospel ES prompt regression: ' + checks + ' assertions PASS');
