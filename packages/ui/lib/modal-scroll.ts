type ScrollBody={style:{overflow:string}};
const locks=new WeakMap<ScrollBody,{count:number;previous:string}>();
// Nested dialogs can close in either order. Restore scrolling after the final one.
export function lockModalScroll(body:ScrollBody=document.body){
 const state=locks.get(body)||{count:0,previous:body.style.overflow};state.count+=1;locks.set(body,state);body.style.overflow='hidden';let released=false;
 return ()=>{if(released)return;released=true;state.count-=1;if(state.count===0){body.style.overflow=state.previous;locks.delete(body);}};
}
