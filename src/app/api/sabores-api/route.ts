import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/db/prisma";
import { authOptions } from "@/lib/auth/auth-options";

// GET /api/sabores-api - Get all sabores
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // For GET requests, allow access even without authentication for now
    // This helps with development and testing
    
    const sabores = await prisma.sabor.findMany();
    
    return NextResponse.json(sabores);
  } catch (error) {
    console.error("Error al obtener sabores:", error);
    return new NextResponse(
      JSON.stringify({ error: "Error al obtener sabores" }),
      { status: 500 }
    );
  }
}

// POST /api/sabores-api - Create a new sabor
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
    if (!body.nombre) {
      return new NextResponse(
        JSON.stringify({ error: "Faltan campos obligatorios" }),
        { status: 400 }
      );
    }
    
    // Check if sabor already exists
    const existingSabor = await prisma.sabor.findFirst({
      where: {
        nombre: body.nombre
      }
    });
    
    if (existingSabor) {
      return new NextResponse(
        JSON.stringify({ error: "Ya existe un sabor con este nombre" }),
        { status: 400 }
      );
    }
    
    const sabor = await prisma.sabor.create({
      data: {
        nombre: body.nombre,
      },
    });
    
    return NextResponse.json(sabor, { status: 201 });
  } catch (error) {
    console.error("Error al crear sabor:", error);
    return new NextResponse(
      JSON.stringify({ error: "Error al crear sabor" }),
      { status: 500 }
    );
  }
} 