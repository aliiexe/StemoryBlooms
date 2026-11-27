import test from 'node:test';
import assert from 'node:assert/strict';
import {safeReturnPath,contextualHref} from '../navigation-context';

test('order detail links carry the exact completed/history view, filters, and page back to the list',()=>{
 const source='/admin/orders?view=DONE&status=CANCELLED&search=Rose+client&page=3&archived=1';
 const target=contextualHref('/admin/orders/order-123',source);
 const url=new URL(target,'https://shop.test');
 assert.equal(url.pathname,'/admin/orders/order-123');
 assert.equal(safeReturnPath(url.searchParams.get('returnTo'),'/admin/orders'),source);
});

test('nested editing and collection links preserve their parent context and existing parameters',()=>{
 const collection='/shop?category=gifts&sort=PRICE_ASC&page=2';
 const detail=contextualHref('/shop/bouquet',collection);
 const edit=contextualHref('/admin/products/bouquet?section=photos#image',detail);
 const url=new URL(edit,'https://shop.test');
 assert.equal(url.searchParams.get('section'),'photos');assert.equal(url.hash,'#image');
 const back=url.searchParams.get('returnTo')!;
 assert.equal(back,detail);
 assert.equal(new URL(back,'https://shop.test').searchParams.get('returnTo'),collection);
});

test('return links reject external, executable, malformed and API destinations',()=>{
 for(const value of ['https://evil.test','//evil.test','javascript:alert(1)','/\\evil.test','/admin/orders\n','/api/private','/'+ 'x'.repeat(12000)]){
  assert.equal(safeReturnPath(value,'/admin/orders'),'/admin/orders');
 }
 assert.equal(safeReturnPath(null,'/shop'),'/shop');
 assert.equal(contextualHref('https://other.test/product','/shop'),'https://other.test/product');
});


test('re-entering the same editor keeps its existing parent instead of making a self-return loop',()=>{
 assert.equal(contextualHref('/admin/orders/new','/admin/orders/new'),'/admin/orders/new');
 const source='/admin/orders/new?returnTo=%2Fadmin%2Forders%3Fview%3DDONE';
 assert.equal(contextualHref('/admin/orders/new',source),source);
});
