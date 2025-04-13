import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { PrismaClient } from "@prisma/client";

// Definir el tipo para el feedback con su relación
type FeedbackWithLinea = PrismaClient['predictionFeedback']['payload']['scalars'] & {
  predictedAt: Date;
  linea: {
    id: string;
    nombre: string;
  }
};

/**
 * API para obtener el histórico de predicciones
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit') as string) : 100;
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset') as string) : 0;
    
    // Obtener datos reales de predicciones desde la base de datos
    const feedbacks = await prisma.predictionFeedback.findMany({
      take: limit,
      skip: offset,
      orderBy: { predictedAt: 'desc' },
      include: {
        linea: true
      }
    });
    
    // Transformar datos al formato esperado por el frontend
    const predictionHistory = feedbacks.map((feedback: FeedbackWithLinea) => {
      return {
        id: feedback.id,
        timestamp: feedback.predictedAt,
        lineaId: feedback.lineaId,
        lineaNombre: feedback.linea.nombre,
        // Datos del paro real (si ocurrió)
        realStop: feedback.actualStopOccurred ? {
          occurredAt: feedback.predictedAt, // Aproximación, no tenemos la fecha exacta
          stopType: feedback.actualStopType || 'Desconocido',
          duration: feedback.actualStopDuration || 0
        } : null,
        // Datos de la predicción
        prediction: {
          predictedAt: feedback.predictedAt,
          probability: feedback.predictedProbability,
          predictedType: feedback.predictedType,
          predictedDuration: feedback.predictedDuration,
          wasCorrect: feedback.actualStopOccurred && feedback.accuracy ? feedback.accuracy > 0.5 : false
        }
      };
    });
    
    return NextResponse.json({
      data: predictionHistory,
      total: predictionHistory.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("⚡ Error al obtener historial de predicciones:", error);
    return NextResponse.json(
      { error: "Error al obtener historial de predicciones" },
      { status: 500 }
    );
  }
} 