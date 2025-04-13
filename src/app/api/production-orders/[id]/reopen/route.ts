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

    const userId = session.user.id;
    const orderId = params.id;

    // 1. Verificar si el operador ya tiene otra orden abierta
    const operatorActiveOrders = await prisma.produccionHistorial.findFirst({
      where: {
        userId: userId,
        activo: true,
        produccionId: { not: orderId } // Que no sea la orden que estamos verificando
      },
      include: {
        produccion: {
          select: {
            id: true,
            numeroOrden: true
          }
        }
      }
    });

    if (operatorActiveOrders) {
      return NextResponse.json({
        error: true,
        message: `Ya tienes abierta la orden #${operatorActiveOrders.produccion.numeroOrden}. Debes cerrarla antes de abrir otra.`,
        activeOrderId: operatorActiveOrders.produccion.id,
        activeOrderNumber: operatorActiveOrders.produccion.numeroOrden
      }, { status: 403 });
    }

    // Check if the order exists
    const order = await prisma.produccion.findUnique({
      where: {
        id: orderId,
      },
      include: {
        lineaProduccion: true,
        producto: true,
      },
    });

    if (!order) {
      return new NextResponse("Order not found", { status: 404 });
    }

    // 2. Verificar si la orden está en progreso y la tiene abierta otro operador
    if (order.estado === "en_progreso") {
      const orderActiveHistory = await prisma.produccionHistorial.findFirst({
        where: {
          produccionId: orderId,
          activo: true,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      });

      if (orderActiveHistory && orderActiveHistory.userId !== userId) {
        return NextResponse.json({
          error: true,
          message: `La orden #${order.numeroOrden} está siendo gestionada por ${orderActiveHistory.user.name}`,
          activeOperatorName: orderActiveHistory.user.name,
          activeOperatorId: orderActiveHistory.user.id
        }, { status: 403 });
      }
    }

    const now = new Date();

    // Update the order status to "en_progreso" using Prisma client's update method
    const updatedOrder = await prisma.produccion.update({
      where: { id: orderId },
      data: {
        estado: "en_progreso",
        lastUpdateTime: now // Also update the last update time
      },
    });

    // Close any active ProduccionHistorial entries
    try {
      await prisma.produccionHistorial.updateMany({
        where: {
          produccionId: orderId,
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
          produccionId: orderId,
          userId: userId,
          lineaProduccionId: order.lineaProduccionId,
          productoId: order.productoId,
          fechaInicio: now,
          activo: true
        }
      });
      newHistorialId = newHistorial.id;
      console.log("[REOPEN] Created new ProduccionHistorial entry for order:", orderId);
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