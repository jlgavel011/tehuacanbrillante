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
        sabor: true,
        modelo: true,
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

    // Create a map to aggregate data by product
    const productMap = new Map<string, {
      name: string;
      litros: number;
      litrosPlanificados: number;
    }>();

    // Process production data
    productionData.forEach(prod => {
      const product = products.find(p => p.id === prod.productoId);
      if (!product?.tamaño || !product.caja) return;

      const productId = product.id;
      const productName = `${product.sabor.nombre} ${product.modelo.nombre} ${product.tamaño.litros}L`;
      const litrosPorUnidad = product.tamaño.litros;
      const unidadesPorCaja = product.caja.numeroUnidades;
      
      const current = productMap.get(productId) || {
        name: productName,
        litros: 0,
        litrosPlanificados: 0
      };

      // Calculate total liters: boxes * units per box * liters per unit
      current.litros += prod.cajasProducidas * unidadesPorCaja * litrosPorUnidad;
      current.litrosPlanificados += prod.cajasPlanificadas * unidadesPorCaja * litrosPorUnidad;
      
      productMap.set(productId, current);
    });

    // Convert map to array and calculate compliance
    const result = Array.from(productMap.values()).map(product => ({
      ...product,
      cumplimiento: product.litrosPlanificados > 0 
        ? (product.litros / product.litrosPlanificados) * 100 
        : 0
    }));

    // Sort by number of liters in descending order
    result.sort((a, b) => b.litros - a.litros);

    // Return only top 10
    return NextResponse.json(result.slice(0, 10));
  } catch (error) {
    console.error('Error fetching total production by product in liters:', error);
    return NextResponse.json(
      { error: 'Error al obtener los datos de producción por producto en litros' },
      { status: 500 }
    );
  }
} 