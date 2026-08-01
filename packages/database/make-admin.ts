import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const email = process.argv[2]
  if (!email) {
    console.error('Please provide an email address. Example: pnpm run make-admin myemail@example.com')
    process.exit(1)
  }

  console.log(`Looking for user with email: ${email}...`)

  // Ensure OWNER role exists
  const ownerRole = await prisma.role.upsert({
    where: { name: 'OWNER' },
    update: {},
    create: { name: 'OWNER' },
  })

  // We upsert the user based on email. If they haven't logged in yet and clerkId isn't synced,
  // we'll just create a placeholder that the webhook can match later (or just tell them to login first).
  // Ideally, they should login to the site first so Clerk creates their account.
  
  try {
    // Try to find the user first
    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      console.log(`User ${email} not found in the local database.`)
      console.log(`Please sign in on the website first so your user record is created!`)
      
      // As a fallback, we can create it if they know their Clerk ID, but usually it's best they login first.
      console.log(`\nAlternatively, we created an empty record for you. Make sure your Clerk webhook is configured to update it.`)
      
      await prisma.user.create({
        data: {
          email,
          clerkId: `manual-${Date.now()}`, // Temporary placeholder
          roleId: ownerRole.id
        }
      })
      console.log(`\n✅ Created user ${email} and assigned OWNER role!`)
    } else {
      await prisma.user.update({
        where: { email },
        data: { roleId: ownerRole.id }
      })
      console.log(`\n✅ Updated existing user ${email} to have the OWNER role!`)
    }
  } catch (error) {
    console.error('Error assigning admin role:', error)
  }
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
