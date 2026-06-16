import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  console.log('Iniciando seed...');

  const company = await prisma.company.upsert({
    where: { code: 'SYSTEM' },
    update: {},
    create: {
      name: 'Sistema',
      code: 'SYSTEM',
      defaultOriginCompany: 'Sistema',
      defaultDestinationCompany: 'Destino',
      active: true,
    },
  });

  console.log(`Empresa creada: ${company.name} (${company.code})`);

  const passwordHash = await bcrypt.hash('SuperAdmin123*', 12);

  const user = await prisma.user.upsert({
    where: { email: 'superadmin@system.local' },
    update: {},
    create: {
      companyId: company.id,
      firstName: 'Super',
      lastName: 'Admin',
      email: 'superadmin@system.local',
      passwordHash,
      role: 'SUPER_ADMIN',
      active: true,
    },
  });

  console.log(`Usuario creado: ${user.email} (${user.role})`);
  console.log('Seed completado exitosamente.');
}

main()
  .catch((e) => {
    console.error('Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
