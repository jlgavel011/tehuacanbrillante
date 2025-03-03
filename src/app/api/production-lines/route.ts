import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { prisma } from "@/lib/db/prisma";

// GET /api/production-lines - Get all production lines
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const lineasProduccion = await prisma.lineaProduccion.findMany({
      orderBy: {
        nombre: 'asc',
      },
    });

    // Map the Spanish field names to English names expected by the frontend
    const productionLines = lineasProduccion.map((linea: { id: string; nombre: string; createdAt?: Date; updatedAt?: Date }) => ({
      id: linea.id,
      name: linea.nombre,
      createdAt: linea.createdAt ? linea.createdAt.toISOString() : new Date().toISOString(),
      updatedAt: linea.updatedAt ? linea.updatedAt.toISOString() : new Date().toISOString()
    }));

    return NextResponse.json(productionLines);
  } catch (error) {
    console.error("Error fetching production lines:", error);
    return NextResponse.json(
      { error: "Error al obtener las líneas de producción" },
      { status: 500 }
    );
  }
}

// POST /api/production-lines - Create a new production line
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { name } = body;

    if (!name || typeof name !== "string" || name.trim() === "") {
      return NextResponse.json(
        { error: "El nombre de la línea de producción es requerido" },
        { status: 400 }
      );
    }

    // Check if a production line with this name already exists
    const existingLineaProduccion = await prisma.lineaProduccion.findFirst({
      where: {
        nombre: {
          equals: name,
          mode: 'insensitive',
        },
      },
    });

    if (existingLineaProduccion) {
      return NextResponse.json(
        { error: "Ya existe una línea de producción con este nombre" },
        { status: 400 }
      );
    }

    const nuevaLineaProduccion = await prisma.lineaProduccion.create({
      data: {
        nombre: name,
      },
    });

    // Map the response to English field names
    const newProductionLine = {
      id: nuevaLineaProduccion.id,
      name: nuevaLineaProduccion.nombre,
      createdAt: nuevaLineaProduccion.createdAt ? nuevaLineaProduccion.createdAt.toISOString() : new Date().toISOString(),
      updatedAt: nuevaLineaProduccion.updatedAt ? nuevaLineaProduccion.updatedAt.toISOString() : new Date().toISOString()
    };

    return NextResponse.json(newProductionLine);
  } catch (error) {
    console.error("Error creating production line:", error);
    return NextResponse.json(
      { error: "Error al crear la línea de producción" },
      { status: 500 }
    );
  }
} 