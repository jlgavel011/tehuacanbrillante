import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { prisma } from "@/lib/db/prisma";

// Interface for TipoParo
interface TipoParo {
  id: string;
  nombre: string;
}

// Interface for groupBy result
interface ParoStat {
  tipoParoId: string;
  _count: { 
    id: number 
  };
  _sum: { 
    tiempoMinutos: number 
  };
}

// Type for Paro creation data
type ParoCreateData = {
  tiempoMinutos: number;
  descripcion: string;
  fechaInicio: Date;
  fechaFin: Date;
  tipoParo: {
    connect: { id: string }
  };
  produccion: {
    connect: { id: string }
  };
  lineaProduccion: {
    connect: { id: string }
  };
  sistema?: {
    connect: { id: string }
  };
  subsistema?: {
    connect: { id: string }
  };
  subsubsistema?: {
    connect: { id: string }
  };
  desviacionCalidad?: {
    connect: { id: string }
  };
  materiaPrima?: {
    connect: { id: string }
  };
};

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
      cajasProducidas, 
      hourlyProduction,
      lastUpdateTime, 
      paros = [], 
      activeHistorialId = null,
      resumenParos = null 
    } = requestData;
    
    console.log("Received request data:", {
      orderId,
      cajasProducidas,
      hourlyProduction,
      parosCount: paros.length,
      resumenParos: resumenParos ? 'present' : 'not provided'
    });

    if (!orderId) {
      return NextResponse.json(
        { message: "ID de orden no proporcionado" },
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

    // Calculate the increment in production since the last update
    // MODIFICACIÓN: Siempre obtener las cajas actuales directo de la base de datos
    let incrementoCajas = 0;
    const cajasPrevias = order.cajasProducidas || 0;
    
    if (hourlyProduction !== undefined && hourlyProduction !== null) {
      // Si recibimos hourlyProduction directamente, usamos ese valor como incremento
      incrementoCajas = typeof hourlyProduction === 'number' ? hourlyProduction : parseInt(hourlyProduction);
      console.log("Using provided hourlyProduction value for increment:", incrementoCajas);
    } else if (cajasProducidas !== undefined && cajasProducidas !== null) {
      // MODIFICACIÓN: Si cajasProducidas es enviado, lo tratamos SIEMPRE como el total final deseado
      // y calculamos el incremento basado en la diferencia con el total actual en la base de datos
      const cajasNuevas = typeof cajasProducidas === 'number' ? cajasProducidas : parseInt(cajasProducidas);
      
      // Si cajasProducidas > cajasPrevias, calculamos el incremento
      // De lo contrario, asumimos que son datos obsoletos y forzamos un incremento 0
      if (cajasNuevas > cajasPrevias) {
        incrementoCajas = cajasNuevas - cajasPrevias;
        console.log("Calculated increment from total:", {
          cajasPrevias,
          cajasNuevas,
          incremento: incrementoCajas
        });
      } else {
        console.log("ADVERTENCIA: cajasProducidas ≤ cajasPrevias, asumiendo incremento de 0", {
          cajasPrevias,
          cajasProducidas: cajasNuevas,
          incremento: 0
        });
        incrementoCajas = 0;
      }
    } else {
      // No hay ni hourlyProduction ni cajasProducidas, asumimos 0
      console.log("ADVERTENCIA: No se proporcionó ni hourlyProduction ni cajasProducidas, asumiendo incremento de 0");
      incrementoCajas = 0;
    }
    
    console.log("INCREMENTO FINAL de cajas:", incrementoCajas);
    
    // Una comprobación de seguridad para nunca permitir incrementos negativos
    if (incrementoCajas < 0) {
      incrementoCajas = 0;
      console.error("ADVERTENCIA: Se detectó un incremento negativo y se forzó a 0.");
    }
    
    // SIEMPRE registrar el incremento solo si es mayor que 0
    if (incrementoCajas > 0) {
      try {
        console.log("Creating hourly production record with data:", {
          produccionId: orderId,
          cajasProducidas: incrementoCajas,
          horaRegistro: new Date()
        });
        
        const produccionPorHora = await prisma.produccionPorHora.create({
          data: {
            produccionId: orderId,
            cajasProducidas: incrementoCajas,
            horaRegistro: new Date()
          }
        });
        
        console.log("Successfully created hourly production record:", produccionPorHora);
      } catch (error) {
        console.error("Error creating hourly production record:", error);
        // Continue with the update even if there's an error with the hourly record
      }
    } else {
      console.log("No increment in production, skipping hourly record");
    }

    // Register paros if there are any
    if (paros && paros.length > 0) {
      console.log(`Processing ${paros.length} paros for order: ${orderId}`);
      
      for (const paro of paros) {
        try {
          // Validate essential paro data
          if (!paro.tiempoMinutos || !paro.tipoParoId) {
            console.error("Invalid paro data, skipping:", paro);
            continue;
          }
          
          const createData: ParoCreateData = {
            tiempoMinutos: paro.tiempoMinutos,
            descripcion: paro.descripcion || "",
            fechaInicio: new Date(),
            fechaFin: new Date(),
            tipoParo: {
              connect: { id: paro.tipoParoId }
            },
            produccion: {
              connect: { id: orderId }
            },
            lineaProduccion: {
              connect: { id: order.lineaProduccionId }
            }
          };
          
          // Add optional connections only if valid IDs are provided
          if (paro.sistemaId) {
            createData.sistema = {
              connect: { id: paro.sistemaId }
            };
          }
          
          if (paro.subsistemaId) {
            createData.subsistema = {
              connect: { id: paro.subsistemaId }
            };
          }
          
          if (paro.subsubsistemaId) {
            createData.subsubsistema = {
              connect: { id: paro.subsubsistemaId }
            };
          }
          
          if (paro.desviacionCalidadId) {
            createData.desviacionCalidad = {
              connect: { id: paro.desviacionCalidadId }
            };
          }
          
          if (paro.materiaPrimaId) {
            createData.materiaPrima = {
              connect: { id: paro.materiaPrimaId }
            };
          }
          
          const createdParo = await prisma.paro.create({
            data: createData
          });
          
          console.log(`Created paro with ID: ${createdParo.id}`);
        } catch (error) {
          console.error("Error creating paro:", error);
          // Continue with the next paro even if there's an error with this one
        }
      }
    }

    let newHistorialId = null;

    // Update the order with the new production count
    // Always keep the status as "en_progreso" for hourly updates
    
    // Log antes de actualizar, para depuración
    console.log("Actualizando orden con increment de Prisma:", {
      id: orderId,
      valorActual: order.cajasProducidas,
      incremento: incrementoCajas
    });
    
    // SIEMPRE usar increment para actualizar cajasProducidas
    const updatedOrder = await prisma.produccion.update({
      where: { id: orderId },
      data: {
        cajasProducidas: {
          increment: incrementoCajas
        },
        estado: "en_progreso",
        lastUpdateTime: lastUpdateTime ? new Date(lastUpdateTime) : new Date()
      },
    });
    
    console.log("Updated order with new production count:", {
      previousCount: order.cajasProducidas || 0,
      increment: incrementoCajas,
      newTotal: updatedOrder.cajasProducidas
    });

    // Update ProduccionHistorial active entry with new production and paro info
    try {
      // If historial ID is provided, use it first
      let activeHistorial = null;
      
      if (activeHistorialId) {
        console.log(`[UPDATE] Looking for historial with specific ID: ${activeHistorialId}`);
        
        // Try to find the historial by ID
        activeHistorial = await prisma.produccionHistorial.findUnique({
          where: {
            id: activeHistorialId
          }
        });
        
        if (!activeHistorial) {
          console.error(`[UPDATE] ERROR: Historial ID ${activeHistorialId} provided by frontend not found in database!`);
        } else if (!activeHistorial.activo) {
          console.log(`[UPDATE] Found historial ID ${activeHistorialId} but it's not active, will search for active one`);
          activeHistorial = null;
        } else {
          console.log(`[UPDATE] Successfully found active historial with ID ${activeHistorialId}`);
        }
      }
      
      // If not found by ID or ID not provided, look for active one
      if (!activeHistorial) {
        console.log(`Searching for active historial for order: ${orderId}`);
        
        activeHistorial = await prisma.produccionHistorial.findFirst({
          where: {
            produccionId: orderId,
            activo: true,
            fechaFin: null
          }
        });
      }
      
      if (activeHistorial) {
        console.log(`[UPDATE] Found active historial ID: ${activeHistorial.id} for order: ${orderId}`);
        console.log(`[UPDATE] Current cajas in historial: ${activeHistorial.cajasProducidas}, incrementing by: ${incrementoCajas > 0 ? incrementoCajas : 0}`);
        
        // Get the tipos de paro to categorize them
        const tiposParo = await prisma.tipoParo.findMany();
        
        // Initialize counters for new paros
        let nuevosParosTotal = paros.length;
        let nuevosParosMantenimiento = 0;
        let nuevosParosCalidad = 0;
        let nuevosParosOperacion = 0;
        let nuevoTiempoParosTotal = 0;
        let nuevoTiempoParosMantenimiento = 0;
        let nuevoTiempoParosCalidad = 0;
        let nuevoTiempoParosOperacion = 0;
        
        // Si hay resumen de paros, usarlo directamente
        if (resumenParos) {
          console.log("Using provided paro summary:", resumenParos);
          
          nuevosParosTotal = resumenParos.cantidadTotal;
          nuevosParosMantenimiento = resumenParos.cantidadMantenimiento;
          nuevosParosCalidad = resumenParos.cantidadCalidad;
          nuevosParosOperacion = resumenParos.cantidadOperacion;
          nuevoTiempoParosTotal = resumenParos.tiempoTotal;
          nuevoTiempoParosMantenimiento = resumenParos.tiempoMantenimiento;
          nuevoTiempoParosCalidad = resumenParos.tiempoCalidad;
          nuevoTiempoParosOperacion = resumenParos.tiempoOperacion;
        } 
        // Si no hay resumen, categorizar los paros manualmente
        else {
          // Process each paro to categorize it
          for (const paro of paros) {
            const tipoParo = tiposParo.find((t: TipoParo) => t.id === paro.tipoParoId);
            const tiempo = paro.tiempoMinutos || 0;
            
            nuevoTiempoParosTotal += tiempo;
            
            // Categorize based on the tipo paro name
            if (tipoParo?.nombre.toLowerCase().includes('mantenimiento')) {
              nuevosParosMantenimiento++;
              nuevoTiempoParosMantenimiento += tiempo;
            } else if (tipoParo?.nombre.toLowerCase().includes('calidad')) {
              nuevosParosCalidad++;
              nuevoTiempoParosCalidad += tiempo;
            } else {
              // Default to operation
              nuevosParosOperacion++;
              nuevoTiempoParosOperacion += tiempo;
            }
          }
        }
        
        // Update the historial with accumulated values
        const updatedHistorial = await prisma.produccionHistorial.update({
          where: { id: activeHistorial.id },
          data: {
            // ARREGLO: Siempre incrementar las cajas producidas en el historial cuando
            // hay un incremento real (> 0) en la orden de producción
            ...(incrementoCajas > 0 ? {
              cajasProducidas: {
                increment: incrementoCajas  // Usar operación increment de Prisma
              }
            } : {}),
            cantidadParosTotal: activeHistorial.cantidadParosTotal + nuevosParosTotal,
            cantidadParosMantenimiento: activeHistorial.cantidadParosMantenimiento + nuevosParosMantenimiento,
            cantidadParosCalidad: activeHistorial.cantidadParosCalidad + nuevosParosCalidad,
            cantidadParosOperacion: activeHistorial.cantidadParosOperacion + nuevosParosOperacion,
            tiempoParosTotal: activeHistorial.tiempoParosTotal + nuevoTiempoParosTotal,
            tiempoParosMantenimiento: activeHistorial.tiempoParosMantenimiento + nuevoTiempoParosMantenimiento,
            tiempoParosCalidad: activeHistorial.tiempoParosCalidad + nuevoTiempoParosCalidad,
            tiempoParosOperacion: activeHistorial.tiempoParosOperacion + nuevoTiempoParosOperacion,
          }
        });
        
        // Verificar que se actualizó correctamente
        if (incrementoCajas > 0) {
          console.log(`[UPDATE] Incrementando cajas en historial: ${activeHistorial.cajasProducidas} + ${incrementoCajas} = ${activeHistorial.cajasProducidas + incrementoCajas}`);
        } else {
          console.log(`[UPDATE] No hay incremento de cajas, manteniendo valor actual: ${activeHistorial.cajasProducidas}`);
        }
        
        // Save the active historial ID for the response
        newHistorialId = activeHistorial.id;
      } else {
        console.error(`[UPDATE] No active ProduccionHistorial found for order: ${orderId}`);
        // Si no se encuentra un historial activo, creamos uno nuevo
        const order = await prisma.produccion.findUnique({
          where: { id: orderId },
          select: {
            lineaProduccionId: true,
            productoId: true
          }
        });
        
        if (order) {
          // Crear un nuevo historial
          const newHistorial = await prisma.produccionHistorial.create({
            data: {
              produccionId: orderId,
              userId: session.user.id,
              lineaProduccionId: order.lineaProduccionId,
              productoId: order.productoId,
              // El historial nuevo debe iniciar con el incremento actual de cajas,
              // solo si es mayor que 0, de lo contrario, iniciar en 0
              cajasProducidas: incrementoCajas > 0 ? incrementoCajas : 0,
              fechaInicio: new Date(),
              activo: true
            }
          });
          
          console.log(`[UPDATE] Creando nuevo historial con ${incrementoCajas > 0 ? incrementoCajas : 0} cajas iniciales`);
          
          // Si hay paros, actualizamos el historial recién creado con la información de paros
          if (paros.length > 0) {
            // Get the tipos de paro to categorize them
            const tiposParo = await prisma.tipoParo.findMany();
            
            // Initialize counters for new paros
            let nuevosParosTotal = paros.length;
            let nuevosParosMantenimiento = 0;
            let nuevosParosCalidad = 0;
            let nuevosParosOperacion = 0;
            let nuevoTiempoParosTotal = 0;
            let nuevoTiempoParosMantenimiento = 0;
            let nuevoTiempoParosCalidad = 0;
            let nuevoTiempoParosOperacion = 0;
            
            // Si hay resumen de paros, usarlo directamente
            if (resumenParos) {
              console.log("Using provided paro summary for new historial:", resumenParos);
              
              nuevosParosTotal = resumenParos.cantidadTotal;
              nuevosParosMantenimiento = resumenParos.cantidadMantenimiento;
              nuevosParosCalidad = resumenParos.cantidadCalidad;
              nuevosParosOperacion = resumenParos.cantidadOperacion;
              nuevoTiempoParosTotal = resumenParos.tiempoTotal;
              nuevoTiempoParosMantenimiento = resumenParos.tiempoMantenimiento;
              nuevoTiempoParosCalidad = resumenParos.tiempoCalidad;
              nuevoTiempoParosOperacion = resumenParos.tiempoOperacion;
            } 
            // Si no hay resumen, categorizar los paros manualmente
            else {
              // Process each paro to categorize it
              for (const paro of paros) {
                const tipoParo = tiposParo.find((t: TipoParo) => t.id === paro.tipoParoId);
                const tiempo = paro.tiempoMinutos || 0;
                
                nuevoTiempoParosTotal += tiempo;
                
                // Categorize based on the tipo paro name
                if (tipoParo?.nombre.toLowerCase().includes('mantenimiento')) {
                  nuevosParosMantenimiento++;
                  nuevoTiempoParosMantenimiento += tiempo;
                } else if (tipoParo?.nombre.toLowerCase().includes('calidad')) {
                  nuevosParosCalidad++;
                  nuevoTiempoParosCalidad += tiempo;
                } else {
                  // Default to operation
                  nuevosParosOperacion++;
                  nuevoTiempoParosOperacion += tiempo;
                }
              }
            }
            
            await prisma.produccionHistorial.update({
              where: { id: newHistorial.id },
              data: {
                cantidadParosTotal: nuevosParosTotal,
                cantidadParosMantenimiento: nuevosParosMantenimiento,
                cantidadParosCalidad: nuevosParosCalidad,
                cantidadParosOperacion: nuevosParosOperacion,
                tiempoParosTotal: nuevoTiempoParosTotal,
                tiempoParosMantenimiento: nuevoTiempoParosMantenimiento,
                tiempoParosCalidad: nuevoTiempoParosCalidad,
                tiempoParosOperacion: nuevoTiempoParosOperacion
              }
            });
          }
          
          // Save the new historial ID for the response
          newHistorialId = newHistorial.id;
          console.log(`[UPDATE] Created new ProduccionHistorial ID: ${newHistorial.id} for order: ${orderId}`);
        } else {
          console.error(`[UPDATE] Could not create ProduccionHistorial, order not found: ${orderId}`);
        }
      }
    } catch (error) {
      console.error("Error updating ProduccionHistorial:", error);
      // Continue with the process even if there's an error with the history
    }

    return NextResponse.json(
      { 
        message: "Producción actualizada correctamente",
        order: updatedOrder,
        activeHistorialId: newHistorialId
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating production order:", error);
    return NextResponse.json(
      { message: "Error al actualizar la producción" },
      { status: 500 }
    );
  }
} 