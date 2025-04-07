import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

interface FormattedData {
  name: string;
  cantidad: number;
  tiempo_total: number;
  porcentaje: number;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    if (!from || !to) {
      return NextResponse.json(
        { error: "Fechas no proporcionadas" },
        { status: 400 }
      );
    }

    const fromDate = new Date(from);
    const toDate = new Date(to);

    // Obtener todas las líneas de producción
    const lineas = await prisma.lineaProduccion.findMany({
      select: {
        id: true,
        nombre: true,
      },
      orderBy: {
        nombre: 'asc',
      },
    });

    // Crear un mapa para almacenar los datos de paros por línea
    const lineasMap = new Map(lineas.map((l) => [l.id, { 
      id: l.id, 
      nombre: l.nombre, 
      cantidad: 0, 
      tiempo_total: 0 
    }]));

    // Obtener los paros de mantenimiento en el periodo especificado
    const tipoParoMantenimiento = await prisma.tipoParo.findFirst({
      where: {
        nombre: "Mantenimiento",
      },
      select: {
        id: true,
      },
    });

    if (!tipoParoMantenimiento) {
      return NextResponse.json([]);
    }

    const result = await prisma.paro.groupBy({
      by: ["lineaProduccionId"],
      where: {
        fechaInicio: {
          gte: fromDate,
          lte: toDate,
        },
        tipoParoId: tipoParoMantenimiento.id,
      },
      _sum: {
        tiempoMinutos: true,
      },
      _count: {
        _all: true,
      },
    });

    // Actualizar el mapa con los datos de paros reales
    result.forEach((item) => {
      const lineaData = lineasMap.get(item.lineaProduccionId);
      if (lineaData) {
        lineaData.cantidad = item._count._all;
        lineaData.tiempo_total = item._sum?.tiempoMinutos || 0;
      }
    });

    // Calcular el total para los porcentajes
    const totalTiempo = Array.from(lineasMap.values()).reduce(
      (acc, curr) => acc + curr.tiempo_total,
      0
    );

    // Convertir el mapa a un array de resultados formateados
    const formattedData = Array.from(lineasMap.values()).map((item): FormattedData => ({
      name: item.nombre,
      cantidad: item.cantidad,
      tiempo_total: item.tiempo_total,
      porcentaje:
        totalTiempo > 0
          ? (item.tiempo_total / totalTiempo) * 100
          : 0,
    }));

    // Ordenar por tiempo total de paros (descendente)
    formattedData.sort((a: FormattedData, b: FormattedData) => b.tiempo_total - a.tiempo_total);

    return NextResponse.json(formattedData);
  } catch (error) {
    console.error("Error al obtener datos de paros de mantenimiento por línea:", error);
    return NextResponse.json(
      { error: "Error al procesar la solicitud" },
      { status: 500 }
    );
  }
} 