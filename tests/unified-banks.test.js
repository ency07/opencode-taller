'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ROOT = path.join(__dirname, '..');
global.window = global;
global.document = { getElementById: function () { return null; }, querySelectorAll: function () { return []; } };
vm.runInThisContext(fs.readFileSync(path.join(ROOT, 'js', 'memoria-local.js'), 'utf8'), { filename: 'memoria-local.js' });
let checks = 0;
const ok = function (condition, message) { checks++; if (!condition) throw new Error(message); };

// Lote sintético de 14 registros: un motivo y una frase por registro (28 strings).
const created = createPersonalBank('gospel_es', 'Banco de prueba semántica', 'PROCESS');
ok(created.ok, 'no se pudo crear el banco de prueba');
const objects = Array.from({ length: 14 }, function (_, i) { return 'Motivo visual de prueba ' + (i + 1) + ' con acción reconocible'; });
const phrases = Array.from({ length: 14 }, function (_, i) { return 'Frase visible de prueba número ' + (i + 1); });
const generated = normalizeGeneratedBankOutput(JSON.stringify({ mercado: 'gospel_es', familia: 'PROCESS', tipo: 'ambos', objetos: objects, frases: phrases }));
ok(generated.market === 'gospel_es' && generated.family === 'PROCESS', 'la salida del generador no conserva mercado y dominio');
ok(generated.objects.length === 14 && generated.phrases.length === 14 && generated.phrases[0] === phrases[0], 'la normalización altera o pierde strings del JSON del generador');
const saved = saveToPersonalBank(generated.market, created.id, { objects: generated.objects, phrases: generated.phrases });
ok(saved.ok && saved.added === 28, 'no se guardó el lote completo: ' + JSON.stringify(saved));
ok(setActivePersonalBank('gospel_es', 'PROCESS', created.id).ok, 'no se activó el banco por dominio');
addPersonalObjects('colombia', 'humor_costeno', ['hamaca que sostiene una conversación larga']);

const portable = exportPersonalBanksObject();
ok(portable.format === 'taller-pod-personal-banks' && portable.schemaVersion === 1, 'formato portable/versionado inesperado');
ok(Object.keys(portable.data).length === 2, 'el respaldo debe contener bancos generales y nombrados de todos los mercados');
const activeState = exportMemoryObject();
activeState['POD2|history|prueba'] = JSON.stringify({ history: ['no debe importarse'] });
clearAllMemory();
const imported = importPersonalBanksJSON(JSON.stringify(activeState));
ok(imported.ok && imported.summary.namedBanks === 1, 'no se restauró el banco nombrado');
ok(imported.summary.objects === 15 && imported.summary.phrases === 14, 'el conteo fusionado no conserva todos los strings: ' + JSON.stringify(imported.summary));
ok(getPersonalBank('gospel_es', created.id).objects.length === 14, 'se perdieron motivos del banco con nombre');
ok(getPersonalBank('gospel_es', created.id).phrases.length === 14, 'se perdieron frases del banco con nombre');
ok(getActivePersonalBank('gospel_es', 'PROCESS').id === created.id, 'se perdió el banco activo');
ok(getPersonalObjects('gospel_es', 'PROCESS').length === 14, 'los motivos restaurados no llegan a los candidatos personales del motor');
ok(getPersonalObjects('colombia', 'humor_costeno').length === 1, 'se perdió el otro mercado');

const beforeRepeat = getPersonalBank('gospel_es', created.id).objects.length + getPersonalBank('gospel_es', created.id).phrases.length;
importPersonalBanksJSON(JSON.stringify(portable));
const afterRepeat = getPersonalBank('gospel_es', created.id).objects.length + getPersonalBank('gospel_es', created.id).phrases.length;
ok(beforeRepeat === afterRepeat && afterRepeat === 28, 'la importación repetida añadió duplicados');

const beforeInvalid = JSON.stringify(exportPersonalBanksObject().data);
let rejected = false;
try { importPersonalBanksJSON({ format: 'taller-pod-personal-banks', schemaVersion: 1, data: { 'POD2|personalBanks|gospel_en': JSON.stringify({ banks: null, active: {} }) } }); }
catch (e) { rejected = true; }
ok(rejected, 'el importador aceptó un banco nombrado inválido');
ok(JSON.stringify(exportPersonalBanksObject().data) === beforeInvalid, 'un archivo inválido cambió datos ya guardados');

const editor = fs.readFileSync(path.join(ROOT, 'editor-bancos.html'), 'utf8');
ok(editor.includes('taller-pod-bancos-unificados.json'), 'el editor no exporta un archivo único de bancos');
ok(editor.includes('normalizeGeneratedBankOutput(incoming)'), 'el importador no enruta la salida del generador por mercado/subnicho');
ok(editor.includes('id="btnMemory"') && editor.includes('js/sync-supabase.js'), 'el editor no ofrece sincronización compartida para el preview');

// --- Importador de bancos de motivos enriquecidos (validación con datos sintéticos) ---
ok(window.ENRICHED_BANK_FORMAT_VERSION === 1, 'la versión del formato enriquecido no es 1');
ok(typeof window.importarMotivosEnriquecidos === 'function', 'no se expuso window.importarMotivosEnriquecidos');

const loteValido = JSON.stringify({
  format: 'taller-pod-motif-candidates',
  schemaVersion: 1,
  mercado: 'gospel_es',
  familia: 'gospel',
  idioma: 'es',
  registros: [
    {
      id: 'sendero-secretos',
      motivo: 'sendero escondido detrás del cerro',
      idea_comunicada: 'a pesar de todo hay caminos',
      tensiones: ['aventura', 'miedo'],
      contextos: ['selva', 'ciudad'],
      justificacion: 'el sendero simboliza rutas no vistas',
      riesgo_cliche: 'bajo'
    }
  ]
});
const importacion = importarMotivosEnriquecidos(loteValido, 'gospel_es', 'gospel_es', false);
ok(importacion.ok, 'el importador rechazó un lote enriquecido válido: ' + (importacion.error || ''));
ok(importacion.stats.added.length === 1, 'el lote válido no registró el motivo como añadido');
ok(importacion.stats.rejected.length === 0, 'el lote válido no reportó rechazos');

const importacionRepeat = importarMotivosEnriquecidos(loteValido, 'gospel_es', 'gospel_es', false);
ok(importacionRepeat.ok, 'la reimportación del mismo lote falló');
ok(importacionRepeat.stats.added.length === 0, 'la reimportación no fue idempotente (volvió a añadir)');
ok(importacionRepeat.stats.duplicates.length === 1, 'la reimportación no reportó el duplicado');

const importacionJsonInvalido = importarMotivosEnriquecidos('{ no es json', 'gospel_es', 'gospel_es', false);
ok(importacionJsonInvalido.ok === false, 'el importador aceptó JSON inválido');
const importacionFormatoInvalido = importarMotivosEnriquecidos(JSON.stringify({ format: 'otro-formato', schemaVersion: 1, mercado: 'gospel_es', registros: [] }), 'gospel_es', 'gospel_es', false);
ok(importacionFormatoInvalido.ok === false, 'el importador aceptó un formato desconocido');
const importacionMercadoDistinto = importarMotivosEnriquecidos(JSON.stringify({ format: 'taller-pod-motif-candidates', schemaVersion: 1, mercado: 'colombia', registros: [] }), 'gospel_es', 'gospel_es', false);
ok(importacionMercadoDistinto.ok === false, 'el importador aceptó un mercado distinto al solicitado');

const loteConInvalido = JSON.stringify({
  format: 'taller-pod-motif-candidates',
  schemaVersion: 1,
  mercado: 'gospel_es',
  registros: [
    { id: 'valido-1', motivo: 'vasija', idea_comunicada: 'resiliencia', tensiones: ['fuerza'], contextos: ['hogar'], justificacion: 'vasija', riesgo_cliche: 'bajo' },
    { id: '', motivo: '', idea_comunicada: '', tensiones: [], contextos: [], justificacion: '', riesgo_cliche: 'x' }
  ]
});
const importacionConInvalido = importarMotivosEnriquecidos(loteConInvalido, 'gospel_es', 'gospel_es', false);
ok(importacionConInvalido.ok === false, 'el importador aceptó un lote con registros inválidos');
ok(importacionConInvalido.stats.rejected.length === 1, 'el importador no reportó el registro inválido');

const conceptos = getPersonalConcepts('gospel_es', 'gospel_es');
ok(conceptos.length === 1, 'el motivo válido no llegó al banco de conceptos del subnicho: ' + JSON.stringify(conceptos));

// --- Banda de propuestas desde el banco (cola de revision) ---
ok(typeof window.proponerEnBanco === 'function', 'no se expuso window.proponerEnBanco');
ok(typeof window.proponerConceptoDesdeBanco === 'function', 'no se expuso window.proponerConceptoDesdeBanco');
ok(typeof window.aceptarPropuestaBanco === 'function', 'no se expuso window.aceptarPropuestaBanco');
ok(typeof window.descartarPropuestaBanco === 'function', 'no se expuso window.descartarPropuestaBanco');
const propuesta = proponerEnBanco('concepto', 'sendero escondido detrás del cerro', { mercado: 'gospel_es', subniche: 'gospel_es', motivo: 'sendero', idea: 'rutas no vistas', tensiones: ['aventura'], contextos: ['selva'], riesgo_cliche: 'bajo' });
ok(propuesta && propuesta.estado === 'pendiente', 'la propuesta no nació en estado pendiente');
ok(Array.isArray(getPropuestasBanco()) && getPropuestasBanco().length === 1, 'la propuesta no quedó en la bandeja');
const aceptada = aceptarPropuestaBanco(propuesta.id);
ok(aceptada.ok, 'no se pudo aceptar la propuesta: ' + JSON.stringify(aceptada));
ok(Array.isArray(getPropuestasBanco()) && getPropuestasBanco().length === 0, 'la propuesta no se descartó al aceptarse');
const propuesta2 = proponerEnBanco('frase', 'a pesar de todo hay caminos', { mercado: 'gospel_es', subniche: 'gospel_es' });
const descartada = descartarPropuestaBanco(propuesta2.id);
ok(descartada.ok && descartada.restantes === 0, 'no se pudo descartar la propuesta');

// --- UI del flujo maestro banco de motivos (index.html + ia-analisis.js) ---
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
ok(html.includes('id="bankJsonInput"'), 'index.html no ofrece el textarea del banco enriquecido');
ok(html.includes('id="bankFileInput"'), 'index.html no ofrece el selector de archivo del banco');
ok(html.includes('id="btnBankValidate"') && html.includes('id="btnBankProposeConcept"') && html.includes('id="btnBankProposePhrase"') && html.includes('id="btnBankProposeObject"') && html.includes('id="btnBankImportSelected"'), 'index.html no ofrece los controles del flujo banco');
ok(html.includes('taller-pod-motif-candidates'), 'index.html no documenta el formato del banco enriquecido');
const analisisSrc = fs.readFileSync(path.join(ROOT, 'js', 'ia-analisis.js'), 'utf8');
ok(analisisSrc.includes('btnBankValidate'), 'ia-analisis.js no cablea el validador del banco');
ok(analisisSrc.includes('proponerBanco'), 'ia-analisis.js no cablea las propuestas desde banco');
ok(analisisSrc.includes('importarSeleccionadosUI'), 'ia-analisis.js no cablea la importacion seleccionada');

console.log('PASS unified-banks (' + checks + ' aserciones: lote sintético de 14 registros/28 strings, mercados, actividad, fusión, validación, importador enriquecido, propuestas, UI flujo banco)');
