/* Contrato Red Team: todos los mercados seculares; Gospel queda aislado. */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ROOT = path.join(__dirname, '..');
let checks = 0;
const failures = [];
function ok(value, message) { checks++; if (!value) failures.push(message); }
global.window = global;
global.document = { getElementById: function () { return null; }, querySelectorAll: function () { return []; } };
const JS = path.join(ROOT, 'js');
['data-mercados.js','data-audiencias.js','data-bancos.js','data-estilos.js','dominios.js','data-productos.js','data-territorios.js','memoria-local.js','motor-nucleo.js']
  .forEach(function (f) { vm.runInThisContext(fs.readFileSync(path.join(JS, f), 'utf8'), { filename: f }); });
const secularMarkets = ['global_en','global_es','colombia','anglo','latam','spain','diaspora_col'];
secularMarkets.forEach(function (market) {
  MOTOR_STATE.market = market;
  const route = resolveEngineForMarket(market);
  ok(route.status === 'resolved' && route.engine === 'secular', market + ' debe tener ruta secular explícita');
  ok(isSecularMarket(), market + ' debe conservar el comportamiento secular');
});
['gospel_es','gospel_en'].forEach(function (market) {
  MOTOR_STATE.market = market;
  const route = resolveEngineForMarket(market);
  ok(route.status === 'resolved' && route.engine === 'gospel', market + ' debe tener ruta Gospel explícita');
  ok(isGospelMarket() && !isSecularMarket(), market + ' debe conservar exclusivamente el motor Gospel');
});
['custom','unknown_market',''].forEach(function (market) {
  const route = resolveEngineForMarket(market);
  ok(route.status === 'unclassified', String(market) + ' debe quedar sin clasificar');
});
MOTOR_STATE.market = 'custom';
ok(!isGospelMarket() && !isSecularMarket(), 'un mercado sin clasificar no debe activar reglas Gospel ni Secular');
const originalReadStateFromDOM = readStateFromDOM;
readStateFromDOM = function () { MOTOR_STATE.market = 'custom'; };
ok(generateSet() === null, 'la generación debe bloquearse para mercados sin clasificar');
readStateFromDOM = originalReadStateFromDOM;
MOTOR_STATE.market='global_en'; MOTOR_STATE.region='global'; MOTOR_STATE.product='CAMISETA SOFT';
MOTOR_STATE.workflowMode='explore'; MOTOR_STATE.designMode='contacto'; MOTOR_STATE.subniche='auto';
MOTOR_STATE.dominio='auto'; MOTOR_STATE.dominioDetectado='auto'; MOTOR_STATE.audienceSet='Auto'; MOTOR_STATE.audienceMulti='si';
MOTOR_STATE.groupMode='distintos'; MOTOR_STATE.concept='Finding your way through uncertainty'; MOTOR_STATE.message='';
MOTOR_STATE.support=''; MOTOR_STATE.explorationBrief=null; MOTOR_STATE.creativeTerritory='auto';
MOTOR_STATE.visualIdentity='Neon cyber identity, black base with cyan and electric magenta accents'; MOTOR_STATE.decisionMode='assisted';
const audiences=resolveAudiences();
ok(new Set(['A','B','C'].map(k=>audiences[k])).size===3,'audiencias distintas cuando el pool lo permite');
const set=buildCandidate(audiences,null);
const families=_secularPaletteFamilies(MOTOR_STATE.visualIdentity);
ok(families.length>=3,'identidad cromática resuelve familias compatibles');
ok(['A','B','C'].every(k=>families.includes(set[k].familiaColor)),'las tres paletas respetan identidad');
const prompt=formatPrompt({set});
ok(prompt.includes(MOTOR_STATE.visualIdentity),'identidad visual presente en prompt');
ok(prompt.includes('PALETA VINCULADA A IDENTIDAD'),'autoridad cromática declarada');
ok(prompt.includes('FIDELIDAD DEL CONCEPTO'),'concepto abstracto protegido');
ok(prompt.includes('COPY CANÓNICO SECULAR')||prompt.includes('COPY LITERAL COMPARTIDO A/B/C'),'copy único compartido A/B/C');
ok(!prompt.includes('debe interactuar físicamente con las letras de forma plausible'),'no se fuerza interacción física');
const badSet={A:Object.assign({},set.A),B:Object.assign({},set.B),C:Object.assign({},set.C)};
badSet.C.familiaColor='tierra cálida';
const arb=arbitroSelectores(prompt,{set:badSet});
ok(arb.checks.some(c=>c.etiqueta==='Paleta compatible con identidad visual'&&!c.ok),'árbitro detecta paleta incompatible');
MOTOR_STATE.concept=''; MOTOR_STATE.message='';
const emptySet=buildCandidate(resolveAudiences(),null);
const emptyPrompt=formatPrompt({set:emptySet});
ok(emptyPrompt.includes('no hay mensaje ni concepto para derivar copy')||emptyPrompt.includes('no hay mensaje ni concepto autorizado'),'sin concepto ni mensaje no inventa copy');
const autoPrint=getPrintPrepRule('CAMISETA SOFT','auto');
ok(autoPrint.includes('AUTO: conserva el estilo')&&!/convierte a vector|simplifica por defecto/i.test(autoPrint),'auto no impone vectorización ni simplificación');
MOTOR_STATE.market='gospel_es'; MOTOR_STATE.visualIdentity='Neon black cyan visual identity';
MOTOR_STATE.workflowMode='explore'; MOTOR_STATE.concept='Un concepto de prueba'; MOTOR_STATE.message='MENSAJE DE PRUEBA';
const gospelSet=buildCandidate(resolveAudiences(),null);
const gospelPrompt=formatPrompt({set:gospelSet});
ok(!gospelPrompt.includes('PALETA VINCULADA A IDENTIDAD'),'Gospel no recibe el filtro cromático secular');
ok(!gospelPrompt.includes('FIDELIDAD DEL CONCEPTO:'),'Gospel no recibe las reglas de concepto seculares');
ok(!gospelPrompt.includes('COPY CANÓNICO SECULAR'),'Gospel no recibe el contrato de copy secular');

/* Gospel EN también debe conservar su contrato propio y quedar fuera de Secular. */
MOTOR_STATE.market='gospel_en'; MOTOR_STATE.visualIdentity='Neon black cyan visual identity';
MOTOR_STATE.workflowMode='explore'; MOTOR_STATE.concept='Grace in the storm'; MOTOR_STATE.message='Christ is my hope';
const gospelEnSet=buildCandidate(resolveAudiences(),null);
const gospelEnPrompt=formatPrompt({set:gospelEnSet});
ok(gospelEnPrompt.includes('DOCTRINA: Trinitario'),'Gospel EN conserva su contrato doctrinal');
ok(!gospelEnPrompt.includes('PALETA VINCULADA A IDENTIDAD'),'Gospel EN no recibe el filtro cromático secular');
ok(!gospelEnPrompt.includes('FIDELIDAD DEL CONCEPTO:'),'Gospel EN no recibe las reglas de concepto seculares');
ok(!gospelEnPrompt.includes('COPY CANÓNICO SECULAR'),'Gospel EN no recibe el contrato de copy secular');

/* Copy Gospel EN: nunca usa fallback genérico si falta autorización. */
let enCopy=_resolveGospelENCopy('Christ is my hope','Grace in the storm',true);
ok(enCopy.text==='Christ is my hope' && enCopy.source==='user','Gospel EN prioriza el mensaje explícito');
enCopy=_resolveGospelENCopy('','Grace in the storm',true);
ok(enCopy.text==='Grace in the storm' && enCopy.source==='concept','Gospel EN deriva solo del concepto autorizado');
enCopy=_resolveGospelENCopy('','—',true);
ok(enCopy.text==='' && enCopy.source==='missing-concept','Gospel EN no usa banco genérico sin concepto');
enCopy=_resolveGospelENCopy('','Grace in the storm',false);
ok(enCopy.text==='' && enCopy.source==='disabled','Gospel EN respeta la desactivación del copy automático');

/* El prompt EN sin concepto ni mensaje debe bloquear el texto inventado. */
MOTOR_STATE.market='gospel_en'; MOTOR_STATE.visualIdentity='';
MOTOR_STATE.workflowMode='explore'; MOTOR_STATE.concept=''; MOTOR_STATE.message='';
MOTOR_STATE.allowAutoCopy=true; MOTOR_STATE.explorationBrief=null;
const gospelEnEmptySet=buildCandidate(resolveAudiences(),null);
const gospelEnEmptyPrompt=formatPrompt({set:gospelEnEmptySet});
ok(gospelEnEmptyPrompt.includes('SIN COPY AUTORIZADO: no generar texto'),'Gospel EN sin concepto no pide copy nuevo a la IA');
ok(gospelEnEmptyPrompt.includes('CONCEPTO NO PROPORCIONADO'),'Gospel EN no inventa concepto');
ok(!gospelEnEmptyPrompt.includes('propón copy breve'),'Gospel EN no cae al fallback comercial');
console.log((failures.length?'FAIL':'PASS')+' secular-prompt-contract ('+checks+' assertions, '+failures.length+' failures)');
failures.forEach(x=>console.error(' - '+x));
process.exit(failures.length?1:0);
