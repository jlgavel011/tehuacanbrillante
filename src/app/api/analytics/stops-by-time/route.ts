import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { Paro } from "@prisma/client";

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
        fechaInicio: true,
      },
    });

    // Initialize array for all 24 hours
    const hourlyData = Array.from({ length: 24 }, (_, i) => ({
      hora: i,
      cantidad: 0,
      tiempo_total: 0,
      porcentaje: 0,
    }));

    // Calculate total time of all stops
    const totalTime = stops.reduce((sum, stop) => sum + stop.tiempoMinutos, 0);

    // Group stops by hour
    stops.forEach((stop) => {
      const hour = stop.fechaInicio.getHours();
      hourlyData[hour].cantidad += 1;
      hourlyData[hour].tiempo_total += stop.tiempoMinutos;
    });

    // Calculate percentages
    hourlyData.forEach((hourData) => {
      hourData.porcentaje = (hourData.tiempo_total / totalTime) * 100;
    });

    return NextResponse.json(hourlyData);
  } catch (error) {
    console.error("Error fetching stops by time:", error);
    return NextResponse.json(
      { error: "Error al obtener los datos de paros por hora" },
      { status: 500 }
    );
  }
} 