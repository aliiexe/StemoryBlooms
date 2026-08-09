import fs from 'fs';
import path from 'path';

function walk(dir: string, callback: (filepath: string) => void) {
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    const filepath = path.join(dir, file);
    const stat = fs.statSync(filepath);
    if (stat && stat.isDirectory()) walk(filepath, callback);
    else if (filepath.endsWith('.ts') || filepath.endsWith('.tsx')) callback(filepath);
  });
}

const replaceAll = (str: string, find: string, replace: string) => str.split(find).join(replace);

walk('/Users/alibourak/Documents/CodingProjects/StemoryBlooms/apps/web/app/admin', (filepath) => {
  let content = fs.readFileSync(filepath, 'utf8');
  if (!content.includes('prisma.')) return;

  // Replace import { db, eq, sql } from '@stemory/database';
  // with import { db, eq, sql, <tables> } from '@stemory/database';
  // I will just use drizzle-orm and db.query
  
  // Basic replacements for finding
  content = content.replace(/prisma\.([a-zA-Z0-9_]+)\.findMany\(/g, 'db.query.$1.findMany(');
  content = content.replace(/prisma\.([a-zA-Z0-9_]+)\.findFirst\(/g, 'db.query.$1.findFirst(');
  content = content.replace(/prisma\.([a-zA-Z0-9_]+)\.findUnique\(/g, 'db.query.$1.findFirst(');
  
  // OrderBy arrays in drizzle query
  content = content.replace(/orderBy:\s*\{\s*([a-zA-Z0-9_]+):\s*'asc'\s*\}/g, "orderBy: [asc($1)]");
  content = content.replace(/orderBy:\s*\{\s*([a-zA-Z0-9_]+):\s*'desc'\s*\}/g, "orderBy: [desc($1)]");
  content = content.replace(/orderBy:\s*\[\{\s*([a-zA-Z0-9_]+):\s*'asc'\s*\}, \{\s*([a-zA-Z0-9_]+):\s*'desc'\s*\}\]/g, "orderBy: [asc($1), desc($2)]");

  // Basic replacements for writes (These usually need to be rewritten to db.insert().values()... so I will leave them alone for now or use regex if simple)
  
  // Imports: add desc, asc
  if (!content.includes('import { asc')) {
    content = content.replace("from '@stemory/database';", "from '@stemory/database';\nimport { asc, desc } from 'drizzle-orm';");
  }

  // Rewrite where: { id } -> where: eq(table.id, id)
  // This is too complex for simple regex. We'll handle where clauses manually where they fail.

  fs.writeFileSync(filepath, content, 'utf8');
  console.log(`Migrated ${filepath}`);
});
