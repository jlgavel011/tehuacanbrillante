import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { Paro } from "@prisma/client";

interface StopsByType {
  tipo: string;
  cantidad: number;
  tiempo_total: number;
  porcentaje: number;
}

export async function GET() {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get all stops from the last 30 days
    const stops = await prisma.paro.findMany({
      where: {
        fechaInicio: {
          gte: thirtyDaysAgo,
        },
      },
      select: {
        tiempoMinutos: true,
        tipoParo: {
          select: {
            nombre: true,
          },
        },
      },
    });

    // Calculate total time of all stops
    const totalTime = stops.reduce((sum: number, stop) => sum + stop.tiempoMinutos, 0);

    // Group stops by type and calculate metrics
    const stopsByType = stops.reduce((acc: Record<string, StopsByType>, stop) => {
      const tipo = stop.tipoParo.nombre;
      if (!acc[tipo]) {
        acc[tipo] = {
          tipo,
          cantidad: 0,
          tiempo_total: 0,
          porcentaje: 0,
        };
      }
      acc[tipo].cantidad += 1;
      acc[tipo].tiempo_total += stop.tiempoMinutos;
      return acc;
    }, {});

    // Calculate percentages and convert to array
    const result = Object.values(stopsByType).map((typeData: StopsByType) => ({
      ...typeData,
      porcentaje: (typeData.tiempo_total / totalTime) * 100,
    }));

    // Sort by total time in descending order
    result.sort((a, b) => b.tiempo_total - a.tiempo_total);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching total stops:", error);
    return NextResponse.json(
      { error: "Error al obtener los datos de paros" },
      { status: 500 }
    );
  }
} 