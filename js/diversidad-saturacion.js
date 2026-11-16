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

  /* Comparación de similitud de metadatos creativos.
     No inspecciona imágenes ni certifica originalidad visual. */
  const SIMILARITY_WEIGHTS = {
    concept: 0.20, phrase: 0.15, symbol: 0.15, silhouette: 0.10,
    composition: 0.15, palette: 0.10, treatment: 0.10, typography: 0.05
  };

  function normalizeComparableText(value) {
    return String(value == null ? '' : value)
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
  }

  function tokenSimilarity(left, right) {
    const a = normalizeComparableText(left);
    const b = normalizeComparableText(right);
    if (!a || !b) return null;
    if (a === b) return 1;
    const aa = new Set(a.split(/\s+/).filter(Boolean));
    const bb = new Set(b.split(/\\s+/).filter(Boolean));
    const intersection = Array.from(aa).filter(function (token) { return bb.has(token); }).length;
    const union = new Set(Array.from(aa).concat(Array.from(bb))).size;
    return union ? intersection / union : 0;
  }

  function compareCreativeMetadataSimilarity(left, right, threshold) {
    left = left || {};
    right = right || {};
    const axes = {
      concept: tokenSimilarity(left.concept, right.concept),
      phrase: tokenSimilarity(left.message, right.message),
      symbol: tokenSimilarity(left.symbol, right.symbol),
      silhouette: tokenSimilarity(left.silhouette, right.silhouette),
      composition: tokenSimilarity(left.composition, right.composition),
      palette: tokenSimilarity(left.palette, right.palette),
      treatment: tokenSimilarity([left.style, left.treatment].filter(Boolean).join(' '), [right.style, right.treatment].filter(Boolean).join(' ')),
      typography: tokenSimilarity(left.typography, right.typography)
    };
    let weighted = 0;
    let totalWeight = 0;
    let matchedAxes = 0;
    Object.keys(SIMILARITY_WEIGHTS).forEach(function (axis) {
      const score = axes[axis];
      if (score === null) return;
      const weight = SIMILARITY_WEIGHTS[axis];
      weighted += score * weight;
      totalWeight += weight;
      if (score >= 0.7) matchedAxes++;
    });
    const overall = totalWeight ? weighted / totalWeight : 0;
    const limit = Number.isFinite(threshold) ? threshold : 0.72;
    const alert = overall >= limit && matchedAxes >= 3 &&
      Math.max(axes.phrase || 0, axes.symbol || 0, axes.composition || 0) >= 0.7;
    return {
      basis: 'metadata_only',
      overall: Number(overall.toFixed(4)),
      axes: axes,
      matchedAxes: matchedAxes,
      threshold: limit,
      alert: alert,
      risk: alert ? 'high' : (overall >= 0.5 ? 'medium' : 'low')
    };
  }

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
    SIMILARITY_WEIGHTS,
    normalizeComparableText,
    tokenSimilarity,
    compareCreativeMetadataSimilarity,
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
