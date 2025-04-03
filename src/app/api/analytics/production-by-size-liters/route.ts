import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Get the last 30 days of production data
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // First get all products with their sizes and boxes
    const products = await prisma.producto.findMany({
      include: {
        tamaño: true,
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

    // Create a map to aggregate data by size
    const sizeMap = new Map<string, {
      name: string;
      litros: number;
      litrosPlanificados: number;
    }>();

    // Process production data
    productionData.forEach(prod => {
      const product = products.find(p => p.id === prod.productoId);
      if (!product?.tamaño?.nombre || !product.caja) return;

      const sizeId = product.tamañoId;
      const sizeName = product.tamaño.nombre;
      const litrosPorUnidad = product.tamaño.litros;
      const unidadesPorCaja = product.caja.numeroUnidades;
      
      const current = sizeMap.get(sizeId) || {
        name: sizeName,
        litros: 0,
        litrosPlanificados: 0
      };

      // Calculate total liters: boxes * units per box * liters per unit
      current.litros += prod.cajasProducidas * unidadesPorCaja * litrosPorUnidad;
      current.litrosPlanificados += prod.cajasPlanificadas * unidadesPorCaja * litrosPorUnidad;
      
      sizeMap.set(sizeId, current);
    });

    // Convert map to array and calculate compliance
    const result = Array.from(sizeMap.values()).map(size => ({
      ...size,
      cumplimiento: size.litrosPlanificados > 0 
        ? (size.litros / size.litrosPlanificados) * 100 
        : 0
    }));

    // Sort by number of liters in descending order
    result.sort((a, b) => b.litros - a.litros);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching production by size in liters:', error);
    return NextResponse.json(
      { error: 'Error al obtener los datos de producción por tamaño en litros' },
      { status: 500 }
    );
  }
} 