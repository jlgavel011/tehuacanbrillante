import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

interface QualityDeviationStats {
  nombre: string;
  cantidad: number;
  tiempo_total: number;
  porcentaje: number;
}

interface AggregationResult {
  nombre: string;
  cantidad: number;
  tiempo_total: number;
}

export async function GET() {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const paros = await prisma.paro.aggregateRaw({
      pipeline: [
        {
          $match: {
            fechaInicio: { $gte: thirtyDaysAgo },
            desviacionCalidadId: { $ne: null }
          }
        },
        {
          $lookup: {
            from: "desviaciones_calidad",
            localField: "desviacionCalidadId",
            foreignField: "_id",
            as: "desviacionCalidad"
          }
        },
        {
          $unwind: "$desviacionCalidad"
        },
        {
          $group: {
            _id: "$desviacionCalidad.nombre",
            cantidad: { $sum: 1 },
            tiempo_total: { $sum: "$tiempoMinutos" }
          }
        },
        {
          $project: {
            _id: 0,
            nombre: "$_id",
            cantidad: 1,
            tiempo_total: 1
          }
        }
      ]
    });

    const stats = (paros as unknown) as AggregationResult[];
    const totalTime = stats.reduce((sum, stat) => sum + stat.tiempo_total, 0);

    const result = stats
      .map(stat => ({
        ...stat,
        porcentaje: totalTime > 0
          ? (stat.tiempo_total / totalTime) * 100
          : 0,
      }))
      .sort((a, b) => b.tiempo_total - a.tiempo_total);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching stops by quality deviation:", error);
    return NextResponse.json(
      { error: "Error al obtener los datos de paros por desviación de calidad" },
      { status: 500 }
    );
  }
} 