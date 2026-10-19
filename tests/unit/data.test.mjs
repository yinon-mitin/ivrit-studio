import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { validateAll } from '../../assets/js/core/schema.js';
import { loadData } from '../../scripts/validate.mjs';

const DATA_DIR = fileURLToPath(new URL('../../data', import.meta.url));

describe('data/', () => {
  it('passes the SPEC validator', () => {
    assert.deepEqual(validateAll(loadData(DATA_DIR)).errors, []);
  });
});
