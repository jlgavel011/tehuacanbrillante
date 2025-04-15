const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Attempting to reset admin password...');
    
    // Find admin user
    const adminUser = await prisma.user.findUnique({
      where: {
        email: 'admin@tehuacanbrillante.com'
      }
    });

    if (!adminUser) {
      console.log('Admin user not found!');
      return;
    }
    
    console.log('Admin user found:', {
      id: adminUser.id,
      email: adminUser.email,
      role: adminUser.role
    });
    
    // Generate new password hash
    const newPassword = 'admin123'; // You can change this
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update admin password
    await prisma.user.update({
      where: { id: adminUser.id },
      data: { 
        password: hashedPassword,
        isMaster: true // Ensure admin has master privileges
      }
    });
    
    console.log('Admin password has been reset successfully!');
    console.log('New credentials:');
    console.log('Email:', adminUser.email);
    console.log('Password:', newPassword);
    
  } catch (error) {
    console.error('Error resetting admin password:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 