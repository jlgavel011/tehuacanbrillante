import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { parseISO, startOfDay, endOfDay } from "date-fns";

// Definir tipos para nuestros datos
type TurnoConTiempoReal = {
  id: string;
  nombre: string;
  tiempoPlan: number;
  tiempoReal: number;
  diferencia: number;
  diferenciaPorcentaje: number;
  totalOrdenes: number;
  porcentajePromedioCumplimiento?: number;
};

export async function GET(req: Request) {
  try {
    // Get URL parameters
    const url = new URL(req.url);
    const fromParam = url.searchParams.get("from");
    const toParam = url.searchParams.get("to");
    const limit = url.searchParams.get("limit") ? parseInt(url.searchParams.get("limit")!) : undefined;
    const includeIncompleteOrders = url.searchParams.get("includeIncomplete") === "true";

    // Validate params
    if (!fromParam || !toParam) {
      return NextResponse.json(
        { error: "Los parámetros 'from' y 'to' son requeridos" },
        { status: 400 }
      );
    }

    const fromDate = parseISO(fromParam);
    const toDate = parseISO(toParam);

    // Fetch production orders that are completed within the date range - ignoring type errors
    // @ts-ignore - Ignoring type errors with Prisma
    const ordenes = await prisma.produccion.findMany({
      where: {
        fechaProduccion: {
          gte: startOfDay(fromDate),
          lte: endOfDay(toDate),
        },
        estado: "completada",
        // @ts-ignore - Ignoring type errors with Prisma
        tiempoPlan: {
          not: null,
        },
      },
      include: {
        // @ts-ignore - Ignoring type errors with Prisma
        produccionPorHora: true,
        // @ts-ignore - Ignoring type errors with Prisma
        finalizaciones: true,
      },
    });

    // Group by shift (turno is an Int in the schema, not a relation)
    const shiftsMap = new Map<number, {
      numero: number,
      tiempoPlan: number,
      tiempoReal: number,
      totalOrdenes: number,
      cumplimientoTotal: number // Para calcular el promedio de cumplimiento
    }>();
    
    let totalPromedioDesviacionPositiva = 0;
    let totalPromedioDesviacionNegativa = 0;
    let countPositive = 0;
    let countNegative = 0;

    // @ts-ignore - Ignoring type errors
    for (const orden of ordenes) {
      try {
        // Skip orders without tiempoPlan or turno
        // @ts-ignore - Ignoring type errors
        if (!orden.tiempoPlan || orden.turno === undefined || orden.turno === null) continue;
  
        // @ts-ignore - Ignoring type errors
        const turnoNumero = orden.turno;
        const turnoNombre = `Turno ${turnoNumero}`;
        
        // Calculate real time (hours from hourly logs + remaining time)
        let tiempoReal = 0;
        
        // Add time from hourly logs (each log counts as 1 hour)
        // @ts-ignore - Ignoring type errors
        if (orden.produccionPorHora && orden.produccionPorHora.length > 0) {
          // @ts-ignore - Ignoring type errors
          tiempoReal += orden.produccionPorHora.length;
        }
        
        // Add remaining time from finalization records
        // @ts-ignore - Ignoring type errors
        if (orden.finalizaciones && orden.finalizaciones.length > 0) {
          // @ts-ignore - Ignoring type errors
          const tiempoRestante = orden.finalizaciones.reduce((sum: number, fin: any) => sum + (fin.tiempoHoras || 0), 0);
          tiempoReal += tiempoRestante;
        }
        
        // @ts-ignore - Ignoring type errors
        const tiempoPlan = orden.tiempoPlan || 0;
        
        // @ts-ignore - Ignoramos errores de tipos
        const cajasProducidas = orden.cajasProducidas || 0;
        // @ts-ignore - Ignoramos errores de tipos
        const cajasPlanificadas = orden.cajasPlanificadas || 0;
        
        const porcentajeCumplimiento = cajasPlanificadas > 0 
          ? (cajasProducidas / cajasPlanificadas) * 100 
          : 0;
        
        // Logging para depuración
        console.log(`Orden ${orden.id}: cajasProducidas=${cajasProducidas}, cajasPlanificadas=${cajasPlanificadas}, porcentaje=${porcentajeCumplimiento}%, includeIncomplete=${includeIncompleteOrders}`);
        
        // Solo incluir órdenes que han completado el 95% o más de sus cajas planificadas,
        // o todas las órdenes si includeIncompleteOrders es true
        if (!includeIncompleteOrders && porcentajeCumplimiento < 95) {
          console.log(`  -> Saltando orden ${orden.id} por no cumplir criterio (${porcentajeCumplimiento.toFixed(1)}%)`);
          continue; // Saltamos esta orden si no cumple con el criterio
        }
        
        const diferencia = tiempoReal - tiempoPlan;
        const diferenciaPorcentaje = tiempoPlan !== 0 ? (diferencia / tiempoPlan) * 100 : 0;
  
        // Track metrics for calculating averages
        if (diferenciaPorcentaje < 0) {
          totalPromedioDesviacionNegativa += diferenciaPorcentaje;
          countNegative++;
        } else if (diferenciaPorcentaje > 0) {
          totalPromedioDesviacionPositiva += diferenciaPorcentaje;
          countPositive++;
        }
  
        // Add to shifts map
        if (!shiftsMap.has(turnoNumero)) {
          shiftsMap.set(turnoNumero, {
            numero: turnoNumero,
            tiempoPlan: 0,
            tiempoReal: 0,
            totalOrdenes: 0,
            cumplimientoTotal: 0
          });
        }
  
        const shiftData = shiftsMap.get(turnoNumero)!;
        shiftData.tiempoPlan += tiempoPlan;
        shiftData.tiempoReal += tiempoReal;
        shiftData.totalOrdenes += 1;
        shiftData.cumplimientoTotal += porcentajeCumplimiento;
      } catch (err) {
        console.error("Error processing order:", err);
        // Skip this order if there's an error
        continue;
      }
    }

    // Calculate aggregated percentages and format data
    let shiftsData: TurnoConTiempoReal[] = Array.from(shiftsMap.values()).map(shift => {
      const diferencia = shift.tiempoReal - shift.tiempoPlan;
      const diferenciaPorcentaje = shift.tiempoPlan > 0 
        ? ((shift.tiempoReal - shift.tiempoPlan) / shift.tiempoPlan) * 100 
        : 0;
      
      const porcentajePromedioCumplimiento = shift.totalOrdenes > 0
        ? shift.cumplimientoTotal / shift.totalOrdenes
        : 0;
        
      return {
        id: shift.numero.toString(),
        nombre: `Turno ${shift.numero}`,
        tiempoPlan: Math.round(shift.tiempoPlan * 10) / 10,
        tiempoReal: Math.round(shift.tiempoReal * 10) / 10,
        diferencia: Math.round(diferencia * 10) / 10,
        diferenciaPorcentaje: Math.round(diferenciaPorcentaje * 10) / 10,
        totalOrdenes: shift.totalOrdenes,
        porcentajePromedioCumplimiento: Math.round(porcentajePromedioCumplimiento * 10) / 10
      };
    });

    // Sort by deviation percentage (most efficient first)
    shiftsData.sort((a, b) => Math.abs(b.diferenciaPorcentaje) - Math.abs(a.diferenciaPorcentaje));

    // Apply limit if specified
    if (limit && shiftsData.length > limit) {
      shiftsData = shiftsData.slice(0, limit);
    }

    // Calculate averages
    const promedioDesviacionPositiva = countPositive > 0 ? totalPromedioDesviacionPositiva / countPositive : 0;
    const promedioDesviacionNegativa = countNegative > 0 ? totalPromedioDesviacionNegativa / countNegative : 0;

    return NextResponse.json({
      data: shiftsData,
      totalTurnos: shiftsMap.size,
      promedioDesviacionPositiva: Math.round(promedioDesviacionPositiva * 10) / 10,
      promedioDesviacionNegativa: Math.round(promedioDesviacionNegativa * 10) / 10,
      filtroCompletadas: !includeIncompleteOrders
    });
  } catch (error) {
    console.error("Error fetching real vs planned time by shift:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
} 