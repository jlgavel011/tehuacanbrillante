import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Get the last 30 days of production data
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // First get all products with their boxes
    const products = await prisma.producto.findMany({
      include: {
        caja: true
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

    // Create a map to aggregate data by box type
    const boxMap = new Map<string, {
      name: string;
      cajas: number;
      cajasPlanificadas: number;
      unidades: number;
      unidadesPlanificadas: number;
    }>();

    // Process production data
    productionData.forEach(prod => {
      const product = products.find(p => p.id === prod.productoId);
      if (!product?.caja?.nombre || !product.caja.numeroUnidades) return;

      const boxId = product.cajaId;
      const boxName = product.caja.nombre;
      const unitsPerBox = product.caja.numeroUnidades;
      
      const current = boxMap.get(boxId) || {
        name: boxName,
        cajas: 0,
        cajasPlanificadas: 0,
        unidades: 0,
        unidadesPlanificadas: 0
      };

      current.cajas += prod.cajasProducidas;
      current.cajasPlanificadas += prod.cajasPlanificadas;
      current.unidades += prod.cajasProducidas * unitsPerBox;
      current.unidadesPlanificadas += prod.cajasPlanificadas * unitsPerBox;
      
      boxMap.set(boxId, current);
    });

    // Convert map to array and calculate compliance
    const result = Array.from(boxMap.values()).map(box => ({
      ...box,
      cumplimiento: box.cajasPlanificadas > 0 
        ? (box.cajas / box.cajasPlanificadas) * 100 
        : 0
    }));

    // Sort by number of boxes in descending order
    result.sort((a, b) => b.cajas - a.cajas);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching production by box type:', error);
    return NextResponse.json(
      { error: 'Error al obtener los datos de producción por tipo de caja' },
      { status: 500 }
    );
  }
} 