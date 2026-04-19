const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  // Create Admin user
  const admin = await prisma.user.upsert({
    where: { email: 'admin@stokvel.com' },
    update: {},
    create: {
      email: 'admin@stokvel.com',
      name: 'Admin User',
      role: 'Admin',
    },
  })

  // Create Member user
  const member = await prisma.user.upsert({
    where: { email: 'member@stokvel.com' },
    update: {},
    create: {
      email: 'member@stokvel.com',
      name: 'Member User',
      role: 'Member',
    },
  })

  console.log('Created users:', admin, member)
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
