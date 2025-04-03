import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import type { Producto } from "@prisma/client";

interface ProductWithProduction extends Producto {
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

    // Get all products with their production data
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

    // Process each product
    const result = products.map((product) => {
      const totalCajas = product.producciones.reduce((sum: number, p) => sum + p.cajasProducidas, 0);
      const totalCajasPlanificadas = product.producciones.reduce((sum: number, p) => sum + p.cajasPlanificadas, 0);

      return {
        name: product.nombre,
        cajas: totalCajas,
        cajasPlanificadas: totalCajasPlanificadas,
        cumplimiento: totalCajasPlanificadas > 0 
          ? (totalCajas / totalCajasPlanificadas) * 100 
          : 0,
      };
    });

    // Sort by number of boxes in descending order
    result.sort((a, b) => b.cajas - a.cajas);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching total production by product boxes:", error);
    return NextResponse.json(
      { error: "Error al obtener los datos de producción total por producto" },
      { status: 500 }
    );
  }
} 