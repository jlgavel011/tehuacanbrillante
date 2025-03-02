import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/db/prisma";
import { authOptions } from "@/lib/auth/auth-options";
import { generateOrderNumber } from "@/lib/utils";

// GET /api/ordenes - Get all production orders
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check if user is authenticated
    if (!session) {
      return new NextResponse(
        JSON.stringify({ error: "No autorizado" }),
        { status: 401 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(req.url);
    const lineaId = searchParams.get("lineaId");
    const productoId = searchParams.get("productoId");
    const fecha = searchParams.get("fecha");
    
    // Build query conditions
    const where: any = {};
    
    if (lineaId) {
      where.lineaProduccionId = lineaId;
    }
    
    if (productoId) {
      where.productoId = productoId;
    }
    
    if (fecha) {
      const fechaObj = new Date(fecha);
      where.fechaProduccion = {
        gte: new Date(fechaObj.setHours(0, 0, 0, 0)),
        lt: new Date(fechaObj.setHours(23, 59, 59, 999)),
      };
    }
    
    const ordenes = await prisma.produccion.findMany({
      where,
      include: {
        lineaProduccion: true,
        producto: {
          include: {
            modelo: true,
            sabor: true,
            tamaño: true,
            caja: true,
          },
        },
        paros: {
          include: {
            tipoParo: true,
          },
        },
      },
      orderBy: {
        fechaProduccion: "desc",
      },
    });
    
    return NextResponse.json(ordenes);
  } catch (error) {
    console.error("Error al obtener órdenes:", error);
    return new NextResponse(
      JSON.stringify({ error: "Error al obtener órdenes" }),
      { status: 500 }
    );
  }
}

// POST /api/ordenes - Create a new production order
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check if user is authenticated and authorized
    if (!session || (session.user.role !== "MASTER_ADMIN" && session.user.role !== "MANAGER")) {
      return new NextResponse(
        JSON.stringify({ error: "No autorizado" }),
        { status: 401 }
      );
    }
    
    const body = await req.json();
    
    // Validate required fields
    if (!body.cajasPlanificadas || !body.lineaProduccionId || !body.productoId || !body.turno || !body.fechaProduccion) {
      return new NextResponse(
        JSON.stringify({ error: "Faltan campos obligatorios" }),
        { status: 400 }
      );
    }
    
    const numeroOrden = generateOrderNumber();
    
    const orden = await prisma.produccion.create({
      data: {
        numeroOrden,
        cajasPlanificadas: body.cajasPlanificadas,
        turno: body.turno,
        fechaProduccion: new Date(body.fechaProduccion),
        lineaProduccionId: body.lineaProduccionId,
        productoId: body.productoId,
      },
      include: {
        lineaProduccion: true,
        producto: {
          include: {
            modelo: true,
            sabor: true,
            tamaño: true,
            caja: true,
          },
        },
      },
    });
    
    return NextResponse.json(orden, { status: 201 });
  } catch (error) {
    console.error("Error al crear orden:", error);
    return new NextResponse(
      JSON.stringify({ error: "Error al crear orden" }),
      { status: 500 }
    );
  }
} 