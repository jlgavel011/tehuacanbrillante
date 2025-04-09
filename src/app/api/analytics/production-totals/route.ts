import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { startOfDay, endOfDay, subDays, subMonths, subYears } from "date-fns";

export async function POST(req: Request) {
  try {
    const { startDate, endDate, comparisonPeriod } = await req.json();

    // Convertir las fechas a objetos Date y ajustar al inicio/fin del día
    const start = startOfDay(new Date(startDate));
    const end = endOfDay(new Date(endDate));

    // Calcular el período de comparación
    let comparisonStart, comparisonEnd;
    const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

    if (comparisonPeriod === "previous_period") {
      // Período anterior del mismo tamaño
      comparisonEnd = new Date(start);
      comparisonEnd.setDate(comparisonEnd.getDate() - 1);
      comparisonStart = new Date(comparisonEnd);
      comparisonStart.setDate(comparisonStart.getDate() - daysDiff);
    } else if (comparisonPeriod === "previous_year") {
      // Mismo período del año anterior
      comparisonStart = new Date(start);
      comparisonStart.setFullYear(comparisonStart.getFullYear() - 1);
      comparisonEnd = new Date(end);
      comparisonEnd.setFullYear(comparisonEnd.getFullYear() - 1);
    } else {
      // Por defecto, período anterior
      comparisonEnd = new Date(start);
      comparisonEnd.setDate(comparisonEnd.getDate() - 1);
      comparisonStart = new Date(comparisonEnd);
      comparisonStart.setDate(comparisonStart.getDate() - daysDiff);
    }

    // Obtener todas las producciones del período actual
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

    // Obtener todas las producciones del período de comparación
    const comparisonProductions = await prisma.produccion.findMany({
      where: {
        fechaProduccion: {
          gte: comparisonStart,
          lte: comparisonEnd,
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

    // Calcular totales para el período actual
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

    // Calcular totales para el período de comparación
    let comparisonTotalBoxes = 0;
    let comparisonTotalLiters = 0;

    for (const production of comparisonProductions) {
      // Sumar cajas producidas
      comparisonTotalBoxes += production.cajasProducidas;

      // Calcular litros: cajas * unidades por caja * litros por unidad
      if (production.producto?.tamaño?.litros && production.producto?.caja?.numeroUnidades) {
        const litersForProduction = 
          production.cajasProducidas * 
          production.producto.caja.numeroUnidades * 
          production.producto.tamaño.litros;
        
        comparisonTotalLiters += litersForProduction;
      }
    }

    // Calcular porcentajes de cambio
    const boxesPercentChange = comparisonTotalBoxes > 0 
      ? ((totalBoxes - comparisonTotalBoxes) / comparisonTotalBoxes) * 100 
      : 0;
    
    const litersPercentChange = comparisonTotalLiters > 0 
      ? ((totalLiters - comparisonTotalLiters) / comparisonTotalLiters) * 100 
      : 0;

    // Obtener el total de órdenes
    const totalOrders = await prisma.produccion.count({
      where: {
        fechaProduccion: {
          gte: start,
          lte: end,
        },
      },
    });

    // Obtener el total de órdenes del período de comparación
    const comparisonTotalOrders = await prisma.produccion.count({
      where: {
        fechaProduccion: {
          gte: comparisonStart,
          lte: comparisonEnd,
        },
      },
    });

    // Calcular el porcentaje de cambio en órdenes
    const ordersPercentChange = comparisonTotalOrders > 0 
      ? ((totalOrders - comparisonTotalOrders) / comparisonTotalOrders) * 100 
      : 0;

    return NextResponse.json({
      totalBoxes,
      totalLiters: Math.round(totalLiters), // Redondear a números enteros
      boxesPercentChange: Math.round(boxesPercentChange * 10) / 10, // Redondear a 1 decimal
      litersPercentChange: Math.round(litersPercentChange * 10) / 10, // Redondear a 1 decimal
      totalOrders,
      ordersPercentChange: Math.round(ordersPercentChange * 10) / 10, // Redondear a 1 decimal
      comparisonPeriod,
    });
  } catch (error) {
    console.error("Error al calcular totales de producción:", error);
    return NextResponse.json(
      { error: "Error al calcular totales de producción" },
      { status: 500 }
    );
  }
} 