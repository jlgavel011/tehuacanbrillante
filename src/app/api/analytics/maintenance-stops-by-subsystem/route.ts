import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

interface SubsystemStopData {
  name: string;
  sistema: string;
  linea: string;
  paros: number;
  tiempo_total: number;
}

export async function GET() {
  try {
    // Get the last 30 days for analysis
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get the ID of the "Mantenimiento" tipo paro
    const tipoMantenimiento = await prisma.tipoParo.findFirst({
      where: {
        nombre: "Mantenimiento"
      }
    });

    if (!tipoMantenimiento) {
      throw new Error("Tipo de paro 'Mantenimiento' no encontrado");
    }

    // Use MongoDB aggregation pipeline
    const result = await prisma.$runCommandRaw({
      aggregate: "paros",
      pipeline: [
        {
          $match: {
            tipoParoId: tipoMantenimiento.id,
            createdAt: { $gte: thirtyDaysAgo },
            subsistemaId: { $ne: null }
          }
        },
        {
          $lookup: {
            from: "subsistemas",
            localField: "subsistemaId",
            foreignField: "_id",
            as: "subsistema"
          }
        },
        {
          $unwind: "$subsistema"
        },
        {
          $lookup: {
            from: "sistemas",
            localField: "subsistema.sistemaId",
            foreignField: "_id",
            as: "sistema"
          }
        },
        {
          $unwind: "$sistema"
        },
        {
          $lookup: {
            from: "lineas_produccion",
            localField: "sistema.lineaProduccionId",
            foreignField: "_id",
            as: "linea"
          }
        },
        {
          $unwind: "$linea"
        },
        {
          $group: {
            _id: {
              subsistemaId: "$subsistema._id",
              subsistemaNombre: "$subsistema.nombre",
              sistemaNombre: "$sistema.nombre",
              lineaNombre: "$linea.nombre"
            },
            paros: { $sum: 1 },
            tiempo_total: { $sum: "$tiempoMinutos" }
          }
        },
        {
          $project: {
            _id: 0,
            name: "$_id.subsistemaNombre",
            sistema: "$_id.sistemaNombre",
            linea: "$_id.lineaNombre",
            paros: 1,
            tiempo_total: 1
          }
        },
        {
          $sort: { tiempo_total: -1 }
        },
        {
          $limit: 10 // Limit to top 10 subsystems
        }
      ],
      cursor: {}
    }) as unknown as { cursor: { firstBatch: SubsystemStopData[] } };

    return NextResponse.json(result.cursor.firstBatch);
  } catch (error) {
    console.error('Error fetching maintenance stops by subsystem:', error);
    return NextResponse.json(
      { error: 'Error al obtener los datos de paros por subsistema' },
      { status: 500 }
    );
  }
} 