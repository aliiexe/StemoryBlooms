import { db } from './index';

async function main() {
  try {
    const res = await db.query.siteSettings.findFirst();
    console.log(res);
  } catch (err) {
    console.error("DRIZZLE ERROR:", err);
  }
}
main();
