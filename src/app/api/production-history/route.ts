import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/db/prisma";
import { authOptions } from "@/lib/auth/auth-options";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { message: "No autorizado" },
        { status: 401 }
      );
    }

    // Get query parameters for filtering
    const searchParams = request.nextUrl.searchParams;
    const desde = searchParams.get('desde');
    const hasta = searchParams.get('hasta');
    const lineaProduccionId = searchParams.get('lineaProduccionId');
    const productoId = searchParams.get('productoId');
    const userId = searchParams.get('userId');
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const skip = (page - 1) * pageSize;

    // Build where clause
    const where: any = {};
    
    if (desde && hasta) {
      where.fechaInicio = {
        gte: new Date(desde),
        lte: new Date(hasta)
      };
    } else if (desde) {
      where.fechaInicio = {
        gte: new Date(desde)
      };
    } else if (hasta) {
      where.fechaInicio = {
        lte: new Date(hasta)
      };
    }

    if (lineaProduccionId) {
      where.lineaProduccionId = lineaProduccionId;
    }

    if (productoId) {
      where.productoId = productoId;
    }

    if (userId) {
      where.userId = userId;
    }

    // Get total count for pagination
    const total = await prisma.produccionHistorial.count({ where });

    // Get the production history records
    const historialesProduccion = await prisma.produccionHistorial.findMany({
      where,
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
        },
        produccion: {
          select: {
            id: true,
            numeroOrden: true,
            estado: true
          }
        }
      },
      orderBy: {
        fechaInicio: 'desc'
      },
      skip,
      take: pageSize
    });

    return NextResponse.json({
      historialesProduccion,
      pagination: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize)
      }
    }, { status: 200 });
  } catch (error: any) {
    console.error("Error retrieving production history:", error);
    return NextResponse.json(
      { message: `Error al obtener historial de producción: ${error?.message || 'Error desconocido'}` },
      { status: 500 }
    );
  }
} 