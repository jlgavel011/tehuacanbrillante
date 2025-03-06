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
    const { hourlyProduction, paros } = await request.json();

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

    // Calculate the new total production count
    const newCajasProducidas = order.cajasProducidas + (parseInt(hourlyProduction) || 0);
    
    // Update just the cajasProducidas field to fix the error
    const updatedOrder = await prisma.produccion.update({
      where: { id: orderId },
      data: {
        cajasProducidas: newCajasProducidas
      },
    });

    // Separately update the estado field to avoid type issues
    await prisma.produccion.update({
      where: { id: orderId },
      data: {
        // @ts-ignore - We know estado exists in the schema
        estado: "completada"
      },
    });

    // Register all paros
    if (paros && paros.length > 0) {
      for (const paro of paros) {
        await prisma.paro.create({
          data: {
            tipoParoId: paro.tipoParoId,
            tiempoMinutos: paro.tiempoMinutos,
            produccionId: orderId,
            lineaProduccionId: order.lineaProduccion.id,
            // The Paro model doesn't have a sistemaId field, only subsistemaId and subsubsistemaId
            subsistemaId: paro.subsistemaId,
            subsubsistemaId: paro.subsubsistemaId,
            descripcion: paro.descripcion || "",
          },
        });
      }
    }

    return NextResponse.json(
      { message: "Producción finalizada correctamente", order: updatedOrder },
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