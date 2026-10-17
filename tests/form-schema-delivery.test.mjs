import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const exports = {};
const source = [
  'form-engine.ts',
  'form-schema.ts',
  'form-delivery.ts',
  'form-response.ts',
]
  .map((file) =>
    readFileSync(new URL('../src/' + file, import.meta.url), 'utf8')
      .replace(/^import [\s\S]*?;\r?\n/gm, '')
      .replace('export { isValidEmail };', ''),
  )
  .join('\n');
vm.runInNewContext(
  ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText,
  { exports, URL, Response, TextEncoder, Uint8Array, crypto },
);

test('schema boundaries preserve optional fields and reject invalid selections', () => {
  const schema = {
    name: { min: 2, max: 100 },
    notes: { max: 10 },
    choice: { allowed: new Set(['', 'weekly', 'monthly']) },
  };
  assert.equal(
    exports.validateFields({ name: 'Al', notes: '', choice: '' }, schema)
      .length,
    0,
  );
  assert.equal(
    exports
      .validateFields(
        { name: 'A', notes: 'x'.repeat(11), choice: 'daily' },
        schema,
      )
      .join(','),
    'name,notes,choice',
  );
  assert.equal(
    exports.validateString('100', {
      pattern: /^\d+$/,
      validate: (value) => Number(value) <= 100,
    }),
    true,
  );
  assert.equal(
    exports.validateString('101', {
      pattern: /^\d+$/,
      validate: (value) => Number(value) <= 100,
    }),
    false,
  );
});

test('phone, URL and calendar validators reject deceptive inputs', () => {
  assert.equal(exports.validPhone('---', 40), false);
  assert.equal(exports.validPhone('+1 (202) 555-0123', 40), true);
  assert.equal(
    exports.validPhone('letters1234567', 30, /^[+()\d\s.-]+$/),
    false,
  );
  assert.equal(exports.validHttpUrl('javascript:alert(1)', 2048), false);
  assert.equal(exports.validHttpUrl('https://example.test', 2048), true);
  assert.equal(exports.validCalendarDate('2026-02-30'), false);
  assert.equal(exports.validCalendarDate('2028-02-29'), true);
  assert.equal(exports.validCalendarDate('2026-2-2'), false);
});

test('site-selected control normalization remains explicit', () => {
  assert.equal(exports.trimmedText(null), '');
  assert.equal(exports.singleLineText(' Test\r\nName\u0000 '), 'TestName');
  assert.equal(exports.multilineText(' First\nSecond\u0000 '), 'First\nSecond');
});

test('provider acceptance requires HTTP success and nonblank string ID', async () => {
  for (const payload of [
    null,
    [],
    {},
    { id: true },
    { id: '' },
    { id: '  ' },
  ]) {
    const result = await exports.acceptMail(async () => Response.json(payload));
    assert.equal(result.outcome, 'unconfirmed');
  }
  const accepted = await exports.acceptMail(async () =>
    Response.json({ id: 'provider-id' }),
  );
  assert.equal(accepted.outcome, 'accepted');
  assert.equal(accepted.id, 'provider-id');
});

test('provider failures expose categories without exception text or raw bodies', async () => {
  const rejected = await exports.acceptMail(async () =>
    Response.json({ private: 'provider-body' }, { status: 429 }),
  );
  assert.equal(rejected.outcome, 'rejected');
  assert.equal(rejected.status, 429);
  assert.equal(JSON.stringify(rejected).includes('provider-body'), false);
  const exception = await exports.acceptMail(async () => {
    throw Error('private-exception');
  });
  assert.equal(exception.outcome, 'request-failed');
  assert.equal(JSON.stringify(exception).includes('private-exception'), false);
  const malformed = await exports.acceptMail(
    async () => new Response('invalid JSON'),
  );
  assert.equal(malformed.outcome, 'unconfirmed');
});

test('native errors negotiate HTML while JSON errors retain machine-readable fields', async () => {
  const native = exports.createFormResponder(
    new Request('https://example.test/quote', {
      headers: { accept: 'text/html' },
    }),
    (body, id) => '<main>' + body.error + ':' + id + '</main>',
  );
  const response = native(
    { error: 'Correct fields', fieldErrors: { name: 'Required' } },
    400,
    'ID',
  );
  assert.equal(
    response.headers.get('content-type'),
    'text/html; charset=utf-8',
  );
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.equal(await response.text(), '<main>Correct fields:ID</main>');
  const enhanced = exports.createFormResponder(
    new Request('https://example.test/quote', {
      headers: { accept: 'text/html, application/json' },
    }),
    () => {
      throw Error('must not render');
    },
  );
  const json = enhanced(
    { error: 'Correct fields', fieldErrors: { name: 'Required' } },
    400,
  );
  assert.equal((await json.json()).fieldErrors.name, 'Required');
});

test('accepted native forms redirect once and unsupported methods advertise POST', async () => {
  const response = exports.acceptedFormResponse(
    new Request('https://example.test/api/quote'),
    'ID',
    '/quote-success',
  );
  assert.equal(response.status, 303);
  assert.equal(
    response.headers.get('location'),
    'https://example.test/quote-success',
  );
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.equal(response.headers.get('x-request-id'), 'ID');
  const json = exports.acceptedFormResponse(
    new Request('https://example.test/api/quote', {
      headers: { accept: 'application/json' },
    }),
    'ID',
    '/quote-success',
  );
  assert.equal((await json.json()).ok, true);
  assert.equal(
    exports
      .jsonFormResponse({ error: 'unsupported' }, 405)
      .headers.get('allow'),
    'POST',
  );
});
