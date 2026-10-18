import { db, eq, role as roleTable, user as userTable } from '@stemory/database';
import { clerkClient, auth } from '@clerk/nextjs/server';
import crypto from 'crypto';

const CUSTOMER_ROLE_NAME = 'CUSTOMER';
const ADMIN_ROLE_NAME = 'ADMIN';

async function getOrCreateRole(roleName: string) {
  const existingRole = await db.query.role.findFirst({
    where: eq(roleTable.name, roleName),
  });

  if (existingRole) {
    return existingRole;
  }

  const [createdRole] = await db.insert(roleTable).values({
    id: crypto.randomUUID(),
    name: roleName,
    updatedAt: new Date(),
  }).onConflictDoNothing({ target: roleTable.name }).returning();

  return createdRole || (await db.query.role.findFirst({ where: eq(roleTable.name, roleName) }))!;
}

export async function getUserRoleName(clerkUserId: string) {
  const rows = await db.select({ roleName: roleTable.name })
    .from(userTable)
    .leftJoin(roleTable, eq(userTable.roleId, roleTable.id))
    .where(eq(userTable.clerkId, clerkUserId))
    .limit(1);

  return rows[0]?.roleName ?? null;
}

export async function assertAdmin() {
  const { userId } = await auth();
  if (!userId) {
    throw new Error('Unauthorized: You must be logged in to perform this action.');
  }
  const roleName = await getUserRoleName(userId);
  if (roleName !== ADMIN_ROLE_NAME) {
    throw new Error('Forbidden: You do not have permission to perform this action.');
  }
  const actor = await db.query.user.findFirst({ where: eq(userTable.clerkId, userId) });
  if (!actor) throw new Error('Unauthorized');
  return { id: actor.id, clerkId: userId };
}

export async function syncClerkUserToDatabase(clerkUserId: string) {
  const client = await clerkClient();
  const clerkUser = await client.users.getUser(clerkUserId);
  const primaryEmail = clerkUser.emailAddresses.find((email) => email.id === clerkUser.primaryEmailAddressId)?.emailAddress ?? clerkUser.emailAddresses[0]?.emailAddress ?? '';
  const firstName = clerkUser.firstName ?? '';
  const lastName = clerkUser.lastName ?? '';

  const customerRole = await getOrCreateRole(CUSTOMER_ROLE_NAME);

  const existingUser = await db.query.user.findFirst({
    where: eq(userTable.clerkId, clerkUserId),
  });

  if (!existingUser) {
    await db.insert(userTable).values({
      id: crypto.randomUUID(),
      clerkId: clerkUserId,
      email: primaryEmail,
      firstName,
      lastName,
      roleId: customerRole.id,
      updatedAt: new Date(),
    }).onConflictDoUpdate({ target: userTable.clerkId, set: { email: primaryEmail, firstName, lastName, updatedAt: new Date() } });
    return { roleName: await getUserRoleName(clerkUserId) };
  }

  // Database roles are authoritative. Profile/webhook synchronization must never grant or restore access.
  await db.update(userTable).set({
    email: primaryEmail,
    firstName,
    lastName,
    updatedAt: new Date(),
  }).where(eq(userTable.clerkId, clerkUserId));

  return { roleName: await getUserRoleName(clerkUserId) };
}
