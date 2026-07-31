import test from 'node:test';
import assert from 'node:assert/strict';
import { StegoData } from '../src/index.js';

test('injects and extracts metadata blocks', async () => {
  const encoder = new TextEncoder();
  const fileBuffer = encoder.encode('SAMPLE DATA');
  const stego = new StegoData();

  const combined = await stego.inject(fileBuffer, {
    namespace: 'demo:metadata',
    contentType: 'application/json',
    headers: {
      '+author': 'Developer',
    },
    payload: JSON.stringify({ hello: 'world' }),
  });

  const extracted = await stego.extract(combined);

  assert.equal(extracted.length, 1);
  assert.equal(extracted[0].headers.namespace, 'demo:metadata');
  assert.equal(extracted[0].headers['content-type'], 'application/json');
  assert.equal(extracted[0].headers['+author'], 'Developer');
  assert.deepEqual(JSON.parse(extracted[0].payload), { hello: 'world' });
});

test('accepts File input for browser-style usage', async () => {
  const stego = new StegoData();
  const file = new File([new Uint8Array([1, 2, 3, 4])], 'sample.bin', {
    type: 'application/octet-stream',
  });

  const combined = await stego.inject(file, {
    namespace: 'browser:test',
    contentType: 'application/octet-stream',
    payload: 'blob-payload',
  });

  const extracted = await stego.extract(combined);

  assert.equal(extracted.length, 1);
  assert.equal(extracted[0].headers.namespace, 'browser:test');
  assert.equal(extracted[0].payload, 'blob-payload');
});
