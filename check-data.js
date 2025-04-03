const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    // Contar producciones
    const count = await prisma.produccion.count();
    console.log('Total producciones:', count);

    // Obtener una muestra
    const sample = await prisma.produccion.findFirst({
      include: {
        producto: {
          include: {
            modelo: true,
            sabor: true,
            tamaño: true
          }
        }
      }
    });
    console.log('Muestra:', JSON.stringify(sample, null, 2));

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 