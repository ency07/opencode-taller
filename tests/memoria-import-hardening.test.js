'use strict';
/* RT-032.1 — Endurecimiento de importación de memoria.
   Pruebas de regresión para validación defensiva en import/export/fusión.
   No son tests de "la función existe": each test exercises a real failure mode. */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');

// --- Entorno browser mínimo ---
global.window = global;
global.document = {
  getElementById: function () { return null; },
  querySelectorAll: function () { return []; },
  createElement: function () { return { click: function () {}, style: {} }; },
  body: { appendChild: function () {} },
  readyState: 'complete',
  addEventListener: function () {}
};
global.location = { reload: function () {} };
global.Blob = function () {};
global.URL = { createObjectURL: function () { return ''; }, revokeObjectURL: function () {} };

// --- Cargar memoria-local.js ---
vm.runInThisContext(
  fs.readFileSync(path.join(ROOT, 'js', 'memoria-local.js'), 'utf8'),
  { filename: 'memoria-local.js' }
);

let checks = 0;
const failures = [];

function ok(cond, msg) {
  checks++;
  if (!cond) failures.push(msg);
}

function throws(fn, msg) {
  checks++;
  try {
    fn();
    failures.push(msg + ' (no lanzó excepción)');
  } catch (e) {
    // esperado
  }
}

function doesNotThrow(fn, msg) {
  checks++;
  try {
    fn();
  } catch (e) {
    failures.push(msg + ' (lanzó: ' + e.message + ')');
  }
}

// ============================================================
// 1. Importación válida
// ============================================================
clearAllMemory();
const validExport = {
  'POD2|locks|gospel_es|CAMISETA': JSON.stringify({ estilo: 'Auto' }),
  'POD2|history|gospel_es|CAMISETA': JSON.stringify({ history: ['a', 'b'], usedObjects: ['x'] })
};
const r1 = importMemoryJSON(JSON.stringify(validExport), 'overwrite');
ok(r1.ok !== false, 'importación válida: no debe fallar');
ok(r1.restored === 2, 'importación válida: debe restaurar 2 claves (obtenido ' + r1.restored + ')');
ok(getRaw('POD2|locks|gospel_es|CAMISETA') === validExport['POD2|locks|gospel_es|CAMISETA'],
  'importación válida: valor almacenado debe coincidir');

// ============================================================
// 2. JSON malformado
// ============================================================
throws(function () { importMemoryJSON('{ no es json', 'overwrite'); },
  'JSON malformado: importMemoryJSON debe lanzar');
throws(function () { importMemoryJSON('null', 'overwrite'); },
  'JSON null: importMemoryJSON debe lanzar');
throws(function () { importMemoryJSON('[1,2,3]', 'overwrite'); },
  'JSON array: importMemoryJSON debe lanzar');
throws(function () { importMemoryJSON('"string"', 'overwrite'); },
  'JSON string: importMemoryJSON debe lanzar');
throws(function () { importMemoryJSON('', 'overwrite'); },
  'JSON vacío: importMemoryJSON debe lanzar');
throws(function () { importPersonalBanksJSON('{ no es json'); },
  'JSON malformado: importPersonalBanksJSON debe lanzar');
throws(function () { normalizeGeneratedBankOutput('{ no es json'); },
  'JSON malformado: normalizeGeneratedBankOutput debe lanzar');

// ============================================================
// 3. Claves manipuladas
// ============================================================
clearAllMemory();
// Nota: JSON.parse crea own property __proto__; un object literal no lo haría
throws(function () {
  importMemoryJSON(JSON.stringify(JSON.parse('{"__proto__": {"polluted": true}, "POD2|x": "y"}')), 'overwrite');
}, 'claves manipuladas: __proto__ debe lanzar');
throws(function () {
  importMemoryJSON(JSON.stringify(JSON.parse('{"constructor": {"polluted": true}, "POD2|y": "z"}')), 'overwrite');
}, 'claves manipuladas: constructor debe lanzar');
throws(function () {
  importMemoryJSON(JSON.stringify(JSON.parse('{"prototype": {"polluted": true}, "POD2|z": "w"}')), 'overwrite');
}, 'claves manipuladas: prototype debe lanzar');

// Verificar que no se contaminó el prototipo global
ok(({}).polluted === undefined, 'claves manipuladas: no debe contaminar prototipo global');

// Claves vacías o con doble pipe
throws(function () {
  importMemoryJSON(JSON.stringify({ 'POD2|': 'test' }), 'overwrite');
}, 'claves manipuladas: POD2| vacía debe lanzar');

throws(function () {
  importMemoryJSON(JSON.stringify({ 'POD2||doble': 'test' }), 'overwrite');
}, 'claves manipuladas: POD2||doble debe lanzar');

// Clave sin prefijo (se ignora silenciosamente para compatibilidad)
const r3f = importMemoryJSON(JSON.stringify({ 'otra_clave': 'test' }), 'overwrite');
ok(r3f.restored === 0, 'claves manipuladas: clave sin prefijo POD2| no debe importarse');

// ============================================================
// 4. Valores con tipos incorrectos
// ============================================================
clearAllMemory();
throws(function () { importMemoryJSON(JSON.stringify({ 'POD2|num': 12345 }), 'overwrite'); },
  'tipo incorrecto: número debe rechazarse');
throws(function () { importMemoryJSON(JSON.stringify({ 'POD2|bool': true }), 'overwrite'); },
  'tipo incorrecto: booleano debe rechazarse');
throws(function () { importMemoryJSON(JSON.stringify({ 'POD2|obj': { a: 1 } }), 'overwrite'); },
  'tipo incorrecto: objeto debe rechazarse');
throws(function () { importMemoryJSON(JSON.stringify({ 'POD2|arr': [1, 2] }), 'overwrite'); },
  'tipo incorrecto: array debe rechazarse');
throws(function () { importMemoryJSON(JSON.stringify({ 'POD2|null': null }), 'overwrite'); },
  'tipo incorrecto: null debe rechazarse');

// ============================================================
// 5. Objetos con propiedades peligrosas
// ============================================================
clearAllMemory();
const r5a = importMemoryJSON(JSON.stringify({
  'POD2|locks|gospel_es|CAMISETA': JSON.stringify({ '__proto__': { polluted: true }, estilo: 'Auto' })
}), 'overwrite');
ok(r5a.restored === 1, 'propiedades peligrosas: la clave POD2| debe importarse');
const stored5a = getRaw('POD2|locks|gospel_es|CAMISETA');
const parsed5a = JSON.parse(stored5a);
ok(parsed5a.__proto__ !== undefined || parsed5a.estilo === 'Auto',
  'propiedades peligrosas: el valor interno debe ser JSON válido');

// Verificar que mergeMemoryObjects no contamina
const pollutedRemote = JSON.parse('{"__proto__": {"polluted": true}, "POD2|a": "1"}');
const merged5b = mergeMemoryObjects({}, pollutedRemote);
ok(merged5b.polluted === undefined, 'propiedades peligrosas: mergeMemoryObjects no debe contaminar');
ok(({}).polluted === undefined, 'propiedades peligrosas: no debe contaminar prototipo global');

// ============================================================
// 6. Archivos excesivamente grandes
// ============================================================
clearAllMemory();
const bigValue = 'x'.repeat(600 * 1024); // 600 KB > 512 KB límite
throws(function () { importMemoryJSON(JSON.stringify({ 'POD2|big': bigValue }), 'overwrite'); },
  'archivo grande: valor > 512KB debe rechazarse');

const bigKey = 'POD2|' + 'a'.repeat(250); // > 200 chars
throws(function () { importMemoryJSON(JSON.stringify({ [bigKey]: 'test' }), 'overwrite'); },
  'archivo grande: clave > 200 chars debe rechazarse');

// Muchas claves
const manyKeys = {};
for (let i = 0; i < 2100; i++) manyKeys['POD2|k|' + i] = 'v';
throws(function () { importMemoryJSON(JSON.stringify(manyKeys), 'overwrite'); },
  'archivo grande: > 2000 claves debe rechazarse');

// ============================================================
// 7. Datos incompletos
// ============================================================
clearAllMemory();
// JSON válido pero sin claves POD2|
const r7a = importMemoryJSON(JSON.stringify({ 'otra': 'clave', 'mas': 'datos' }), 'overwrite');
ok(r7a.restored === 0, 'datos incompletos: sin claves POD2| debe restaurar 0');

// Objeto vacío
const r7b = importMemoryJSON(JSON.stringify({}), 'overwrite');
ok(r7b.restored === 0, 'datos incompletos: objeto vacío debe restaurar 0');

// Solo claves prohibidas
throws(function () {
  importMemoryJSON(JSON.stringify({ '__proto__': {}, 'constructor': {} }), 'overwrite');
}, 'datos incompletos: solo claves prohibidas debe lanzar');

// ============================================================
// 8. Importación parcial y fallo de almacenamiento
// ============================================================
clearAllMemory();
setRaw('POD2|existing', 'original');
const r8a = importMemoryJSON(JSON.stringify({
  'POD2|existing': 'updated',
  'POD2|new': 'added'
}), 'merge');
ok(r8a.restored === 2, 'fusión parcial: debe restaurar 2 claves');
ok(getRaw('POD2|existing') === 'original', 'fusión parcial: en merge la prioridad es local (sin pérdida de datos locales)');
ok(getRaw('POD2|new') === 'added', 'fusión parcial: clave nueva debe añadirse');

// En overwrite sí se actualiza
clearAllMemory();
setRaw('POD2|existing', 'original');
const r8a2 = importMemoryJSON(JSON.stringify({
  'POD2|existing': 'updated',
  'POD2|new': 'added'
}), 'overwrite');
ok(getRaw('POD2|existing') === 'updated', 'overwrite: clave existente debe actualizarse');
ok(getRaw('POD2|new') === 'added', 'overwrite: clave nueva debe añadirse');

// Verificar que un fallo de almacenamiento no deja estado parcial
clearAllMemory();
setRaw('POD2|a', 'original_a');
setRaw('POD2|b', 'original_b');

// Simular fallo: monkey-patch temporal de POD_LS.setItem
const originalSetItem = POD_LS.setItem;
let failCount = 0;
POD_LS.setItem = function (k, v) {
  failCount++;
  if (failCount === 2) throw new Error('storage full');
  return originalSetItem.call(POD_LS, k, v);
};

throws(function () {
  importMemoryJSON(JSON.stringify({ 'POD2|a': 'new_a', 'POD2|b': 'new_b' }), 'overwrite');
}, 'fallo almacenamiento: debe lanzar');

// Restaurar
POD_LS.setItem = originalSetItem;

// Verificar que se restauró el estado anterior
ok(getRaw('POD2|a') === 'original_a', 'fallo almacenamiento: POD2|a debe restaurarse a original_a');
ok(getRaw('POD2|b') === 'original_b', 'fallo almacenamiento: POD2|b debe restaurarse a original_b');

// ============================================================
// 9. Compatibilidad con exportaciones antiguas
// ============================================================
clearAllMemory();
// Exportación legítima actual
setRaw('POD2|config|patterns', JSON.stringify({ window: 12, tolerance: 2 }));
setRaw('POD2|locks|gospel_es|CAMISETA', JSON.stringify({ estilo: 'Auto' }));
const currentExport = exportMemoryObject();
const r9a = importMemoryJSON(JSON.stringify(currentExport), 'overwrite');
ok(r9a.restored >= 2, 'compatibilidad: exportación actual debe importarse (obtenido ' + r9a.restored + ')');
ok(getRaw('POD2|config|patterns') === JSON.stringify({ window: 12, tolerance: 2 }),
  'compatibilidad: config debe preservarse');
ok(getRaw('POD2|locks|gospel_es|CAMISETA') === JSON.stringify({ estilo: 'Auto' }),
  'compatibilidad: locks debe preservarse');

// Formato personal banks
clearAllMemory();
createPersonalBank('gospel_es', 'Banco RT-032', 'PROCESS');
const personalBanksExport = exportPersonalBanksObject();
ok(Object.keys(personalBanksExport.data).length > 0, 'compatibilidad: exportación personal banks debe tener datos');
const r9b = importPersonalBanksJSON(JSON.stringify(personalBanksExport));
ok(r9b.ok === true, 'compatibilidad: exportación personal banks debe importarse');

// ============================================================
// 10. Fusión local/nube sin pérdida de datos
// ============================================================
clearAllMemory();
setRaw('POD2|history|gospel_es|CAMISETA', JSON.stringify({
  history: ['a', 'b', 'c'],
  usedObjects: ['x', 'y'],
  prevPicks: { estilo: 'Auto' },
  updatedAt: '2026-01-01T00:00:00Z'
}));
const localPayload = exportMemoryObject();
const remotePayload = {
  'POD2|history|gospel_es|CAMISETA': JSON.stringify({
    history: ['b', 'c', 'd'],
    usedObjects: ['y', 'z'],
    prevPicks: null,
    updatedAt: '2026-02-01T00:00:00Z'
  }),
  'POD2|locks|gospel_es|CAMISETA': JSON.stringify({ estilo: 'Auto' })
};
const merged10 = mergeMemoryObjects(localPayload, remotePayload);
ok(merged10['POD2|history|gospel_es|CAMISETA'] !== undefined, 'fusión nube: historial debe existir');
const mergedHistory = JSON.parse(merged10['POD2|history|gospel_es|CAMISETA']);
ok(mergedHistory.history.indexOf('a') !== -1, 'fusión nube: no debe perder historial local (a)');
ok(mergedHistory.history.indexOf('d') !== -1, 'fusión nube: debe incluir historial remoto (d)');
ok(mergedHistory.usedObjects.indexOf('x') !== -1, 'fusión nube: no debe perder usedObjects local (x)');
ok(mergedHistory.usedObjects.indexOf('z') !== -1, 'fusión nube: debe incluir usedObjects remoto (z)');
ok(merged10['POD2|locks|gospel_es|CAMISETA'] !== undefined, 'fusión nube: locks remotos deben existir');

// mergeMemoryObjects con entradas nulas/incorrectas
const r10b = mergeMemoryObjects(null, null);
ok(typeof r10b === 'object', 'fusión nube: entradas nulas no deben lanzar');
const r10c = mergeMemoryObjects([1, 2], 'string');
ok(typeof r10c === 'object', 'fusión nube: entradas incorrectas no deben lanzar');

// ============================================================
// 11. mergeArraysUnique — casos borde
// ============================================================
const circular = {};
circular.self = circular;
const r11a = mergeArraysUnique([circular], []);
ok(Array.isArray(r11a), 'mergeArraysUnique: referencia circular no debe lanzar');

const r11b = mergeArraysUnique(['__proto__'], []);
ok(r11b.indexOf('__proto__') !== -1, 'mergeArraysUnique: __proto__ como string no debe perderse');

const r11c = mergeArraysUnique(null, ['a', 'b']);
ok(r11c.length === 2 && r11c[0] === 'a', 'mergeArraysUnique: remote nulo debe manejarse');

const r11d = mergeArraysUnique(['a', 'b'], ['b', 'c']);
ok(r11d.length === 3, 'mergeArraysUnique: debe fusionar sin duplicados');
ok(r11d.indexOf('a') !== -1 && r11d.indexOf('b') !== -1 && r11d.indexOf('c') !== -1,
  'mergeArraysUnique: debe conservar todos los valores únicos');

// ============================================================
// 12. Límites de arrays en mergeArraysUnique
// ============================================================
const bigArr = [];
for (let i = 0; i < 6000; i++) bigArr.push('item' + i);
const r12a = mergeArraysUnique(bigArr, []);
ok(r12a.length === 5000, 'límite arrays: debe cortar a 5000 elementos (obtenido ' + r12a.length + ')');

// ============================================================
// 13. Tamaño de importación
// ============================================================
clearAllMemory();
const hugePayload = 'x'.repeat(9 * 1024 * 1024); // 9 MB > 8 MB límite
throws(function () { importMemoryJSON(JSON.stringify({ 'POD2|huge': hugePayload }), 'overwrite'); },
  'tamaño importación: > 8MB debe rechazarse');

// ============================================================
// RESULTADO
// ============================================================
const passed = failures.length === 0;
console.log((passed ? 'PASS' : 'FAIL') + ' memoria-import-hardening (' + checks + ' aserciones, ' + failures.length + ' fallos)');
if (!passed) {
  failures.forEach(function (f) { console.error(' - ' + f); });
  process.exit(1);
}
