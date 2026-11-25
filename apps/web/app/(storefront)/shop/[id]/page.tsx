import {cache} from 'react';
import {notFound} from 'next/navigation';
import type {Metadata} from 'next';
import {db,product as products,eq,and} from '@stemory/database';
import {relatedCatalogItems,publicReviews} from '@/lib/commerce/catalog';
import Link from 'next/link';
import PDPClient from './PDPClient';
const getProduct=cache(async(id:string)=>db.query.product.findFirst({where:and(eq(products.id,id),eq(products.status,'PUBLISHED')),columns:{id:true,name:true,description:true,basePrice:true,salePrice:true,isSaleEnabled:true,stock:true,isAvailable:true,images:true,processingEstimate:true},with:{categoryToProducts:{columns:{a:true}}}}));
type Props={params:Promise<{id:string}>;searchParams:Promise<{reviews?:string}>};
export async function generateMetadata({params}:Pick<Props,'params'>):Promise<Metadata>{
  const {id}=await params;const product=await getProduct(id);if(!product)return {title:'Arrangement unavailable',robots:{index:false}};
  const description=(product.description||'A handcrafted everlasting arrangement, made in Morocco.').slice(0,160);
  const image=product.images?.find(value=>value.startsWith('https://')||value.startsWith('/')&&!value.startsWith('//'))||'/opengraph-image';
  return {title:product.name,description,alternates:{canonical:`/shop/${id}`},openGraph:{title:product.name,description,url:`/shop/${id}`,images:[{url:image,alt:product.name}]},twitter:{card:'summary_large_image',title:product.name,description,images:[image]}};
}
export default async function ProductDetailsPage({params,searchParams}:Props){
  const {id}=await params;const product=await getProduct(id);if(!product)notFound();
  const query=await searchParams;const page=Math.max(1,Math.min(10000,Number.parseInt(query.reviews||'1',10)||1));
  const [recommendations,reviews]=await Promise.all([relatedCatalogItems(id,product.categoryToProducts.map(row=>row.a)),publicReviews(id,page)]);
  const settings=await db.query.siteSettings.findFirst();
  const trackInventory=(settings?.config as {inventoryTrackingEnabled?:boolean}|null)?.inventoryTrackingEnabled!==false;
  const origin=process.env.NEXT_PUBLIC_SITE_URL||'https://stemoryblooms.com';
  const structured={'@context':'https://schema.org','@type':'Product',name:product.name,description:product.description||undefined,image:product.images?.filter(value=>!value.startsWith('data:')).map(value=>new URL(value,origin).toString()),sku:product.id,brand:{'@type':'Brand',name:'Stemory Blooms'},offers:{'@type':'Offer',url:new URL(`/shop/${id}`,origin).toString(),priceCurrency:'MAD',price:product.isSaleEnabled&&product.salePrice!==null?product.salePrice:product.basePrice,availability:product.isAvailable&&(!trackInventory||product.stock>0)?'https://schema.org/InStock':'https://schema.org/OutOfStock'},...(reviews.count?{aggregateRating:{'@type':'AggregateRating',ratingValue:Number(reviews.rating?.toFixed(2)),reviewCount:reviews.count}}:{})};
  const {categoryToProducts:_categories,...details}=product;void _categories;
  return <><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(structured).replace(/</g,'\\u003c')}}/><PDPClient trackInventory={trackInventory} product={{...details,reviews:reviews.items}} recommendations={recommendations}/>{reviews.count>10&&<nav aria-label="Product review pages" style={{display:'flex',justifyContent:'center',gap:20,padding:'1rem 1rem 4rem'}}>{page>1&&<Link href={`/shop/${id}?reviews=${page-1}#reviews`}>Previous reviews</Link>}<span>Reviews page {page} of {Math.ceil(reviews.count/10)}</span>{page*10<reviews.count&&<Link href={`/shop/${id}?reviews=${page+1}#reviews`}>More reviews</Link>}</nav>}</>;
}
