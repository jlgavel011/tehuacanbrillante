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
    const { cajasProducidas } = await request.json();

    if (!orderId) {
      return NextResponse.json(
        { message: "ID de orden no proporcionado" },
        { status: 400 }
      );
    }

    // First get the current order details
    const order = await prisma.produccion.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return NextResponse.json(
        { message: "Orden de producción no encontrada" },
        { status: 404 }
      );
    }

    // Update the order with the new production count
    // Always keep the status as "en_progreso" for hourly updates
    const updatedOrder = await prisma.produccion.update({
      where: { id: orderId },
      data: {
        cajasProducidas: cajasProducidas,
        estado: "en_progreso",
        lastUpdateTime: new Date()
      },
    });

    return NextResponse.json(
      { 
        message: "Producción actualizada correctamente",
        order: updatedOrder 
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating production order:", error);
    return NextResponse.json(
      { message: "Error al actualizar la producción" },
      { status: 500 }
    );
  }
} 