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
['data-mercados.js','data-audiencias.js','data-bancos.js','banco-gospel-en.js','data-estilos.js','dominios.js','data-productos.js','data-territorios.js','memoria-local.js','motor-nucleo.js']
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
ok(gospelEnPrompt.includes('FIDELIDAD DOCTRINAL GOSPEL EN:'),'Gospel EN bloquea inferencias doctrinales y escenas no solicitadas');
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
MOTOR_STATE.subniche='auto'; MOTOR_STATE.dominio='auto'; MOTOR_STATE.dominioDetectado='auto';
MOTOR_STATE.allowAutoCopy=true; MOTOR_STATE.explorationBrief=null;
const gospelEnEmptyBrief=_resolveExplorationBrief();
ok(gospelEnEmptyBrief.concept==='','Gospel EN no toma conceptos automáticos del banco sin autorización');
const gospelEnEmptySet=buildCandidate(resolveAudiences(),null);
const gospelEnEmptyPrompt=formatPrompt({set:gospelEnEmptySet});
ok(gospelEnEmptyPrompt.includes('SIN COPY AUTORIZADO: no generar texto'),'Gospel EN sin concepto no pide copy nuevo a la IA');
ok(gospelEnEmptyPrompt.includes('CONCEPTO NO PROPORCIONADO'),'Gospel EN no inventa concepto');
ok(!gospelEnEmptyPrompt.includes('propón copy breve'),'Gospel EN no cae al fallback comercial');
/* Integridad estructural del banco Gospel EN: 13 dominios, 30 objetos y sin duplicados. */
const gospelEnBankDomains=window.GOSPEL_DOMINIOS_EN || {};
ok(Object.keys(gospelEnBankDomains).length===13,'Gospel EN expone 13 dominios');
Object.keys(gospelEnBankDomains).forEach(function(id){
 const items=gospelEnBankDomains[id].objetos || [];
 ok(items.length===30,id+' contiene exactamente 30 objetos');
 ok(new Set(items.map(function(x){return String(x).trim().toLowerCase();})).size===items.length,id+' no contiene objetos duplicados');
});
/* Coherencia visual del dominio LIGHT: evitar contradicciones y metáforas no representables. */
const gospelLightObjects=(gospelEnBankDomains.LIGHT && gospelEnBankDomains.LIGHT.objetos) || [];
[
 'steady lamp flame beside an open window at night',
 'first sunlight touching the edge of a dark horizon',
 'glowing ember beneath a thin layer of ash',
 'traveler carrying a lit lantern along a dark road',
 'soft light spilling through an opened doorway',
 'lighthouse beam sweeping across a dark sea',
 'torch held high above a stone path',
 'single lightning flash illuminating layered storm clouds',
 'red ember glowing among dark coals',
 'window glowing at the end of a dark street',
 'sunbeam falling across an open Bible',
 'lantern sheltered behind clear glass in a storm'
].forEach(function(item){
 ok(gospelLightObjects.includes(item),'LIGHT contiene imagen visual coherente: '+item);
});
[
 'light that goes out but does not go out entirely',
 'torch that lights without being lit',
 'clarity that lights itself while walking',
 'light that does not switch on with force',
 'light that does not go out with wind'
].forEach(function(item){
 ok(!gospelLightObjects.includes(item),'LIGHT excluye contradicción o imagen no representable: '+item);
});

/* Auditoría semántica transversal: cada familia conserva imágenes concretas y excluye las formulaciones incoherentes detectadas. */
(gospelEnBankDomains.BATTLE.objetos).forEach(function(item){ ok(typeof item==='string' && item.trim().length>0,'BATTLE contiene entradas no vacías'); });
ok(gospelEnBankDomains.BATTLE.objetos.includes("battle-worn shield held firm against a volley of arrows"),'BATTLE incluye imagen coherente: battle-worn shield held firm against a volley of arrows');
ok(gospelEnBankDomains.BATTLE.objetos.includes("broken yoke lying beside a freed prisoner"),'BATTLE incluye imagen coherente: broken yoke lying beside a freed prisoner');
ok(gospelEnBankDomains.BATTLE.objetos.includes("stone fortress guarding a narrow mountain pass"),'BATTLE incluye imagen coherente: stone fortress guarding a narrow mountain pass');
ok(gospelEnBankDomains.BATTLE.objetos.includes("shield raised by a soldier beneath a banner of hope"),'BATTLE incluye imagen coherente: shield raised by a soldier beneath a banner of hope');
ok(gospelEnBankDomains.BATTLE.objetos.includes("arrow aimed at a clearly marked target"),'BATTLE incluye imagen coherente: arrow aimed at a clearly marked target');
ok(gospelEnBankDomains.BATTLE.objetos.includes("watchtower overlooking a guarded city"),'BATTLE incluye imagen coherente: watchtower overlooking a guarded city');
ok(gospelEnBankDomains.BATTLE.objetos.includes("sword being sharpened against a whetstone"),'BATTLE incluye imagen coherente: sword being sharpened against a whetstone');
ok(gospelEnBankDomains.BATTLE.objetos.includes("shield held before a soldier in the storm"),'BATTLE incluye imagen coherente: shield held before a soldier in the storm');
ok(gospelEnBankDomains.BATTLE.objetos.includes("arrow striking the center of a target"),'BATTLE incluye imagen coherente: arrow striking the center of a target');
ok(gospelEnBankDomains.BATTLE.objetos.includes("stone wall reinforced with timber beams"),'BATTLE incluye imagen coherente: stone wall reinforced with timber beams');
(gospelEnBankDomains.PROCESS.objetos).forEach(function(item){ ok(typeof item==='string' && item.trim().length>0,'PROCESS contiene entradas no vacías'); });
ok(gospelEnBankDomains.PROCESS.objetos.includes("footprints crossing a long stretch of desert"),'PROCESS incluye imagen coherente: footprints crossing a long stretch of desert');
ok(gospelEnBankDomains.PROCESS.objetos.includes("seedling pushing through cracked earth"),'PROCESS incluye imagen coherente: seedling pushing through cracked earth');
ok(gospelEnBankDomains.PROCESS.objetos.includes("small flame catching on a dry branch"),'PROCESS incluye imagen coherente: small flame catching on a dry branch');
ok(gospelEnBankDomains.PROCESS.objetos.includes("hands resting open beside a winding road"),'PROCESS incluye imagen coherente: hands resting open beside a winding road');
ok(gospelEnBankDomains.PROCESS.objetos.includes("silhouette of a traveler beneath the last light of dusk"),'PROCESS incluye imagen coherente: silhouette of a traveler beneath the last light of dusk');
ok(gospelEnBankDomains.PROCESS.objetos.includes("long shadow stretching across a sundial at sunset"),'PROCESS incluye imagen coherente: long shadow stretching across a sundial at sunset');
ok(gospelEnBankDomains.PROCESS.objetos.includes("stone bridge anchored by solid piers"),'PROCESS incluye imagen coherente: stone bridge anchored by solid piers');
ok(gospelEnBankDomains.PROCESS.objetos.includes("open journal beside a completed milestone"),'PROCESS incluye imagen coherente: open journal beside a completed milestone');
(gospelEnBankDomains.GROWTH.objetos).forEach(function(item){ ok(typeof item==='string' && item.trim().length>0,'GROWTH contiene entradas no vacías'); });
ok(gospelEnBankDomains.GROWTH.objetos.includes("open hands scattering seed across dark soil"),'GROWTH incluye imagen coherente: open hands scattering seed across dark soil');
ok(gospelEnBankDomains.GROWTH.objetos.includes("young plant leaning toward a shaft of sunlight"),'GROWTH incluye imagen coherente: young plant leaning toward a shaft of sunlight');
ok(gospelEnBankDomains.GROWTH.objetos.includes("tree roots spreading through a visible cutaway of earth"),'GROWTH incluye imagen coherente: tree roots spreading through a visible cutaway of earth');
ok(gospelEnBankDomains.GROWTH.objetos.includes("flower opening in the morning light"),'GROWTH incluye imagen coherente: flower opening in the morning light');
ok(gospelEnBankDomains.GROWTH.objetos.includes("tree root winding around a stone"),'GROWTH incluye imagen coherente: tree root winding around a stone');
ok(gospelEnBankDomains.GROWTH.objetos.includes("new branch extending from a mature tree"),'GROWTH incluye imagen coherente: new branch extending from a mature tree');
ok(gospelEnBankDomains.GROWTH.objetos.includes("fresh leaf unfolding toward the sun"),'GROWTH incluye imagen coherente: fresh leaf unfolding toward the sun');
ok(gospelEnBankDomains.GROWTH.objetos.includes("two seedlings growing at different paces in one field"),'GROWTH incluye imagen coherente: two seedlings growing at different paces in one field');
(gospelEnBankDomains.COVENANT.objetos).forEach(function(item){ ok(typeof item==='string' && item.trim().length>0,'COVENANT contiene entradas no vacías'); });
ok(gospelEnBankDomains.COVENANT.objetos.includes("sealed scroll resting beside a memorial stone"),'COVENANT incluye imagen coherente: sealed scroll resting beside a memorial stone');
ok(gospelEnBankDomains.COVENANT.objetos.includes("wax seal pressed firmly into warm red wax"),'COVENANT incluye imagen coherente: wax seal pressed firmly into warm red wax');
ok(gospelEnBankDomains.COVENANT.objetos.includes("hands clasped above an open covenant document"),'COVENANT incluye imagen coherente: hands clasped above an open covenant document');
ok(gospelEnBankDomains.COVENANT.objetos.includes("wooden cross standing beside an open covenant scroll"),'COVENANT incluye imagen coherente: wooden cross standing beside an open covenant scroll');
ok(gospelEnBankDomains.COVENANT.objetos.includes("two witnesses standing beside a signed covenant"),'COVENANT incluye imagen coherente: two witnesses standing beside a signed covenant');
ok(gospelEnBankDomains.COVENANT.objetos.includes("rainbow arching over a landscape after rain"),'COVENANT incluye imagen coherente: rainbow arching over a landscape after rain');
ok(gospelEnBankDomains.COVENANT.objetos.includes("wax seal beside a clay water jar"),'COVENANT incluye imagen coherente: wax seal beside a clay water jar');
ok(gospelEnBankDomains.COVENANT.objetos.includes("open doorway with a key resting on the threshold"),'COVENANT incluye imagen coherente: open doorway with a key resting on the threshold');
(gospelEnBankDomains.IDENTITY.objetos).forEach(function(item){ ok(typeof item==='string' && item.trim().length>0,'IDENTITY contiene entradas no vacías'); });
ok(gospelEnBankDomains.IDENTITY.objetos.includes("new name engraved on a small white stone"),'IDENTITY incluye imagen coherente: new name engraved on a small white stone');
ok(gospelEnBankDomains.IDENTITY.objetos.includes("clean robe laid out beside worn garments"),'IDENTITY incluye imagen coherente: clean robe laid out beside worn garments');
ok(gospelEnBankDomains.IDENTITY.objetos.includes("small footprints leading toward a welcoming home"),'IDENTITY incluye imagen coherente: small footprints leading toward a welcoming home');
ok(gospelEnBankDomains.IDENTITY.objetos.includes("family home with its doorway restored"),'IDENTITY incluye imagen coherente: family home with its doorway restored');
ok(gospelEnBankDomains.IDENTITY.objetos.includes("portrait illuminated by morning light"),'IDENTITY incluye imagen coherente: portrait illuminated by morning light');
ok(gospelEnBankDomains.IDENTITY.objetos.includes("loose robe draped over a wooden chair"),'IDENTITY incluye imagen coherente: loose robe draped over a wooden chair');
ok(gospelEnBankDomains.IDENTITY.objetos.includes("family home standing on a firm foundation"),'IDENTITY incluye imagen coherente: family home standing on a firm foundation');
ok(gospelEnBankDomains.IDENTITY.objetos.includes("family tree carved into a wooden panel"),'IDENTITY incluye imagen coherente: family tree carved into a wooden panel');
(gospelEnBankDomains.REST.objetos).forEach(function(item){ ok(typeof item==='string' && item.trim().length>0,'REST contiene entradas no vacías'); });
ok(gospelEnBankDomains.REST.objetos.includes("empty wooden chair beside a quiet window"),'REST incluye imagen coherente: empty wooden chair beside a quiet window');
ok(gospelEnBankDomains.REST.objetos.includes("tree casting shade over a resting traveler"),'REST incluye imagen coherente: tree casting shade over a resting traveler');
ok(gospelEnBankDomains.REST.objetos.includes("wooden yoke resting beside a quiet stream"),'REST incluye imagen coherente: wooden yoke resting beside a quiet stream');
ok(gospelEnBankDomains.REST.objetos.includes("moonlit landscape beneath a field of stars"),'REST incluye imagen coherente: moonlit landscape beneath a field of stars');
ok(gospelEnBankDomains.REST.objetos.includes("quiet chair set apart in a peaceful room"),'REST incluye imagen coherente: quiet chair set apart in a peaceful room');
ok(gospelEnBankDomains.REST.objetos.includes("work yoke laid down beside a field"),'REST incluye imagen coherente: work yoke laid down beside a field');
ok(gospelEnBankDomains.REST.objetos.includes("simple bed beneath a cool linen blanket"),'REST incluye imagen coherente: simple bed beneath a cool linen blanket');
ok(gospelEnBankDomains.REST.objetos.includes("open room with a single chair and soft morning light"),'REST incluye imagen coherente: open room with a single chair and soft morning light');
(gospelEnBankDomains.CROSS.objetos).forEach(function(item){ ok(typeof item==='string' && item.trim().length>0,'CROSS contiene entradas no vacías'); });
ok(gospelEnBankDomains.CROSS.objetos.includes("wooden cross standing beside the open tomb"),'CROSS incluye imagen coherente: wooden cross standing beside the open tomb');
ok(gospelEnBankDomains.CROSS.objetos.includes("hill of Calvary beneath the first light of dawn"),'CROSS incluye imagen coherente: hill of Calvary beneath the first light of dawn');
ok(gospelEnBankDomains.CROSS.objetos.includes("old iron key resting beside an open tomb entrance"),'CROSS incluye imagen coherente: old iron key resting beside an open tomb entrance');
ok(gospelEnBankDomains.CROSS.objetos.includes("stone rolled away from the entrance of an empty tomb"),'CROSS incluye imagen coherente: stone rolled away from the entrance of an empty tomb');
ok(gospelEnBankDomains.CROSS.objetos.includes("open tomb carved into a rocky hillside"),'CROSS incluye imagen coherente: open tomb carved into a rocky hillside');
ok(gospelEnBankDomains.CROSS.objetos.includes("clear stream flowing past a wooden cross"),'CROSS incluye imagen coherente: clear stream flowing past a wooden cross');
ok(gospelEnBankDomains.CROSS.objetos.includes("rough wooden cross silhouetted against sunrise"),'CROSS incluye imagen coherente: rough wooden cross silhouetted against sunrise');
ok(gospelEnBankDomains.CROSS.objetos.includes("empty tomb with folded burial cloth inside"),'CROSS incluye imagen coherente: empty tomb with folded burial cloth inside');
(gospelEnBankDomains.KINGDOM.objetos).forEach(function(item){ ok(typeof item==='string' && item.trim().length>0,'KINGDOM contiene entradas no vacías'); });
ok(gospelEnBankDomains.KINGDOM.objetos.includes("open city gates welcoming travelers from every road"),'KINGDOM incluye imagen coherente: open city gates welcoming travelers from every road');
ok(gospelEnBankDomains.KINGDOM.objetos.includes("open scroll beside balanced scales"),'KINGDOM incluye imagen coherente: open scroll beside balanced scales');
ok(gospelEnBankDomains.KINGDOM.objetos.includes("royal throne beneath a simple crown"),'KINGDOM incluye imagen coherente: royal throne beneath a simple crown');
ok(gospelEnBankDomains.KINGDOM.objetos.includes("open palace doorway with a welcoming table beyond"),'KINGDOM incluye imagen coherente: open palace doorway with a welcoming table beyond');
ok(gospelEnBankDomains.KINGDOM.objetos.includes("wide city square with open gates"),'KINGDOM incluye imagen coherente: wide city square with open gates');
ok(gospelEnBankDomains.KINGDOM.objetos.includes("crown resting beside a servant's towel"),'KINGDOM incluye imagen coherente: crown resting beside a servant's towel');
ok(gospelEnBankDomains.KINGDOM.objetos.includes("royal banner held above a gathered crowd"),'KINGDOM incluye imagen coherente: royal banner held above a gathered crowd');
ok(gospelEnBankDomains.KINGDOM.objetos.includes("wide field with workers gathering the harvest"),'KINGDOM incluye imagen coherente: wide field with workers gathering the harvest');
(gospelEnBankDomains.PERSON.objetos).forEach(function(item){ ok(typeof item==='string' && item.trim().length>0,'PERSON contiene entradas no vacías'); });
ok(gospelEnBankDomains.PERSON.objetos.includes("friend helping another traveler stand"),'PERSON incluye imagen coherente: friend helping another traveler stand');
ok(gospelEnBankDomains.PERSON.objetos.includes("shepherd searching a rocky hillside for a lost sheep"),'PERSON incluye imagen coherente: shepherd searching a rocky hillside for a lost sheep');
ok(gospelEnBankDomains.PERSON.objetos.includes("fisher rowing toward the shore at sunrise"),'PERSON incluye imagen coherente: fisher rowing toward the shore at sunrise');
ok(gospelEnBankDomains.PERSON.objetos.includes("dusty road leading toward a distant village"),'PERSON incluye imagen coherente: dusty road leading toward a distant village');
ok(gospelEnBankDomains.PERSON.objetos.includes("fisher casting a net from a wooden boat"),'PERSON incluye imagen coherente: fisher casting a net from a wooden boat');
ok(gospelEnBankDomains.PERSON.objetos.includes("shepherd carrying a lamb across his shoulders"),'PERSON incluye imagen coherente: shepherd carrying a lamb across his shoulders');
ok(gospelEnBankDomains.PERSON.objetos.includes("teacher speaking to listeners gathered around an open scroll"),'PERSON incluye imagen coherente: teacher speaking to listeners gathered around an open scroll');
ok(gospelEnBankDomains.PERSON.objetos.includes("two friends speaking beside a quiet road"),'PERSON incluye imagen coherente: two friends speaking beside a quiet road');
(gospelEnBankDomains.PLACE.objetos).forEach(function(item){ ok(typeof item==='string' && item.trim().length>0,'PLACE contiene entradas no vacías'); });
ok(gospelEnBankDomains.PLACE.objetos.includes("rocky mountain path marked by travelers' footprints"),'PLACE incluye imagen coherente: rocky mountain path marked by travelers' footprints');
ok(gospelEnBankDomains.PLACE.objetos.includes("Jordan River flowing between green banks"),'PLACE incluye imagen coherente: Jordan River flowing between green banks');
ok(gospelEnBankDomains.PLACE.objetos.includes("quiet garden with an ancient stone path"),'PLACE incluye imagen coherente: quiet garden with an ancient stone path');
ok(gospelEnBankDomains.PLACE.objetos.includes("humble house with an open doorway"),'PLACE incluye imagen coherente: humble house with an open doorway');
ok(gospelEnBankDomains.PLACE.objetos.includes("shoreline marked by footprints beside a fishing boat"),'PLACE incluye imagen coherente: shoreline marked by footprints beside a fishing boat');
ok(gospelEnBankDomains.PLACE.objetos.includes("wide valley opening beneath a mountain ridge"),'PLACE incluye imagen coherente: wide valley opening beneath a mountain ridge');
ok(gospelEnBankDomains.PLACE.objetos.includes("steep mountain trail leading toward a bright summit"),'PLACE incluye imagen coherente: steep mountain trail leading toward a bright summit');
ok(gospelEnBankDomains.PLACE.objetos.includes("ancient village square with a stone well"),'PLACE incluye imagen coherente: ancient village square with a stone well');
(gospelEnBankDomains.SYMBOL.objetos).forEach(function(item){ ok(typeof item==='string' && item.trim().length>0,'SYMBOL contiene entradas no vacías'); });
ok(gospelEnBankDomains.SYMBOL.objetos.includes("small fish symbol carved into a stone"),'SYMBOL incluye imagen coherente: small fish symbol carved into a stone');
ok(gospelEnBankDomains.SYMBOL.objetos.includes("iron anchor resting firmly on a rocky seabed"),'SYMBOL incluye imagen coherente: iron anchor resting firmly on a rocky seabed');
ok(gospelEnBankDomains.SYMBOL.objetos.includes("loaf of bread divided among gathered hands"),'SYMBOL incluye imagen coherente: loaf of bread divided among gathered hands');
ok(gospelEnBankDomains.SYMBOL.objetos.includes("banner hanging from a pole above a stone courtyard"),'SYMBOL incluye imagen coherente: banner hanging from a pole above a stone courtyard');
ok(gospelEnBankDomains.SYMBOL.objetos.includes("watchful eye motif engraved on a small seal"),'SYMBOL incluye imagen coherente: watchful eye motif engraved on a small seal');
ok(gospelEnBankDomains.SYMBOL.objetos.includes("fish-shaped emblem carved into a river stone"),'SYMBOL incluye imagen coherente: fish-shaped emblem carved into a river stone');
ok(gospelEnBankDomains.SYMBOL.objetos.includes("torch burning in a wall-mounted iron holder"),'SYMBOL incluye imagen coherente: torch burning in a wall-mounted iron holder');
ok(gospelEnBankDomains.SYMBOL.objetos.includes("open sea viewed from the bow of a wooden boat"),'SYMBOL incluye imagen coherente: open sea viewed from the bow of a wooden boat');
ok(gospelEnBankDomains.SYMBOL.objetos.includes("fish symbol carved into a round wooden token"),'SYMBOL incluye imagen coherente: fish symbol carved into a round wooden token');
ok(gospelEnBankDomains.SYMBOL.objetos.includes("wax seal pressed into a parchment document"),'SYMBOL incluye imagen coherente: wax seal pressed into a parchment document');
(gospelEnBankDomains.WORSHIP.objetos).forEach(function(item){ ok(typeof item==='string' && item.trim().length>0,'WORSHIP contiene entradas no vacías'); });
ok(gospelEnBankDomains.WORSHIP.objetos.includes("choir gathered before an open Bible"),'WORSHIP incluye imagen coherente: choir gathered before an open Bible');
ok(gospelEnBankDomains.WORSHIP.objetos.includes("person kneeling in prayer beside a simple wooden cross"),'WORSHIP incluye imagen coherente: person kneeling in prayer beside a simple wooden cross');
ok(gospelEnBankDomains.WORSHIP.objetos.includes("open hymnbook resting on a wooden music stand"),'WORSHIP incluye imagen coherente: open hymnbook resting on a wooden music stand');
ok(gospelEnBankDomains.WORSHIP.objetos.includes("congregation raising hands in reverent praise"),'WORSHIP incluye imagen coherente: congregation raising hands in reverent praise');
ok(gospelEnBankDomains.WORSHIP.objetos.includes("church congregation gathered for a thanksgiving service"),'WORSHIP incluye imagen coherente: church congregation gathered for a thanksgiving service');
ok(gospelEnBankDomains.WORSHIP.objetos.includes("choir singing beneath the wooden beams of a chapel"),'WORSHIP incluye imagen coherente: choir singing beneath the wooden beams of a chapel');
ok(gospelEnBankDomains.WORSHIP.objetos.includes("hymnbook open beside a candlelit lectern"),'WORSHIP incluye imagen coherente: hymnbook open beside a candlelit lectern');
ok(gospelEnBankDomains.WORSHIP.objetos.includes("small choir singing from a shared songbook"),'WORSHIP incluye imagen coherente: small choir singing from a shared songbook');
ok(gospelEnBankDomains.WORSHIP.objetos.includes("open psalter beside a simple cross"),'WORSHIP incluye imagen coherente: open psalter beside a simple cross');
ok(gospelEnBankDomains.WORSHIP.objetos.includes("congregation gathered around a table of thanksgiving"),'WORSHIP incluye imagen coherente: congregation gathered around a table of thanksgiving');
ok(gospelEnBankDomains.WORSHIP.objetos.includes("worshippers gathered in quiet prayer"),'WORSHIP incluye imagen coherente: worshippers gathered in quiet prayer');
ok(gospelEnBankDomains.WORSHIP.objetos.includes("raised hands silhouetted before a cross"),'WORSHIP incluye imagen coherente: raised hands silhouetted before a cross');
ok(!gospelEnBankDomains.BATTLE.objetos.includes("shield that renews itself with the fighter faith"),'BATTLE no conserva formulación incoherente: shield that renews itself with the fighter faith');
ok(!gospelEnBankDomains.BATTLE.objetos.includes("yoke that crushes itself without force"),'BATTLE no conserva formulación incoherente: yoke that crushes itself without force');
ok(!gospelEnBankDomains.BATTLE.objetos.includes("valley that becomes a fortress by walking"),'BATTLE no conserva formulación incoherente: valley that becomes a fortress by walking');
ok(!gospelEnBankDomains.BATTLE.objetos.includes("shield that rises on its own at the promise"),'BATTLE no conserva formulación incoherente: shield that rises on its own at the promise');
ok(!gospelEnBankDomains.BATTLE.objetos.includes("arrow that veers alone toward truth"),'BATTLE no conserva formulación incoherente: arrow that veers alone toward truth');
ok(!gospelEnBankDomains.BATTLE.objetos.includes("fence that rises with every prayer"),'BATTLE no conserva formulación incoherente: fence that rises with every prayer');
ok(!gospelEnBankDomains.BATTLE.objetos.includes("sword that sharpens itself with the truth"),'BATTLE no conserva formulación incoherente: sword that sharpens itself with the truth');
ok(!gospelEnBankDomains.BATTLE.objetos.includes("shield that rises with the promise"),'BATTLE no conserva formulación incoherente: shield that rises with the promise');
ok(!gospelEnBankDomains.BATTLE.objetos.includes("arrow that veers toward truth"),'BATTLE no conserva formulación incoherente: arrow that veers toward truth');
ok(!gospelEnBankDomains.BATTLE.objetos.includes("fence that rises with prayer"),'BATTLE no conserva formulación incoherente: fence that rises with prayer');
ok(!gospelEnBankDomains.PROCESS.objetos.includes("firm step over coals that do not burn faith"),'PROCESS no conserva formulación incoherente: firm step over coals that do not burn faith');
ok(!gospelEnBankDomains.PROCESS.objetos.includes("soil opening without breaking the surface"),'PROCESS no conserva formulación incoherente: soil opening without breaking the surface');
ok(!gospelEnBankDomains.PROCESS.objetos.includes("flame kindling without calling and smoking in silence"),'PROCESS no conserva formulación incoherente: flame kindling without calling and smoking in silence');
ok(!gospelEnBankDomains.PROCESS.objetos.includes("hand that does not take the wheel"),'PROCESS no conserva formulación incoherente: hand that does not take the wheel');
ok(!gospelEnBankDomains.PROCESS.objetos.includes("shadow that stays when the lamp goes out"),'PROCESS no conserva formulación incoherente: shadow that stays when the lamp goes out');
ok(!gospelEnBankDomains.PROCESS.objetos.includes("shadow that does not move with the sun"),'PROCESS no conserva formulación incoherente: shadow that does not move with the sun');
ok(!gospelEnBankDomains.PROCESS.objetos.includes("bridge that stands without supports"),'PROCESS no conserva formulación incoherente: bridge that stands without supports');
ok(!gospelEnBankDomains.PROCESS.objetos.includes("voice that does not repeat what is known"),'PROCESS no conserva formulación incoherente: voice that does not repeat what is known');
ok(!gospelEnBankDomains.GROWTH.objetos.includes("hand opening without letting go what gives"),'GROWTH no conserva formulación incoherente: hand opening without letting go what gives');
ok(!gospelEnBankDomains.GROWTH.objetos.includes("light growing without anyone watching"),'GROWTH no conserva formulación incoherente: light growing without anyone watching');
ok(!gospelEnBankDomains.GROWTH.objetos.includes("root extending without breaking the soil"),'GROWTH no conserva formulación incoherente: root extending without breaking the soil');
ok(!gospelEnBankDomains.GROWTH.objetos.includes("flower opening without the sun asking"),'GROWTH no conserva formulación incoherente: flower opening without the sun asking');
ok(!gospelEnBankDomains.GROWTH.objetos.includes("root that does not fight the rock"),'GROWTH no conserva formulación incoherente: root that does not fight the rock');
ok(!gospelEnBankDomains.GROWTH.objetos.includes("branch that grows without leaving its shade"),'GROWTH no conserva formulación incoherente: branch that grows without leaving its shade');
ok(!gospelEnBankDomains.GROWTH.objetos.includes("leaf that opens without fleeing the light"),'GROWTH no conserva formulación incoherente: leaf that opens without fleeing the light');
ok(!gospelEnBankDomains.GROWTH.objetos.includes("seed that does not compare with the neighbor"),'GROWTH no conserva formulación incoherente: seed that does not compare with the neighbor');
ok(!gospelEnBankDomains.COVENANT.objetos.includes("promise that keeps itself without anyone remembering"),'COVENANT no conserva formulación incoherente: promise that keeps itself without anyone remembering');
ok(!gospelEnBankDomains.COVENANT.objetos.includes("seal that does not break though it heats"),'COVENANT no conserva formulación incoherente: seal that does not break though it heats');
ok(!gospelEnBankDomains.COVENANT.objetos.includes("covenant renewing with every tear"),'COVENANT no conserva formulación incoherente: covenant renewing with every tear');
ok(!gospelEnBankDomains.COVENANT.objetos.includes("alliance that cannot be understood without blood"),'COVENANT no conserva formulación incoherente: alliance that cannot be understood without blood');
ok(!gospelEnBankDomains.COVENANT.objetos.includes("oath not repeated with words"),'COVENANT no conserva formulación incoherente: oath not repeated with words');
ok(!gospelEnBankDomains.COVENANT.objetos.includes("rainbow that does not become promise again"),'COVENANT no conserva formulación incoherente: rainbow that does not become promise again');
ok(!gospelEnBankDomains.COVENANT.objetos.includes("seal that waters without breaking"),'COVENANT no conserva formulación incoherente: seal that waters without breaking');
ok(!gospelEnBankDomains.COVENANT.objetos.includes("door that opens without key because it entered"),'COVENANT no conserva formulación incoherente: door that opens without key because it entered');
ok(!gospelEnBankDomains.IDENTITY.objetos.includes("name that pronounces itself in silence"),'IDENTITY no conserva formulación incoherente: name that pronounces itself in silence');
ok(!gospelEnBankDomains.IDENTITY.objetos.includes("robe fitting the body by itself"),'IDENTITY no conserva formulación incoherente: robe fitting the body by itself');
ok(!gospelEnBankDomains.IDENTITY.objetos.includes("footprint that does not compare with the Father"),'IDENTITY no conserva formulación incoherente: footprint that does not compare with the Father');
ok(!gospelEnBankDomains.IDENTITY.objetos.includes("house that is not rebuilt without knowing the intent"),'IDENTITY no conserva formulación incoherente: house that is not rebuilt without knowing the intent');
ok(!gospelEnBankDomains.IDENTITY.objetos.includes("face that does not erase with doubt"),'IDENTITY no conserva formulación incoherente: face that does not erase with doubt');
ok(!gospelEnBankDomains.IDENTITY.objetos.includes("robe that does not tighten with more cloth"),'IDENTITY no conserva formulación incoherente: robe that does not tighten with more cloth');
ok(!gospelEnBankDomains.IDENTITY.objetos.includes("house not rebuilt without intent"),'IDENTITY no conserva formulación incoherente: house not rebuilt without intent');
ok(!gospelEnBankDomains.IDENTITY.objetos.includes("lineage that is not bought with gold"),'IDENTITY no conserva formulación incoherente: lineage that is not bought with gold');
ok(!gospelEnBankDomains.REST.objetos.includes("chair that does not weigh though it is occupied"),'REST no conserva formulación incoherente: chair that does not weigh though it is occupied');
ok(!gospelEnBankDomains.REST.objetos.includes("shadow that does not move when sun passes"),'REST no conserva formulación incoherente: shadow that does not move when sun passes');
ok(!gospelEnBankDomains.REST.objetos.includes("yoke that loosens by itself with Christ"),'REST no conserva formulación incoherente: yoke that loosens by itself with Christ');
ok(!gospelEnBankDomains.REST.objetos.includes("night that is not measured by day"),'REST no conserva formulación incoherente: night that is not measured by day');
ok(!gospelEnBankDomains.REST.objetos.includes("chair that does not move with the crowd"),'REST no conserva formulación incoherente: chair that does not move with the crowd');
ok(!gospelEnBankDomains.REST.objetos.includes("yoke that is not eased with tears"),'REST no conserva formulación incoherente: yoke that is not eased with tears');
ok(!gospelEnBankDomains.REST.objetos.includes("bed that is not measured with heat"),'REST no conserva formulación incoherente: bed that is not measured with heat');
ok(!gospelEnBankDomains.REST.objetos.includes("silence that is not filled with words"),'REST no conserva formulación incoherente: silence that is not filled with words');
ok(!gospelEnBankDomains.CROSS.objetos.includes("cross that is not touched because it is empty"),'CROSS no conserva formulación incoherente: cross that is not touched because it is empty');
ok(!gospelEnBankDomains.CROSS.objetos.includes("calvary that has no height because He rose"),'CROSS no conserva formulación incoherente: calvary that has no height because He rose');
ok(!gospelEnBankDomains.CROSS.objetos.includes("key that opens by itself without lock"),'CROSS no conserva formulación incoherente: key that opens by itself without lock');
ok(!gospelEnBankDomains.CROSS.objetos.includes("tomb that opens by itself without key"),'CROSS no conserva formulación incoherente: tomb that opens by itself without key');
ok(!gospelEnBankDomains.CROSS.objetos.includes("tomb that does not turn to stone without cross"),'CROSS no conserva formulación incoherente: tomb that does not turn to stone without cross');
ok(!gospelEnBankDomains.CROSS.objetos.includes("river that does not cool with the name"),'CROSS no conserva formulación incoherente: river that does not cool with the name');
ok(!gospelEnBankDomains.CROSS.objetos.includes("beam that is not touched because it is empty"),'CROSS no conserva formulación incoherente: beam that is not touched because it is empty');
ok(!gospelEnBankDomains.CROSS.objetos.includes("resurrection that is not celebrated without body"),'CROSS no conserva formulación incoherente: resurrection that is not celebrated without body');
ok(!gospelEnBankDomains.KINGDOM.objetos.includes("city that has no walls because it does not need them"),'KINGDOM no conserva formulación incoherente: city that has no walls because it does not need them');
ok(!gospelEnBankDomains.KINGDOM.objetos.includes("law that is not remembered because it is kept"),'KINGDOM no conserva formulación incoherente: law that is not remembered because it is kept');
ok(!gospelEnBankDomains.KINGDOM.objetos.includes("throne that is not touched because it belongs to the Father"),'KINGDOM no conserva formulación incoherente: throne that is not touched because it belongs to the Father');
ok(!gospelEnBankDomains.KINGDOM.objetos.includes("door that does not close because it is not needed"),'KINGDOM no conserva formulación incoherente: door that does not close because it is not needed');
ok(!gospelEnBankDomains.KINGDOM.objetos.includes("city that is not lengthened with walls"),'KINGDOM no conserva formulación incoherente: city that is not lengthened with walls');
ok(!gospelEnBankDomains.KINGDOM.objetos.includes("king that is not crowned with more thorns"),'KINGDOM no conserva formulación incoherente: king that is not crowned with more thorns');
ok(!gospelEnBankDomains.KINGDOM.objetos.includes("banner that is not changed with wind"),'KINGDOM no conserva formulación incoherente: banner that is not changed with wind');
ok(!gospelEnBankDomains.KINGDOM.objetos.includes("field that is not extended with shade"),'KINGDOM no conserva formulación incoherente: field that is not extended with shade');
ok(!gospelEnBankDomains.PERSON.objetos.includes("friend that does not carry the weight of the other"),'PERSON no conserva formulación incoherente: friend that does not carry the weight of the other');
ok(!gospelEnBankDomains.PERSON.objetos.includes("shepherd that does not seek because he finds"),'PERSON no conserva formulación incoherente: shepherd that does not seek because he finds');
ok(!gospelEnBankDomains.PERSON.objetos.includes("fisher that does not row because the sea obeys"),'PERSON no conserva formulación incoherente: fisher that does not row because the sea obeys');
ok(!gospelEnBankDomains.PERSON.objetos.includes("path that is not repeated because it already was"),'PERSON no conserva formulación incoherente: path that is not repeated because it already was');
ok(!gospelEnBankDomains.PERSON.objetos.includes("fisher that does not cast again without asking"),'PERSON no conserva formulación incoherente: fisher that does not cast again without asking');
ok(!gospelEnBankDomains.PERSON.objetos.includes("shepherd that does not carry because he has none"),'PERSON no conserva formulación incoherente: shepherd that does not carry because he has none');
ok(!gospelEnBankDomains.PERSON.objetos.includes("teacher that does not teach without looking"),'PERSON no conserva formulación incoherente: teacher that does not teach without looking');
ok(!gospelEnBankDomains.PERSON.objetos.includes("friend that does not speak without believing"),'PERSON no conserva formulación incoherente: friend that does not speak without believing');
ok(!gospelEnBankDomains.PLACE.objetos.includes("mount that is not climbed without leaving a mark"),'PLACE no conserva formulación incoherente: mount that is not climbed without leaving a mark');
ok(!gospelEnBankDomains.PLACE.objetos.includes("river that does not forget when passing"),'PLACE no conserva formulación incoherente: river that does not forget when passing');
ok(!gospelEnBankDomains.PLACE.objetos.includes("sacred place that does not forget when leaving"),'PLACE no conserva formulación incoherente: sacred place that does not forget when leaving');
ok(!gospelEnBankDomains.PLACE.objetos.includes("house that is not forgotten when moving"),'PLACE no conserva formulación incoherente: house that is not forgotten when moving');
ok(!gospelEnBankDomains.PLACE.objetos.includes("shore that is not forgotten when crossing"),'PLACE no conserva formulación incoherente: shore that is not forgotten when crossing');
ok(!gospelEnBankDomains.PLACE.objetos.includes("valley that is not forgotten when arriving"),'PLACE no conserva formulación incoherente: valley that is not forgotten when arriving');
ok(!gospelEnBankDomains.PLACE.objetos.includes("mount that is not promised before climbing"),'PLACE no conserva formulación incoherente: mount that is not promised before climbing');
ok(!gospelEnBankDomains.PLACE.objetos.includes("square that is not forgotten with time"),'PLACE no conserva formulación incoherente: square that is not forgotten with time');
ok(!gospelEnBankDomains.SYMBOL.objetos.includes("fish that swims alone without net"),'SYMBOL no conserva formulación incoherente: fish that swims alone without net');
ok(!gospelEnBankDomains.SYMBOL.objetos.includes("anchor that hooks without weight"),'SYMBOL no conserva formulación incoherente: anchor that hooks without weight');
ok(!gospelEnBankDomains.SYMBOL.objetos.includes("bread that is broken without sharing"),'SYMBOL no conserva formulación incoherente: bread that is broken without sharing');
ok(!gospelEnBankDomains.SYMBOL.objetos.includes("flag that waves without wind"),'SYMBOL no conserva formulación incoherente: flag that waves without wind');
ok(!gospelEnBankDomains.SYMBOL.objetos.includes("eye that does not close with the secret"),'SYMBOL no conserva formulación incoherente: eye that does not close with the secret');
ok(!gospelEnBankDomains.SYMBOL.objetos.includes("fish eye that is not covered with water"),'SYMBOL no conserva formulación incoherente: fish eye that is not covered with water');
ok(!gospelEnBankDomains.SYMBOL.objetos.includes("torch that does not light with fingers"),'SYMBOL no conserva formulación incoherente: torch that does not light with fingers');
ok(!gospelEnBankDomains.SYMBOL.objetos.includes("sea that does not become a map"),'SYMBOL no conserva formulación incoherente: sea that does not become a map');
ok(!gospelEnBankDomains.SYMBOL.objetos.includes("fish eye not covered with water"),'SYMBOL no conserva formulación incoherente: fish eye not covered with water');
ok(!gospelEnBankDomains.SYMBOL.objetos.includes("seal not erased with time"),'SYMBOL no conserva formulación incoherente: seal not erased with time');
ok(!gospelEnBankDomains.WORSHIP.objetos.includes("choir that does not sing without voice"),'WORSHIP no conserva formulación incoherente: choir that does not sing without voice');
ok(!gospelEnBankDomains.WORSHIP.objetos.includes("prayer that is not lifted without faith"),'WORSHIP no conserva formulación incoherente: prayer that is not lifted without faith');
ok(!gospelEnBankDomains.WORSHIP.objetos.includes("hymn that is not sung without love"),'WORSHIP no conserva formulación incoherente: hymn that is not sung without love');
ok(!gospelEnBankDomains.WORSHIP.objetos.includes("praise that is not made without presence"),'WORSHIP no conserva formulación incoherente: praise that is not made without presence');
ok(!gospelEnBankDomains.WORSHIP.objetos.includes("cult that is not celebrated without gratitude"),'WORSHIP no conserva formulación incoherente: cult that is not celebrated without gratitude');
ok(!gospelEnBankDomains.WORSHIP.objetos.includes("praise that does not echo without love"),'WORSHIP no conserva formulación incoherente: praise that does not echo without love');
ok(!gospelEnBankDomains.WORSHIP.objetos.includes("hymn that does not move without heart"),'WORSHIP no conserva formulación incoherente: hymn that does not move without heart');
ok(!gospelEnBankDomains.WORSHIP.objetos.includes("chorus that does not sing without breath"),'WORSHIP no conserva formulación incoherente: chorus that does not sing without breath');
ok(!gospelEnBankDomains.WORSHIP.objetos.includes("psalm that does not bow without God"),'WORSHIP no conserva formulación incoherente: psalm that does not bow without God');
ok(!gospelEnBankDomains.WORSHIP.objetos.includes("cult that does not burn without gratitude"),'WORSHIP no conserva formulación incoherente: cult that does not burn without gratitude');
ok(!gospelEnBankDomains.WORSHIP.objetos.includes("worship that does not stop with haste"),'WORSHIP no conserva formulación incoherente: worship that does not stop with haste');
ok(!gospelEnBankDomains.WORSHIP.objetos.includes("praise that does not shake the altar"),'WORSHIP no conserva formulación incoherente: praise that does not shake the altar');

/* El catálogo de un mercado Gospel nunca debe caer silenciosamente en el otro. */
const savedGospelEnDomains=window.GOSPEL_DOMINIOS_EN;
window.GOSPEL_DOMINIOS_EN=undefined;
ok(Object.keys(getDominiosGospel('gospel_en')).length===0,'Gospel EN sin catálogo no hereda dominios Gospel ES');
const isolatedGospelEnCatalog={TEST:{label:'Test EN'}};
window.GOSPEL_DOMINIOS_EN=isolatedGospelEnCatalog;
ok(getDominiosGospel('gospel_en')===isolatedGospelEnCatalog,'Gospel EN recupera exclusivamente su catálogo');
window.GOSPEL_DOMINIOS_EN=savedGospelEnDomains;
ok(Object.keys(getDominiosGospel('unknown_market')).length===0,'mercado desconocido no recibe catálogo Gospel ES');
console.log((failures.length?'FAIL':'PASS')+' secular-prompt-contract ('+checks+' assertions, '+failures.length+' failures)');
failures.forEach(x=>console.error(' - '+x));
process.exit(failures.length?1:0);
