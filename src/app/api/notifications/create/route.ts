import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { prisma } from "@/lib/db/prisma";

interface User {
  id: string;
}

/**
 * POST /api/notifications/create
 * Crea notificaciones para usuarios basados en roles específicos
 */
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Obtener datos de la solicitud
    const data = await request.json();
    const { title, message, type, link, targetRoles, sourceUserId } = data;

    // Validar campos requeridos
    if (!title || !message || !type || !targetRoles || !Array.isArray(targetRoles)) {
      return NextResponse.json(
        { error: "Faltan campos requeridos" },
        { status: 400 }
      );
    }

    // Encontrar usuarios por roles
    const targetUsers = await prisma.user.findMany({
      where: {
        role: {
          in: targetRoles
        }
      },
      select: {
        id: true
      }
    });

    console.log(`Creating notifications for ${targetUsers.length} users with roles:`, targetRoles);

    // Crear notificaciones para cada usuario
    const notificaciones = await Promise.all(
      targetUsers.map((user: User) => 
        prisma.notificacion.create({
          data: {
            title,
            message,
            type,
            link,
            userId: user.id,
            sourceUserId: sourceUserId || session.user.id,
            read: false
          }
        })
      )
    );

    return NextResponse.json(
      { message: "Notificaciones creadas", count: notificaciones.length },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating notifications:", error);
    return NextResponse.json(
      { error: "Error al crear notificaciones" },
      { status: 500 }
    );
  }
} 