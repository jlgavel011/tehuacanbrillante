import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Get the last 30 days of production data
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // First get all products with their flavors
    const products = await prisma.producto.findMany({
      include: {
        sabor: true
      }
    });

    // Get production data
    const productionData = await prisma.produccion.findMany({
      where: {
        fechaProduccion: {
          gte: thirtyDaysAgo
        },
        estado: "completada" // Solo considerar producciones completadas
      },
      select: {
        productoId: true,
        cajasProducidas: true,
        cajasPlanificadas: true
      }
    });

    // Create a map to aggregate data by flavor
    const flavorMap = new Map<string, {
      name: string;
      cajas: number;
      planificadas: number;
    }>();

    // Process production data
    productionData.forEach(prod => {
      const product = products.find(p => p.id === prod.productoId);
      if (!product) return;

      const flavorId = product.saborId;
      const flavorName = product.sabor.nombre;
      
      const current = flavorMap.get(flavorId) || {
        name: flavorName,
        cajas: 0,
        planificadas: 0
      };

      current.cajas += prod.cajasProducidas;
      current.planificadas += prod.cajasPlanificadas;
      
      flavorMap.set(flavorId, current);
    });

    // Convert map to array and calculate compliance
    const result = Array.from(flavorMap.values()).map(flavor => ({
      ...flavor,
      cumplimiento: flavor.planificadas > 0 
        ? (flavor.cajas / flavor.planificadas) * 100 
        : 0
    }));

    // Sort by number of boxes in descending order
    result.sort((a, b) => b.cajas - a.cajas);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching production by flavor:', error);
    return NextResponse.json(
      { error: 'Error al obtener los datos de producción por sabor' },
      { status: 500 }
    );
  }
} 