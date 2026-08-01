import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding the database...')
  
  // Seed basic roles
  const ownerRole = await prisma.role.upsert({
    where: { name: 'OWNER' },
    update: {},
    create: {
      name: 'OWNER',
    },
  })

  // Seed sample products
  const product = await prisma.product.create({
    data: {
      name: 'Classic Lavender Bouquet',
      description: 'A beautiful mix of lavender and baby\'s breath.',
      basePrice: 19900, // 199 MAD
    }
  })

  console.log(`Created product: ${product.name}`)
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
