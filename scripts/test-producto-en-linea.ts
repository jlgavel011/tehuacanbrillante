import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    // Get a random product
    const producto = await prisma.producto.findFirst();
    if (!producto) {
      console.error('No products found');
      return;
    }

    // Get a random production line
    const lineaProduccion = await prisma.lineaProduccion.findFirst();
    if (!lineaProduccion) {
      console.error('No production lines found');
      return;
    }

    console.log('Found product:', producto.id, producto.nombre);
    console.log('Found production line:', lineaProduccion.id, lineaProduccion.nombre);

    // Check if the relation already exists
    const existingRelation = await prisma.productoEnLinea.findFirst({
      where: {
        productoId: producto.id,
        lineaProduccionId: lineaProduccion.id,
      },
    });

    if (existingRelation) {
      console.log('Relation already exists:', existingRelation);
      return;
    }

    // Create the relation
    const productoEnLinea = await prisma.productoEnLinea.create({
      data: {
        productoId: producto.id,
        lineaProduccionId: lineaProduccion.id,
        velocidadProduccion: 100,
      },
    });

    console.log('Created relation:', productoEnLinea);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 