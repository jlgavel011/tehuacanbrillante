import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { parseISO, addDays } from "date-fns";

// Interfaz para los datos del mapa de calor por hora
interface HourProductionData {
  hour: string; // Hora formateada (00:00, 01:00, etc.)
  hourIndex: number; // Índice de la hora (0-23)
  cajasProducidas: number;
  litrosProducidos: number;
  totalRegistros: number;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    
    if (!from || !to) {
      return NextResponse.json(
        { error: "Los parámetros 'from' y 'to' son requeridos" },
        { status: 400 }
      );
    }

    const fromDate = parseISO(from);
    const toDate = addDays(parseISO(to), 1); // Incluir el día final completo

    // Obtener todas las producciones por hora en el rango de fechas
    const productionData = await (prisma as any).produccionPorHora.findMany({
      where: {
        horaRegistro: {
          gte: fromDate,
          lt: toDate,
        },
      },
      include: {
        produccion: {
          include: {
            producto: {
              include: {
                tamaño: true,
                caja: true,
              },
            },
          },
        },
      },
    });

    // Inicializar datos para las 24 horas
    const hourData: HourProductionData[] = Array.from({ length: 24 }, (_, i) => {
      const hourFormatted = i.toString().padStart(2, '0') + ':00';
      return {
        hour: hourFormatted,
        hourIndex: i,
        cajasProducidas: 0,
        litrosProducidos: 0,
        totalRegistros: 0,
      };
    });

    // Procesar los datos de producción
    productionData.forEach((record: any) => {
      const hour = record.horaRegistro.getHours();
      const cajas = record.cajasProducidas || 0;
      const litrosPorUnidad = record.produccion.producto.tamaño?.litros || 0;
      const unidadesPorCaja = record.produccion.producto.caja?.numeroUnidades || 0;
      const litros = cajas * litrosPorUnidad * unidadesPorCaja;
      
      hourData[hour].cajasProducidas += cajas;
      hourData[hour].litrosProducidos += litros;
      hourData[hour].totalRegistros += 1;
    });

    // Calcular totales y máximos
    const totalCajas = hourData.reduce((sum, hour) => sum + hour.cajasProducidas, 0);
    const totalLitros = hourData.reduce((sum, hour) => sum + hour.litrosProducidos, 0);
    const maxCajasHora = Math.max(...hourData.map(hour => hour.cajasProducidas));
    const maxLitrosHora = Math.max(...hourData.map(hour => hour.litrosProducidos));

    return NextResponse.json({
      data: hourData,
      totalCajas,
      totalLitros,
      maxCajasHora,
      maxLitrosHora,
    });
  } catch (error) {
    console.error("Error en el endpoint production-heatmap-by-hour:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
} 