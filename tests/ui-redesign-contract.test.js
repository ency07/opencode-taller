/* Contrato de no regresión del rediseño UI: preservar controles, IDs y conexiones. */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');
const feedback = fs.readFileSync(path.join(root, 'js', 'ui-feedback.js'), 'utf8');

const requiredControls = [
  'btnMemory', 'btnAI', 'market', 'language', 'brand', 'product', 'printMethod',
  'stampSide', 'capApplication', 'marketplace', 'workflowMode', 'decisionMode',
  'region', 'subniche', 'creativeTerritory', 'visualIdentity', 'serie', 'set',
  'concept', 'message', 'btnUseBankPhrase', 'btnUseBankConcept', 'btnSugerirCopy',
  'support', 'dominio', 'audienceSet', 'audienceMulti', 'aestheticPreference',
  'bankJsonInput', 'bankFileInput', 'btnBankValidate', 'btnBankProposeConcept',
  'btnBankProposePhrase', 'btnBankProposeObject', 'btnBankImportSelected',
  'imageUpload', 'btnAnalyzeImage', 'essence', 'domImagen', 'simboloVar',
  'paletaVar', 'textosVar', 'repeatType', 'pbText', 'pbDom', 'pbBank', 'pbBankName',
  'btnSavePB', 'btnDirector', 'btnBuild', 'btnNewSet', 'btnReset', 'btnArbitro',
  'out', 'btnCopy', 'btnCopyPart', 'btnFmt', 'sheetUpload', 'btnValidarHoja'
];

const requiredIds = [
  ...requiredControls,
  'status', 'colorAudit', 'gate', 'arbitroEstado', 'arbitro', 'qaVisual',
  'qaEstado', 'cards', 'matrix', 'aiBar', 'varPanel', 'mixPanel', 'modeToggle',
  'objectModeToggle', 'designToggle', 'designModeHelp', 'repeatRow', 'bankPreview',
  'approvedDirectionsList', 'validadorStatus', 'validadorRes', 'uploadZone',
  'imagePreview', 'imageAnalysisStatus', 'conceptModeHelp', 'copyIAStatus',
  'copyIAAlternativas', 'marketHelp', 'audienceHelp', 'dominioHelp',
  'domImagenHelp', 'pbCount', 'printMethodField', 'stampSideField',
  'capApplicationField', 'panel-mercado', 'panel-idea', 'panel-banco',
  'panel-calidad', 'panel-arbitro', 'panel-visual', 'panel-resultados',
  'panel-matriz', 'panel-prompt', 'panel-validador'
];

const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
const unique = new Set(ids);
assert.equal(ids.length, unique.size, 'no debe haber IDs duplicados');
for (const id of requiredIds) {
  assert.ok(unique.has(id), `falta el ID requerido: #${id}`);
}

const controlCount = (html.match(/<(button|select|input|textarea)\b/g) || []).length;
assert.ok(controlCount >= 59, `el rediseño no debe eliminar controles (${controlCount}/59)`);

const hrefs = [...html.matchAll(/class="app-nav"[\s\S]*?<\/nav>/g)]
  .flatMap(block => [...block[0].matchAll(/href="#([^"]+)"/g)].map(m => m[1]));
assert.ok(hrefs.length >= 8, 'la navegación por secciones debe tener anclas');
for (const href of hrefs) {
  assert.ok(unique.has(href), `la ancla #${href} no existe`);
}

assert.match(css, /prefers-reduced-motion/, 'el CSS debe respetar prefers-reduced-motion');
assert.match(css, /--acc:/, 'el CSS debe definir el tokens de acento');
assert.match(feedback, /MutationObserver/, 'el script de microinteracciones debe observar estados');
assert.match(html, /js\/ui-feedback\.js/, 'index.html debe cargar ui-feedback.js');
assert.match(html, /styles\.css/, 'index.html debe cargar styles.css');

for (const id of ['market', 'language', 'brand', 'product', 'marketplace', 'workflowMode', 'decisionMode', 'region', 'creativeTerritory', 'audienceSet', 'audienceMulti', 'aestheticPreference', 'dominio', 'simboloVar', 'paletaVar', 'textosVar', 'repeatType']) {
  const re = new RegExp(`<select[^>]*id="${id}"[\\s\\S]*?<\\/select>`, 'i');
  assert.match(html, re, `el selector #${id} debe conservar su estructura de opciones`);
}

console.log('PASS ui-redesign-contract: 59 controles, IDs, anclas y microinteracciones preservados');
