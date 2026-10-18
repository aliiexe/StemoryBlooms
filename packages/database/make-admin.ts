import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import { db, eq, sql, role, user } from './index';

async function main() {
  const email = process.argv[2]?.trim().toLowerCase();
  if (!email || !email.includes('@')) throw new Error('Usage: pnpm --filter @stemory/database make-admin email@example.com');
  await db.transaction(async tx => {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtextextended('admin-role-changes', 0))`);
    const [existing] = await tx.select().from(user).where(sql`lower(trim(${user.email})) = ${email}`).for('update');
    if (!existing) throw new Error('Sign in on the website first so a real Clerk-linked user exists.');
    await tx.insert(role).values({ id: randomUUID(), name: 'ADMIN', updatedAt: new Date() }).onConflictDoNothing({ target: role.name });
    const adminRole = await tx.query.role.findFirst({ where: eq(role.name, 'ADMIN') });
    if (!adminRole) throw new Error('Could not create admin role.');
    await tx.update(user).set({ roleId: adminRole.id, updatedAt: new Date() }).where(eq(user.id, existing.id));
  });
  console.log('Administrator role assigned to the existing user.');
}
main().then(() => process.exit(0)).catch(error => { console.error(error instanceof Error ? error.message : 'Role assignment failed.'); process.exit(1); });
