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
    
    // Check if user is authenticated
    if (!session) {
      return new NextResponse(
        JSON.stringify({ error: "No autorizado - Usuario no autenticado" }),
        { status: 401 }
      );
    }
    
    // Allow MASTER_ADMIN, MANAGER, and PRODUCTION_CHIEF roles to create orders
    const allowedRoles = ["MASTER_ADMIN", "MANAGER", "PRODUCTION_CHIEF"];
    if (!allowedRoles.includes(session.user.role)) {
      return new NextResponse(
        JSON.stringify({ error: "No autorizado - Rol sin permisos suficientes" }),
        { status: 403 }
      );
    }
    
    const body = await req.json();
    
    // Validate required fields
    if (!body.cajasPlanificadas || !body.lineaProduccionId || !body.productoId || !body.turno || !body.fechaProduccion || !body.numeroOrden) {
      return new NextResponse(
        JSON.stringify({ error: "Faltan campos obligatorios" }),
        { status: 400 }
      );
    }
    
    // Use the provided numeroOrden instead of generating one
    const numeroOrden = body.numeroOrden;
    
    // Check if an order with this number already exists
    const existingOrder = await prisma.produccion.findFirst({
      where: {
        numeroOrden: numeroOrden
      }
    });
    
    if (existingOrder) {
      return new NextResponse(
        JSON.stringify({ error: "Ya existe una orden con este número" }),
        { status: 400 }
      );
    }
    
    // Calculate tiempoPlan (planned time in hours) if velocidadProduccion is available
    let tiempoPlan = null;
    
    try {
      // Get the production speed for this product on this production line
      const productoEnLinea = await prisma.productoEnLinea.findFirst({
        where: {
          productoId: body.productoId,
          lineaProduccionId: body.lineaProduccionId
        }
      });
      
      if (productoEnLinea?.velocidadProduccion && productoEnLinea.velocidadProduccion > 0) {
        tiempoPlan = body.cajasPlanificadas / productoEnLinea.velocidadProduccion;
      }
    } catch (error) {
      console.error("Error al obtener velocidad de producción:", error);
      // Continue with tiempoPlan as null if there's an error
    }
    
    // Create the order even if calculating tiempoPlan failed
    const orden = await prisma.produccion.create({
      data: {
        numeroOrden,
        cajasPlanificadas: body.cajasPlanificadas,
        turno: body.turno,
        fechaProduccion: new Date(body.fechaProduccion),
        lineaProduccionId: body.lineaProduccionId,
        productoId: body.productoId,
        tiempoPlan: tiempoPlan,
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