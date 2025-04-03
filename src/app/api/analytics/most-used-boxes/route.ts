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
        cajasProducidas: true
      }
    });

    // Create a map to aggregate data by box type
    const boxMap = new Map<string, {
      name: string;
      numeroUnidades: number;
      cajasTotales: number;
      unidadesTotales: number;
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
        numeroUnidades: unitsPerBox,
        cajasTotales: 0,
        unidadesTotales: 0
      };

      current.cajasTotales += prod.cajasProducidas;
      current.unidadesTotales += prod.cajasProducidas * unitsPerBox;
      
      boxMap.set(boxId, current);
    });

    // Convert map to array
    const result = Array.from(boxMap.values());

    // Sort by total units in descending order
    result.sort((a, b) => b.unidadesTotales - a.unidadesTotales);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching most used boxes:', error);
    return NextResponse.json(
      { error: 'Error al obtener los datos de cajas más usadas' },
      { status: 500 }
    );
  }
} 