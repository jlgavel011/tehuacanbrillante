import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/db/prisma";
import { authOptions } from "@/lib/auth/auth-options";

// GET /api/tamanos - Get all tamaños
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // For GET requests, allow access even without authentication for now
    // This helps with development and testing
    
    const tamaños = await prisma.tamaño.findMany();
    
    return NextResponse.json(tamaños);
  } catch (error) {
    console.error("Error al obtener tamaños:", error);
    return new NextResponse(
      JSON.stringify({ error: "Error al obtener tamaños" }),
      { status: 500 }
    );
  }
}

// POST /api/tamanos - Create a new tamaño
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
    if (!body.litros) {
      return new NextResponse(
        JSON.stringify({ error: "Faltan campos obligatorios" }),
        { status: 400 }
      );
    }
    
    // Check if tamaño already exists
    const existingTamaño = await prisma.tamaño.findFirst({
      where: {
        litros: parseFloat(body.litros.toFixed(3))
      }
    });
    
    if (existingTamaño) {
      return new NextResponse(
        JSON.stringify({ error: "Ya existe un tamaño con estos litros" }),
        { status: 400 }
      );
    }
    
    // Generate a nombre if not provided
    const litrosFormatted = parseFloat(body.litros.toFixed(3));
    const nombre = body.nombre || `${litrosFormatted}L`;
    
    const tamaño = await prisma.tamaño.create({
      data: {
        litros: litrosFormatted,
        nombre: nombre,
      },
    });
    
    return NextResponse.json(tamaño, { status: 201 });
  } catch (error) {
    console.error("Error al crear tamaño:", error);
    return new NextResponse(
      JSON.stringify({ error: "Error al crear tamaño" }),
      { status: 500 }
    );
  }
} 