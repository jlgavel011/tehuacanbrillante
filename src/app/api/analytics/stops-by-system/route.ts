import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get all stops from the last 30 days with their system relationships
    const stops = await prisma.paro.findMany({
      where: {
        fechaInicio: {
          gte: thirtyDaysAgo,
        },
      },
      select: {
        tiempoMinutos: true,
        subsistema: {
          select: {
            nombre: true,
            sistema: {
              select: {
                nombre: true,
              },
            },
          },
        },
      },
    });

    // Calculate total time of all stops
    const totalTime = stops.reduce((sum, stop) => sum + stop.tiempoMinutos, 0);

    // Group stops by system and subsystem
    const systemMap = new Map<
      string,
      {
        sistema: string;
        cantidad: number;
        tiempo_total: number;
        porcentaje: number;
        subsistemas: Map<
          string,
          {
            nombre: string;
            cantidad: number;
            tiempo_total: number;
            porcentaje: number;
          }
        >;
      }
    >();

    stops.forEach((stop) => {
      if (!stop.subsistema) return; // Skip stops without system info

      const systemName = stop.subsistema.sistema.nombre;
      const subsystemName = stop.subsistema.nombre;

      // Initialize system if not exists
      if (!systemMap.has(systemName)) {
        systemMap.set(systemName, {
          sistema: systemName,
          cantidad: 0,
          tiempo_total: 0,
          porcentaje: 0,
          subsistemas: new Map(),
        });
      }

      const system = systemMap.get(systemName)!;
      system.cantidad += 1;
      system.tiempo_total += stop.tiempoMinutos;

      // Initialize subsystem if not exists
      if (!system.subsistemas.has(subsystemName)) {
        system.subsistemas.set(subsystemName, {
          nombre: subsystemName,
          cantidad: 0,
          tiempo_total: 0,
          porcentaje: 0,
        });
      }

      const subsystem = system.subsistemas.get(subsystemName)!;
      subsystem.cantidad += 1;
      subsystem.tiempo_total += stop.tiempoMinutos;
    });

    // Calculate percentages and convert to array format
    const result = Array.from(systemMap.values()).map((system) => ({
      ...system,
      porcentaje: (system.tiempo_total / totalTime) * 100,
      subsistemas: Array.from(system.subsistemas.values()).map((subsystem) => ({
        ...subsystem,
        porcentaje: (subsystem.tiempo_total / system.tiempo_total) * 100,
      })),
    }));

    // Sort systems by total time in descending order
    result.sort((a, b) => b.tiempo_total - a.tiempo_total);

    // Sort subsystems within each system by total time
    result.forEach((system) => {
      system.subsistemas.sort((a, b) => b.tiempo_total - a.tiempo_total);
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching stops by system:", error);
    return NextResponse.json(
      { error: "Error al obtener los datos de paros por sistema" },
      { status: 500 }
    );
  }
} 