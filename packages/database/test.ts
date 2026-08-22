import { db, order } from './index';
async function test() {
  try {
    const orders = await db.select().from(order).limit(1);
    console.log("Success! Data:", orders);
  } catch (e) {
    console.error("Failed:", e.message);
  }
}
test();
