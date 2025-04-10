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
      return NextResponse.json(
        { message: "No autorizado" },
        { status: 401 }
      );
    }

    const orderId = params.id;
    const { cajasProducidas, lastUpdateTime } = await request.json();

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

    // Calculate the increment in production since the last update
    const cajasPrevias = order.cajasProducidas || 0;
    const incrementoCajas = cajasProducidas - cajasPrevias;
    
    console.log("Production increment calculation:", {
      orderId,
      cajasPrevias,
      cajasProducidas,
      incrementoCajas
    });
    
    // Record the hourly production data if there's an increment
    if (incrementoCajas > 0) {
      try {
        console.log("Creating hourly production record with data:", {
          produccionId: orderId,
          cajasProducidas: incrementoCajas,
          horaRegistro: new Date()
        });
        
        const produccionPorHora = await prisma.produccionPorHora.create({
          data: {
            produccionId: orderId,
            cajasProducidas: incrementoCajas,
            horaRegistro: new Date()
          }
        });
        
        console.log("Successfully created hourly production record:", produccionPorHora);
      } catch (error) {
        console.error("Error creating hourly production record:", error);
        // Continue with the update even if there's an error with the hourly record
      }
    } else {
      console.log("No increment in production, skipping hourly record");
    }

    // Update the order with the new production count
    // Always keep the status as "en_progreso" for hourly updates
    const updatedOrder = await prisma.produccion.update({
      where: { id: orderId },
      data: {
        cajasProducidas: cajasProducidas,
        estado: "en_progreso",
        lastUpdateTime: lastUpdateTime ? new Date(lastUpdateTime) : new Date()
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