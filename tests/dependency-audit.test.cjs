const assert = require('node:assert/strict');
const test = require('node:test');
const { pathToFileURL } = require('node:url');
const path = require('node:path');

async function loadAuditModule() {
  return import(
    pathToFileURL(path.resolve('scripts/dependency-audit.mjs')).href
  );
}

function acceptedAudit() {
  return {
    auditReportVersion: 2,
    vulnerabilities: {
      '@astrojs/cloudflare': {
        name: '@astrojs/cloudflare',
        severity: 'high',
        isDirect: true,
        via: ['astro'],
        effects: [],
        range: '*',
        nodes: ['node_modules/@astrojs/cloudflare'],
      },
      astro: {
        name: 'astro',
        severity: 'high',
        isDirect: true,
        via: ['http-cache-semantics'],
        effects: ['@astrojs/cloudflare'],
        range: '*',
        nodes: ['node_modules/astro'],
      },
      'http-cache-semantics': {
        name: 'http-cache-semantics',
        severity: 'high',
        isDirect: false,
        via: [
          {
            source: 999999,
            name: 'http-cache-semantics',
            dependency: 'http-cache-semantics',
            title:
              'max-stale handling can disclose cross-user cached responses',
            url: 'https://github.com/advisories/GHSA-ch52-4w7c-c8xp',
            severity: 'high',
            range: '*',
          },
        ],
        effects: ['astro'],
        range: '*',
        nodes: ['node_modules/http-cache-semantics'],
      },
    },
    metadata: {
      vulnerabilities: {
        info: 0,
        low: 0,
        moderate: 0,
        high: 3,
        critical: 0,
        total: 3,
      },
    },
  };
}

test('dependency audit accepts only the exact classified advisory chain', async () => {
  const { assertAcceptedAuditShape } = await loadAuditModule();
  assert.deepEqual(assertAcceptedAuditShape(acceptedAudit()), {
    acceptedException: true,
  });
});

test('dependency audit fails closed when any new vulnerable package appears', async () => {
  const { assertAcceptedAuditShape } = await loadAuditModule();
  const audit = acceptedAudit();
  audit.vulnerabilities.other = {
    name: 'other',
    severity: 'low',
    via: [],
  };
  audit.metadata.vulnerabilities.low = 1;
  audit.metadata.vulnerabilities.total = 4;

  assert.throws(
    () => assertAcceptedAuditShape(audit),
    /unexpected vulnerable package other/,
  );
});

test('dependency audit fails closed when the accepted advisory identity changes', async () => {
  const { assertAcceptedAuditShape } = await loadAuditModule();
  const audit = acceptedAudit();
  audit.vulnerabilities['http-cache-semantics'].via[0].url =
    'https://github.com/advisories/GHSA-different';

  assert.throws(
    () => assertAcceptedAuditShape(audit),
    /only allowed advisory no longer matches/,
  );
});
