const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Creating a new test user...');
    
    // Create test user credentials
    const email = 'test@tehuacanbrillante.com';
    const password = 'test123';
    const name = 'Usuario de Prueba';
    const role = 'MASTER_ADMIN';
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });
    
    if (existingUser) {
      console.log('User with this email already exists. Updating password...');
      
      // Update existing user
      const hashedPassword = await bcrypt.hash(password, 10);
      await prisma.user.update({
        where: { id: existingUser.id },
        data: { 
          password: hashedPassword,
          name,
          role,
          isMaster: true
        }
      });
      
      console.log('User updated successfully!');
      
    } else {
      // Create new user
      const hashedPassword = await bcrypt.hash(password, 10);
      
      const newUser = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          role,
          isMaster: true
        }
      });
      
      console.log('New user created successfully:', {
        id: newUser.id,
        email: newUser.email,
        role: newUser.role
      });
    }
    
    console.log('Test user credentials:');
    console.log('Email:', email);
    console.log('Password:', password);
    
  } catch (error) {
    console.error('Error creating test user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 