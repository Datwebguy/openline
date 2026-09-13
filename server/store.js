const crypto = require('node:crypto');
const { listProviders, getProvider } = require('./providers');
const { simulateCall } = require('./simulation');
const { runLiveCall } = require('./calle-adapter');

const requests = new Map();

function createRequest(input) {
  const normalized = { ...input };
  const legacyCityRequest = !String(normalized.country ?? '').trim() && String(normalized.city ?? '').trim();
  // `country` is the public form field. Keep the older programmatic shape
  // usable for tests and integrations by deriving safe defaults here; the
  // browser form still requires users to provide every meaningful field.
  if (!String(normalized.city ?? '').trim() && normalized.country) normalized.city = normalized.country;
  if (!String(normalized.country ?? '').trim() && normalized.city) normalized.country = normalized.city;
  if (legacyCityRequest && !String(normalized.timing ?? '').trim()) normalized.timing = 'today';
  if (legacyCityRequest && !String(normalized.language ?? '').trim()) normalized.language = 'English';
  if (legacyCityRequest && !String(normalized.householdSize ?? '').trim()) normalized.householdSize = '1';
  const requiredFields = ['need', 'country', 'timing', 'language', 'householdSize'];
  const missing = requiredFields.filter(field => !String(normalized[field] ?? '').trim());
  if (missing.length) {
    throw new Error(`Please complete: ${missing.join(', ')}.`);
  }

  const householdSize = Number(normalized.householdSize);
  if (!Number.isInteger(householdSize) || householdSize < 1 || householdSize > 100) {
    throw new Error('Household size must be a whole number between 1 and 100.');
  }

  const request = {
    id: `req_${crypto.randomUUID()}`,
    createdAt: new Date().toISOString(),
    status: 'draft',
    country: normalized.country,
    need: normalized.need || 'food support',
    city: normalized.city || normalized.country,
    timing: normalized.timing,
    language: normalized.language,
    accessibility: Array.isArray(normalized.accessibility) ? normalized.accessibility : [],
    householdSize,
    providers: [],
    plans: [],
    runs: [],
    decision: null
  };
  requests.set(request.id, request);
  return request;
}

function getRequest(id) {
  return requests.get(id);
}

function buildPlans(request) {
  // The request form deliberately asks for country, not city. Only apply a
  // city filter to legacy/API callers that explicitly supplied a distinct
  // city; otherwise country-only requests must still produce a plan.
  const cityFilter = request.city && request.city !== request.country ? request.city : undefined;
  const providers = listProviders({ category: 'food-support', city: cityFilter });
  request.providers = providers.map(({ phone, ...publicProvider }) => publicProvider);
  request.plans = providers.map((provider) => ({
    id: `plan_${request.id}_${provider.id}`,
    requestId: request.id,
    providerId: provider.id,
    providerName: provider.name,
    purpose: `Verify whether ${provider.name} can help with ${request.need} ${request.timing}.`,
    questions: [
      'Are you accepting new households?',
      'Are you open during the requested time?',
      'What documents or eligibility requirements apply?',
      `Can you support ${request.language}?`
    ],
    disclosure: 'I am an AI assistant calling on behalf of Openline to verify current service availability.',
    approvalStatus: 'pending'
  }));
  request.status = 'previewed';
  return request;
}

function approveRequest(request) {
  if (!request || request.status !== 'previewed') {
    throw new Error('Request must be previewed before approval.');
  }
  request.status = 'approved';
  request.plans = request.plans.map((plan) => ({ ...plan, approvalStatus: 'approved' }));
  return request;
}

function runSimulation(request) {
  if (!request || request.status !== 'approved') {
    throw new Error('Request must be approved before execution.');
  }
  request.status = 'running';
  request.runs = request.plans.map((plan) => {
    const provider = getProvider(plan.providerId);
    return simulateCall(provider, request);
  });
  request.status = 'completed';
  request.decision = rankResults(request);
  return request;
}

async function runLive(request) {
  if (request.status !== 'approved') {
    throw new Error('Request must be approved before running live calls.');
  }

  request.status = 'running';
  try {
    const configuredProviderId = String(process.env.OPENLINE_LIVE_PROVIDER_ID || '').trim().toLowerCase();
    let livePlans = configuredProviderId
      ? request.plans.filter(plan => String(plan.providerId).trim().toLowerCase() === configuredProviderId)
      : request.plans;

    if (!livePlans.length) {
      livePlans = request.plans.filter(plan => {
        const provider = getProvider(plan.providerId);
        return provider && !/555/.test(String(provider.phone || ''));
      });
    }

    if (!livePlans.length) {
      throw new Error(`No approved provider has a live phone number configured. Available plans: ${request.plans.map(plan => plan.providerId).join(', ')}`);
    }

    request.runs = await Promise.all(livePlans.map(plan => runLiveCall({
      provider: getProvider(plan.providerId),
      request,
      plan
    })));
  } catch (error) {
    request.status = error.code === 'call_not_ready' ? 'blocked' : 'failed';
    request.error = error.message;
    request.errorCode = error.code || null;
    request.errorDetails = error.details || null;
    request.liveCallId = error.callId || null;
    throw error;
  }

  request.status = 'completed';
  request.decision = rankResults(request);
  return request;
}

function rankResults(request) {
  const rank = { confirmed: 3, unavailable: 1, contradictory: 0, voicemail: 0, unknown: 0, failed: 0 };
  const resultFor = (run) => run.result || run;
  const sorted = [...request.runs].sort((a, b) => {
    const resultA = resultFor(a);
    const resultB = resultFor(b);
    const scoreA = rank[resultA.callOutcome] + (resultA.confidence === 'high' ? 1 : 0);
    const scoreB = rank[resultB.callOutcome] + (resultB.confidence === 'high' ? 1 : 0);
    return scoreB - scoreA;
  });
  const best = sorted.find((run) => resultFor(run).callOutcome === 'confirmed');
  return {
    status: best ? 'human_review_required' : 'unresolved',
    recommendedProviderId: best ? best.providerId : null,
    reason: best
      ? 'A provider confirmed current availability. A human must review the evidence before taking the next action.'
      : 'No provider produced a sufficiently supported current availability result.',
    rankedProviderIds: sorted.map((run) => run.providerId)
  };
}

module.exports = { createRequest, getRequest, buildPlans, approveRequest, runSimulation, runLive };
