'use strict';
const assert = require('node:assert/strict');
const diversity = require('../js/diversidad-saturacion.js');

const profiles = ['HEAVY', 'HEAVY', 'HEAVY', 'HEAVY', 'SOFT'];
const allowedProfiles = ['HEAVY', 'SOFT', 'MODERN'];
const balancedProfiles = diversity.redistributeStructuralProfiles(profiles, 0.4, allowedProfiles);
assert.equal(balancedProfiles.length, profiles.length);
assert.equal(diversity.isStructuralProfileSaturated(balancedProfiles, 0.4), false);
assert.deepEqual(diversity.countStructuralProfiles(balancedProfiles), diversity.countValues(balancedProfiles));

const styles = ['Anime / Manga', 'Anime / Manga', 'Anime / Manga', 'Brutalist', 'Risograph'];
const allowedStyles = ['Anime / Manga', 'Brutalist', 'Risograph'];
const balancedStyles = diversity.redistributeVisualStyles(styles, 0.4, allowedStyles);
assert.equal(balancedStyles.length, styles.length);
assert.equal(diversity.isVisualStyleSaturated(balancedStyles, 0.4), false);
assert.ok(balancedStyles.every(value => allowedStyles.includes(value)));

// Los ejes no se mezclan: un catálogo estructural no puede reemplazar estilos.
assert.deepEqual(
  diversity.redistributeVisualStyles(styles, 0.4, allowedProfiles),
  styles
);

// Sin solución completa, conserva el set original.
const impossible = ['HEAVY', 'HEAVY', 'HEAVY', 'HEAVY'];
assert.deepEqual(
  diversity.redistributeStructuralProfiles(impossible, 0.4, ['HEAVY', 'SOFT']),
  impossible
);

// Compatibilidad de API histórica.
assert.deepEqual(diversity.aplicarDiversidad(profiles, 0.4, allowedProfiles), balancedProfiles);
assert.equal(diversity.estaSaturado(balancedProfiles, 0.4), false);

console.log('PASS diversity-contract: structural and visual axes isolated');
