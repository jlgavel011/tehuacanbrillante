import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { prisma } from "@/lib/db/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { message: "No autorizado" },
        { status: 401 }
      );
    }

    const orderId = params.id;
    const requestData = await request.json();
    const { 
      hourlyProduction, // Este será SIEMPRE un valor incremental
      activeHistorialId = null
    } = requestData;
    
    console.log("[UPDATE-CAJAS] Received request data:", {
      orderId,
      hourlyProduction,
      activeHistorialId: activeHistorialId ? 'provided' : 'not provided'
    });

    if (!orderId) {
      return NextResponse.json(
        { message: "ID de orden no proporcionado" },
        { status: 400 }
      );
    }

    if (hourlyProduction === undefined || hourlyProduction === null) {
      return NextResponse.json(
        { message: "El valor de producción incremental (hourlyProduction) es requerido" },
        { status: 400 }
      );
    }

    // Convertir a número si es necesario
    const incrementoCajas = typeof hourlyProduction === 'number' ? hourlyProduction : parseInt(hourlyProduction);

    if (isNaN(incrementoCajas) || incrementoCajas < 0) {
      return NextResponse.json(
        { message: "El valor de producción debe ser un número positivo" },
        { status: 400 }
      );
    }

    // First get the current order details
    const order = await prisma.produccion.findUnique({
      where: { id: orderId },
      include: {
        lineaProduccion: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { message: "Orden de producción no encontrada" },
        { status: 404 }
      );
    }

    // Record the hourly production data
    try {
      console.log("[UPDATE-CAJAS] Creating hourly production record with data:", {
        produccionId: orderId,
        cajasProducidas: incrementoCajas,
        horaRegistro: new Date()
      });
      
      await prisma.produccionPorHora.create({
        data: {
          produccionId: orderId,
          cajasProducidas: incrementoCajas,
          horaRegistro: new Date()
        }
      });
      
      console.log("[UPDATE-CAJAS] Successfully created hourly production record");
    } catch (error) {
      console.error("[UPDATE-CAJAS] Error creating hourly production record:", error);
      // Continue with the update even if there's an error with the hourly record
    }

    // Update the order with the new production count by incrementing the current value
    console.log("[UPDATE-CAJAS] Actualizando orden con increment de Prisma:", {
      id: orderId,
      valorActual: order.cajasProducidas,
      incremento: incrementoCajas
    });
    
    const updatedOrder = await prisma.produccion.update({
      where: { id: orderId },
      data: {
        // SIEMPRE usar increment para actualizar cajasProducidas
        cajasProducidas: {
          increment: incrementoCajas
        },
        estado: "en_progreso",
        lastUpdateTime: new Date()
      },
    });
    
    console.log("[UPDATE-CAJAS] Updated order with new production count:", {
      previousCount: order.cajasProducidas || 0,
      increment: incrementoCajas,
      newTotal: updatedOrder.cajasProducidas
    });

    // Update ProduccionHistorial active entry with new production
    let newHistorialId = null;
    try {
      // If historial ID is provided, use it first
      let activeHistorial = null;
      
      if (activeHistorialId) {
        console.log(`[UPDATE-CAJAS] Looking for historial with specific ID: ${activeHistorialId}`);
        
        // Try to find the historial by ID
        activeHistorial = await prisma.produccionHistorial.findUnique({
          where: {
            id: activeHistorialId
          }
        });
        
        if (activeHistorial && !activeHistorial.activo) {
          console.log(`[UPDATE-CAJAS] Found historial ID ${activeHistorialId} but it's not active, will search for active one`);
          activeHistorial = null;
        }
      }
      
      // If not found by ID or ID not provided, look for active one
      if (!activeHistorial) {
        console.log(`[UPDATE-CAJAS] Searching for active historial for order: ${orderId}`);
        
        activeHistorial = await prisma.produccionHistorial.findFirst({
          where: {
            produccionId: orderId,
            activo: true,
            fechaFin: null
          }
        });
      }
      
      if (activeHistorial) {
        console.log(`[UPDATE-CAJAS] Found active historial ID: ${activeHistorial.id} for order: ${orderId}`);
        
        // Update the historial with accumulated cajas
        const updatedHistorial = await prisma.produccionHistorial.update({
          where: { id: activeHistorial.id },
          data: {
            // SIEMPRE sumar el incremento de cajas
            cajasProducidas: activeHistorial.cajasProducidas + incrementoCajas
          }
        });
        
        console.log(`[UPDATE-CAJAS] Successfully updated ProduccionHistorial ID: ${activeHistorial.id}`);
        console.log(`[UPDATE-CAJAS] Added: ${incrementoCajas} cajas`);
        
        // Save the active historial ID for the response
        newHistorialId = activeHistorial.id;
      } else {
        console.error(`[UPDATE-CAJAS] No active ProduccionHistorial found for order: ${orderId}`);
        // Si no se encuentra un historial activo, creamos uno nuevo
        const orderData = await prisma.produccion.findUnique({
          where: { id: orderId },
          select: {
            lineaProduccionId: true,
            productoId: true
          }
        });
        
        if (orderData) {
          // Crear un nuevo historial
          const newHistorial = await prisma.produccionHistorial.create({
            data: {
              produccionId: orderId,
              userId: session.user.id,
              lineaProduccionId: orderData.lineaProduccionId,
              productoId: orderData.productoId,
              cajasProducidas: incrementoCajas,
              fechaInicio: new Date(),
              activo: true
            }
          });
          
          // Save the new historial ID for the response
          newHistorialId = newHistorial.id;
          console.log(`[UPDATE-CAJAS] Created new ProduccionHistorial ID: ${newHistorial.id} for order: ${orderId}`);
        } else {
          console.error(`[UPDATE-CAJAS] Could not create ProduccionHistorial, order data not found: ${orderId}`);
        }
      }
    } catch (error) {
      console.error("[UPDATE-CAJAS] Error updating ProduccionHistorial:", error);
      // Continue with the process even if there's an error with the history
    }

    return NextResponse.json(
      { 
        message: "Cajas producidas actualizadas correctamente",
        order: updatedOrder,
        activeHistorialId: newHistorialId
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[UPDATE-CAJAS] Error updating production cajas:", error);
    return NextResponse.json(
      { message: "Error al actualizar las cajas producidas" },
      { status: 500 }
    );
  }
} 