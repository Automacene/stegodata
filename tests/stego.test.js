import test from 'node:test';
import assert from 'node:assert/strict';
import { StegoData } from '../src/index.js';

test('injects and extracts metadata blocks', () => {
  const encoder = new TextEncoder();
  const fileBuffer = encoder.encode('SAMPLE DATA');
  const stego = new StegoData();

  const combined = stego.inject(fileBuffer, {
    namespace: 'demo:metadata',
    contentType: 'application/json',
    headers: {
      '+author': 'Developer',
    },
    payload: JSON.stringify({ hello: 'world' }),
  });

  const extracted = stego.extract(combined);

  assert.equal(extracted.length, 1);
  assert.equal(extracted[0].headers.namespace, 'demo:metadata');
  assert.equal(extracted[0].headers['content-type'], 'application/json');
  assert.equal(extracted[0].headers['+author'], 'Developer');
  assert.deepEqual(JSON.parse(extracted[0].payload), { hello: 'world' });
});
