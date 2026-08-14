const { db, product, categoryToProduct } = require('@stemory/database');
const { eq } = require('drizzle-orm');

async function test() {
  const p = await db.query.product.findFirst();
  const c = await db.query.category.findFirst();
  console.log("Product:", p?.id, "Category:", c?.id);
  if (p && c) {
    try {
      await db.transaction(async (tx) => {
         await tx.delete(categoryToProduct).where(eq(categoryToProduct.b, p.id));
         await tx.insert(categoryToProduct).values([{ a: c.id, b: p.id }]);
      });
      console.log("Success!");
    } catch (e) {
      console.error(e);
    }
  }
}
test();
