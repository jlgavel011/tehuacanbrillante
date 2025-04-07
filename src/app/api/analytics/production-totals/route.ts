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
          },
        },
      },
    });

    // Calcular totales
    let totalBoxes = 0;
    let totalLiters = 0;

    for (const production of productions) {
      // Sumar cajas producidas
      totalBoxes += production.cajasProducidas;

      // Calcular litros: cajas * unidades por caja * litros por unidad
      if (production.producto?.tamaño?.litros && production.producto?.caja?.numeroUnidades) {
        const litersForProduction = 
          production.cajasProducidas * 
          production.producto.caja.numeroUnidades * 
          production.producto.tamaño.litros;
        
        totalLiters += litersForProduction;
      }
    }

    return NextResponse.json({
      totalBoxes,
      totalLiters: Math.round(totalLiters), // Redondear a números enteros
    });
  } catch (error) {
    console.error("Error al calcular totales de producción:", error);
    return NextResponse.json(
      { error: "Error al calcular totales de producción" },
      { status: 500 }
    );
  }
} 