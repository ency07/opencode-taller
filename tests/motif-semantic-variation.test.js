'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ROOT = path.join(__dirname, '..');
global.window = global;
global.document = { getElementById: function () { return null; }, querySelectorAll: function () { return []; } };
const JS = path.join(ROOT, 'js');
['data-mercados.js', 'data-audiencias.js', 'data-bancos.js', 'banco-gospel-es.js', 'data-estilos.js', 'dominios.js', 'data-productos.js', 'memoria-local.js', 'motor-nucleo.js']
  .forEach(function (file) { vm.runInThisContext(fs.readFileSync(path.join(JS, file), 'utf8'), { filename: file }); });

const concept = 'La gracia, la fe, el amor y la fuerza de Cristo están presentes incluso en la debilidad.';
const candidates = [
  'vasija de barro que se deja moldear en el torno',
  'puente en construcción que une lo que se creía roto',
  'raíz profunda que sostiene árbol en tormenta',
  'lámpara que arde en la noche más oscura',
  'escudo de la fe que apaga dardos encendidos',
  'coro en silueta cantando frente a la cruz vacía'
];
const ranked = _rankCompatibleMotifs(candidates, concept);
if (ranked.length < 3) throw new Error('El concepto abstracto debe encontrar al menos tres metáforas concretas por relación semántica.');
if (!ranked.some(function (x) { return /vasija|puente|raiz/i.test(x); })) throw new Error('El ranking debe recuperar motivos de sostén/fractura aunque no repitan las palabras del concepto.');
if (ranked.some(function (x) { return /cruz vacia|escudo de la fe/i.test(x); })) throw new Error('No debe preferir símbolos cristianos genéricos solo por el nicho o la palabra fe.');
const realGospelProcessMotifs = _rankCompatibleMotifs(GOSPEL_DOMINIOS_ES.PROCESS.objetos, concept).slice(0, 3);
if (realGospelProcessMotifs.length !== 3 || !realGospelProcessMotifs.some(function (x) { return /vasija de barro/i.test(x); })
  || !realGospelProcessMotifs.some(function (x) { return /puente en construcci.n/i.test(x); })) {
  throw new Error('El concepto de prueba debe recuperar metáforas pertinentes del banco real de Gospel/Proceso.');
}

MOTOR_STATE.motifVariationMode = 'distinct';
MOTOR_STATE.motifRerollNonce = 0;
const varied = _planExploreMotifs(candidates, candidates, concept, concept, '', '');
if (new Set(varied.list.slice(0, 3)).size !== 3) throw new Error('La exploración debe ofrecer tres motivos diferentes cuando hay candidatos compatibles.');
MOTOR_STATE.motifVariationMode = 'same';
const same = _planExploreMotifs(candidates, candidates, concept, concept, '', '');
if (same.list.length !== 1) throw new Error('El selector “Mantener el mismo objeto” debe producir un solo motivo para A/B/C.');
MOTOR_STATE.motifRerollNonce = 1;
const rotatedSame = _planExploreMotifs(candidates, candidates, concept, concept, '', '');
if (rotatedSame.list[0] === same.list[0]) throw new Error('En modo de objeto compartido, rotar debe cambiar el motivo común del siguiente set.');
MOTOR_STATE.motifVariationMode = 'distinct';
MOTOR_STATE.motifRerollNonce = 1;
const rotated = _planExploreMotifs(candidates, candidates, concept, concept, '', '');
if (rotated.list[0] === varied.list[0]) throw new Error('“Proponer otros objetos” debe rotar el orden de las propuestas semánticamente compatibles.');
MOTOR_STATE.approvedMotifMaster = 'vasija de barro seleccionada por la persona usuaria';
if (_effectiveMotifVariationMode() !== 'same' || _planExploreMotifs(candidates, candidates, concept, concept, '', MOTOR_STATE.approvedMotifMaster).list.length !== 1) {
  throw new Error('Un objeto escrito manualmente debe fijarse en A/B/C aunque el modo anterior fuera variar.');
}
MOTOR_STATE.approvedMotifMaster = '';
Object.assign(MOTOR_STATE, { market: 'gospel_es', region: 'universal', product: 'CAMISETA SOFT', subniche: 'gospel_es', workflowMode: 'explore', concept: concept, message: 'Su gracia es suficiente para mí', support: 'Cuando soy débil, entonces soy fuerte', audienceSet: 'Auto', audienceMulti: 'si', groupMode: 'distintos' });
MOTOR_STATE.explorationBrief = _resolveExplorationBrief();
const generatedSet = buildCandidate(resolveAudiences());
if (new Set(['A', 'B', 'C'].map(function (k) { return generatedSet[k].objeto; })).size !== 3) throw new Error('La generación debe asignar tres motivos distintos del banco a la prueba real.');
const generatedPrompt = formatPrompt({ set: generatedSet, score: scoreSet(generatedSet), passed: false, explorationBrief: MOTOR_STATE.explorationBrief, objectConflicts: [] });
if (!generatedPrompt.includes('Su gracia es suficiente para mí') || !generatedPrompt.includes('Cuando soy débil, entonces soy fuerte')) {
  throw new Error('El flujo de exploración debe preservar literalmente el mensaje y el apoyo de la prueba.');
}
if (!['A', 'B', 'C'].every(function (k) { return generatedPrompt.includes(generatedSet[k].objeto); })) throw new Error('El prompt final debe fijar el objeto seleccionado para cada ficha.');
const repeatedSet = JSON.parse(JSON.stringify(generatedSet));
repeatedSet.B.objeto = repeatedSet.A.objeto;
repeatedSet.C.objeto = repeatedSet.A.objeto;
if (!evaluaSetOk(repeatedSet).detalle.some(function (detail) { return detail.indexOf('motivos relacionados repetidos') !== -1; })) {
  throw new Error('El control de calidad debe señalar si la variación seleccionada termina repitiendo el objeto.');
}
const source = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
if (!source.includes('id="motifVariationMode"') || !source.includes('id="btnChangeMotifs"')) throw new Error('La vista debe exponer los controles para variar y rotar el objeto.');
console.log('PASS motif-semantic-variation (selección semántica, diversidad, fijación y rotación)');
