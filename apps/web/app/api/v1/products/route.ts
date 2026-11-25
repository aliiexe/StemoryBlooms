import {NextResponse} from 'next/server';
import {browseCatalog,catalogFilters} from '@/lib/commerce/catalog';
import {CommerceError} from '@/lib/commerce/errors';
export async function GET(request:Request){
  try{const filters=catalogFilters(Object.fromEntries(new URL(request.url).searchParams));const result=await browseCatalog(filters);return NextResponse.json(result.items.map(item=>({...item,trackInventory:result.trackInventory,images:item.imageUrl?[item.imageUrl]:[]})),{headers:{'X-Total-Count':String(result.count),'X-Page':String(filters.page),'X-Page-Size':'12'}});}
  catch(error){if(error instanceof CommerceError)return NextResponse.json({error:error.message},{status:400});return NextResponse.json({error:'The catalog could not be loaded. Please retry.'},{status:503});}
}
