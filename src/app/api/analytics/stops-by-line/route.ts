import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

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

    const result = await prisma.paro.groupBy({
      by: ["lineaProduccionId"],
      where: {
        fechaInicio: {
          gte: fromDate,
          lte: toDate,
        },
      },
      _sum: {
        tiempoMinutos: true,
      },
      _count: {
        _all: true,
      },
    });

    // Obtener los nombres de las líneas
    const lineas = await prisma.lineaProduccion.findMany({
      select: {
        id: true,
        nombre: true,
      },
    });

    const lineasMap = new Map(lineas.map((l: { id: string; nombre: string }) => [l.id, l.nombre]));

    // Calcular el total para los porcentajes
    const totalTiempo = result.reduce(
      (acc: number, curr) => acc + (curr._sum?.tiempoMinutos || 0),
      0
    );

    const formattedData = result.map((item): FormattedData => ({
      name: lineasMap.get(item.lineaProduccionId) || `Línea ${item.lineaProduccionId}`,
      cantidad: item._count._all,
      tiempo_total: item._sum?.tiempoMinutos || 0,
      porcentaje:
        totalTiempo > 0
          ? ((item._sum?.tiempoMinutos || 0) / totalTiempo) * 100
          : 0,
    }));

    // Ordenar por tiempo total de paros (descendente)
    formattedData.sort((a: FormattedData, b: FormattedData) => b.tiempo_total - a.tiempo_total);

    return NextResponse.json(formattedData);
  } catch (error) {
    console.error("Error al obtener datos de paros por línea:", error);
    return NextResponse.json(
      { error: "Error al procesar la solicitud" },
      { status: 500 }
    );
  }
} 