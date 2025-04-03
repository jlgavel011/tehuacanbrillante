import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Get the last 30 days of production data
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const productionData = await prisma.produccion.groupBy({
      by: ['productoId'],
      where: {
        fechaProduccion: {
          gte: thirtyDaysAgo
        }
      },
      _sum: {
        cajasProducidas: true,
        cajasPlanificadas: true
      }
    });

    // Get product details
    const productIds = productionData.map(item => item.productoId);
    const products = await prisma.producto.findMany({
      where: {
        id: {
          in: productIds
        }
      },
      include: {
        sabor: true,
        modelo: true,
        tamaño: true
      }
    });

    // Combine the data
    const result = productionData.map(item => {
      const product = products.find(p => p.id === item.productoId);
      if (!product) return null;

      const productName = `${product.sabor.nombre} ${product.modelo.nombre} ${product.tamaño.litros}L`;
      const cajas = item._sum.cajasProducidas || 0;
      const planificadas = item._sum.cajasPlanificadas || 0;
      const cumplimiento = planificadas > 0 ? (cajas / planificadas) * 100 : 0;

      return {
        name: productName,
        cajas,
        planificadas,
        cumplimiento
      };
    }).filter(Boolean);

    // Sort by number of boxes in descending order
    result.sort((a, b) => b!.cajas - a!.cajas);

    // Return only top 10
    return NextResponse.json(result.slice(0, 10));
  } catch (error) {
    console.error('Error fetching total production by product:', error);
    return NextResponse.json(
      { error: 'Error al obtener los datos de producción por producto' },
      { status: 500 }
    );
  }
} 