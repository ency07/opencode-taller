/* Fuente: feat/ui-ux-layout-p4-motores-gospel-secular. Adaptación segura: catálogo aislado, sin globals ni colisiones con data-estilos.js. */
(function (root) {
  'use strict';
  /**
   * SHARED INFRASTRUCTURE — Neutral shared infrastructure
   * P4 (Plan creativo): solo infraestructura neutral, compartible entre Gospel y Secular.
   * NO contiene reglas creativas de ningún motor.
   * 
   * Compartido:
   * - Productos (data-productos.js)
   * - Métodos de impresión
   * - Exportación/importación (memoria-local.js, sync-supabase.js)
   * - UI base (styles.css, index.html, PODNav)
   * - Utilidades (pod-nav.js, dominios.js)
   */
  
  'use strict';
  
  /* --- Productos compartidos (referencia a data-productos.js) --- */
  const SHARED_PRODUCTS = {
    'CAMISETA SOFT': { category: 'apparel', printMethods: ['DTF', 'DTG', 'sublimacion'] },
    'MOCHILA': { category: 'accessory', printMethods: ['DTF', 'sublimacion'] },
    'FUNDA': { category: 'accessory', printMethods: ['DTF'] }
  };
  
  /* --- Métodos de impresión compartidos --- */
  const SHARED_PRINT_METHODS = ['DTF', 'DTG', 'sublimacion', 'vinilo', 'bordado'];
  
  /* --- Exportación/importación compartida (referencia a memoria-local.js) --- */
  const SHARED_STORAGE_PREFIX = 'POD2|';
  
  /* --- UI base compartida --- */
  const SHARED_UI = {
    nav: 'PODNav',
    styles: 'styles.css',
    theme: 'dark'
  };
  
  /* --- Utilidades compartidas --- */
  const SHARED_UTILS = ['pod-nav.js', 'dominios.js'];
  
  
  const api = { SHARED_PRODUCTS, SHARED_PRINT_METHODS, SHARED_STORAGE_PREFIX, SHARED_UI, SHARED_UTILS };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) {
    root.PODCreativeCatalogs = root.PODCreativeCatalogs || {};
    root.PODCreativeCatalogs.sharedInfra = api;
  }
})(typeof window !== 'undefined' ? window : null);
