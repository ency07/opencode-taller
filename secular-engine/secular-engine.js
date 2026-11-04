/**
 * SECULAR ENGINE — Motor independiente para mercados no religiosos.
 * P4: aislado del Gospel Engine. Comparte solo infraestructura neutral.
 */
'use strict';
const SECULAR_MARKETS = [
  'streetwear', 'sports', 'lifestyle', 'music_entertainment', 'nature_outdoor',
  'automotive_industrial', 'humor_pop', 'art_design', 'professional_community'
];
const SECULAR_BRAND_BENCHMARKS = {
  streetwear: ['Supreme', 'BAPE', 'Stüssy', 'Palace'],
  sports: ['Nike', 'Adidas', 'Under Armour'],
  lifestyle: ['Patagonia', 'Carhartt WIP', 'The North Face'],
  music_entertainment: ['Supreme', 'BAPE', 'Off-White'],
  nature_outdoor: ['Patagonia', 'The North Face', "Arc'teryx"],
  automotive_industrial: ['Carhartt WIP', 'Dickies', 'Stanley'],
  humor_pop: ['Supreme', 'Stüssy', 'BAPE'],
  art_design: ['Off-White', 'Vetements', 'Balenciaga'],
  professional_community: ['Carhartt WIP', 'Dickies', 'Patagonia']
};
const SECULAR_RULES = {
  noTheologicalBasis: true,
  messageRequired: true,
  qaType: 'commercial',
  restrictions: ['originalidad_visual', 'coherencia_marca', 'legibilidad_texto', 'viabilidad_produccion', 'no_duplicacion_coleccion']
};
function initSecularEngine(config) {
  config = config || {};
  const market = SECULAR_MARKETS.includes(config.market) ? config.market : 'streetwear';
  return {
    market,
    language: config.language || 'es',
    product: config.product || 'CAMISETA SOFT',
    decisionMode: config.decisionMode || 'assisted',
    creativeTerritory: config.creativeTerritory || null,
    visualIdentity: config.visualIdentity || null,
    brandBenchmark: SECULAR_BRAND_BENCHMARKS[market].slice()
  };
}
if (typeof module !== 'undefined' && module.exports) module.exports = { SECULAR_MARKETS, SECULAR_BRAND_BENCHMARKS, SECULAR_RULES, initSecularEngine };
