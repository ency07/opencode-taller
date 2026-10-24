/* C2 — Etiquetas de origen en los selectores de audiencia: al elegir se ve si
   el pool lo filtró el subnicho (filtra de verdad) o si es el catálogo del
   mercado sin filtro efectivo (DEBT-006). Cubre los 2 selectores reales:
   el global #audienceSet (updateAudienceSelect de ia-analisis, el builder que
   manda en producción) y el selector por ficha (renderCards con audSuf).
   Los value NO cambian: locks, refresh y preservación intactos.
   Ejecutar: node tests/aud-origen-label.test.js */

'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const JS = path.join(ROOT, 'js');
let checks = 0;
const failures = [];
function ok(cond, msg) { checks++; if (!cond) failures.push(msg); }

const dataSrc = fs.readFileSync(path.join(JS, 'data-audiencias.js'), 'utf8');
const motorSrc = fs.readFileSync(path.join(JS, 'motor-nucleo.js'), 'utf8');
const analisisSrc = fs.readFileSync(path.join(JS, 'ia-analisis.js'), 'utf8');

const SUF_SUB = ' (del subnicho)';
const SUF_MERC = ' (mercado — sin filtro del subnicho)';

/* DOM falso (patrón lang-reset): selectores con innerHTML→options */
function fakeSelect(value) {
  const el = {
    value: value, options: [], _html: '', style: {}, open: false,
    addEventListener: function () {}
  };
  Object.defineProperty(el, 'innerHTML', {
    get: function () { return this._html; },
    set: function (h) {
      this._html = String(h);
      const m = this._html.match(/<option value="([^"]*)"/g) || [];
      this.options = m.map(function (s) { return { value: s.slice(15, -1), text: s }; });
      if (this.options.length) this.value = this.options[0].value;
    }
  });
  return el;
}
const els = {};
function $(id) { return els[id] || null; }
['market', 'region', 'subniche', 'audienceSet', 'language', 'dominio',
 'domImagen', 'pbDom', 'concept', 'message', 'dominioHelp',
 'tplActiveHint', 'product'].forEach(function (id) { els[id] = fakeSelect(''); });
els.concept.value = '';
els.message.value = '';

global.window = global;
global.document = {
  getElementById: function (id) { return els[id] || null; },
  querySelectorAll: function () { return []; },
  readyState: 'complete',
  createElement: function () { return { style: {}, getContext: function () { return null; }, className: '', innerHTML: '', appendChild: function () {}, addEventListener: function () {} }; },
  addEventListener: function () {},
  body: { appendChild: function () {} }
};

['data-mercados.js', 'data-audiencias.js', 'data-bancos.js', 'data-estilos.js',
 'dominios.js', 'data-productos.js', 'memoria-local.js', 'motor-nucleo.js',
 'ia-client.js'
].forEach(function (f) {
  vm.runInThisContext(fs.readFileSync(path.join(JS, f), 'utf8'), { filename: f });
});
vm.runInThisContext(analisisSrc, { filename: 'ia-analisis.js' });

function optionsDe(html) { return html.split('</option>').filter(Boolean); }
function poolOptions(html) { return optionsDe(html).filter(function (o) { return o.indexOf('value="Auto"') === -1; }); }
function sinSuffix(html) { return optionsDe(html).every(function (o) { return o.indexOf(SUF_SUB) === -1 && o.indexOf(SUF_MERC) === -1; }); }
function valuesDe(html) { return (html.match(/<option value="([^"]*)"/g) || []).map(function (m) { return m.slice(15, -1); }); }

/* --- 0) Fuente: los 2 selectores reales usan el helper --- */
ok(dataSrc.includes('function audiencePoolOriginSuffix'), 'data-audiencias define audiencePoolOriginSuffix');
ok(dataSrc.includes(SUF_MERC) && dataSrc.includes(SUF_SUB), 'los 2 sufijos existen en la fuente');
ok(dataSrc.includes('window.audiencePoolOriginSuffix = audiencePoolOriginSuffix'), 'helper exportado en window');
ok(analisisSrc.includes('audiencePoolOriginSuffix(effRegion, marketId, subniche)'), 'el selector global (updateAudienceSelect) usa el helper');
ok(analisisSrc.includes('_escapeOptionText(label) + audSuf +'), 'el selector global añade el sufijo al texto de cada opción');
ok(motorSrc.includes('escHtml(a) + audSuf +'), 'el selector por ficha añade audSuf al texto de cada opción');
ok(motorSrc.includes('audiencePoolOriginSuffix(MOTOR_STATE.region'), 'audSuf del fichero se calcula con region/market/subnicho efectivo');

/* --- 1) Helper directo (semántica producción: gana data-bancos) --- */
ok(audiencePoolOriginSuffix('todas', 'colombia', 'auto') === '', 'auto no etiqueta (pool sin subnicho)');
ok(audiencePoolOriginSuffix('todas', 'colombia', '') === '', 'sin subnicho no etiqueta');
ok(audiencePoolOriginSuffix('todas', 'colombia', 'humor_costeno') === SUF_SUB, 'subnicho que estrecha el pool etiqueta «del subnicho»');
ok(audiencePoolOriginSuffix('todas', 'colombia', 'comida_sabor') === SUF_SUB, 'subnicho que no incluye la persona propia costeña estrecha y etiqueta «del subnicho» (C3)');

/* --- 2) Selector global REAL: updateAudienceSelect vía cascadeUpdate --- */
els.market.value = 'colombia';
els.region.value = '';
els.subniche.value = '';
els.audienceSet.value = '';
global.cascadeUpdate();

ok(els.audienceSet.options.length > 1, 'con subnicho auto el selector global tiene opciones de pool (' + els.audienceSet.options.length + ')');
ok(sinSuffix(els.audienceSet._html), 'con subnicho auto ninguna opción lleva sufijo');
const valuesAuto = valuesDe(els.audienceSet._html);
ok(valuesAuto[0] === 'Auto', 'Auto sigue siendo la primera opción');
const regActiva = els.region.value;
const poolAutenticos = getAudiencesForMarketRegion('colombia', regActiva);
ok(poolAutenticos.every(function (id) { return valuesAuto.indexOf(id) !== -1; }), 'el pool del mercado completo está en el selector');

els.subniche.value = 'humor_costeno';
global.cascadeUpdate();
const htmlHumor = els.audienceSet._html;
const poolHumor = poolOptions(htmlHumor);
ok(poolHumor.length === 6, 'humor_costeno estrecha el pool a 6 (5 + costeno_costenol; hay ' + poolHumor.length + ')');
ok(poolHumor.every(function (o) { return o.slice(-SUF_SUB.length) === SUF_SUB; }), 'las 6 opciones terminan con «(del subnicho)»');
ok(htmlHumor.indexOf(SUF_MERC) === -1, 'con humor_costeno NO aparece «(mercado…)»');
ok(valuesDe(htmlHumor).indexOf('Auto') !== -1, 'Auto sigue presente tras filtrar');
ok(valuesDe(htmlHumor).slice(1).join() === getAudiencesForSubniche('humor_costeno', regActiva, 'colombia').join(),
  'los value son exactamente los ids del pool (sin sufijo en los value)');

els.audienceSet.value = 'coste_adulto_m';
els.subniche.value = 'humor_costeno';
global.cascadeUpdate();
ok(els.audienceSet.value === 'coste_adulto_m', 'elección manual válida se preserva con el sufijo presente');

els.subniche.value = 'comida_sabor';
global.cascadeUpdate();
const htmlComida = els.audienceSet._html;
const poolComida = poolOptions(htmlComida);
ok(poolComida.length === 13 && poolComida.length < poolAutenticos.length,
  'comida_sabor estrecha a sus 13 (excluye costeno_costenol; ' + poolComida.length + ' < mercado ' + poolAutenticos.length + ')');
ok(poolComida.every(function (o) { return o.slice(-SUF_SUB.length) === SUF_SUB; }),
  'todas las opciones terminan con «(del subnicho)» (' + poolComida.length + ' opciones)');
ok(htmlComida.indexOf(SUF_MERC) === -1, 'con comida_sabor NO aparece «(mercado.)»');

els.subniche.value = 'auto';
global.cascadeUpdate();
ok(sinSuffix(els.audienceSet._html), 'volver a auto limpia los sufijos');

/* --- 3) Export getAudienceSelectOptions (misma semántica, caminos test/legacy) --- */
const optSub = getAudienceSelectOptions('todas', 'colombia', 'humor_costeno');
const optSubPool = poolOptions(optSub);
ok(optSubPool.length > 0 && optSubPool.every(function (o) { return o.slice(-SUF_SUB.length) === SUF_SUB; }),
  'getAudienceSelectOptions etiqueta «del subnicho» (' + optSubPool.length + ' opciones)');
const optMerc = getAudienceSelectOptions('todas', 'colombia', 'comida_sabor');
const optMercPool = poolOptions(optMerc);
ok(optMercPool.length > 0 && optMercPool.every(function (o) { return o.slice(-SUF_SUB.length) === SUF_SUB }),
  'getAudienceSelectOptions etiqueta «del subnicho» para comida_sabor (' + optMercPool.length + ' opciones)');
const optAuto = getAudienceSelectOptions('todas', 'colombia', 'auto');
ok(optAuto.indexOf('value="Auto"') !== -1 && sinSuffix(optAuto), 'getAudienceSelectOptions con auto: Auto presente y sin sufijos');

/* --- 4) Los value nunca arrastran el sufijo (locks/refresh intactos) --- */
[htmlHumor, htmlComida, els.audienceSet._html].forEach(function (html, i) {
  const vals = valuesDe(html);
  ok(vals.every(function (v) { return v.indexOf('(') === -1 && v.indexOf('subnicho') === -1; }),
    'caso ' + i + ': ningún value arrastra el sufijo');
});

const passed = failures.length === 0;
console.log((passed ? 'PASS' : 'FAIL') + '  aud-origen-label  (' + checks + ' aserciones, ' + failures.length + ' fallos)');
failures.forEach(function (f) { console.log('  X ' + f); });
process.exit(passed ? 0 : 1);
