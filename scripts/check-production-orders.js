// Script para verificar las órdenes de producción en la base de datos
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkProductionOrders() {
  try {
    console.log('Verificando órdenes de producción...');
    
    // Obtener todas las órdenes de producción
    const orders = await prisma.produccion.findMany({
      include: {
        lineaProduccion: true,
        producto: true,
      },
    });
    
    console.log(`Total de órdenes de producción: ${orders.length}`);
    
    if (orders.length > 0) {
      console.log('\nPrimeras 5 órdenes:');
      orders.slice(0, 5).forEach((order, index) => {
        console.log(`\nOrden #${index + 1}:`);
        console.log(`ID: ${order.id}`);
        console.log(`Número de orden: ${order.numeroOrden}`);
        console.log(`Cajas planificadas: ${order.cajasPlanificadas}`);
        console.log(`Cajas producidas: ${order.cajasProducidas}`);
        console.log(`Línea de producción: ${order.lineaProduccion.nombre}`);
        console.log(`Producto: ${order.producto.nombre}`);
      });
    } else {
      console.log('\nNo hay órdenes de producción en la base de datos.');
    }
  } catch (error) {
    console.error('Error al verificar las órdenes de producción:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkProductionOrders(); 