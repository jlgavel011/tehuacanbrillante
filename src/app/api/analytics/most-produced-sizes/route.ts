import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

interface SizeData {
  nombre: string;
  cantidad: number;
  porcentaje: number;
}

export async function GET(request: Request) {
  try {
    // Obtener los parámetros de fecha de la URL
    const { searchParams } = new URL(request.url);
    const fromDate = searchParams.get('from');
    const toDate = searchParams.get('to');

    if (!fromDate || !toDate) {
      return NextResponse.json(
        { error: "Se requieren los parámetros 'from' y 'to'" },
        { status: 400 }
      );
    }

    const from = new Date(fromDate);
    const to = new Date(toDate);

    // Validar que las fechas sean válidas
    if (isNaN(from.getTime()) || isNaN(to.getTime())) {
      return NextResponse.json(
        { error: "Fechas inválidas" },
        { status: 400 }
      );
    }

    console.log("Buscando producciones desde:", from, "hasta:", to);

    // Primero verificar si hay producciones en el período
    const produccionesCount = await prisma.produccion.count({
      where: {
        fechaProduccion: {
          gte: from,
          lte: to
        },
        estado: {
          in: ["completada", "en_progreso"]
        }
      }
    });

    console.log("Número de producciones encontradas:", produccionesCount);

    if (produccionesCount === 0) {
      console.log("No se encontraron producciones en el período seleccionado");
      return NextResponse.json([]);
    }

    // Obtener los productos más producidos usando Prisma
    const productsData = await prisma.produccion.groupBy({
      by: ['productoId'],
      where: {
        fechaProduccion: {
          gte: from,
          lte: to
        },
        estado: {
          in: ["completada", "en_progreso"]
        }
      },
      _sum: {
        cajasProducidas: true
      }
    });

    // Obtener los detalles de los productos
    const productIds = productsData.map(p => p.productoId);
    const products = await prisma.producto.findMany({
      where: {
        id: {
          in: productIds
        }
      },
      include: {
        tamaño: true
      }
    });

    console.log("Productos encontrados:", products.length);

    // Agrupar por tamaño
    const sizeMap = new Map<string, number>();
    
    productsData.forEach(prod => {
      const product = products.find(p => p.id === prod.productoId);
      if (!product || !prod._sum.cajasProducidas) return;
      
      const sizeName = `${product.tamaño.litros}L`;
      const currentAmount = sizeMap.get(sizeName) || 0;
      sizeMap.set(sizeName, currentAmount + prod._sum.cajasProducidas);
    });

    // Convertir a array y calcular porcentajes
    const totalProduction = Array.from(sizeMap.values()).reduce((a, b) => a + b, 0);
    
    const result: SizeData[] = Array.from(sizeMap.entries())
      .map(([nombre, cantidad]) => ({
        nombre,
        cantidad,
        porcentaje: (cantidad / totalProduction) * 100
      }))
      .sort((a, b) => b.cantidad - a.cantidad);

    console.log("Resultado final:", result);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in most-produced-sizes:", error);
    return NextResponse.json(
      { error: "Error al obtener los tamaños más producidos" },
      { status: 500 }
    );
  }
} 