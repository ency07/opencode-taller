'use strict';

/* Las compatibilidades territoriales deben influir como sesgo suave, no como filtro de estilos. */
const fs=require('fs');
const path=require('path');
const vm=require('vm');
const root=path.join(__dirname,'..');
let checks=0;const failures=[];
function ok(v,m){checks++;if(!v)failures.push(m);}
global.window=global;
global.document={getElementById:function(){return null;},querySelectorAll:function(){return [];}};
const js=path.join(root,'js');
['data-mercados.js','data-audiencias.js','data-bancos.js','data-estilos.js','dominios.js','data-productos.js','data-territorios.js','memoria-local.js','motor-nucleo.js']
 .forEach(function(f){vm.runInThisContext(fs.readFileSync(path.join(js,f),'utf8'),{filename:f});});

MOTOR_STATE.market='global_en';
MOTOR_STATE.region='global';
MOTOR_STATE.product='CAMISETA SOFT';
MOTOR_STATE.subniche='auto';
MOTOR_STATE.groupMode='distintos';
MOTOR_STATE.aestheticPreference='auto';
MOTOR_STATE.concept='territory-style-bias';
MOTOR_STATE.message='';
const territoryId='SARCASM_HUMOR';
const compatible=(POD_CREATIVE_TERRITORIES[territoryId]||{}).compatibleStyles||[];
ok(compatible.length>=5,'el territorio de prueba debe declarar estilos compatibles');
const fullPool=_styleCandidatesForContext();
ok(_territoryStyleFilter(fullPool).length===fullPool.length,'el territorio no debe recortar el catálogo');
ok(compatible.every(function(s){return fullPool.indexOf(s)!==-1;}),'todos los estilos compatibles deben seguir en el catálogo');

function sample(territory){
  MOTOR_STATE.creativeTerritory=territory;
  const key=memKey(['styleRecentSets',MOTOR_STATE.market,MOTOR_STATE.region,MOTOR_STATE.product]);
  setJSON(key,[]);
  const counts=Object.create(null);let outside=0;const total=450*3;
  for(let i=0;i<450;i++){
    MOTOR_STATE.concept='territory-style-bias-'+i;
    MOTOR_STATE._rerollNonce=i;
    const result=resolveEstilos({A:'unisex_nacional',B:'unisex_nacional',C:'unisex_nacional'});
    ['A','B','C'].forEach(function(k){
      const style=result[k];counts[style]=(counts[style]||0)+1;
      if(compatible.indexOf(style)===-1)outside++;
    });
  }
  const matching=Object.keys(counts).reduce(function(sum,style){return sum+(compatible.indexOf(style)!==-1?counts[style]:0);},0);
  return {share:matching/total,outside:outside,counts:counts};
}
const baseline=sample('auto');
const biased=sample(territoryId);
ok(biased.share>baseline.share,'los estilos compatibles deben aumentar su peso automático ('+baseline.share.toFixed(3)+' → '+biased.share.toFixed(3)+')');
ok(biased.outside>0,'el territorio no debe excluir estilos no listados como compatibles');

console.log((failures.length?'FAIL':'PASS')+' territory-style-bias ('+checks+' assertions, '+failures.length+' failures)');
failures.forEach(function(x){console.error(' - '+x);});
process.exit(failures.length?1:0);
