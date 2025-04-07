import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { parseISO, startOfDay, endOfDay } from "date-fns";

// Definir tipos para nuestros datos
type OrdenConTiempoReal = {
  id: string;
  numeroOrden: number;
  producto: string;
  productoId: string;
  lineaProduccion: string;
  lineaProduccionId: string;
  fechaProduccion: Date;
  tiempoPlan: number;
  tiempoReal: number;
  diferencia: number;
  diferenciaPorcentaje: number;
};

export async function GET(request: Request) {
  try {
    // Get date range from query parameters
    const { searchParams } = new URL(request.url);
    const fromParam = searchParams.get('from');
    const toParam = searchParams.get('to');
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit') as string) : 10;

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
        producto: {
          include: {
            modelo: true,
            sabor: true,
            tamaño: true,
          }
        },
        // @ts-ignore - Ignoramos errores de tipos con Prisma
        produccionPorHora: true,
        // @ts-ignore - Ignoramos errores de tipos con Prisma
        finalizaciones: true,
      },
      orderBy: {
        fechaProduccion: 'desc',
      },
    });

    // Calcular el tiempo real para cada orden
    const ordenesConTiempoReal: OrdenConTiempoReal[] = [];

    // @ts-ignore - Ignoramos errores de tipos
    for (const orden of ordenes) {
      try {
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
        const diferenciaPorcentaje = tiempoPlan > 0 
          ? ((tiempoReal - tiempoPlan) / tiempoPlan) * 100 
          : 0;
        
        ordenesConTiempoReal.push({
          // @ts-ignore - Ignoramos errores de tipos
          id: orden.id,
          // @ts-ignore - Ignoramos errores de tipos
          numeroOrden: orden.numeroOrden,
          // @ts-ignore - Ignoramos errores de tipos
          producto: `${orden.producto?.sabor?.nombre || ''} ${orden.producto?.modelo?.nombre || ''} ${orden.producto?.tamaño?.nombre || ''}`,
          // @ts-ignore - Ignoramos errores de tipos
          productoId: orden.productoId,
          // @ts-ignore - Ignoramos errores de tipos
          lineaProduccion: orden.lineaProduccion?.nombre || '',
          // @ts-ignore - Ignoramos errores de tipos
          lineaProduccionId: orden.lineaProduccionId,
          // @ts-ignore - Ignoramos errores de tipos
          fechaProduccion: orden.fechaProduccion,
          tiempoPlan, 
          tiempoReal,
          diferencia: tiempoReal - tiempoPlan,
          diferenciaPorcentaje: Math.round(diferenciaPorcentaje * 10) / 10,
        });
      } catch (err) {
        console.error("Error processing order:", err);
        // Skip this order if there's an error
        continue;
      }
    }

    // Ordenar por diferencia porcentual (mayor desviación primero)
    ordenesConTiempoReal.sort((a, b) => 
      Math.abs(b.diferenciaPorcentaje) - Math.abs(a.diferenciaPorcentaje)
    );

    // Calcular el promedio de las diferencias
    const diferenciasPositivas = ordenesConTiempoReal
      .filter(o => o.diferenciaPorcentaje > 0)
      .map(o => o.diferenciaPorcentaje);
      
    const diferenciasNegativas = ordenesConTiempoReal
      .filter(o => o.diferenciaPorcentaje < 0)
      .map(o => o.diferenciaPorcentaje);
    
    const promedioDiferenciasPositivas = diferenciasPositivas.length > 0
      ? diferenciasPositivas.reduce((sum, diff) => sum + diff, 0) / diferenciasPositivas.length
      : 0;
      
    const promedioDiferenciasNegativas = diferenciasNegativas.length > 0
      ? diferenciasNegativas.reduce((sum, diff) => sum + diff, 0) / diferenciasNegativas.length
      : 0;

    // Limitar resultados si se especificó un límite
    const ordenesLimitadas = limit > 0
      ? ordenesConTiempoReal.slice(0, limit)
      : ordenesConTiempoReal;

    // Devolver los datos procesados
    return NextResponse.json({
      data: ordenesLimitadas,
      totalOrdenes: ordenesConTiempoReal.length,
      promedioDesviacionPositiva: Math.round(promedioDiferenciasPositivas * 10) / 10,
      promedioDesviacionNegativa: Math.round(promedioDiferenciasNegativas * 10) / 10,
    });
    
  } catch (error) {
    console.error('Error calculando tiempo real vs planificado:', error);
    return NextResponse.json(
      { error: 'Error al calcular el tiempo real vs planificado de producción' },
      { status: 500 }
    );
  }
} 