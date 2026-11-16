'use strict';

/* RT-MI-01 — Contrato de evidencia para inteligencia comercial.
   No consulta proveedores ni inventa métricas: normaliza evidencia externa
   verificable y separa saturación comercial de repetición creativa. */
(function (root) {
  const REQUIRED = ['market', 'region', 'language', 'marketplace', 'product', 'keyword'];
  const SIGNALS = ['demand', 'competition', 'trend'];

  function clean(value) {
    return String(value == null ? '' : value).trim();
  }

  function validHttpsUrl(value) {
    try { return new URL(value).protocol === 'https:'; }
    catch (_) { return false; }
  }

  function validateEvidence(record, now) {
    const errors = [];
    const item = record && typeof record === 'object' ? record : {};
    REQUIRED.forEach(function (key) {
      if (!clean(item[key])) errors.push('missing_' + key);
    });
    if (!SIGNALS.includes(item.signal)) errors.push('invalid_signal');
    if (!clean(item.source)) errors.push('missing_source');
    if (!validHttpsUrl(item.sourceUrl)) errors.push('invalid_source_url');
    if (!clean(item.retrievedAt) || !Number.isFinite(Date.parse(item.retrievedAt))) {
      errors.push('invalid_retrieved_at');
    } else {
      const age = (Number.isFinite(now) ? now : Date.now()) - Date.parse(item.retrievedAt);
      if (age < -5 * 60 * 1000) errors.push('retrieved_at_in_future');
      if (age > 30 * 86400000) errors.push('stale_evidence');
    }
    if (typeof item.value !== 'number' || !Number.isFinite(item.value) || item.value < 0) {
      errors.push('invalid_value');
    }
    if (!clean(item.unit)) errors.push('missing_unit');
    if (!clean(item.period)) errors.push('missing_period');
    return { valid: errors.length === 0, errors: errors };
  }

  function cohortKey(record) {
    const item = record || {};
    return REQUIRED.map(function (key) { return clean(item[key]).toLowerCase(); }).join('|');
  }

  function assessCommercialSaturation(records, options) {
    const input = Array.isArray(records) ? records : [];
    const now = options && Number.isFinite(options.now) ? options.now : Date.now();
    const valid = [];
    const rejected = [];
    input.forEach(function (record, index) {
      const result = validateEvidence(record, now);
      if (result.valid) valid.push(record);
      else rejected.push({ index: index, errors: result.errors });
    });

    const cohorts = Object.create(null);
    valid.forEach(function (record) {
      const key = cohortKey(record);
      if (!cohorts[key]) cohorts[key] = [];
      cohorts[key].push(record);
    });
    const cohortIds = Object.keys(cohorts);
    if (cohortIds.length !== 1) {
      return {
        status: 'insufficient',
        reason: cohortIds.length > 1 ? 'mixed_market_cohorts' : 'no_valid_evidence',
        cohortCount: cohortIds.length,
        signals: {},
        rejected: rejected
      };
    }

    const cohort = cohorts[cohortIds[0]];
    const bySignal = Object.create(null);
    SIGNALS.forEach(function (signal) { bySignal[signal] = cohort.filter(function (r) { return r.signal === signal; }); });
    const missing = SIGNALS.filter(function (signal) { return bySignal[signal].length === 0; });
    const signals = {};
    SIGNALS.forEach(function (signal) {
      signals[signal] = bySignal[signal].map(function (r) {
        return { value: r.value, unit: r.unit, period: r.period, source: r.source, sourceUrl: r.sourceUrl, retrievedAt: r.retrievedAt };
      });
    });

    return {
      status: missing.length ? 'insufficient' : 'evidence_available',
      reason: missing.length ? 'missing_signals' : 'human_interpretation_required',
      cohort: cohortIds[0],
      missingSignals: missing,
      signals: signals,
      rejected: rejected,
      disclaimer: 'La evidencia disponible no demuestra por sí sola saturación comercial. No se calcula un score ni se infieren ventas.'
    };
  }

  const api = { REQUIRED_FIELDS: REQUIRED.slice(), SIGNALS: SIGNALS.slice(), validateEvidence, cohortKey, assessCommercialSaturation };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) {
    root.PODCreativeCatalogs = root.PODCreativeCatalogs || {};
    root.PODCreativeCatalogs.marketIntelligence = api;
  }
})(typeof window !== 'undefined' ? window : null);
