// This is a standalone script to seed the database
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seeding script...');

  try {
    // Check if users already exist
    const usersCount = await prisma.user.count();
    console.log(`Found ${usersCount} existing users`);

    if (usersCount === 0) {
      console.log('Creating users...');
      
      // Create guest user
      const hashedGuestPassword = await bcrypt.hash('invitado123', 10);
      await prisma.user.create({
        data: {
          name: 'Invitado',
          email: 'invitado@tehuacanbrillante.com',
          password: hashedGuestPassword,
          role: 'PRODUCTION_CHIEF',
        },
      });
      console.log('Guest user created');
      
      // Create admin user
      const hashedAdminPassword = await bcrypt.hash('admin123', 10);
      await prisma.user.create({
        data: {
          name: 'Administrador',
          email: 'admin@tehuacanbrillante.com',
          password: hashedAdminPassword,
          role: 'MASTER_ADMIN',
        },
      });
      console.log('Admin user created');
      
      // Create manager user
      const hashedManagerPassword = await bcrypt.hash('manager123', 10);
      await prisma.user.create({
        data: {
          name: 'Gerente',
          email: 'gerente@tehuacanbrillante.com',
          password: hashedManagerPassword,
          role: 'MANAGER',
        },
      });
      console.log('Manager user created');
    } else {
      console.log('Users already exist, skipping creation');
    }

    // Check if tipo paros exist
    const tipoParoCount = await prisma.tipoParo.count();
    console.log(`Found ${tipoParoCount} existing paro types`);
    
    if (tipoParoCount === 0) {
      console.log('Creating paro types...');
      
      await prisma.tipoParo.createMany({
        data: [
          { nombre: 'Mantenimiento' },
          { nombre: 'Calidad' },
          { nombre: 'Operativo' }
        ],
      });
      
      console.log('Paro types created successfully');
    }

    console.log('Seeding completed successfully');
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .then(() => {
    console.log('Script execution complete');
    process.exit(0);
  })
  .catch((e) => {
    console.error('Unhandled error during script execution:', e);
    process.exit(1);
  }); 