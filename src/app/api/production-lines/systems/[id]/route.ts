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

    const system = await prisma.system.findUnique({
      where: {
        id,
      },
      include: {
        subsystems: {
          include: {
            subsubsystems: true,
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
    const existingSystem = await prisma.system.findUnique({
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
    const updatedSystem = await prisma.system.update({
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
    const existingSystem = await prisma.system.findUnique({
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

    // Eliminar el sistema
    await prisma.system.delete({
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