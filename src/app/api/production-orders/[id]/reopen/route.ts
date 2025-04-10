import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Check if the order exists
    const order = await prisma.produccion.findUnique({
      where: {
        id: params.id,
      },
      include: {
        lineaProduccion: true,
        producto: true,
      },
    });

    if (!order) {
      return new NextResponse("Order not found", { status: 404 });
    }

    const now = new Date();

    // Update the order status to "en_progreso" using Prisma client's update method
    const updatedOrder = await prisma.produccion.update({
      where: { id: params.id },
      data: {
        estado: "en_progreso",
        lastUpdateTime: now // Also update the last update time
      },
    });

    // Close any active ProduccionHistorial entries
    try {
      await prisma.produccionHistorial.updateMany({
        where: {
          produccionId: params.id,
          activo: true,
          fechaFin: null
        },
        data: {
          activo: false,
          fechaFin: now
        }
      });
    } catch (error) {
      console.error("[CLOSE_PRODUCTION_HISTORY]", error);
      // Continue even if history closure fails
    }

    // Create a new production history entry
    let newHistorialId = null;
    try {
      const newHistorial = await prisma.produccionHistorial.create({
        data: {
          produccionId: params.id,
          userId: session.user.id,
          lineaProduccionId: order.lineaProduccionId,
          productoId: order.productoId,
          fechaInicio: now,
          activo: true
        }
      });
      newHistorialId = newHistorial.id;
      console.log("[REOPEN] Created new ProduccionHistorial entry for order:", params.id);
    } catch (error) {
      console.error("[PRODUCTION_HISTORY_CREATE]", error);
      // Continue even if history creation fails
    }

    return NextResponse.json({
      message: "Production order reopened successfully",
      order: updatedOrder,
      activeHistorialId: newHistorialId
    });
  } catch (error) {
    console.error("[ORDER_REOPEN_POST]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
} 