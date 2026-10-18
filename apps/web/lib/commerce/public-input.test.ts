import test from 'node:test';
import assert from 'node:assert/strict';
import { publicEmail, reviewInput, contactInput, escapeEmailHtml } from './public-input';

test('public inputs reject malformed contact and review values', () => {
  assert.equal(publicEmail.parse(' BUYER@Example.com '), 'buyer@example.com');
  assert.equal(publicEmail.safeParse('a@').success, false);
  const review = { productId: 'p', authorName: 'Buyer', rating: '5', title: '', content: 'Lovely flowers' };
  assert.equal(reviewInput.safeParse(review).success, true);
  for (const rating of ['0', '6', '2.5', '5oops', '']) assert.equal(reviewInput.safeParse({ ...review, rating }).success, false);
  assert.equal(contactInput.safeParse({ firstName: 'A', lastName: 'B', email: 'x@example.com', subject: 'Help', message: 'a'.repeat(5001) }).success, false);
});
test('untrusted contact text cannot inject email markup', () => {
  assert.equal(escapeEmailHtml('<a href="x">&\'</a>'), '&lt;a href=&quot;x&quot;&gt;&amp;&#39;&lt;/a&gt;');
});
