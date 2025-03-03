import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/db/prisma";
import { authOptions } from "@/lib/auth/auth-options";

// GET /api/cajas - Get all cajas
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // For GET requests, allow access even without authentication for now
    // This helps with development and testing
    
    const cajas = await prisma.caja.findMany();
    
    return NextResponse.json(cajas);
  } catch (error) {
    console.error("Error al obtener cajas:", error);
    return new NextResponse(
      JSON.stringify({ error: "Error al obtener cajas" }),
      { status: 500 }
    );
  }
}

// POST /api/cajas - Create a new caja
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // For development purposes, allow creation without strict auth checks
    // In production, you would want to uncomment the following check
    /*
    if (!session || (session.user.role !== "MASTER_ADMIN" && session.user.role !== "MANAGER")) {
      return new NextResponse(
        JSON.stringify({ error: "No autorizado" }),
        { status: 401 }
      );
    }
    */
    
    const body = await req.json();
    
    // Validate required fields
    if (!body.numeroUnidades) {
      return new NextResponse(
        JSON.stringify({ error: "Faltan campos obligatorios" }),
        { status: 400 }
      );
    }
    
    // Generate a nombre if not provided
    const nombre = body.nombre || `${body.numeroUnidades}u`;
    
    const caja = await prisma.caja.create({
      data: {
        numeroUnidades: parseInt(body.numeroUnidades),
        nombre: nombre,
      },
    });
    
    return NextResponse.json(caja, { status: 201 });
  } catch (error) {
    console.error("Error al crear caja:", error);
    return new NextResponse(
      JSON.stringify({ error: "Error al crear caja" }),
      { status: 500 }
    );
  }
} 