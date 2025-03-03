import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/db/prisma";
import { authOptions } from "@/lib/auth/auth-options";

// GET /api/materias-primas - Get all materias primas
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // For GET requests, allow access even without authentication for now
    // This helps with development and testing
    
    const materiasPrimas = await prisma.materiaPrima.findMany();
    
    return NextResponse.json(materiasPrimas);
  } catch (error) {
    console.error("Error al obtener materias primas:", error);
    return new NextResponse(
      JSON.stringify({ error: "Error al obtener materias primas" }),
      { status: 500 }
    );
  }
}

// POST /api/materias-primas - Create a new materia prima
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
    
    // Check if materia prima already exists
    const existingMateriaPrima = await prisma.materiaPrima.findFirst({
      where: {
        nombre: body.nombre
      }
    });
    
    if (existingMateriaPrima) {
      return new NextResponse(
        JSON.stringify({ error: "Ya existe una materia prima con este nombre" }),
        { status: 400 }
      );
    }
    
    const materiaPrima = await prisma.materiaPrima.create({
      data: {
        nombre: body.nombre,
      },
    });
    
    return NextResponse.json(materiaPrima, { status: 201 });
  } catch (error) {
    console.error("Error al crear materia prima:", error);
    return new NextResponse(
      JSON.stringify({ error: "Error al crear materia prima" }),
      { status: 500 }
    );
  }
} 