import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Get the last 30 days of production data
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // First get all products with their sizes, boxes, and models
    const products = await prisma.producto.findMany({
      include: {
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
        },
        estado: "completada" // Solo considerar producciones completadas
      },
      select: {
        productoId: true,
        cajasProducidas: true,
        cajasPlanificadas: true
      }
    });

    // Create a map to aggregate data by model
    const modelMap = new Map<string, {
      name: string;
      litros: number;
      litrosPlanificados: number;
    }>();

    // Process production data
    productionData.forEach(prod => {
      const product = products.find(p => p.id === prod.productoId);
      if (!product?.tamaño || !product.caja || !product.modelo) return;

      const modelId = product.modeloId;
      const modelName = product.modelo.nombre;
      const litrosPorUnidad = product.tamaño.litros;
      const unidadesPorCaja = product.caja.numeroUnidades;
      
      const current = modelMap.get(modelId) || {
        name: modelName,
        litros: 0,
        litrosPlanificados: 0
      };

      // Calculate total liters: boxes * units per box * liters per unit
      current.litros += prod.cajasProducidas * unidadesPorCaja * litrosPorUnidad;
      current.litrosPlanificados += prod.cajasPlanificadas * unidadesPorCaja * litrosPorUnidad;
      
      modelMap.set(modelId, current);
    });

    // Convert map to array and calculate compliance
    const result = Array.from(modelMap.values()).map(model => ({
      ...model,
      cumplimiento: model.litrosPlanificados > 0 
        ? (model.litros / model.litrosPlanificados) * 100 
        : 0
    }));

    // Sort by number of liters in descending order
    result.sort((a, b) => b.litros - a.litros);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching production by model in liters:', error);
    return NextResponse.json(
      { error: 'Error al obtener los datos de producción por modelo en litros' },
      { status: 500 }
    );
  }
} 