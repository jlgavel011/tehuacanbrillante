import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

interface SizeData {
  name: string;
  cajas: number;
}

export async function GET() {
  try {
    // Get the last 30 days for analysis
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Fetch production data and group by size
    const produccion = await prisma.produccion.groupBy({
      by: ['productoId'],
      where: {
        createdAt: {
          gte: thirtyDaysAgo
        }
      },
      _sum: {
        cajasProducidas: true
      }
    });

    // Fetch productos with their tamaños
    const productoIds = produccion.map(p => p.productoId);
    const productos = await prisma.producto.findMany({
      where: {
        id: {
          in: productoIds
        }
      },
      include: {
        tamaño: true
      }
    });

    // Group by tamaño
    const sizeMap = new Map<string, number>();
    produccion.forEach(prod => {
      const producto = productos.find(p => p.id === prod.productoId);
      if (producto?.tamaño) {
        const currentTotal = sizeMap.get(producto.tamaño.id) || 0;
        sizeMap.set(producto.tamaño.id, currentTotal + (prod._sum.cajasProducidas || 0));
      }
    });

    // Fetch tamaño details
    const tamaños = await prisma.tamaño.findMany({
      where: {
        id: {
          in: Array.from(sizeMap.keys())
        }
      }
    });

    // Create final result
    const result: SizeData[] = tamaños.map(tamaño => ({
      name: tamaño.nombre || `${tamaño.litros}L`,
      cajas: sizeMap.get(tamaño.id) || 0
    }));

    // Sort by cajas in descending order
    result.sort((a, b) => b.cajas - a.cajas);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching most produced sizes:', error);
    return NextResponse.json(
      { error: 'Error al obtener los datos de tamaños más producidos' },
      { status: 500 }
    );
  }
} 