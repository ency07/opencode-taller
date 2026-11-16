'use strict';

/* Integración de similitud de metadatos con el historial propio por mercado/producto. */
const fs=require('fs');
const path=require('path');
const vm=require('vm');
const root=path.join(__dirname,'..');
const store=Object.create(null);
global.localStorage={
  setItem:function(k,v){store[k]=String(v);this[k]=String(v);},
  getItem:function(k){return Object.prototype.hasOwnProperty.call(store,k)?store[k]:null;},
  removeItem:function(k){delete store[k];delete this[k];}
};
global.window=global;
const gate={innerHTML:''};
global.document={getElementById:function(id){return id==='gate'?gate:null;},querySelectorAll:function(){return [];}};
const js=path.join(root,'js');
['data-mercados.js','data-audiencias.js','data-bancos.js','data-estilos.js','dominios.js','data-productos.js','data-territorios.js','memoria-local.js','diversidad-saturacion.js','motor-nucleo.js']
 .forEach(function(f){vm.runInThisContext(fs.readFileSync(path.join(js,f),'utf8'),{filename:f});});

MOTOR_STATE.market='global_en';
MOTOR_STATE.region='global';
MOTOR_STATE.product='CAMISETA SOFT';
MOTOR_STATE.concept='A lighthouse standing through a storm';
MOTOR_STATE.message='Keep the light';
MOTOR_STATE.serie='';
MOTOR_STATE._generationId='current-generation';
const card={
  objeto:'lighthouse',
  formaSimbolo:'vertical lighthouse silhouette with beam',
  layout:'Emblema circular',
  jerarquiaVisual:'OBJETO_DOMINANTE',
  integracionTexto:'text below symbol',
  distribucionTexto:'centered text',
  familiaColor:'navy cream gold',
  paleta:'navy cream gold',
  estilo:'Grabado / Linóleo',
  tratamiento:'HEAVY: bold ink',
  tipografia:'Serif clásica titulada'
};
clearPatternMemory(memPatternMarket(),MOTOR_STATE.product);
recordPattern(card,memPatternMarket(),MOTOR_STATE.product,{
  serie:'previous-series',
  generationId:'previous-generation',
  similarityRecord:_similarityRecordForCard(card)
});
const conflict=_findCreativeSimilarityConflicts(card);
if(!conflict.available) throw new Error('El detector de metadatos no está disponible');
if(conflict.compared!==1) throw new Error('Debe comparar un registro histórico, obtuvo '+conflict.compared);
if(conflict.alerts.length!==1) throw new Error('Debe detectar una coincidencia alta, obtuvo '+conflict.alerts.length);
if(conflict.alerts[0].similarity.basis!=='metadata_only') throw new Error('La alerta debe declarar que solo compara metadatos');

clearPatternMemory(memPatternMarket(),MOTOR_STATE.product);
MOTOR_STATE.serie='same-series';
recordPattern(card,memPatternMarket(),MOTOR_STATE.product,{
  serie:'same-series',
  generationId:'older-generation',
  similarityRecord:_similarityRecordForCard(card)
});
const sameSeries=_findCreativeSimilarityConflicts(card);
if(sameSeries.compared!==0 || sameSeries.alerts.length!==0) throw new Error('La coherencia intencional de una misma serie no debe generar alerta');

clearPatternMemory(memPatternMarket(),MOTOR_STATE.product);
MOTOR_STATE.serie='';
recordPattern(card,memPatternMarket(),MOTOR_STATE.product,{
  serie:'other-series',
  generationId:'current-generation',
  similarityRecord:_similarityRecordForCard(card)
});
const sameGeneration=_findCreativeSimilarityConflicts(card);
if(sameGeneration.compared!==0) throw new Error('Las fichas de la misma generación no deben compararse entre sí');

clearPatternMemory(memPatternMarket(),MOTOR_STATE.product);
recordPattern(card,memPatternMarket(),MOTOR_STATE.product,{serie:'legacy-series'});
const legacy=_findCreativeSimilarityConflicts(card);
if(legacy.alerts.length!==1) throw new Error('El historial antiguo debe seguir siendo comparable con sus ejes visuales disponibles');

LAST_RESULT={similarityAudit:{basis:'metadata_only',available:true,compared:1,alerts:[{card:'A',similarity:{overall:0.9,axes:{symbol:1,composition:1,phrase:0.8}}}]}};
renderGates({score:{
  diversity:90,fitAudienciaMin:90,fitProductoMin:90,estilos:['a','b','c'],
  symbolStable:true,treatmentsComplete:true,familias:['x','y','z']
}});
if(gate.innerHTML.indexOf('Similitud interna: 1 alerta(s)')===-1) throw new Error('La alerta debe aparecer en el panel de gates');
if(gate.innerHTML.indexOf('no analiza imágenes finales')===-1) throw new Error('La interfaz debe declarar que no compara imágenes');

console.log('PASS similarity-history-integration (8 assertions, 0 failures; metadata only).');
