import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/db/prisma";
import { authOptions } from "@/lib/auth/auth-options";

// GET /api/modelos - Get all modelos
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // For GET requests, allow access even without authentication for now
    // This helps with development and testing
    
    const modelos = await prisma.modelo.findMany();
    
    return NextResponse.json(modelos);
  } catch (error) {
    console.error("Error al obtener modelos:", error);
    return new NextResponse(
      JSON.stringify({ error: "Error al obtener modelos" }),
      { status: 500 }
    );
  }
}

// POST /api/modelos - Create a new modelo
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
    
    // Check if modelo already exists
    const existingModelo = await prisma.modelo.findFirst({
      where: {
        nombre: body.nombre
      }
    });
    
    if (existingModelo) {
      return new NextResponse(
        JSON.stringify({ error: "Ya existe un modelo con este nombre" }),
        { status: 400 }
      );
    }
    
    const modelo = await prisma.modelo.create({
      data: {
        nombre: body.nombre,
      },
    });
    
    return NextResponse.json(modelo, { status: 201 });
  } catch (error) {
    console.error("Error al crear modelo:", error);
    return new NextResponse(
      JSON.stringify({ error: "Error al crear modelo" }),
      { status: 500 }
    );
  }
} 