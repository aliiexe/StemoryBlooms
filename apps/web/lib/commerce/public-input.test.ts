import {casablancaInstant,casablancaLocal} from '../business-time';
import {announcementMatchesPath} from '../announcement-visibility';
import {validateImageReferences} from '../image-references';
import { publicAnalyticsUrl } from '../analytics-privacy';
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


test('analytics excludes private routes and strips public query strings',()=>{
  assert.equal(publicAnalyticsUrl('https://example.com/receipt/order?token=secret'),null);
  assert.equal(publicAnalyticsUrl('https://example.com/subscriptions/verify?token=secret'),null);
  assert.equal(publicAnalyticsUrl('https://example.com/admin/customers'),null);
  assert.equal(publicAnalyticsUrl('https://example.com/shop?email=private@example.com#secret'),'https://example.com/shop');
});


test('new catalog images must be uploaded references while legacy embedded images remain editable',()=>{
 const legacy='data:image/png;base64,old';assert.deepEqual(validateImageReferences([legacy],[legacy]),[legacy]);
 assert.throws(()=>validateImageReferences([legacy]),/uploaded|picker|embedded/);
 assert.throws(()=>validateImageReferences(['https://untrusted.example/image.png']),/picker/);
 assert.deepEqual(validateImageReferences(['/uploads/photo.webp']),['/uploads/photo.webp']);
});


test('announcement schedules round trip Casablanca times and reject invalid calendar dates',()=>{
 const date=casablancaInstant('2026-10-21T09:30');assert.equal(date?.toISOString(),'2026-10-21T08:30:00.000Z');assert.equal(casablancaLocal(date),'2026-10-21T09:30');
 assert.throws(()=>casablancaInstant('2026-02-30T10:00'),/calendar/);assert.equal(casablancaInstant(''),null);
});
test('announcement page targeting honors exclusions and explicit custom paths',()=>{
 assert.equal(announcementMatchesPath({targetMode:'SHOP',includedPaths:null,excludedPaths:['/shop/private']},'/shop/private'),false);
 assert.equal(announcementMatchesPath({targetMode:'SHOP',includedPaths:null,excludedPaths:null},'/shop/product'),true);
 assert.equal(announcementMatchesPath({targetMode:'CUSTOM',includedPaths:['/gifts/*'],excludedPaths:null},'/gifts/birthday'),true);
 assert.equal(announcementMatchesPath({targetMode:'HOMEPAGE',includedPaths:null,excludedPaths:null},'/shop'),false);
});
