const test = require('node:test');
const assert = require('node:assert/strict');
const { runLiveCall } = require('../server/calle-adapter');

test('live calls require explicit confirmation', async () => {
  const previous = {
    mode: process.env.OPENLINE_MODE,
    confirm: process.env.OPENLINE_LIVE_CONFIRM,
    key: process.env.CALLE_API_KEY
  };

  delete process.env.OPENLINE_MODE;
  delete process.env.OPENLINE_LIVE_CONFIRM;
  delete process.env.CALLE_API_KEY;

  await assert.rejects(
    () => runLiveCall({ provider: { id: 'p', name: 'Provider', phone: '+14155550101' }, request: { id: 'r' }, plan: { questions: [], disclosure: '', purpose: '' } }),
    /Live mode is not enabled/
  );

  if (previous.mode === undefined) delete process.env.OPENLINE_MODE;
  else process.env.OPENLINE_MODE = previous.mode;
  if (previous.confirm === undefined) delete process.env.OPENLINE_LIVE_CONFIRM;
  else process.env.OPENLINE_LIVE_CONFIRM = previous.confirm;
  if (previous.key === undefined) delete process.env.CALLE_API_KEY;
  else process.env.CALLE_API_KEY = previous.key;
});

test('live calls reject fixture phone numbers before network access', async () => {
  const previous = {
    mode: process.env.OPENLINE_MODE,
    confirm: process.env.OPENLINE_LIVE_CONFIRM,
    key: process.env.CALLE_API_KEY
  };

  process.env.OPENLINE_MODE = 'live';
  process.env.OPENLINE_LIVE_CONFIRM = 'true';
  process.env.CALLE_API_KEY = 'test-key';

  await assert.rejects(
    () => runLiveCall({ provider: { id: 'p', name: 'Provider', phone: '+14155550101' }, request: { id: 'r' }, plan: { questions: [], disclosure: '', purpose: '' } }),
    /Fixture phone numbers cannot be used/
  );

  if (previous.mode === undefined) delete process.env.OPENLINE_MODE;
  else process.env.OPENLINE_MODE = previous.mode;
  if (previous.confirm === undefined) delete process.env.OPENLINE_LIVE_CONFIRM;
  else process.env.OPENLINE_LIVE_CONFIRM = previous.confirm;
  if (previous.key === undefined) delete process.env.CALLE_API_KEY;
  else process.env.CALLE_API_KEY = previous.key;
});

test('live calls reject unsupported recipient regions before network access', async () => {
  const previous = {
    mode: process.env.OPENLINE_MODE,
    confirm: process.env.OPENLINE_LIVE_CONFIRM,
    key: process.env.CALLE_API_KEY
  };

  process.env.OPENLINE_MODE = 'live';
  process.env.OPENLINE_LIVE_CONFIRM = 'true';
  process.env.CALLE_API_KEY = 'test-key';

  try {
    await assert.rejects(
      () => runLiveCall({
        provider: { id: 'p', name: 'Provider', phone: '+2340000000000', region: 'NG' },
        request: { id: 'r', country: 'Nigeria', language: 'English' },
        plan: { questions: [], disclosure: '', purpose: '' }
      }),
      (error) => error.code === 'call_not_ready' && /not currently available for Nigeria/.test(error.message)
    );
  } finally {
    if (previous.mode === undefined) delete process.env.OPENLINE_MODE;
    else process.env.OPENLINE_MODE = previous.mode;
    if (previous.confirm === undefined) delete process.env.OPENLINE_LIVE_CONFIRM;
    else process.env.OPENLINE_LIVE_CONFIRM = previous.confirm;
    if (previous.key === undefined) delete process.env.CALLE_API_KEY;
    else process.env.CALLE_API_KEY = previous.key;
  }
});
