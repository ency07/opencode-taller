/**
 * DIVERSIDAD Y SATURACIÓN — Reglas cualitativas y cuantitativas
 * P5 (Plan creativo): distribuir estilos para evitar repetición excesiva.
 * No se importa en motor-nucleo.js todavía (eso es P6+).
 */

'use strict';

/* --- Umbral de saturación (porcentaje máximo de un estilo en un set) --- */
const SATURACION_UMBRAL = 0.4; // 40% máximo de un estilo en un set

/* --- Distribución recomendada por número de diseños --- */
const DISTRIBUCION_ESTILOS = {
  1: ['HEAVY'],
  2: ['HEAVY', 'SOFT'],
  3: ['HEAVY', 'SOFT', 'MODERN'],
  4: ['HEAVY', 'SOFT', 'MODERN', 'SOFT'],
  5: ['HEAVY', 'SOFT', 'MODERN', 'SOFT', 'HEAVY'],
  6: ['HEAVY', 'SOFT', 'MODERN', 'HEAVY', 'SOFT', 'MODERN']
};

/* --- Regla de diversidad: si un estilo supera el umbral, forzar alternativas --- */
function aplicarDiversidad(styles, umbral) {
  umbral = umbral || SATURACION_UMBRAL;
  const counts = {};
  styles.forEach(function (s) { counts[s] = (counts[s] || 0) + 1; });
  const maxCount = Math.max.apply(null, Object.values(counts));
  const total = styles.length;
  const maxAllowed = Math.ceil(total * umbral);
  if (maxCount <= maxAllowed) return styles.slice();
  // Forzar redistribución: reemplazar excesos con el estilo menos usado
  const leastUsed = Object.keys(counts).reduce(function (a, b) { return counts[a] <= counts[b] ? a : b; });
  const result = styles.slice();
  let replaced = 0;
  for (let i = 0; i < result.length && replaced < (maxCount - maxAllowed); i++) {
    if (result[i] === Object.keys(counts).find(function (k) { return counts[k] === maxCount; }) && replaced < (maxCount - maxAllowed)) {
      result[i] = leastUsed;
      replaced++;
    }
  }
  return result;
}

/* --- Verificar si un set está saturado --- */
function estaSaturado(styles, umbral) {
  umbral = umbral || SATURACION_UMBRAL;
  const counts = {};
  styles.forEach(function (s) { counts[s] = (counts[s] || 0) + 1; });
  return Object.values(counts).some(function (c) { return c / styles.length > umbral; });
}

/* --- Contador de estilos por colección --- */
function contarEstilos(styles) {
  const counts = {};
  styles.forEach(function (s) { counts[s] = (counts[s] || 0) + 1; });
  return counts;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SATURACION_UMBRAL, DISTRIBUCION_ESTILOS, aplicarDiversidad, estaSaturado, contarEstilos };
}
if (typeof window !== 'undefined') {
  window.SATURACION_UMBRAL = SATURACION_UMBRAL;
  window.DISTRIBUCION_ESTILOS = DISTRIBUCION_ESTILOS;
  window.aplicarDiversidad = aplicarDiversidad;
  window.estaSaturado = estaSaturado;
  window.contarEstilos = contarEstilos;
}
