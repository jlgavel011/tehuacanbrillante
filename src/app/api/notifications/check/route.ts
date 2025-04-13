import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { prisma } from "@/lib/db/prisma";

// Interfaz para el tipo de notificación de la base de datos
interface DatabaseNotification {
  id: string;
  title: string;
  message: string;
  type: string;
  link?: string;
  read: boolean;
  createdAt: Date;
  readAt?: Date;
  userId: string;
  sourceUserId?: string;
}

/**
 * GET /api/notifications/check
 * Obtiene las notificaciones no leídas para el usuario autenticado
 */
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    console.log("Checking notifications for user:", session.user.id, session.user.role);

    // Obtener las notificaciones no leídas del usuario desde la base de datos
    const notificaciones = await prisma.notificacion.findMany({
      where: {
        userId: session.user.id,
        read: false
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 20 // Limitar a las 20 más recientes
    });

    console.log(`Found ${notificaciones.length} unread notifications for user ${session.user.id}`);

    return NextResponse.json({ 
      notifications: notificaciones.map((notif: DatabaseNotification) => ({
        id: notif.id,
        title: notif.title,
        message: notif.message,
        type: notif.type,
        link: notif.link,
        read: notif.read,
        timestamp: notif.createdAt
      })),
      count: notificaciones.length 
    });
  } catch (error) {
    console.error("Error checking notifications:", error);
    return NextResponse.json(
      { error: "Error al verificar notificaciones" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/notifications/check
 * Marca notificaciones del usuario como leídas
 */
export async function PUT(request: NextRequest) {
  try {
    // Verificar autenticación
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Obtener datos de la solicitud
    const data = await request.json();
    const { notificationId } = data;

    console.log("Marking notifications as read for user:", session.user.id, {
      specificNotification: notificationId || "all"
    });

    if (notificationId) {
      // Marcar una notificación específica como leída
      await prisma.notificacion.updateMany({
        where: {
          id: notificationId,
          userId: session.user.id
        },
        data: {
          read: true,
          readAt: new Date()
        }
      });

      console.log(`Marked notification ${notificationId} as read for user ${session.user.id}`);
    } else {
      // Marcar todas las notificaciones como leídas
      const result = await prisma.notificacion.updateMany({
        where: {
          userId: session.user.id,
          read: false
        },
        data: {
          read: true,
          readAt: new Date()
        }
      });

      console.log(`Marked ${result.count} notifications as read for user ${session.user.id}`);
    }

    return NextResponse.json({ 
      message: "Notificaciones actualizadas",
      success: true
    });
  } catch (error) {
    console.error("Error updating notifications:", error);
    return NextResponse.json(
      { error: "Error al actualizar notificaciones" },
      { status: 500 }
    );
  }
} 