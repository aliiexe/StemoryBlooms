import { sql, order } from '@stemory/database';
import type { OrderAddress } from './receipt-access';
export const BUSINESS_TIMEZONE = 'Africa/Casablanca';
export function businessDay(date: Date) {
  return new Intl.DateTimeFormat('en-CA',{timeZone:BUSINESS_TIMEZONE,year:'numeric',month:'2-digit',day:'2-digit'}).format(date);
}
// Existing discount includes gift tender. Add it back when measuring booked merchandise.
export function bookedMerchandise(value: {subtotal:number;discount:number;deliveryAddress:unknown}) {
  const gift=(value.deliveryAddress as OrderAddress | null)?.redemptions?.giftAmount || 0;
  return Math.max(0,value.subtotal-value.discount+(Number.isSafeInteger(gift)&&gift>0?gift:0));
}
export const bookedMerchandiseSql = sql`GREATEST(0, ${order.subtotal} - ${order.discount} + CASE WHEN jsonb_typeof(${order.deliveryAddress}->'redemptions'->'giftAmount')='number' THEN GREATEST(0,(${order.deliveryAddress}->'redemptions'->>'giftAmount')::numeric) ELSE 0 END)`;

export type ReportPeriod = { period:string;from:string;to:string;label:string;error?:string };
const dateOnly=(value:unknown):value is string=>typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value)&&Number.isFinite(Date.parse(`${value}T12:00:00Z`))&&new Date(`${value}T12:00:00Z`).toISOString().slice(0,10)===value;
export function reportPeriod(input:{period?:string;from?:string;to?:string},now=new Date(),defaultPeriod='30',allowAll=false):ReportPeriod {
 const today=businessDay(now);const period=['MONTH','30','90','CUSTOM',...(allowAll?['ALL']:[])].includes(input.period||'')?input.period!:defaultPeriod;
 if(period==='ALL')return {period,from:'',to:'',label:'All recorded history'};
 if(period==='CUSTOM'){
  if(dateOnly(input.from)&&dateOnly(input.to)&&input.from<=input.to&&(Date.parse(input.to)-Date.parse(input.from))/86400000<366)return {period,from:input.from,to:input.to,label:`${input.from} – ${input.to}`};
  return {...reportPeriod({period:defaultPeriod},now,defaultPeriod,allowAll),error:'Choose a valid date range of up to one year.'};
 }
 const start=new Date(`${today}T12:00:00Z`);if(period==='MONTH')start.setUTCDate(1);else start.setUTCDate(start.getUTCDate()-(Number(period)-1));
 const from=start.toISOString().slice(0,10);return {period,from,to:today,label:period==='MONTH'?'This month':`Last ${period} days`};
}
export function dailyOrderSeries(orders:{createdAt:Date;status:string;subtotal:number;discount:number;deliveryAddress:unknown}[],from:string,to:string){
 if(!dateOnly(from)||!dateOnly(to)||from>to||(Date.parse(to)-Date.parse(from))/86400000>=366)throw new Error('Choose a reporting range of up to one year.');
 const rows=new Map<string,{date:string;revenue:number;orders:number}>();const day=new Date(`${from}T12:00:00Z`);
 while(day.toISOString().slice(0,10)<=to){const date=day.toISOString().slice(0,10);rows.set(date,{date,revenue:0,orders:0});day.setUTCDate(day.getUTCDate()+1);}
 for(const current of orders){const row=rows.get(businessDay(current.createdAt));if(row){row.orders+=1;if(current.status!=='CANCELLED')row.revenue+=bookedMerchandise(current);}}
 return [...rows.values()];
}
