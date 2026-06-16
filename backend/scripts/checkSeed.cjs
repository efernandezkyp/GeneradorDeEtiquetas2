require('dotenv').config();

const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  const user = await prisma.user.findUnique({ where: { email: 'superadmin@system.local' } });
  await prisma.$disconnect();
  if (!user) {
    console.log(null);
    return;
  }
  console.log({
    email: user.email,
    role: user.role,
    active: user.active,
    hasPassword: Boolean(user.passwordHash),
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
