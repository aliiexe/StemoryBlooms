import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateOrderTotals } from './orderUtils.ts';

test('calculates totals with a percentage promo applied', () => {
  const result = calculateOrderTotals({
    subtotal: 450,
    promoCode: 'SUMMER10',
    promoDetails: { type: 'PERCENTAGE', value: 10 },
    deliveryFee: 50,
  });

  assert.equal(result.discountAmount, 45);
  assert.equal(result.total, 455);
});

test('uses the flat delivery fee when no promo is present', () => {
  const result = calculateOrderTotals({
    subtotal: 300,
    deliveryFee: 50,
  });

  assert.equal(result.discountAmount, 0);
  assert.equal(result.total, 350);
});
