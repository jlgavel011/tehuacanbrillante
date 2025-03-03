const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  // Create stop types - only the three required types
  const stopTypes = [
    { nombre: "Mantenimiento" },
    { nombre: "Calidad" },
    { nombre: "Operación" }
  ];

  console.log("Seeding stop types...");

  // First, delete any existing stop types that are not in our list
  const existingTypes = await prisma.tipoParo.findMany();
  for (const existingType of existingTypes) {
    if (!stopTypes.some(type => type.nombre.toLowerCase() === existingType.nombre.toLowerCase())) {
      await prisma.tipoParo.delete({
        where: { id: existingType.id }
      });
      console.log(`Deleted stop type: ${existingType.nombre}`);
    }
  }

  // Then create or update the required types
  for (const stopType of stopTypes) {
    // Check if the stop type already exists
    const existingStopType = await prisma.tipoParo.findFirst({
      where: {
        nombre: {
          equals: stopType.nombre,
          mode: "insensitive"
        }
      }
    });

    if (!existingStopType) {
      await prisma.tipoParo.create({
        data: stopType
      });
      console.log(`Created stop type: ${stopType.nombre}`);
    } else {
      console.log(`Stop type already exists: ${stopType.nombre}`);
    }
  }

  console.log("Seeding completed!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 