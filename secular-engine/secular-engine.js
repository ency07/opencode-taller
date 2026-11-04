/* Fuente: feat/ui-ux-layout-p4-motores-gospel-secular. Adaptación segura: catálogo aislado, sin globals ni colisiones con data-estilos.js. */
(function (root) {
  'use strict';
  /**
   * SECULAR ENGINE — Motor independiente para mercados no religiosos
   * P4 (Plan creativo): aislado del Gospel Engine. Comparte solo infraestructura neutra (shared/).
   * 
   * Mercados: Streetwear, Sports, Lifestyle, Music, Outdoor, Automotive, Humor, Art, Professional
   * No requiere theologicalBasis. message puede ser secular/comercial.
   * QA comercial (no teológico).
   */
  
  'use strict';
  
  /* --- Mercados seculares soportados --- */
  const SECULAR_MARKETS = [
    'streetwear', 'sports', 'lifestyle', 'music_entertainment', 'nature_outdoor',
    'automotive_industrial', 'humor_pop', 'art_design', 'professional_community'
  ];
  
  /* --- Catálogo de referencias de marcas (benchmarks) --- */
  const SECULAR_BRAND_BENCHMARKS = {
    'streetwear': ['Supreme', 'BAPE', 'Stüssy', 'Palace'],
    'sports': ['Nike', 'Adidas', 'Under Armour'],
    'lifestyle': ['Patagonia', 'Carhartt WIP', 'The North Face'],
    'music_entertainment': ['Supreme', 'BAPE', 'Off-White'],
    'nature_outdoor': ['Patagonia', 'The North Face', 'Arc\'teryx'],
    'automotive_industrial': ['Carhartt WIP', 'Dickies', 'Stanley'],
    'humor_pop': ['Supreme', 'Stüssy', 'BAPE'],
    'art_design': ['Off-White', 'Vetements', 'Balenciaga'],
    'professional_community': ['Carhartt WIP', 'Dickies', 'Patagonia']
  };
  
  /* --- Reglas comerciales (no doctrinales) --- */
  const SECULAR_RULES = {
    noTheologicalBasis: true,  // theologicalBasis es opcional
    messageRequired: true,      // message es obligatorio (comercial)
    qaType: 'commercial',       // QA comercial, no teológico
    restrictions: ['originalidad_visual', 'coherencia_marca', 'legibilidad_texto', 'viabilidad_produccion', 'no_duplicacion_coleccion']
  };
  
  /* --- Función de inicialización del motor secular --- */
  function initSecularEngine(config) {
    config = config || {};
    return {
      market: config.market || 'streetwear',
      language: config.language || 'es',
      product: config.product || 'CAMISETA SOFT',
      decisionMode: config.decisionMode || 'assisted',
      creativeTerritory: config.creativeTerritory || null,
      visualIdentity: config.visualIdentity || null,
      brandBenchmark: SECULAR_BRAND_BENCHMARKS[config.market] || []
    };
  }
  
  
  const api = { SECULAR_MARKETS, SECULAR_BRAND_BENCHMARKS, SECULAR_RULES, initSecularEngine };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) {
    root.PODCreativeCatalogs = root.PODCreativeCatalogs || {};
    root.PODCreativeCatalogs.secularEngine = api;
  }
})(typeof window !== 'undefined' ? window : null);
