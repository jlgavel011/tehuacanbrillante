import { prisma } from "./prisma";
import bcrypt from "bcryptjs";

/**
 * Seeds the database with initial data for development
 */
export async function seedDatabase() {
  try {
    console.log("Attempting to connect to database...");
    
    // Check if users already exist to avoid duplicates
    const usersCount = await prisma.user.count();
    console.log(`Found ${usersCount} existing users`);
    
    if (usersCount === 0) {
      console.log("Seeding database with initial users...");
      
      // Create guest user
      const hashedGuestPassword = await bcrypt.hash("invitado123", 10);
      await prisma.user.create({
        data: {
          name: "Invitado",
          email: "invitado@tehuacanbrillante.com",
          password: hashedGuestPassword,
          role: "PRODUCTION_CHIEF",
        },
      });
      console.log("Guest user created");
      
      // Create admin user
      const hashedAdminPassword = await bcrypt.hash("admin123", 10);
      await prisma.user.create({
        data: {
          name: "Administrador",
          email: "admin@tehuacanbrillante.com",
          password: hashedAdminPassword,
          role: "MASTER_ADMIN",
        },
      });
      console.log("Admin user created");
      
      // Create manager user
      const hashedManagerPassword = await bcrypt.hash("manager123", 10);
      await prisma.user.create({
        data: {
          name: "Gerente",
          email: "gerente@tehuacanbrillante.com",
          password: hashedManagerPassword,
          role: "MANAGER",
        },
      });
      console.log("Manager user created");
      
      console.log("Database seeded successfully with users!");
    } else {
      console.log("Database already has users, skipping user seed...");
    }
    
    // Seed other essential data like TipoParo if needed
    const tipoParoCount = await prisma.tipoParo.count();
    console.log(`Found ${tipoParoCount} existing paro types`);
    
    if (tipoParoCount === 0) {
      console.log("Seeding database with initial paro types...");
      
      await prisma.tipoParo.createMany({
        data: [
          { nombre: "Mantenimiento" },
          { nombre: "Calidad" },
          { nombre: "Operativo" }
        ],
      });
      
      console.log("Paro types seeded successfully!");
    } else {
      console.log("Database already has paro types, skipping paro types seed...");
    }
    
    return { success: true, message: "Database seeding completed successfully" };
  } catch (error) {
    console.error("Error seeding database:", error);
    return { 
      success: false, 
      message: "Failed to seed database", 
      error: error instanceof Error ? error.message : String(error) 
    };
  }
} 