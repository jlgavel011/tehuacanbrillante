import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { prisma } from "@/lib/db/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({
        available: false,
        message: "No autorizado"
      }, { status: 401 });
    }

    const userId = session.user.id;
    const orderId = params.id;

    // Verificar si la orden existe
    const order = await prisma.produccion.findUnique({
      where: { id: orderId },
      select: { 
        id: true,
        estado: true,
        numeroOrden: true
      }
    });

    if (!order) {
      return NextResponse.json({
        available: false,
        message: "Orden no encontrada"
      }, { status: 404 });
    }

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
        available: false,
        message: `Ya tienes abierta la orden #${operatorActiveOrders.produccion.numeroOrden}. Debes cerrarla antes de abrir otra.`,
        activeOrderId: operatorActiveOrders.produccion.id,
        activeOrderNumber: operatorActiveOrders.produccion.numeroOrden
      });
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
          available: false,
          message: `La orden #${order.numeroOrden} está siendo gestionada por ${orderActiveHistory.user.name}`,
          activeOperatorName: orderActiveHistory.user.name,
          activeOperatorId: orderActiveHistory.user.id
        });
      }
    }

    // Si llegamos aquí, la orden está disponible para este operador
    return NextResponse.json({
      available: true,
      message: "Orden disponible"
    });
  } catch (error) {
    console.error("[CHECK_AVAILABILITY]", error);
    return NextResponse.json({
      available: false,
      message: "Error interno del servidor"
    }, { status: 500 });
  }
} 