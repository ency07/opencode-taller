'use strict';
const assert = require('node:assert/strict');
const intel = require('../js/inteligencia-mercado.js');

const now = Date.parse('2026-11-16T12:00:00Z');
function evidence(signal, overrides) {
  return Object.assign({
    market: 'global_en', region: 'us', language: 'en', marketplace: 'Etsy',
    product: 'T-shirt', keyword: 'faith shirt', signal: signal,
    source: 'Example provider', sourceUrl: 'https://example.com/report',
    retrievedAt: '2026-11-15T12:00:00Z', value: 100, unit: 'records',
    period: 'last_30_days'
  }, overrides || {});
}

assert.equal(intel.validateEvidence(evidence('demand'), now).valid, true);
assert.ok(intel.validateEvidence(evidence('demand', { sourceUrl: 'http://example.com' }), now).errors.includes('invalid_source_url'));
assert.ok(intel.validateEvidence(evidence('demand', { retrievedAt: '2026-09-01T00:00:00Z' }), now).errors.includes('stale_evidence'));
assert.ok(intel.validateEvidence(evidence('demand', { value: -1 }), now).errors.includes('invalid_value'));

const incomplete = intel.assessCommercialSaturation([evidence('demand'), evidence('competition')], { now });
assert.equal(incomplete.status, 'insufficient');
assert.deepEqual(incomplete.missingSignals, ['trend']);

const complete = intel.assessCommercialSaturation([
  evidence('demand'), evidence('competition'), evidence('trend')
], { now });
assert.equal(complete.status, 'evidence_available');
assert.equal(complete.reason, 'human_interpretation_required');
assert.match(complete.disclaimer, /No se calcula un score/);

const mixed = intel.assessCommercialSaturation([
  evidence('demand'), evidence('competition', { marketplace: 'Redbubble' })
], { now });
assert.equal(mixed.status, 'insufficient');
assert.equal(mixed.reason, 'mixed_market_cohorts');

const invalidOnly = intel.assessCommercialSaturation([
  evidence('demand', { sourceUrl: 'javascript:alert(1)' })
], { now });
assert.equal(invalidOnly.status, 'insufficient');
assert.equal(invalidOnly.reason, 'no_valid_evidence');

console.log('PASS market-intelligence-contract: provenance, freshness and cohort isolation');
