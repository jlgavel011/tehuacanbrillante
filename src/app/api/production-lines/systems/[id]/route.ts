import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { prisma } from "@/lib/db/prisma";

// GET /api/production-lines/systems/[id] - Get a specific system
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = params;

    const system = await prisma.sistema.findUnique({
      where: {
        id,
      },
      include: {
        subsistemas: {
          include: {
            subsubsistemas: true,
          },
        },
      },
    });

    if (!system) {
      return NextResponse.json(
        { error: "Sistema no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(system);
  } catch (error) {
    console.error("Error obteniendo sistema:", error);
    return NextResponse.json(
      { error: "Error al obtener el sistema" },
      { status: 500 }
    );
  }
}

// PUT /api/production-lines/systems/[id] - Update a system
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();

    // Validación básica de datos
    if (!body.nombre) {
      return NextResponse.json(
        { error: "El nombre es requerido" },
        { status: 400 }
      );
    }

    // Verificar si el sistema existe
    const existingSystem = await prisma.sistema.findUnique({
      where: {
        id,
      },
    });

    if (!existingSystem) {
      return NextResponse.json(
        { error: "Sistema no encontrado" },
        { status: 404 }
      );
    }

    // Actualizar el sistema
    const updatedSystem = await prisma.sistema.update({
      where: {
        id,
      },
      data: {
        nombre: body.nombre,
        descripcion: body.descripcion,
        estado: body.estado,
        criticidad: body.criticidad,
        fechaInstalacion: body.fechaInstalacion
          ? new Date(body.fechaInstalacion)
          : undefined,
        ultimoMantenimiento: body.ultimoMantenimiento
          ? new Date(body.ultimoMantenimiento)
          : undefined,
        proximoMantenimiento: body.proximoMantenimiento
          ? new Date(body.proximoMantenimiento)
          : undefined,
        lineaProduccionId: body.lineaProduccionId,
      },
    });

    return NextResponse.json(updatedSystem);
  } catch (error) {
    console.error("Error actualizando sistema:", error);
    return NextResponse.json(
      { error: "Error al actualizar el sistema" },
      { status: 500 }
    );
  }
}

// DELETE /api/production-lines/systems/[id] - Delete a system
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = params;

    // Verificar si el sistema existe
    const existingSystem = await prisma.sistema.findUnique({
      where: {
        id,
      },
      include: {
        paros: {
          select: {
            id: true,
          },
          take: 1, // Solo necesitamos saber si hay al menos uno
        },
        subsistemas: {
          select: {
            id: true,
          },
          take: 1, // Solo necesitamos saber si hay al menos uno
        },
      },
    });

    if (!existingSystem) {
      return NextResponse.json(
        { error: "Sistema no encontrado" },
        { status: 404 }
      );
    }

    // Verificar si hay paros asociados al sistema
    if (existingSystem.paros && existingSystem.paros.length > 0) {
      return NextResponse.json(
        { 
          error: "No se puede eliminar el sistema porque hay paros asociados. Elimine los paros primero o desasócielos de este sistema." 
        },
        { status: 400 }
      );
    }

    // Verificar si hay subsistemas asociados al sistema
    if (existingSystem.subsistemas && existingSystem.subsistemas.length > 0) {
      return NextResponse.json(
        { 
          error: "No se puede eliminar el sistema porque hay subsistemas asociados. Elimine los subsistemas primero." 
        },
        { status: 400 }
      );
    }

    // Eliminar el sistema
    await prisma.sistema.delete({
      where: {
        id,
      },
    });

    return NextResponse.json(
      { message: "Sistema eliminado correctamente" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error eliminando sistema:", error);
    return NextResponse.json(
      { error: "Error al eliminar el sistema" },
      { status: 500 }
    );
  }
} 