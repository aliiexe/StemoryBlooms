import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import * as schema from './schema';
import * as relations from './relations';
import fs from 'fs';

neonConfig.webSocketConstructor = globalThis.WebSocket || require('ws');

const OLD_URL = "postgresql://neondb_owner:npg_afXiP2Q6EBSt@ep-damp-sky-aslz81n7-pooler.c-4.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";
const NEW_URL = "postgresql://neondb_owner:npg_W3b8lkdMFPsJ@ep-rapid-glade-b16e8hpk-pooler.c-5.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

async function run() {
  console.log("Connecting to old DB...");
  const oldPool = new Pool({ connectionString: OLD_URL });
  const oldDb = drizzle(oldPool, { schema: { ...schema, ...relations } });

  console.log("Connecting to new DB...");
  const newPool = new Pool({ connectionString: NEW_URL });
  const newDb = drizzle(newPool, { schema: { ...schema, ...relations } });

  try {
    // 1. Extract data
    console.log("Extracting data from old DB...");
    const data: any = {};
    const tables = [
      'siteSettings', 'adminNotification', 'auditLog', 'adminInboxEvent', 'contactMessage', 
      'deliveryZone', 'deliveryCompany', 'customer', 'supplier', 'material', 
      'product', 'category', 'categoryToProduct', 'builderComponent', 'productImage', 
      'waitlist', 'promoCode', 'giftCard', 'address', 'order', 'orderItem', 
      'review', 'announcement', 'announcementBarSettings', 'announcementTemplate', 
      'analyticsEvent'
    ];

    for (const tableName of tables) {
      if (oldDb.query[tableName]) {
        console.log(`Extracting ${tableName}...`);
        data[tableName] = await (oldDb.query as any)[tableName].findMany();
        console.log(`Found ${data[tableName].length} rows in ${tableName}`);
      } else {
        console.log(`Table ${tableName} not found in schema. Skipping.`);
      }
    }
    
    fs.writeFileSync('dump.json', JSON.stringify(data, null, 2));
    console.log("Data extracted successfully and saved to dump.json!");

  } catch (e: any) {
    console.error("Error:", e.message);
  } finally {
    await oldPool.end();
    await newPool.end();
  }
}
run();
