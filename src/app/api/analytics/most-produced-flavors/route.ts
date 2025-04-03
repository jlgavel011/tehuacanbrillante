import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

interface FlavorData {
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

    if (produccionesCount === 0) {
      return NextResponse.json([]);
    }

    // Obtener los sabores más producidos usando Prisma
    const productionData = await prisma.produccion.groupBy({
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

    // Obtener los detalles de los productos y sus sabores
    const productIds = productionData.map(p => p.productoId);
    const products = await prisma.producto.findMany({
      where: {
        id: {
          in: productIds
        }
      },
      include: {
        sabor: true
      }
    });

    // Agrupar por sabor
    const flavorProduction = products.reduce<Record<string, number>>((acc, product) => {
      const production = productionData.find(p => p.productoId === product.id);
      const cantidad = production?._sum.cajasProducidas || 0;
      
      if (!acc[product.sabor.nombre]) {
        acc[product.sabor.nombre] = 0;
      }
      acc[product.sabor.nombre] += cantidad;
      
      return acc;
    }, {});

    // Convertir a array y calcular porcentajes
    const totalProduction = Object.values(flavorProduction).reduce((a, b) => a + b, 0);
    
    const result: FlavorData[] = Object.entries(flavorProduction)
      .map(([nombre, cantidad]) => ({
        nombre,
        cantidad,
        porcentaje: (cantidad / totalProduction) * 100
      }))
      .sort((a, b) => b.cantidad - a.cantidad);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in most-produced-flavors:", error);
    return NextResponse.json(
      { error: "Error al obtener los sabores más producidos" },
      { status: 500 }
    );
  }
} 