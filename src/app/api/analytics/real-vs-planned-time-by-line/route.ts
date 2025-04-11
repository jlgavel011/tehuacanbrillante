import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { parseISO, startOfDay, endOfDay } from "date-fns";

// Definir tipos para nuestros datos
type LineaConTiempoReal = {
  id: string;
  nombre: string;
  tiempoPlan: number;
  tiempoReal: number;
  diferencia: number;
  diferenciaPorcentaje: number;
  totalOrdenes: number;
  porcentajePromedioCumplimiento: number; // Nueva propiedad para mostrar el cumplimiento promedio
};

export async function GET(request: Request) {
  try {
    // Get date range from query parameters
    const { searchParams } = new URL(request.url);
    const fromParam = searchParams.get('from');
    const toParam = searchParams.get('to');
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit') as string) : 10;
    const includeIncompleteOrders = searchParams.get('includeIncomplete') === 'true';

    if (!fromParam || !toParam) {
      return NextResponse.json(
        { error: 'Se requieren los parámetros from y to' },
        { status: 400 }
      );
    }

    const fromDate = parseISO(fromParam);
    const toDate = parseISO(toParam);

    // Obtener todas las órdenes completadas en el período - ignorando tipos
    // @ts-ignore - Ignoramos errores de tipos con Prisma
    const ordenes = await prisma.produccion.findMany({
      where: {
        fechaProduccion: {
          gte: startOfDay(fromDate),
          lte: endOfDay(toDate),
        },
        estado: "completada",
        // @ts-ignore - Ignoramos errores de tipos con Prisma
        tiempoPlan: {
          not: null,
        },
      },
      include: {
        lineaProduccion: true,
        // @ts-ignore - Ignoramos errores de tipos con Prisma
        produccionPorHora: true,
        // @ts-ignore - Ignoramos errores de tipos con Prisma
        finalizaciones: true,
      },
    });

    // Agrupar por línea de producción
    const lineasMap = new Map<string, {
      id: string,
      nombre: string,
      tiempoPlan: number,
      tiempoReal: number,
      totalOrdenes: number,
      cumplimientoTotal: number // Para calcular el promedio de cumplimiento
    }>();

    // @ts-ignore - Ignoramos errores de tipos
    for (const orden of ordenes) {
      try {
        // @ts-ignore - Ignoramos errores de tipos
        const lineaId = orden.lineaProduccionId;
        // @ts-ignore - Ignoramos errores de tipos
        const lineaNombre = orden.lineaProduccion?.nombre || 'Desconocida';
        
        // @ts-ignore - Ignoramos errores de tipos
        const horasRegistradas = orden.produccionPorHora?.length || 0;
        
        // @ts-ignore - Ignoramos errores de tipos
        const tiempoRemanente = Array.isArray(orden.finalizaciones) 
          // @ts-ignore - Ignoramos errores de tipos
          ? orden.finalizaciones.reduce((sum: number, fin: any) => sum + (fin.tiempoHoras || 0), 0)
          : 0;
        
        const tiempoReal = horasRegistradas + tiempoRemanente;
        
        // @ts-ignore - Ignoramos errores de tipos
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

        // Agregar o actualizar la línea en el mapa
        if (!lineasMap.has(lineaId)) {
          lineasMap.set(lineaId, {
            id: lineaId,
            nombre: lineaNombre,
            tiempoPlan: 0,
            tiempoReal: 0,
            totalOrdenes: 0,
            cumplimientoTotal: 0
          });
        }

        const lineaData = lineasMap.get(lineaId)!;
        lineaData.tiempoPlan += tiempoPlan;
        lineaData.tiempoReal += tiempoReal;
        lineaData.totalOrdenes += 1;
        lineaData.cumplimientoTotal += porcentajeCumplimiento;
      } catch (err) {
        console.error("Error processing order:", err);
        // Skip this order if there's an error
        continue;
      }
    }

    // Convertir el mapa a un array y calcular las diferencias
    const lineasConTiempoReal: LineaConTiempoReal[] = Array.from(lineasMap.values()).map(linea => {
      const diferencia = linea.tiempoReal - linea.tiempoPlan;
      const diferenciaPorcentaje = linea.tiempoPlan > 0 
        ? ((linea.tiempoReal - linea.tiempoPlan) / linea.tiempoPlan) * 100 
        : 0;
      
      const porcentajePromedioCumplimiento = linea.totalOrdenes > 0
        ? linea.cumplimientoTotal / linea.totalOrdenes
        : 0;
      
      return {
        id: linea.id,
        nombre: linea.nombre,
        tiempoPlan: Math.round(linea.tiempoPlan * 10) / 10,
        tiempoReal: Math.round(linea.tiempoReal * 10) / 10,
        diferencia: Math.round(diferencia * 10) / 10,
        diferenciaPorcentaje: Math.round(diferenciaPorcentaje * 10) / 10,
        totalOrdenes: linea.totalOrdenes,
        porcentajePromedioCumplimiento: Math.round(porcentajePromedioCumplimiento * 10) / 10
      };
    });

    // Ordenar por diferencia porcentual (mayor desviación primero)
    lineasConTiempoReal.sort((a, b) => 
      Math.abs(b.diferenciaPorcentaje) - Math.abs(a.diferenciaPorcentaje)
    );

    // Calcular el promedio de las diferencias
    const diferenciasPositivas = lineasConTiempoReal
      .filter(o => o.diferenciaPorcentaje > 0)
      .map(o => o.diferenciaPorcentaje);
      
    const diferenciasNegativas = lineasConTiempoReal
      .filter(o => o.diferenciaPorcentaje < 0)
      .map(o => o.diferenciaPorcentaje);
    
    const promedioDiferenciasPositivas = diferenciasPositivas.length > 0
      ? diferenciasPositivas.reduce((sum, diff) => sum + diff, 0) / diferenciasPositivas.length
      : 0;
      
    const promedioDiferenciasNegativas = diferenciasNegativas.length > 0
      ? diferenciasNegativas.reduce((sum, diff) => sum + diff, 0) / diferenciasNegativas.length
      : 0;

    // Limitar resultados si se especificó un límite
    const lineasLimitadas = limit > 0
      ? lineasConTiempoReal.slice(0, limit)
      : lineasConTiempoReal;

    // Devolver los datos procesados
    return NextResponse.json({
      data: lineasLimitadas,
      totalLineas: lineasConTiempoReal.length,
      promedioDesviacionPositiva: Math.round(promedioDiferenciasPositivas * 10) / 10,
      promedioDesviacionNegativa: Math.round(promedioDiferenciasNegativas * 10) / 10,
      filtroCompletadas: !includeIncompleteOrders
    });
    
  } catch (error) {
    console.error('Error calculando tiempo real vs planificado por línea:', error);
    return NextResponse.json(
      { error: 'Error al calcular el tiempo real vs planificado de producción por línea' },
      { status: 500 }
    );
  }
} 