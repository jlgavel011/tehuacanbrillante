import { seedDatabase } from "./seed";

// In development, seed the database with initial data
if (process.env.NODE_ENV !== "production") {
  console.log("Development environment detected, attempting to seed database...");
  
  // Use an immediately invoked async function to handle the Promise
  (async () => {
    try {
      const result = await seedDatabase();
      if (result.success) {
        console.log(`Database seeding: ${result.message}`);
      } else {
        console.error(`Database seeding failed: ${result.message}`, result.error);
      }
    } catch (error) {
      console.error("Unhandled error during database seeding:", error);
    }
  })();
}

export * from "./prisma"; 