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
console.log('PASS unified-banks (' + checks + ' aserciones: lote sintético de 14 registros/28 strings, mercados, actividad, fusión, validación)');
