// Guarded CALL-E integration boundary.
// Simulation remains the default. Live calls require explicit configuration and
// never accept fixture phone numbers.

const fs = require('node:fs');
const TERMINAL_STATUSES = new Set(['completed', 'failed', 'canceled']);

function readApiKey() {
  if (process.env.CALLE_API_KEY) return process.env.CALLE_API_KEY.trim();
  if (!process.env.CALLE_API_KEY_FILE) return '';

  try {
    const raw = fs.readFileSync(process.env.CALLE_API_KEY_FILE, 'utf8').trim();
    try {
      const parsed = JSON.parse(raw);
      const jsonKey = parsed.CALLE_API_KEY || parsed.calle_api_key || parsed.api_key || parsed.token;
      if (jsonKey) return String(jsonKey).trim();
    } catch {}

    const assignment = raw.match(/(?:^|\n)\s*(?:CALLE_API_KEY|API_KEY|TOKEN)\s*[=:]\s*["']?([^"'\r\n]+)["']?/im);
    if (assignment) return assignment[1].trim();

    const labeled = raw.match(/(?:call[- ]?e\s+)?api\s*key\s*[:=]\s*["']?([^"'\r\n]+)["']?/im);
    if (labeled) return labeled[1].trim();

    return raw.split(/\r?\n/).map(line => line.trim()).find(Boolean) || '';
  } catch {
    return '';
  }
}

function getConfig() {
  if (process.env.OPENLINE_MODE !== 'live') {
    throw new Error('Live mode is not enabled. Set OPENLINE_MODE=live to use CALL-E.');
  }

  if (process.env.OPENLINE_LIVE_CONFIRM !== 'true') {
    throw new Error('Live calls require OPENLINE_LIVE_CONFIRM=true.');
  }

  const apiKey = readApiKey();
  if (!apiKey) {
    throw new Error('CALLE_API_KEY is required for live mode.');
  }

  return {
    baseUrl: (process.env.CALLE_BASE_URL || 'https://api.heycall-e.com').replace(/\/$/, ''),
    apiKey,
    pollMs: Number(process.env.CALLE_POLL_MS || 60000),
    timeoutMs: Number(process.env.CALLE_TIMEOUT_MS || 300000),
    httpTimeoutMs: Number(process.env.CALLE_HTTP_TIMEOUT_MS || 30000)
  };
}

function resultSchema() {
  return {
    type: 'object',
    required: [
      'call_outcome',
      'open_today',
      'accepting_request',
      'availability_window',
      'requirements',
      'evidence',
      'confidence',
      'follow_up_needed'
    ],
    properties: {
      call_outcome: {
        type: 'string',
        enum: ['confirmed', 'unavailable', 'voicemail', 'failed', 'contradictory', 'unknown'],
        description: 'Use confirmed only when the call provides clear current evidence. Use unknown when the answer is unclear or the call does not connect.'
      },
      open_today: { type: 'string', enum: ['yes', 'no', 'unknown'] },
      accepting_request: { type: 'string', enum: ['yes', 'no', 'unknown'] },
      availability_window: { type: 'string' },
      requirements: { type: 'array', items: { type: 'string' } },
      evidence: { type: 'array', items: { type: 'string' } },
      confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
      follow_up_needed: { type: 'string', enum: ['yes', 'no'] }
    },
    additionalProperties: false
  };
}

async function callApi(path, options = {}) {
  const config = getConfig();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.httpTimeoutMs);
  let response;
  try {
    response = await fetch(`${config.baseUrl}${path}`, {
      ...options,
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    });
  } finally {
    clearTimeout(timeout);
  }

  const text = await response.text();
  let body;
  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    body = { raw: text };
  }

  if (!response.ok) {
    const detail = body.error || body.message || body.details || text || 'request failed';
    const readable = typeof detail === 'string' ? detail : JSON.stringify(detail);
    const error = new Error(`CALL-E ${response.status}: ${readable}`);
    if (body.error && typeof body.error === 'object') {
      error.code = body.error.code;
      error.details = body.error.details;
    }
    throw error;
  }

  return body;
}

function isFixturePhone(phone) {
  return /555/.test(String(phone || ''));
}

function localeForLanguage(language) {
  const normalized = String(language || '').toLowerCase();
  if (normalized.includes('spanish')) return 'es-US';
  if (normalized.includes('mandarin') || normalized.includes('chinese')) return 'zh-CN';
  if (normalized.includes('hindi')) return 'hi-IN';
  if (normalized.includes('arabic')) return 'ar-AE';
  if (normalized.includes('french')) return 'fr-FR';
  if (normalized.includes('portuguese')) return 'pt-BR';
  if (normalized.includes('german')) return 'de-DE';
  if (normalized.includes('japanese')) return 'ja-JP';
  if (normalized.includes('vietnamese')) return 'vi-VN';
  return 'en-US';
}

// This is the current CALL-E live coverage matrix. Keep the full country
// selector in the product, but never send a known unsupported combination to
// the provider and make the limitation explicit to the user.
const SUPPORTED_REGION_LANGUAGES = {
  US: ['English'],
  SG: ['English'],
  MY: ['English'],
  IN: ['English', 'Hindi'],
  AE: ['English', 'Arabic'],
  AU: ['English'],
  CA: ['English'],
  GB: ['English'],
  VN: ['Vietnamese'],
  DE: ['English', 'German'],
  JP: ['Japanese'],
  FR: ['French'],
  MX: ['Spanish'],
  BR: ['Portuguese'],
  ID: ['English'],
  PH: ['English'],
  KE: ['English']
};

function normalizedLanguage(language) {
  const normalized = String(language || '').toLowerCase();
  if (normalized.includes('spanish')) return 'Spanish';
  if (normalized.includes('hindi')) return 'Hindi';
  if (normalized.includes('arabic')) return 'Arabic';
  if (normalized.includes('french')) return 'French';
  if (normalized.includes('portuguese')) return 'Portuguese';
  if (normalized.includes('german')) return 'German';
  if (normalized.includes('japanese')) return 'Japanese';
  if (normalized.includes('vietnamese')) return 'Vietnamese';
  if (normalized.includes('english')) return 'English';
  return language;
}

function assertSupportedRecipient(request, region, locale) {
  const language = normalizedLanguage(request.language);
  const supported = SUPPORTED_REGION_LANGUAGES[region] || [];
  if (supported.includes(language)) return;

  const error = new Error(
    `CALL-E live calling is not currently available for ${request.country} in ${request.language}. Choose a supported region/language combination or use simulation mode.`
  );
  error.code = 'call_not_ready';
  error.details = {
    region,
    locale,
    requestedLanguage: language,
    supportedLanguages: supported,
    supportedRegions: Object.keys(SUPPORTED_REGION_LANGUAGES)
  };
  throw error;
}

async function createLiveCall({ provider, request, plan }) {
  getConfig();

  if (!provider || !provider.phone) {
    throw new Error('A live call requires a provider phone number.');
  }

  if (isFixturePhone(provider.phone)) {
    throw new Error('Fixture phone numbers cannot be used for live calls.');
  }

  // The CALL-E recipient region must describe the phone being called, not the
  // country where the requester needs help. Never guess it from the request.
  const region = String(provider.region || '').trim().toUpperCase();
  if (!region) {
    const error = new Error('The live recipient region is not configured. Add the recipient country code before enabling live calls.');
    error.code = 'call_not_ready';
    throw error;
  }
  const locale = localeForLanguage(request.language);
  assertSupportedRecipient(request, region, locale);

  const payload = {
    task: [
      plan.disclosure,
      `Purpose: ${plan.purpose}`,
      `Ask these questions: ${plan.questions.join(' ')}`,
      `The caller needs help in ${request.city || 'the requested area'} for ${request.timing || 'the requested time'}.`,
      `Preferred language: ${request.language || 'English'}.`,
      'Do not make a booking, purchase, payment, reservation, or other commitment.',
      'Return the structured result only after the call has ended.'
    ].join('\n'),
    recipients: [{
      phones: [provider.phone],
      region,
      locale
    }],
    result_schema: {
      type: 'object',
      required: ['completed_count'],
      properties: {
        completed_count: {
          type: 'integer',
          description: 'Number of recipients with a clear confirmed result.'
        }
      },
      additionalProperties: false
    },
    recipient_result_schema: resultSchema(),
    metadata: {
      openline_request_id: request.id,
      openline_provider_id: provider.id
    }
  };

  return callApi('/v1/calls', {
    method: 'POST',
    headers: {
      'Idempotency-Key': `openline_${request.id}_${provider.id}`
    },
    body: JSON.stringify(payload)
  });
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitForLiveCall(call) {
  const config = getConfig();
  const callId = call.id || call.call_id;
  if (!callId) throw new Error('CALL-E did not return a call id.');

  let current = call;
  const startedAt = Date.now();

  while (!TERMINAL_STATUSES.has(current.status)) {
    if (Date.now() - startedAt >= config.timeoutMs) {
      throw new Error(`CALL-E call ${callId} timed out.`);
    }

    await sleep(config.pollMs);
    current = await callApi(`/v1/calls/${encodeURIComponent(callId)}`);
  }

  return current;
}

function normalizeResult(call, provider) {
  const recipient = call.recipients?.[0] || {};
  const raw = recipient.structured_result || {};
  const transcriptTurns = recipient.attempts?.[0]?.transcript_turns || [];
  const transcript = transcriptTurns
    .map(turn => `${turn.speaker || turn.role || 'Speaker'}: ${turn.text || turn.content || ''}`.trim())
    .filter(Boolean)
    .join('\n');

  return {
    providerId: provider.id,
    providerName: provider.name,
    callOutcome: raw.call_outcome || (call.status === 'completed' ? 'unknown' : 'failed'),
    openToday: raw.open_today || 'unknown',
    acceptingRequest: raw.accepting_request || 'unknown',
    availabilityWindow: raw.availability_window || 'Unknown',
    requirements: Array.isArray(raw.requirements) ? raw.requirements : [],
    evidence: Array.isArray(raw.evidence) ? raw.evidence : call.evidence || [],
    confidence: raw.confidence || call.completion_confidence?.label || 'low',
    followUpNeeded: raw.follow_up_needed || 'yes',
    transcript,
    source: 'call-e',
    liveCallId: call.id || call.call_id
  };
}

async function runLiveCall({ provider, request, plan }) {
  const created = await createLiveCall({ provider, request, plan });
  try {
    const completed = await waitForLiveCall(created);
    return normalizeResult(completed, provider);
  } catch (error) {
    error.callId = created.id || created.call_id;
    throw error;
  }
}

module.exports = { runLiveCall };
