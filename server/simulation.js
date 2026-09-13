const scenarios = {
  'harbor-food-hub': {
    callOutcome: 'confirmed',
    openToday: 'yes',
    acceptingRequest: 'yes',
    availabilityWindow: 'Today, 3:00 PM–5:00 PM',
    requirements: ['Photo ID requested but not required', 'Household size'],
    evidence: [
      'The coordinator confirmed that walk-ins are accepted today from 3:00 PM to 5:00 PM.',
      'The coordinator said Spanish support is available.'
    ],
    confidence: 'high',
    followUpNeeded: 'no'
  },
  'mission-community-pantry': {
    callOutcome: 'confirmed',
    openToday: 'yes',
    acceptingRequest: 'yes',
    availabilityWindow: 'Tomorrow, 10:00 AM–12:00 PM',
    requirements: ['Bring a utility bill if available'],
    evidence: [
      'The coordinator confirmed that new households can register tomorrow morning.',
      'The coordinator confirmed Mandarin support.'
    ],
    confidence: 'high',
    followUpNeeded: 'no'
  },
  'sunset-neighborhood-kitchen': {
    callOutcome: 'unknown',
    openToday: 'unknown',
    acceptingRequest: 'unknown',
    availabilityWindow: 'unknown',
    requirements: [],
    evidence: ['The call reached voicemail and no current availability was established.'],
    confidence: 'low',
    followUpNeeded: 'yes'
  }
};

function simulateCall(provider, request) {
  const scenario = scenarios[provider.id] || scenarios['sunset-neighborhood-kitchen'];
  const accessibilityRequested = request.accessibility && request.accessibility.length > 0;
  const accessibilitySupported = accessibilityRequested
    ? request.accessibility.every((item) => provider.accessibility.includes(item))
    : true;

  const result = JSON.parse(JSON.stringify(scenario));
  if (!accessibilitySupported && result.callOutcome === 'confirmed') {
    result.callOutcome = 'contradictory';
    result.acceptingRequest = 'unknown';
    result.confidence = 'low';
    result.evidence.push('The requested accessibility feature was not confirmed for this provider.');
    result.followUpNeeded = 'yes';
  }

  return {
    providerId: provider.id,
    providerName: provider.name,
    mode: 'simulation',
    status: 'completed',
    result,
    transcript: [
      { speaker: 'assistant', text: 'Hello, I am Openline, an AI assistant calling to verify current service availability.' },
      { speaker: 'provider', text: result.evidence[0] }
    ],
    evidence: result.evidence,
    simulatedAt: new Date().toISOString()
  };
}

module.exports = { simulateCall };
