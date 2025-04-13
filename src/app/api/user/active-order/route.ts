import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { prisma } from "@/lib/db/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const userId = session.user.id;

    // Buscar cualquier historial de producción activo para este usuario
    const activeHistorial = await prisma.produccionHistorial.findFirst({
      where: {
        userId: userId,
        activo: true,
      },
      include: {
        produccion: {
          select: {
            id: true,
            numeroOrden: true,
            estado: true,
            lineaProduccionId: true,
            productoId: true
          }
        }
      },
      orderBy: {
        fechaInicio: 'desc'
      }
    });

    if (activeHistorial && activeHistorial.produccion) {
      // El usuario tiene una orden activa
      return NextResponse.json({
        hasActiveOrder: true,
        activeOrder: {
          id: activeHistorial.produccion.id,
          numeroOrden: activeHistorial.produccion.numeroOrden,
          historialId: activeHistorial.id,
          estado: activeHistorial.produccion.estado
        }
      });
    } else {
      // El usuario no tiene órdenes activas
      return NextResponse.json({
        hasActiveOrder: false,
        activeOrder: null
      });
    }
  } catch (error) {
    console.error("[ACTIVE_ORDER_CHECK]", error);
    return NextResponse.json(
      { error: "Error interno al verificar órdenes activas" },
      { status: 500 }
    );
  }
} 