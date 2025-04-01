import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";

const prisma = new PrismaClient();

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { message: "No autorizado" },
        { status: 401 }
      );
    }

    const orderId = params.id;
    const { cajasProducidas, paros, isFinalizingProduction = false } = await request.json();

    if (!orderId) {
      return NextResponse.json(
        { message: "ID de orden no proporcionado" },
        { status: 400 }
      );
    }

    // First get the current order details
    const order = await prisma.produccion.findUnique({
      where: { id: orderId },
      include: {
        lineaProduccion: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { message: "Orden de producción no encontrada" },
        { status: 404 }
      );
    }

    // Update the order with the new total production
    // Only mark as completed if explicitly finalizing production
    const updatedOrder = await prisma.produccion.update({
      where: { id: orderId },
      data: {
        cajasProducidas: cajasProducidas,
        estado: isFinalizingProduction ? "completada" : "en_progreso",
        lastUpdateTime: new Date()
      },
    });

    // Register all paros if they exist
    if (paros && paros.length > 0) {
      for (const paro of paros) {
        await prisma.paro.create({
          data: {
            tipoParoId: paro.tipoParoId,
            tiempoMinutos: paro.tiempoMinutos,
            produccionId: orderId,
            lineaProduccionId: order.lineaProduccion.id,
            subsistemaId: paro.subsistemaId === "placeholder" ? null : paro.subsistemaId,
            subsubsistemaId: paro.subsubsistemaId === "placeholder" ? null : paro.subsubsistemaId,
            descripcion: paro.descripcion || "",
          },
        });
      }
    }

    return NextResponse.json(
      { 
        message: isFinalizingProduction ? "Producción finalizada correctamente" : "Producción actualizada correctamente", 
        order: updatedOrder 
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error finishing production order:", error);
    return NextResponse.json(
      { message: "Error al finalizar la producción" },
      { status: 500 }
    );
  }
} 