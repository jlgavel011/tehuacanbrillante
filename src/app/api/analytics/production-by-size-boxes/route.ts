import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import type { Producto } from "@prisma/client";

interface ProductWithProduction extends Producto {
  tamaño: {
    nombre: string;
  };
  producciones: {
    cajasProducidas: number;
    cajasPlanificadas: number;
  }[];
}

export async function GET() {
  try {
    // Get production data from the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get all products with their sizes
    const products = await prisma.producto.findMany({
      where: {
        producciones: {
          some: {
            fechaProduccion: {
              gte: thirtyDaysAgo,
            },
        estado: "completada" // Solo considerar producciones completadas,
          },
        },
      },
      include: {
        tamaño: true,
        producciones: {
          where: {
            fechaProduccion: {
              gte: thirtyDaysAgo,
            },
        estado: "completada" // Solo considerar producciones completadas,
          },
          select: {
            cajasProducidas: true,
            cajasPlanificadas: true,
          },
        },
      },
    }) as unknown as ProductWithProduction[];

    // Create a map to aggregate production data by size
    const sizeMap = new Map<string, { cajas: number; cajasPlanificadas: number }>();

    // Process each product
    products.forEach((product: ProductWithProduction) => {
      const sizeName = product.tamaño.nombre;
      
      const totalCajas = product.producciones.reduce((sum: number, p) => sum + p.cajasProducidas, 0);
      const totalCajasPlanificadas = product.producciones.reduce((sum: number, p) => sum + p.cajasPlanificadas, 0);

      if (sizeMap.has(sizeName)) {
        const current = sizeMap.get(sizeName)!;
        sizeMap.set(sizeName, {
          cajas: current.cajas + totalCajas,
          cajasPlanificadas: current.cajasPlanificadas + totalCajasPlanificadas,
        });
      } else {
        sizeMap.set(sizeName, {
          cajas: totalCajas,
          cajasPlanificadas: totalCajasPlanificadas,
        });
      }
    });

    // Convert map to array and calculate compliance
    const result = Array.from(sizeMap.entries()).map(([name, data]) => ({
      name,
      cajas: data.cajas,
      cajasPlanificadas: data.cajasPlanificadas,
      cumplimiento: data.cajasPlanificadas > 0 
        ? (data.cajas / data.cajasPlanificadas) * 100 
        : 0,
    }));

    // Sort by number of boxes in descending order
    result.sort((a, b) => b.cajas - a.cajas);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching production by size boxes:", error);
    return NextResponse.json(
      { error: "Error al obtener los datos de producción por tamaño" },
      { status: 500 }
    );
  }
} 