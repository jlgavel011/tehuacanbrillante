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

    // Get production data with line information
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
        cajasPlanificadas: true,
        lineaProduccion: {
          select: {
            id: true,
            nombre: true
          }
        }
      }
    });

    // Create a map to aggregate data by line
    const lineMap = new Map<string, {
      name: string;
      litros: number;
      litrosPlanificados: number;
    }>();

    // Process production data
    productionData.forEach(prod => {
      const product = products.find(p => p.id === prod.productoId);
      if (!product?.tamaño || !product.caja || !prod.lineaProduccion?.nombre) return;

      const lineId = prod.lineaProduccion.id;
      const lineName = prod.lineaProduccion.nombre;
      const litrosPorUnidad = product.tamaño.litros;
      const unidadesPorCaja = product.caja.numeroUnidades;
      
      const current = lineMap.get(lineId) || {
        name: lineName,
        litros: 0,
        litrosPlanificados: 0
      };

      // Calculate total liters: boxes * units per box * liters per unit
      current.litros += prod.cajasProducidas * unidadesPorCaja * litrosPorUnidad;
      current.litrosPlanificados += prod.cajasPlanificadas * unidadesPorCaja * litrosPorUnidad;
      
      lineMap.set(lineId, current);
    });

    // Convert map to array and calculate compliance
    const result = Array.from(lineMap.values()).map(line => ({
      ...line,
      cumplimiento: line.litrosPlanificados > 0 
        ? (line.litros / line.litrosPlanificados) * 100 
        : 0
    }));

    // Sort by number of liters in descending order
    result.sort((a, b) => b.litros - a.litros);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching production by line in liters:', error);
    return NextResponse.json(
      { error: 'Error al obtener los datos de producción por línea en litros' },
      { status: 500 }
    );
  }
} 