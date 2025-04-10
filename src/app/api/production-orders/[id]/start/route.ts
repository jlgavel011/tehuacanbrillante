import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { prisma } from "@/lib/db/prisma";

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
        producto: {
          include: {
            lineasProduccion: {
              where: {
                lineaProduccionId: { not: undefined },
              },
            },
          },
        },
      },
    });

    if (!order) {
      return new NextResponse("Order not found", { status: 404 });
    }

    // Determine the state of the order
    const newCajasProducidas = order.cajasProducidas === 0 ? 1 : order.cajasProducidas;
    const estado = "en_progreso";
    const now = new Date();

    // Update the order to mark it as started
    const updatedOrder = await prisma.produccion.update({
      where: {
        id: params.id,
      },
      data: {
        cajasProducidas: newCajasProducidas,
        estado,
        lastUpdateTime: now
      },
      include: {
        lineaProduccion: true,
        producto: {
          include: {
            lineasProduccion: {
              where: {
                lineaProduccionId: { not: undefined },
              },
            },
          },
        },
      },
    });

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
      console.log("[START] Created new ProduccionHistorial entry for order:", params.id);
    } catch (error) {
      console.error("[PRODUCTION_HISTORY_CREATE]", error);
      // Continue even if history creation fails
    }

    // Find the velocidadProduccion for this product on this production line
    const productoEnLinea = updatedOrder.producto.lineasProduccion.find(
      (pl: any) => pl.lineaProduccionId === updatedOrder.lineaProduccionId
    );

    // Add the velocidadProduccion to the product
    const producto = {
      ...updatedOrder.producto,
      velocidadProduccion: productoEnLinea?.velocidadProduccion || null,
    };

    // Return the updated order with the enhanced product and status
    return NextResponse.json({
      ...updatedOrder,
      producto,
      estado,
      lastUpdateTime: now,
      activeHistorialId: newHistorialId
    });
  } catch (error) {
    console.error("[ORDER_START_POST]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
} 