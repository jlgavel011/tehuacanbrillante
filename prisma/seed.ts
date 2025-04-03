import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Development environment detected, attempting to seed database...');
  console.log('Attempting to connect to database...');

  // Seed users if they don't exist
  const existingUsers = await prisma.user.findMany();
  if (existingUsers.length === 0) {
    console.log('Seeding users...');
    await prisma.user.createMany({
      data: [
        {
          name: 'Admin',
          email: 'admin@tehuacan.com',
          role: Role.MASTER_ADMIN
        },
        {
          name: 'Jefe de Producción',
          email: 'production@tehuacan.com',
          role: Role.PRODUCTION_CHIEF
        },
        {
          name: 'Gerente',
          email: 'manager@tehuacan.com',
          role: Role.MANAGER
        }
      ]
    });
  } else {
    console.log('Found', existingUsers.length, 'existing users');
    console.log('Database already has users, skipping user seed...');
  }

  // Seed paro types if they don't exist
  const existingParoTypes = await prisma.tipoParo.findMany();
  if (existingParoTypes.length === 0) {
    console.log('Seeding paro types...');
    await prisma.tipoParo.createMany({
      data: [
        { nombre: 'Mantenimiento' },
        { nombre: 'Calidad' },
        { nombre: 'Operativo' }
      ]
    });
  } else {
    console.log('Found', existingParoTypes.length, 'existing paro types');
    console.log('Database already has paro types, skipping paro types seed...');
  }

  console.log('Database seeding: Database seeding completed successfully');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 