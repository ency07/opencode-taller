/* P5 — Diversidad por eje explícito.
   Este módulo no decide por sí mismo qué dimensión creativa debe redistribuirse.
   El contrato de cada consumidor debe declarar eje, alternativas y umbral.
   Compatibilidad: los nombres históricos se conservan como aliases. */
(function (root) {
  'use strict';

  const SATURATION_THRESHOLD = 0.4;

  function countValues(values) {
    const counts = Object.create(null);
    (Array.isArray(values) ? values : []).forEach(function (value) {
      const key = String(value == null ? '' : value).trim();
      if (key) counts[key] = (counts[key] || 0) + 1;
    });
    return counts;
  }

  function isSaturated(values, threshold) {
    if (!Array.isArray(values) || values.length < 2) return false;
    const limit = Number.isFinite(threshold) ? threshold : SATURATION_THRESHOLD;
    if (limit <= 0 || limit > 1) return false;
    const counts = countValues(values);
    return Object.keys(counts).some(function (key) {
      return counts[key] / values.length > limit;
    });
  }

  function redistribute(values, threshold, alternatives) {
    if (!Array.isArray(values) || values.length < 2) return Array.isArray(values) ? values.slice() : [];
    const limit = Number.isFinite(threshold) ? threshold : SATURATION_THRESHOLD;
    if (limit <= 0 || limit > 1) return values.slice();

    const allowed = Array.isArray(alternatives)
      ? Array.from(new Set(alternatives.map(function (v) { return String(v || '').trim(); }).filter(Boolean)))
      : [];
    if (allowed.length < 2 || values.some(function (v) { return allowed.indexOf(v) === -1; })) return values.slice();

    const maxAllowed = Math.max(1, Math.floor(values.length * limit));
    if (allowed.length * maxAllowed < values.length) return values.slice();

    const result = values.slice();
    let counts = countValues(result);
    let guard = result.length * allowed.length;
    while (guard-- > 0) {
      const over = Object.keys(counts).filter(function (key) { return counts[key] > maxAllowed; });
      if (!over.length) break;
      const source = over.sort(function (a, b) { return counts[b] - counts[a]; })[0];
      const target = allowed
        .filter(function (key) { return key !== source && (counts[key] || 0) < maxAllowed; })
        .sort(function (a, b) { return (counts[a] || 0) - (counts[b] || 0); })[0];
      if (!target) break;
      const index = result.lastIndexOf(source);
      if (index < 0) break;
      result[index] = target;
      counts = countValues(result);
    }
    return result;
  }

  /* Adaptadores con semántica explícita: no mezclar estilos con perfiles. */
  function countStructuralProfiles(values) { return countValues(values); }
  function isStructuralProfileSaturated(values, threshold) { return isSaturated(values, threshold); }
  function redistributeStructuralProfiles(values, threshold, allowedProfiles) {
    return redistribute(values, threshold, allowedProfiles);
  }
  function countVisualStyles(values) { return countValues(values); }
  function isVisualStyleSaturated(values, threshold) { return isSaturated(values, threshold); }
  function redistributeVisualStyles(values, threshold, allowedStyles) {
    return redistribute(values, threshold, allowedStyles);
  }

  const STRUCTURAL_PROFILE_DISTRIBUTION = {
    1: ['HEAVY'],
    2: ['HEAVY', 'SOFT'],
    3: ['HEAVY', 'SOFT', 'MODERN'],
    4: ['HEAVY', 'SOFT', 'MODERN', 'SOFT'],
    5: ['HEAVY', 'SOFT', 'MODERN', 'SOFT', 'HEAVY'],
    6: ['HEAVY', 'SOFT', 'MODERN', 'HEAVY', 'SOFT', 'MODERN']
  };

  const api = {
    SATURATION_THRESHOLD,
    STRUCTURAL_PROFILE_DISTRIBUTION,
    countValues,
    isSaturated,
    redistribute,
    countStructuralProfiles,
    isStructuralProfileSaturated,
    redistributeStructuralProfiles,
    countVisualStyles,
    isVisualStyleSaturated,
    redistributeVisualStyles,
    /* Legacy aliases: their input axis is supplied by the caller. */
    SATURACION_UMBRAL: SATURATION_THRESHOLD,
    DISTRIBUCION_ESTILOS: STRUCTURAL_PROFILE_DISTRIBUTION,
    contarEstilos: countValues,
    estaSaturado: isSaturated,
    aplicarDiversidad: redistribute
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) {
    root.PODCreativeCatalogs = root.PODCreativeCatalogs || {};
    root.PODCreativeCatalogs.diversity = api;
  }
})(typeof window !== 'undefined' ? window : null);
