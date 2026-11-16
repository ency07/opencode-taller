'use strict';

const assert = require('assert');
const similarity = require('../js/diversidad-saturacion.js');

const same = {
  concept: 'La fidelidad de Dios permanece',
  message: 'Dios permanece fiel',
  symbol: 'ancla de hierro',
  silhouette: 'emblema circular con ancla central',
  composition: 'emblema circular / texto debajo / balanceado',
  palette: 'azul marino crema oro',
  style: 'Grabado / Linóleo',
  treatment: 'HEAVY',
  typography: 'Serif clásica titulada'
};
const identical = similarity.compareCreativeMetadataSimilarity(same, Object.assign({}, same));
assert.strictEqual(identical.basis, 'metadata_only');
assert.strictEqual(identical.overall, 1);
assert.strictEqual(identical.alert, true);
assert.strictEqual(identical.matchedAxes, 8);

const sameIdeaDifferentDesign = similarity.compareCreativeMetadataSimilarity(same, {
  concept: 'La fidelidad de Dios permanece',
  message: 'Dios permanece fiel',
  symbol: 'farol encendido en tormenta',
  silhouette: 'silueta vertical aislada',
  composition: 'diagonal ascendente con texto integrado',
  palette: 'terracota oliva hueso',
  style: 'Acuarela Suelta',
  treatment: 'SOFT',
  typography: 'Sans humanista limpia'
});
assert.ok(sameIdeaDifferentDesign.axes.concept > 0.9);
assert.ok(sameIdeaDifferentDesign.axes.phrase > 0.9);
assert.strictEqual(sameIdeaDifferentDesign.alert, false, 'la coherencia conceptual no debe confundirse con repetición visual');

const repeatedVisualDifferentCopy = similarity.compareCreativeMetadataSimilarity(
  Object.assign({}, same, { concept: 'Mensaje uno', message: 'Frase uno' }),
  Object.assign({}, same, { concept: 'Mensaje dos', message: 'Frase dos' })
);
assert.ok(repeatedVisualDifferentCopy.axes.symbol === 1);
assert.ok(repeatedVisualDifferentCopy.axes.composition === 1);
assert.ok(repeatedVisualDifferentCopy.axes.palette === 1);
assert.strictEqual(repeatedVisualDifferentCopy.alert, true, 'misma estructura/símbolo/paleta con copy distinto debe generar alerta');

const noData = similarity.compareCreativeMetadataSimilarity({}, {});
assert.strictEqual(noData.overall, 0);
assert.strictEqual(noData.alert, false);
assert.strictEqual(noData.basis, 'metadata_only');

const stricter = similarity.compareCreativeMetadataSimilarity(same, same, 1.01);
assert.strictEqual(stricter.alert, false, 'un umbral más alto que 1 no debe disparar alerta');

assert.strictEqual(similarity.normalizeComparableText('Fidelidad — Dios permanece'), 'fidelidad dios permanece');
assert.strictEqual(similarity.tokenSimilarity('La fidelidad permanece', 'Fidelidad permanece'), 1);

console.log('PASS creative-similarity-metadata (14 assertions, 0 failures). Metadata only; image-level similarity is not evaluated.');
