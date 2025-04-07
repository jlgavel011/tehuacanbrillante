import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { startOfDay, endOfDay } from "date-fns";

export async function POST(req: Request) {
  try {
    const { startDate, endDate } = await req.json();

    // Convertir las fechas a objetos Date y ajustar al inicio/fin del día
    const start = startOfDay(new Date(startDate));
    const end = endOfDay(new Date(endDate));

    // Obtener todas las producciones en el rango de fechas con sus productos relacionados
    const productions = await prisma.produccion.findMany({
      where: {
        fechaProduccion: {
          gte: start,
          lte: end,
        },
      },
      include: {
        producto: {
          include: {
            tamaño: true,
            caja: true,
            sabor: true,
            modelo: true,
          },
        },
      },
    });

    // Agrupar por producto y calcular totales
    const productTotals = productions.reduce((acc, production) => {
      const productId = production.producto.id;
      const productName = `${production.producto.nombre} - ${production.producto.sabor.nombre} ${production.producto.tamaño.litros}L`;
      
      if (!acc[productId]) {
        acc[productId] = {
          id: productId,
          name: productName,
          totalBoxes: 0,
          totalLiters: 0,
        };
      }

      // Sumar cajas
      acc[productId].totalBoxes += production.cajasProducidas;

      // Calcular y sumar litros
      const liters = 
        production.cajasProducidas * 
        production.producto.caja.numeroUnidades * 
        production.producto.tamaño.litros;
      
      acc[productId].totalLiters += liters;

      return acc;
    }, {} as Record<string, { id: string; name: string; totalBoxes: number; totalLiters: number; }>);

    // Convertir a array y ordenar por cajas y litros
    const productsArray = Object.values(productTotals);
    
    const topByBoxes = [...productsArray]
      .sort((a, b) => b.totalBoxes - a.totalBoxes)
      .slice(0, 5);

    const topByLiters = [...productsArray]
      .sort((a, b) => b.totalLiters - a.totalLiters)
      .slice(0, 5);

    return NextResponse.json({
      byBoxes: topByBoxes,
      byLiters: topByLiters,
    });
  } catch (error) {
    console.error("Error al obtener top productos:", error);
    return NextResponse.json(
      { error: "Error al obtener top productos" },
      { status: 500 }
    );
  }
} 