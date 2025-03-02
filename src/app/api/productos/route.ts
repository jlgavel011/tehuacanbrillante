import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/db/prisma";
import { authOptions } from "@/lib/auth/auth-options";

// GET /api/productos - Get all products
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
    
    const productos = await prisma.producto.findMany({
      include: {
        caja: true,
        modelo: true,
        sabor: true,
        tamaño: true,
      },
    });
    
    return NextResponse.json(productos);
  } catch (error) {
    console.error("Error al obtener productos:", error);
    return new NextResponse(
      JSON.stringify({ error: "Error al obtener productos" }),
      { status: 500 }
    );
  }
}

// POST /api/productos - Create a new product
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
    if (!body.nombre || !body.cajaId || !body.modeloId || !body.tamañoId || !body.saborId) {
      return new NextResponse(
        JSON.stringify({ error: "Faltan campos obligatorios" }),
        { status: 400 }
      );
    }
    
    const producto = await prisma.producto.create({
      data: {
        nombre: body.nombre,
        cajaId: body.cajaId,
        modeloId: body.modeloId,
        tamañoId: body.tamañoId,
        saborId: body.saborId,
      },
      include: {
        caja: true,
        modelo: true,
        sabor: true,
        tamaño: true,
      },
    });
    
    return NextResponse.json(producto, { status: 201 });
  } catch (error) {
    console.error("Error al crear producto:", error);
    return new NextResponse(
      JSON.stringify({ error: "Error al crear producto" }),
      { status: 500 }
    );
  }
} 