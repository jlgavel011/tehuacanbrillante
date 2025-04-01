import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/db/prisma";
import { authOptions } from "@/lib/auth/auth-options";

// GET /api/production-lines/[id]/quality-deviations
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      console.error("No session found");
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    console.log("Fetching deviations for production line:", params.id);
    
    // First check if the production line exists
    const lineaProduccion = await prisma.lineaProduccion.findUnique({
      where: {
        id: params.id,
      },
    });

    if (!lineaProduccion) {
      console.error("Production line not found:", params.id);
      return NextResponse.json(
        { error: "Línea de producción no encontrada" },
        { status: 404 }
      );
    }

    const deviations = await prisma.desviacionCalidad.findMany({
      where: {
        lineaProduccionId: params.id,
      },
      orderBy: {
        nombre: 'asc',
      },
    });

    console.log("Found deviations:", deviations);
    return NextResponse.json(deviations);
  } catch (error) {
    console.error("Error fetching quality deviations:", error);
    // Log more details about the error
    if (error instanceof Error) {
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    return NextResponse.json(
      { error: "Error al obtener las desviaciones de calidad" },
      { status: 500 }
    );
  }
}

// POST /api/production-lines/[id]/quality-deviations
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log("POST request received for production line:", params.id);
    
    const session = await getServerSession(authOptions);
    if (!session) {
      console.error("No session found");
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    console.log("Session found:", session.user);

    const body = await request.json();
    const { nombre } = body;
    console.log("Request body:", { nombre });

    if (!nombre || typeof nombre !== "string" || nombre.trim() === "") {
      console.error("Invalid name provided:", nombre);
      return NextResponse.json(
        { error: "El nombre de la desviación es requerido" },
        { status: 400 }
      );
    }

    // Check if the production line exists
    console.log("Checking if production line exists:", params.id);
    const lineaProduccion = await prisma.lineaProduccion.findUnique({
      where: {
        id: params.id,
      },
    });

    if (!lineaProduccion) {
      console.error("Production line not found:", params.id);
      return NextResponse.json(
        { error: "Línea de producción no encontrada" },
        { status: 404 }
      );
    }
    console.log("Production line found:", lineaProduccion);

    // Check if a quality deviation with this name already exists in the production line
    console.log("Checking for existing deviation with name:", nombre);
    const existingDeviation = await prisma.desviacionCalidad.findFirst({
      where: {
        nombre: {
          equals: nombre,
          mode: 'insensitive',
        },
        lineaProduccionId: params.id,
      },
    });

    if (existingDeviation) {
      console.error("Existing deviation found:", existingDeviation);
      return NextResponse.json(
        { error: "Ya existe una desviación de calidad con este nombre en esta línea de producción" },
        { status: 400 }
      );
    }

    console.log("Creating new quality deviation");
    const deviation = await prisma.desviacionCalidad.create({
      data: {
        nombre,
        lineaProduccionId: params.id,
      },
    });
    console.log("Quality deviation created:", deviation);

    return NextResponse.json(deviation, { status: 201 });
  } catch (error) {
    console.error("Error creating quality deviation:", error);
    if (error instanceof Error) {
      console.error("Error details:", {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
    }
    return NextResponse.json(
      { error: "Error al crear la desviación de calidad" },
      { status: 500 }
    );
  }
} 