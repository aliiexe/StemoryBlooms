import { createClerkClient } from '@clerk/clerk-sdk-node';
import { PrismaClient } from '@stemory/database';

const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
const prisma = new PrismaClient();

async function backfill() {
  const users = (await clerk.users.getUserList()).data;
  console.log(`Found ${users.length} users in Clerk`);
  
  for (const user of users) {
    const email = user.emailAddresses[0]?.emailAddress;
    if (!email) continue;
    
    // Ensure CUSTOMER role exists
    const role = await prisma.role.upsert({
      where: { name: 'CUSTOMER' },
      update: {},
      create: { name: 'CUSTOMER' },
    });
    
    await prisma.user.upsert({
      where: { clerkId: user.id },
      update: {
        email,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        roleId: role.id, // Retroactively assign role if missing
      },
      create: {
        clerkId: user.id,
        email,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        roleId: role.id,
      }
    });
    console.log(`Synced user ${user.id} (${email})`);
  }
}

backfill().catch(console.error).finally(() => prisma.$disconnect());
