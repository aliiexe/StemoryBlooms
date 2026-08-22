import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import * as schema from './schema';
import * as relations from './relations';
import fs from 'fs';

neonConfig.webSocketConstructor = globalThis.WebSocket || require('ws');

const NEW_URL = "postgresql://neondb_owner:npg_W3b8lkdMFPsJ@ep-rapid-glade-b16e8hpk-pooler.c-5.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

const isIsoDate = (str: string) => {
  if (!/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z/.test(str)) return false;
  const d = new Date(str); 
  return d instanceof Date && !isNaN(d.getTime()) && d.toISOString() === str;
};

function reviveDates(obj: any): any {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(reviveDates);
  const revived: any = {};
  for (const key in obj) {
    const value = obj[key];
    if (typeof value === 'string' && isIsoDate(value)) {
      revived[key] = new Date(value);
    } else {
      revived[key] = reviveDates(value);
    }
  }
  return revived;
}

async function run() {
  console.log("Connecting to new DB...");
  const newPool = new Pool({ connectionString: NEW_URL });
  const newDb = drizzle(newPool, { schema: { ...schema, ...relations } });

  try {
    const rawData = fs.readFileSync('dump.json', 'utf-8');
    const data = reviveDates(JSON.parse(rawData));

    const tableOrder = [
      'siteSettings', 'adminNotification', 'auditLog', 'adminInboxEvent', 'contactMessage', 
      'deliveryZone', 'deliveryCompany', 'customer', 'supplier', 'material', 
      'category', 'product', 'categoryToProduct', 'builderComponent', 'productImage', 
      'waitlist', 'promoCode', 'giftCard', 'address', 'order', 'orderItem', 
      'review', 'announcement', 'announcementBarSettings', 'announcementTemplate', 
      'analyticsEvent'
    ];

    for (const tableName of tableOrder) {
      if (data[tableName] && data[tableName].length > 0) {
        console.log(`Inserting ${data[tableName].length} rows into ${tableName}...`);
        const schemaTable = (schema as any)[tableName];
        if (schemaTable) {
           await newDb.insert(schemaTable).values(data[tableName]);
        }
      }
    }
    
    console.log("Data imported successfully!");

  } catch (e: any) {
    console.error("Error:", e.message);
  } finally {
    await newPool.end();
  }
}
run();
