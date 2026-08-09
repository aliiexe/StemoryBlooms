const fs = require('fs');
const path = require('path');

const filesToPatch = [
  { file: 'apps/web/app/admin/customers/page.tsx', model: 'customer', array: 'customers' },
  { file: 'apps/web/app/admin/waitlist/page.tsx', model: 'waitlistEntry', array: 'waitlist' },
  { file: 'apps/web/app/admin/announcements/page.tsx', model: 'announcementTemplate', array: 'announcements' },
  { file: 'apps/web/app/admin/custom-orders/page.tsx', model: 'draftOrder', array: 'draftOrders' },
  { file: 'apps/web/app/admin/users/page.tsx', model: 'user', array: 'users' },
  { file: 'apps/web/app/admin/orders/page.tsx', model: 'order', array: 'orders' }
];

for (const {file, model, array} of filesToPatch) {
  const fullPath = path.join('/Users/alibourak/Documents/CodingProjects/StemoryBlooms', file);
  if (!fs.existsSync(fullPath)) {
    console.log(`Not found: ${file}`);
    continue;
  }
  
  let content = fs.readFileSync(fullPath, 'utf-8');
  
  // Skip if already patched
  if (content.includes('TablePagination')) continue;
  
  // Import TablePagination and sql if not there
  if (!content.includes('TablePagination')) {
    content = content.replace(/import React(?:[^;]+)?;/, `import React from 'react';\nimport { TablePagination } from '../../../components/ui/TablePagination';`);
  }
  if (!content.includes('sql')) {
    content = content.replace(/import {([^}]+)} from '@stemory\/database';/, "import { $1, sql } from '@stemory/database';");
  }
  
  // Modify export default async function
  content = content.replace(/export default async function \w+\(\) {/, `export default async function Page(props: { searchParams: { page?: string, limit?: string } }) {\n  const page = Number(props.searchParams.page) || 1;\n  const limit = Number(props.searchParams.limit) || 10;\n  const offset = (page - 1) * limit;\n`);
  
  // Inject limit/offset in findMany
  const findManyRegex = new RegExp(`const ${array} = await db\\.query\\.${model}\\.findMany\\(\\{([\\s\\S]*?)\\}\\);`);
  const match = content.match(findManyRegex);
  if (match) {
    const replacement = `const ${array} = await db.query.${model}.findMany({$1, limit, offset });\n  const [countResult] = await db.select({ count: sql\`count(*)\` }).from(${model});\n  const totalItems = Number(countResult.count);`;
    content = content.replace(match[0], replacement);
  }
  
  // Inject <TablePagination totalItems={totalItems} />
  if (content.includes('</table>')) {
    content = content.replace('</table>', `</table>\n        <TablePagination totalItems={totalItems} />`);
  }
  
  fs.writeFileSync(fullPath, content, 'utf-8');
  console.log(`Patched ${file}`);
}
