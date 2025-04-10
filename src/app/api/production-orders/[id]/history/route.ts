import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/db/prisma";
import { authOptions } from "@/lib/auth/auth-options";

export async function GET(
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

    if (!orderId) {
      return NextResponse.json(
        { message: "ID de orden no proporcionado" },
        { status: 400 }
      );
    }

    // Check if the order exists
    const order = await prisma.produccion.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return NextResponse.json(
        { message: "Orden de producción no encontrada" },
        { status: 404 }
      );
    }

    // Get the history records for this order
    const historialesProduccion = await prisma.produccionHistorial.findMany({
      where: { 
        produccionId: orderId 
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        },
        lineaProduccion: true,
        producto: {
          include: {
            modelo: true,
            sabor: true,
            tamaño: true
          }
        }
      },
      orderBy: {
        fechaInicio: 'desc'
      }
    });

    return NextResponse.json({
      historialesProduccion
    }, { status: 200 });
  } catch (error: any) {
    console.error("Error retrieving production history:", error);
    return NextResponse.json(
      { message: `Error al obtener historial de producción: ${error?.message || 'Error desconocido'}` },
      { status: 500 }
    );
  }
} 