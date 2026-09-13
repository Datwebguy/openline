const providers = [
  ...(process.env.OPENLINE_TEST_PHONE ? [{
    id: 'live-test-recipient',
    name: 'Openline live test recipient',
    category: 'food-support',
    city: process.env.OPENLINE_TEST_CITY || 'Configured recipient',
    phone: process.env.OPENLINE_TEST_PHONE,
    region: process.env.OPENLINE_TEST_REGION || '',
    allRegions: true,
    liveOnly: true,
    coverage: 'Configured live recipient',
    languages: ['English'],
    accessibility: ['Phone verification test contact']
  }] : []),
  {
    id: 'harbor-food-hub',
    name: 'Harbor Food Hub',
    category: 'food-support',
    address: '214 Harbor Street',
    city: 'San Francisco',
    region: 'US',
    phone: '+14155550101',
    languages: ['English', 'Spanish'],
    accessibility: ['step-free entrance', 'accessible restroom'],
    source: 'community-fixture',
    authorizedForCalling: true
  },
  {
    id: 'mission-community-pantry',
    name: 'Mission Community Pantry',
    category: 'food-support',
    address: '801 Valencia Street',
    city: 'San Francisco',
    region: 'US',
    phone: '+14155550102',
    region: 'US',
    languages: ['English', 'Spanish', 'Mandarin'],
    accessibility: ['step-free entrance'],
    source: 'community-fixture',
    authorizedForCalling: true
  },
  {
    id: 'sunset-neighborhood-kitchen',
    name: 'Sunset Neighborhood Kitchen',
    category: 'food-support',
    address: '1440 Ninth Avenue',
    city: 'San Francisco',
    region: 'US',
    phone: '+14155550103',
    region: 'US',
    languages: ['English'],
    accessibility: ['phone intake available'],
    source: 'community-fixture',
    authorizedForCalling: true
  }
];

function listProviders({ category, city } = {}) {
  return providers.filter((provider) => {
    if (category && provider.category !== category) return false;
    if (city && provider.city.toLowerCase() !== city.toLowerCase()) return false;
    return true;
  });
}

function getProvider(id) {
  return providers.find((provider) => provider.id === id);
}

function listProvidersForRequest(filters = {}) {
  const liveOnly = process.env.OPENLINE_MODE === 'live';
  const eligibleProviders = providers.filter(provider => liveOnly ? provider.allRegions : !provider.liveOnly);
  const matching = eligibleProviders.filter((provider) => {
    if (filters.category && provider.category !== filters.category) return false;
    if (filters.city && provider.city.toLowerCase() !== filters.city.toLowerCase()) return false;
    return true;
  });
  const global = eligibleProviders.filter(provider =>
    provider.allRegions
    && (!filters.category || provider.category === filters.category)
  );

  return [...new Map([...matching, ...global].map(provider => [provider.id, provider])).values()];
}

module.exports = { listProviders: listProvidersForRequest, getProvider };
