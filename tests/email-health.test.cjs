const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

function load(file, extra = {}) {
  const code = ts.transpileModule(
    fs.readFileSync(file, 'utf8').replace(/^(?:import|export \{).*;\n/gm, ''),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
      },
    },
  ).outputText;
  const context = {
    exports: {},
    site: require('../engineering.config.json'),
    Response,
    AbortSignal,
    console: { info() {} },
    setTimeout: (fn) => fn(),
    ...(file.endsWith('/email-health.ts')
      ? { ...load('src/email-health-engine.ts') }
      : {}),
    ...extra,
  };
  vm.runInNewContext(code, context);
  if (file.endsWith('/email-health.ts'))
    context.exports.healthDate = context.healthDate;
  return context.exports;
}
test('daily mail is DST-safe at 05:00 Chicago including both transition days', () => {
  const { healthDate } = load('src/email-health.ts');
  for (const [day, hour] of [
    ['2026-01-15', 11],
    ['2026-07-15', 10],
    ['2026-03-08', 10],
    ['2026-11-01', 11],
  ]) {
    for (const candidate of [10, 11]) {
      const stamp = Date.parse(`${day}T${candidate}:00:00Z`);
      assert.equal(healthDate(stamp, stamp), candidate === hour ? day : null);
    }
  }
  const stamp = Date.parse('2026-07-15T10:00:00Z');
  assert.equal(healthDate(stamp, stamp + 16 * 60_000), null);
  assert.equal(healthDate(stamp, stamp - 61_000), null);
  assert.equal(healthDate(NaN, stamp), null);
});
test('scheduled retries use real shared fixed-recipient transport and stable key/payload', async () => {
  const sends = [];
  const mail = load('src/mail.ts', {
    fetch: async (url, options) => {
      sends.push({ url, ...options });
      return sends.length === 1
        ? new Response('', { status: 503 })
        : Response.json({ id: 'mock-id' });
    },
  });
  const { sendDailyHealth } = load('src/email-health.ts', mail);
  const stamp = Date.parse('2026-07-15T10:00:00Z');
  await sendDailyHealth(stamp, { RESEND_API_KEY: 'fixture' }, stamp);
  assert.equal(sends.length, 2);
  assert.equal(sends[0].body, sends[1].body);
  assert.equal(
    sends[0].headers['Idempotency-Key'],
    'alienx-daily-email-health/2026-07-15',
  );
  assert.equal('redirect' in sends[0], false);
  assert.deepEqual(JSON.parse(sends[0].body).to, [
    'alienx@alienxsmarthome.com',
  ]);
  assert.equal(
    JSON.parse(sends[0].body).from,
    'AlienX SmartHome <contact@alienxsmarthome.com>',
  );
  await assert.rejects(
    sendDailyHealth(stamp, {}, stamp),
    /missing mail configuration/,
  );
});
test('heartbeat copy is actionable only on failure and does not pretend to test the form', async () => {
  const sends = [];
  const { sendDailyHealth } = load('src/email-health.ts', {
    sendProductionMail: async (_token, _key, message) => {
      sends.push(message);
      return Response.json({ id: 'mock-id' });
    },
  });
  const stamp = Date.parse('2026-07-15T10:00:00Z');
  await sendDailyHealth(stamp, { RESEND_API_KEY: 'fixture' }, stamp);
  assert.equal(sends.length, 1);
  assert.equal(
    sends[0].subject,
    'AlienX SmartHome — email transport healthy — 2026-07-15',
  );
  assert.match(sends[0].text, /No action is required/);
  assert.match(sends[0].text, /Contact-form health is monitored separately/);
  assert.doesNotMatch(sends[0].text, /If missing/);
  assert.doesNotMatch(sends[0].text, /No customer inquiry was created/);
});

test('shared mail transport uses one direct fixed-recipient Resend request', async () => {
  const calls = [];
  const { sendProductionMail } = load('src/mail.ts', {
    fetch: async (url, options) => {
      calls.push({ url: String(url), ...options });
      return Response.json({ id: 'mock-id' });
    },
  });
  const response = await sendProductionMail('  fixture  ', 'stable-key', {
    subject: 'Fixture',
    text: 'Fixture',
  });
  assert.equal(response.status, 200);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, 'https://api.resend.com/emails');
  assert.equal(calls[0].method, 'POST');
  assert.equal('redirect' in calls[0], false);
  assert.equal(calls[0].headers.Authorization, 'Bearer fixture');
  assert.equal(calls[0].headers['Idempotency-Key'], 'stable-key');
  assert.deepEqual(JSON.parse(calls[0].body).to, [
    'alienx@alienxsmarthome.com',
  ]);
  assert.equal(
    JSON.parse(calls[0].body).from,
    'AlienX SmartHome <contact@alienxsmarthome.com>',
  );
});

test('scheduled mail fails closed on permanent, exhausted, and malformed provider results', async () => {
  const stamp = Date.parse('2026-07-15T10:00:00Z');
  for (const [reply, expected] of [
    [() => new Response('', { status: 401 }), 1],
    [() => Response.json({ id: ' ' }), 3],
    [
      () => {
        throw Error('private provider detail');
      },
      3,
    ],
  ]) {
    let calls = 0;
    const { sendDailyHealth } = load('src/email-health.ts', {
      sendProductionMail: async () => {
        calls++;
        return reply();
      },
    });
    await assert.rejects(
      sendDailyHealth(stamp, { RESEND_API_KEY: 'fixture' }, stamp),
      /^Error: Daily email health not confirmed by provider$/,
    );
    assert.equal(calls, expected);
  }
});
test('delivery monitor requires matching provider delivery, not mere acceptance', async () => {
  const { verifyEmailHealth, expectedHealthDate } =
    await import('../scripts/verify-email-health.mjs');
  const now = new Date('2026-07-15T10:25:00Z');
  const row = {
    id: 'fixture',
    subject: 'AlienX SmartHome — email transport healthy — 2026-07-15',
    from: 'AlienX SmartHome <contact@alienxsmarthome.com>',
    to: ['alienx@alienxsmarthome.com'],
    created_at: '2026-07-15T10:00:00Z',
    last_event: 'delivered',
  };
  const verify = (data, has_more = false) =>
    verifyEmailHealth({
      token: 'fixture',
      now,
      fetchImpl: async (_url, options) => {
        assert.equal(options.redirect, 'error');
        return Response.json({ data, has_more });
      },
    });
  assert.equal((await verify([row])).status, 'delivered');
  for (const change of [
    { last_event: 'sent' },
    { last_event: 'bounced' },
    { from: 'other@example.test' },
    { to: ['other@example.test'] },
    { created_at: '2026-07-14T10:00:00Z' },
    { created_at: 'invalid' },
  ])
    await assert.rejects(verify([{ ...row, ...change }]));
  await assert.rejects(verify([]), /missing/);
  await assert.rejects(verify(null), /Malformed/);
  await assert.rejects(verifyEmailHealth({ now }), /credential/);
  await assert.rejects(
    verifyEmailHealth({
      token: 'fixture',
      now,
      fetchImpl: async () => {
        throw Error('private');
      },
    }),
    /details suppressed/,
  );
  assert.equal(expectedHealthDate(new Date('2026-01-15T10:25:00Z')), null);
  assert.equal(
    expectedHealthDate(new Date('2026-01-15T11:25:00Z')),
    '2026-01-15',
  );
});
test('production configuration wires cron to shared mail without a public trigger', () => {
  const cfg = JSON.parse(fs.readFileSync('wrangler.json', 'utf8'));
  assert.equal(cfg.main, './src/worker.ts');
  assert.deepEqual(cfg.triggers.crons, ['0 10 * * *', '0 11 * * *']);
  const worker = fs.readFileSync('src/worker.ts', 'utf8');
  assert.match(worker, /fetch: handle/);
  assert.match(
    worker,
    /await sendDailyHealth\(controller.scheduledTime, env\)/,
  );
});
