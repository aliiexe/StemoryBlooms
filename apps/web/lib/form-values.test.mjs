import test from 'node:test';
import assert from 'node:assert/strict';
import { parseIntegerInput } from './form-values.ts';

test('rounds decimal input for integer-backed database fields', () => {
  assert.equal(parseIntegerInput('0.7'), 1);
  assert.equal(parseIntegerInput('12.4'), 12);
});

test('returns null for empty or invalid input', () => {
  assert.equal(parseIntegerInput(''), null);
  assert.equal(parseIntegerInput('invalid'), null);
});
