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

    console.log("Fechas de consulta:", { from, to });

    // Obtener primero todas las líneas de producción
    const lineas = await prisma.lineaProduccion.findMany({
      select: {
        id: true,
        nombre: true,
      },
      orderBy: {
        nombre: 'asc',
      },
    });

    console.log("Líneas encontradas:", lineas);

    // Crear un mapa para almacenar los datos de paros por línea
    const lineasMap = new Map(lineas.map((l) => [l.id, { 
      id: l.id, 
      nombre: l.nombre, 
      cantidad: 0, 
      tiempo_total: 0 
    }]));

    console.log("IDs de líneas en el mapa:", Array.from(lineasMap.keys()));

    // Obtener los paros en el periodo especificado
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

    console.log("Paros agrupados por línea:", result);

    // Actualizar el mapa con los datos de paros reales
    result.forEach((item) => {
      console.log(`Procesando paro para lineaProduccionId: ${item.lineaProduccionId}`);
      console.log(`¿Existe en el mapa? ${lineasMap.has(item.lineaProduccionId)}`);
      
      const lineaData = lineasMap.get(item.lineaProduccionId);
      if (lineaData) {
        console.log(`Actualizando datos para línea ${lineaData.nombre}`);
        lineaData.cantidad = item._count._all;
        lineaData.tiempo_total = item._sum?.tiempoMinutos || 0;
      } else {
        console.log(`ADVERTENCIA: No se encontró la línea con ID ${item.lineaProduccionId} en el mapa`);
      }
    });

    console.log("Mapa después de procesar paros:", Array.from(lineasMap.entries()).map(([id, data]) => ({ 
      id, 
      nombre: data.nombre, 
      cantidad: data.cantidad, 
      tiempo_total: data.tiempo_total 
    })));

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

    console.log("Datos finales formateados:", formattedData);

    return NextResponse.json(formattedData);
  } catch (error) {
    console.error("Error al obtener datos de paros por línea:", error);
    return NextResponse.json(
      { error: "Error al procesar la solicitud" },
      { status: 500 }
    );
  }
} 