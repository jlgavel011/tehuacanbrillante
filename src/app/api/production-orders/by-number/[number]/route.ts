import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: { number: string } }
) {
  try {
    console.log("[ORDER_BY_NUMBER_GET] Request for order number:", params.number);
    
    // Temporarily skip authentication check for debugging
    // const session = await getServerSession(authOptions);
    // if (!session) {
    //   console.log("[ORDER_BY_NUMBER_GET] Unauthorized - No session");
    //   return new NextResponse("Unauthorized", { status: 401 });
    // }
    // console.log("[ORDER_BY_NUMBER_GET] Session user:", session.user);

    const orderNumber = parseInt(params.number);

    if (isNaN(orderNumber)) {
      console.log("[ORDER_BY_NUMBER_GET] Invalid order number:", params.number);
      return new NextResponse("Invalid order number", { status: 400 });
    }

    console.log("[ORDER_BY_NUMBER_GET] Searching for order number:", orderNumber);
    
    const order = await prisma.produccion.findFirst({
      where: {
        numeroOrden: orderNumber,
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
      console.log("[ORDER_BY_NUMBER_GET] Order not found for number:", orderNumber);
      return new NextResponse("Order not found", { status: 404 });
    }

    console.log("[ORDER_BY_NUMBER_GET] Order found:", order.id, order.numeroOrden);
    
    // Find the velocidadProduccion for this product on this production line
    const productoEnLinea = order.producto.lineasProduccion.find(
      (pl: any) => pl.lineaProduccionId === order.lineaProduccionId
    );

    // Add the velocidadProduccion to the product
    const producto = {
      ...order.producto,
      velocidadProduccion: productoEnLinea?.velocidadProduccion || null,
    };

    // Determine the order status
    let estado = "pendiente";
    if (order.cajasProducidas >= order.cajasPlanificadas) {
      estado = "completada";
    } else if (order.cajasProducidas > 0) {
      estado = "en_progreso";
    }

    console.log("[ORDER_BY_NUMBER_GET] Returning order with status:", estado);
    
    // Return the order with the enhanced product and status
    return NextResponse.json({
      ...order,
      producto,
      estado,
    });
  } catch (error) {
    console.error("[ORDER_BY_NUMBER_GET] Error:", error);
    return new NextResponse("Internal error", { status: 500 });
  }
} 