import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Get the last 30 days of production data
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // First get all products with their sizes
    const products = await prisma.producto.findMany({
      include: {
        tamaño: true
      }
    });

    // Get production data
    const productionData = await prisma.produccion.findMany({
      where: {
        fechaProduccion: {
          gte: thirtyDaysAgo
        }
      },
      select: {
        productoId: true,
        cajasProducidas: true,
        cajasPlanificadas: true
      }
    });

    // Create a map to aggregate data by size
    const sizeMap = new Map<string, {
      name: string;
      litros: number;
      cajas: number;
      planificadas: number;
    }>();

    // Process production data
    productionData.forEach(prod => {
      const product = products.find(p => p.id === prod.productoId);
      if (!product) return;

      const sizeId = product.tamañoId;
      const sizeName = `${product.tamaño.litros}L`;
      const litros = product.tamaño.litros;
      
      const current = sizeMap.get(sizeId) || {
        name: sizeName,
        litros: litros,
        cajas: 0,
        planificadas: 0
      };

      current.cajas += prod.cajasProducidas;
      current.planificadas += prod.cajasPlanificadas;
      
      sizeMap.set(sizeId, current);
    });

    // Convert map to array and calculate compliance
    const result = Array.from(sizeMap.values()).map(size => ({
      ...size,
      cumplimiento: size.planificadas > 0 
        ? (size.cajas / size.planificadas) * 100 
        : 0
    }));

    // Sort by number of boxes in descending order
    result.sort((a, b) => b.cajas - a.cajas);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching production by size:', error);
    return NextResponse.json(
      { error: 'Error al obtener los datos de producción por tamaño' },
      { status: 500 }
    );
  }
} 