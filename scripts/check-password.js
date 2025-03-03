const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  try {
    // Get the admin user
    const adminUser = await prisma.user.findUnique({
      where: {
        email: 'admin@tehuacanbrillante.com'
      }
    });

    if (!adminUser) {
      console.log('Admin user not found');
      return;
    }

    console.log('Admin user found:', {
      id: adminUser.id,
      email: adminUser.email,
      role: adminUser.role,
      isMaster: adminUser.isMaster
    });

    // Check if the stored hash matches the provided hash
    const providedHash = '$2b$10$kjTaGghP9wvGGsuQCPb2zO2UiLVEJUXkFyxq/ZsjEOQWVlYs8lLWK';
    console.log('Stored hash:', adminUser.password);
    console.log('Provided hash:', providedHash);
    console.log('Hashes match:', adminUser.password === providedHash);

    // Try to verify with known password
    const knownPassword = 'admin123';
    const isKnownPasswordValid = await bcrypt.compare(knownPassword, adminUser.password);
    console.log('Known password valid:', isKnownPasswordValid);

    // Check if the isMaster flag is set correctly
    console.log('isMaster flag is set to:', adminUser.isMaster);
    
    // Update the admin user to set isMaster to true if it's not already
    if (!adminUser.isMaster) {
      console.log('Updating admin user to set isMaster to true...');
      await prisma.user.update({
        where: { id: adminUser.id },
        data: { isMaster: true }
      });
      console.log('Admin user updated successfully');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 