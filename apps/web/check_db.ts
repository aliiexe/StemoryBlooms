import { db } from '@stemory/database';
import { user } from '@stemory/database';
import { role } from '@stemory/database';

async function main() {
  const users = await db.query.user.findMany({ with: { role: true } });
  console.log('USERS:', JSON.stringify(users, null, 2));
}

main().catch(console.error);
