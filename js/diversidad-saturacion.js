/* Motor de diversidad aislado: requiere alternativas explícitas; no altera globals. */
(function (root) {
  /**
   * DIVERSIDAD Y SATURACIÓN — Reglas de distribución de tratamientos.
   * La redistribución requiere un catálogo explícito de alternativas válidas.
   * Sin alternativas no se inventan ni sustituyen estilos.
   */
  'use strict';
  const SATURACION_UMBRAL = 0.4;
  const DISTRIBUCION_ESTILOS = {
    1: ['HEAVY'],
    2: ['HEAVY', 'SOFT'],
    3: ['HEAVY', 'SOFT', 'MODERN'],
    4: ['HEAVY', 'SOFT', 'MODERN', 'SOFT'],
    5: ['HEAVY', 'SOFT', 'MODERN', 'SOFT', 'HEAVY'],
    6: ['HEAVY', 'SOFT', 'MODERN', 'HEAVY', 'SOFT', 'MODERN']
  };
  function contarEstilos(styles) {
    const counts = {};
    (Array.isArray(styles) ? styles : []).forEach(function (style) {
      counts[style] = (counts[style] || 0) + 1;
    });
    return counts;
  }
  function estaSaturado(styles, umbral) {
    if (!Array.isArray(styles) || styles.length < 2) return false;
    const limit = Number.isFinite(umbral) ? umbral : SATURACION_UMBRAL;
    if (limit <= 0 || limit > 1) return false;
    const counts = contarEstilos(styles);
    return Object.keys(counts).some(function (style) {
      return counts[style] / styles.length > limit;
    });
  }
  /**
   * Redistribuye solo si se proporcionan alternativas permitidas.
   * Mantiene longitud y orden; devuelve copia. Si no hay solución válida,
   * conserva el set original para no introducir estilos no autorizados.
   */
  function aplicarDiversidad(styles, umbral, alternativas) {
    if (!Array.isArray(styles) || styles.length < 2) return Array.isArray(styles) ? styles.slice() : [];
    const limit = Number.isFinite(umbral) ? umbral : SATURACION_UMBRAL;
    if (limit <= 0 || limit > 1) return styles.slice();
    const allowed = Array.isArray(alternativas) ? Array.from(new Set(alternativas.filter(Boolean))) : [];
    if (allowed.length < 2) return styles.slice();
    const result = styles.slice();
    const maxAllowed = Math.max(1, Math.floor(result.length * limit));
    let counts = contarEstilos(result);
    let guard = result.length * allowed.length;
    while (guard-- > 0) {
      const over = Object.keys(counts).filter(function (style) { return counts[style] > maxAllowed; });
      if (!over.length) break;
      const source = over.sort(function (a, b) { return counts[b] - counts[a]; })[0];
      const target = allowed
        .filter(function (style) { return style !== source && (counts[style] || 0) < maxAllowed; })
        .sort(function (a, b) { return (counts[a] || 0) - (counts[b] || 0); })[0];
      if (!target) break;
      const index = result.lastIndexOf(source);
      if (index < 0) break;
      result[index] = target;
      counts = contarEstilos(result);
    }
    return result;
  }
  
  const api = { SATURACION_UMBRAL, DISTRIBUCION_ESTILOS, aplicarDiversidad, estaSaturado, contarEstilos };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) {
    root.PODCreativeCatalogs = root.PODCreativeCatalogs || {};
    root.PODCreativeCatalogs.diversity = api;
  }
})(typeof window !== 'undefined' ? window : null);
