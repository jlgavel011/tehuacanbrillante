import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import type { Producto } from "@prisma/client";

interface ProductWithProduction extends Producto {
  modelo: {
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

    // Get all products with their models
    const products = await prisma.producto.findMany({
      where: {
        producciones: {
          some: {
            fechaProduccion: {
              gte: thirtyDaysAgo,
            },
          },
        },
      },
      include: {
        modelo: true,
        producciones: {
          where: {
            fechaProduccion: {
              gte: thirtyDaysAgo,
            },
          },
          select: {
            cajasProducidas: true,
            cajasPlanificadas: true,
          },
        },
      },
    }) as unknown as ProductWithProduction[];

    // Create a map to aggregate production data by model
    const modelMap = new Map<string, { cajas: number; cajasPlanificadas: number }>();

    // Process each product
    products.forEach((product: ProductWithProduction) => {
      const modelName = product.modelo.nombre;
      
      const totalCajas = product.producciones.reduce((sum: number, p) => sum + p.cajasProducidas, 0);
      const totalCajasPlanificadas = product.producciones.reduce((sum: number, p) => sum + p.cajasPlanificadas, 0);

      if (modelMap.has(modelName)) {
        const current = modelMap.get(modelName)!;
        modelMap.set(modelName, {
          cajas: current.cajas + totalCajas,
          cajasPlanificadas: current.cajasPlanificadas + totalCajasPlanificadas,
        });
      } else {
        modelMap.set(modelName, {
          cajas: totalCajas,
          cajasPlanificadas: totalCajasPlanificadas,
        });
      }
    });

    // Convert map to array and calculate compliance
    const result = Array.from(modelMap.entries()).map(([name, data]) => ({
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
    console.error("Error fetching production by model boxes:", error);
    return NextResponse.json(
      { error: "Error al obtener los datos de producción por modelo" },
      { status: 500 }
    );
  }
} 