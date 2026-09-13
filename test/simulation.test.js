const test = require('node:test');
const assert = require('node:assert/strict');
const { createRequest, buildPlans, approveRequest, runSimulation } = require('../server/store');

test('simulation requires preview and approval before execution', () => {
  const request = createRequest({ city: 'San Francisco', need: 'food support' });
  assert.throws(() => runSimulation(request), /approved/);
  buildPlans(request);
  assert.throws(() => runSimulation(request), /approved/);
});

test('simulation returns evidence-backed confirmed and unknown outcomes', () => {
  const request = createRequest({ city: 'San Francisco', need: 'food support', timing: 'today' });
  buildPlans(request);
  approveRequest(request);
  const completed = runSimulation(request);
  assert.equal(completed.status, 'completed');
  assert.equal(completed.runs.length, 3);
  assert.ok(completed.runs.some((run) => run.result.callOutcome === 'confirmed'));
  assert.ok(completed.runs.some((run) => run.result.callOutcome === 'unknown'));
  assert.equal(completed.decision.status, 'human_review_required');
  assert.ok(completed.runs.every((run) => run.evidence.length > 0));
});

test('country-only requests still produce simulation plans', () => {
  const request = createRequest({
    country: 'United States',
    need: 'food support',
    timing: 'today',
    language: 'English',
    householdSize: '2'
  });
  const previewed = buildPlans(request);
  assert.equal(previewed.plans.length, 3);
});

test('country-based API requests reject missing required fields', () => {
  assert.throws(
    () => createRequest({ country: 'United States', need: 'food support', timing: 'today', language: 'English' }),
    /householdSize/
  );
});
