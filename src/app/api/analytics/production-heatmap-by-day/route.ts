import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { addDays, parseISO, format } from "date-fns";
import { es } from "date-fns/locale";

// Interfaz para los datos del mapa de calor por día
interface DayProductionData {
  day: string; // Nombre del día (Lunes, Martes, etc.)
  dayIndex: number; // Índice del día (0-6, donde 0 es lunes)
  cajasProducidas: number;
  litrosProducidos: number;
  totalRegistros: number;
}

// Interfaz para el registro de producción por hora
interface ProduccionPorHoraRecord {
  horaRegistro: Date;
  cajasProducidas: number;
  produccion: {
    producto: {
      tamaño: {
        litros: number;
      };
      caja: {
        numeroUnidades: number;
      };
    };
  };
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
    const toDate = addDays(parseISO(to), 1); // Incluir el día final

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

    // Mapear los días de la semana (0 = lunes, 6 = domingo)
    const daysOfWeek = [
      { name: "Lunes", index: 1 },
      { name: "Martes", index: 2 },
      { name: "Miércoles", index: 3 },
      { name: "Jueves", index: 4 },
      { name: "Viernes", index: 5 },
      { name: "Sábado", index: 6 },
      { name: "Domingo", index: 0 },
    ];

    // Inicializar el mapa para almacenar la producción por día
    const productionByDayMap = new Map<number, {
      cajasProducidas: number,
      litrosProducidos: number,
      totalRegistros: number
    }>();

    // Inicializar el mapa con todos los días de la semana
    daysOfWeek.forEach(day => {
      productionByDayMap.set(day.index, {
        cajasProducidas: 0,
        litrosProducidos: 0,
        totalRegistros: 0
      });
    });

    // Procesar los datos de producción
    productionData.forEach((record: any) => {
      const dayOfWeek = record.horaRegistro.getDay(); // 0 para domingo, 1 para lunes, etc.
      const litrosPorUnidad = record.produccion.producto.tamaño.litros;
      const cajas = record.cajasProducidas;
      const unidadesPorCaja = record.produccion.producto.caja.numeroUnidades;
      const litros = cajas * litrosPorUnidad * unidadesPorCaja;

      const dayData = productionByDayMap.get(dayOfWeek);
      if (dayData) {
        dayData.cajasProducidas += cajas;
        dayData.litrosProducidos += litros;
        dayData.totalRegistros += 1;
      }
    });

    // Convertir el mapa a un array para la respuesta
    const result: DayProductionData[] = daysOfWeek.map(day => {
      const data = productionByDayMap.get(day.index) || {
        cajasProducidas: 0,
        litrosProducidos: 0,
        totalRegistros: 0
      };
      
      return {
        day: day.name,
        dayIndex: day.index,
        cajasProducidas: data.cajasProducidas,
        litrosProducidos: data.litrosProducidos,
        totalRegistros: data.totalRegistros
      };
    });

    // Ordenar por índice del día (empezando por lunes)
    result.sort((a, b) => {
      // Convertir domingo (0) a 7 para que sea el último día
      const adjustedA = a.dayIndex === 0 ? 7 : a.dayIndex;
      const adjustedB = b.dayIndex === 0 ? 7 : b.dayIndex;
      return adjustedA - adjustedB;
    });

    return NextResponse.json({
      data: result,
      totalCajas: result.reduce((sum, day) => sum + day.cajasProducidas, 0),
      totalLitros: result.reduce((sum, day) => sum + day.litrosProducidos, 0),
      maxCajasDia: result.reduce((max, day) => Math.max(max, day.cajasProducidas), 0),
      maxLitrosDia: result.reduce((max, day) => Math.max(max, day.litrosProducidos), 0),
    });
  } catch (error) {
    console.error("Error al obtener datos de producción por día:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
} 