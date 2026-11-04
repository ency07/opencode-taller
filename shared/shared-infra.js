/**
 * SHARED INFRASTRUCTURE — Infraestructura neutral.
 * No contiene reglas creativas de Gospel ni Secular.
 */
'use strict';
const SHARED_PRODUCTS = {
  'CAMISETA SOFT': { category: 'apparel', printMethods: ['DTF', 'DTG', 'sublimacion'] },
  'MOCHILA': { category: 'accessory', printMethods: ['DTF', 'sublimacion'] },
  'FUNDA': { category: 'accessory', printMethods: ['DTF'] }
};
const SHARED_PRINT_METHODS = ['DTF', 'DTG', 'sublimacion', 'vinilo', 'bordado'];
const SHARED_STORAGE_PREFIX = 'POD2|';
const SHARED_UI = { nav: 'PODNav', styles: 'styles.css', theme: 'dark' };
const SHARED_UTILS = ['pod-nav.js', 'dominios.js'];
if (typeof module !== 'undefined' && module.exports) module.exports = { SHARED_PRODUCTS, SHARED_PRINT_METHODS, SHARED_STORAGE_PREFIX, SHARED_UI, SHARED_UTILS };
