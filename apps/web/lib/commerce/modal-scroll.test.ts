import test from 'node:test';
import assert from 'node:assert/strict';
import {lockModalScroll} from '../../../../packages/ui/lib/modal-scroll';
test('nested dialogs retain scroll locking until the last closes, regardless of close order',()=>{
 for(const reverse of [false,true]){const body={style:{overflow:'clip'}};const first=lockModalScroll(body);const second=lockModalScroll(body);assert.equal(body.style.overflow,'hidden');if(reverse){second();second();assert.equal(body.style.overflow,'hidden');first();}else{first();first();assert.equal(body.style.overflow,'hidden');second();}assert.equal(body.style.overflow,'clip');}
});
