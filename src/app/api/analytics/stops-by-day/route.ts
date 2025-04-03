import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { Paro } from "@prisma/client";

const diasSemana = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];

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

    // Initialize array for all 7 days
    const dailyData = Array.from({ length: 7 }, (_, i) => ({
      dia: i,
      nombre: diasSemana[i],
      cantidad: 0,
      tiempo_total: 0,
      porcentaje: 0,
    }));

    // Calculate total time of all stops
    const totalTime = stops.reduce((sum, stop) => sum + stop.tiempoMinutos, 0);

    // Group stops by day
    stops.forEach((stop) => {
      const day = stop.fechaInicio.getDay();
      dailyData[day].cantidad += 1;
      dailyData[day].tiempo_total += stop.tiempoMinutos;
    });

    // Calculate percentages
    dailyData.forEach((dayData) => {
      dayData.porcentaje = (dayData.tiempo_total / totalTime) * 100;
    });

    // Sort by day of week starting from Monday
    const sortedData = [
      ...dailyData.slice(1), // Monday to Saturday
      dailyData[0], // Sunday
    ];

    return NextResponse.json(sortedData);
  } catch (error) {
    console.error("Error fetching stops by day:", error);
    return NextResponse.json(
      { error: "Error al obtener los datos de paros por día" },
      { status: 500 }
    );
  }
} 