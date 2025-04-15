const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Checking database connection...');
    
    // Test database connection
    const usersCount = await prisma.user.count();
    console.log(`Connection successful! Found ${usersCount} users in database.`);
    
    // Try to authenticate with admin credentials
    const email = 'admin@tehuacanbrillante.com';
    const password = 'admin123';
    
    console.log(`Attempting to authenticate with email: ${email}`);
    
    const user = await prisma.user.findUnique({
      where: { email }
    });
    
    if (!user) {
      console.log('User not found with this email!');
      return;
    }
    
    console.log('User found:', {
      id: user.id,
      email: user.email,
      role: user.role,
      passwordStored: !!user.password
    });
    
    // Test password
    if (!user.password) {
      console.log('User has no password set!');
      return;
    }
    
    const isPasswordValid = await bcrypt.compare(password, user.password);
    console.log('Password valid:', isPasswordValid);
    
    if (!isPasswordValid) {
      // Log the stored hash for debugging
      console.log('Stored password hash:', user.password);
      
      // Generate a new hash with the known password for comparison
      const newHash = await bcrypt.hash(password, 10);
      console.log('New hash generated with same password:', newHash);
      
      // Create a test hash with exact rounds for debugging
      const testHash = await bcrypt.hash(password, 10);
      console.log('Test hash with bcrypt rounds=10:', testHash);
    }
    
  } catch (error) {
    console.error('Error connecting to database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 