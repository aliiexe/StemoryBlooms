import { saveProduct } from './apps/web/app/admin/products/actions.ts';
import { db } from '@stemory/database';

async function run() {
  const c = await db.query.category.findFirst();
  if (!c) return console.log("No category");
  
  const fd = new FormData();
  fd.append('id', '');
  fd.append('name', 'Test Product');
  fd.append('description', 'Test desc');
  fd.append('basePrice', '100');
  fd.append('stock', '5');
  fd.append('categoryIds', JSON.stringify([c.id]));

  console.log("Calling saveProduct...");
  const res = await saveProduct(fd);
  console.log("Result:", res);
}
run();
