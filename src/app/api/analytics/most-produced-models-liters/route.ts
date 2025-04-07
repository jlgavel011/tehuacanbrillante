import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { parseISO, isValid } from "date-fns";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Obtener y validar parámetros de fechas
    let fromDate = searchParams.get("from") 
      ? parseISO(searchParams.get("from") as string) 
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    let toDate = searchParams.get("to") 
      ? parseISO(searchParams.get("to") as string) 
      : new Date();
    
    // Verificar que las fechas son válidas
    if (!isValid(fromDate) || !isValid(toDate)) {
      return NextResponse.json(
        { error: "Fechas inválidas" },
        { status: 400 }
      );
    }

    // Consultar las producciones completadas en el rango de fechas
    // @ts-ignore - Ignorar errores de tipo con Prisma
    const producciones = await prisma.produccion.findMany({
      where: {
        fechaProduccion: {
          gte: fromDate,
          lte: toDate,
        },
        estado: "completada"
      },
      include: {
        producto: {
          include: {
            modelo: true,
            tamaño: true,
            caja: true
          }
        }
      }
    });

    // Calcular litros totales por modelo
    const modelosMapa = new Map<string, { id: string, nombre: string, litros: number }>();

    // @ts-ignore - Ignorar errores de tipo
    producciones.forEach(prod => {
      try {
        // @ts-ignore - Ignorar errores de tipo
        const modelo = prod.producto.modelo;
        // @ts-ignore - Ignorar errores de tipo
        const tamaño = prod.producto.tamaño;
        // @ts-ignore - Ignorar errores de tipo
        const caja = prod.producto.caja;
        
        if (!modelo || !tamaño || !caja) return;
        
        // Calcular litros producidos (cajas * unidades por caja * litros por unidad)
        // @ts-ignore - Ignorar errores de tipo
        const litrosPorCaja = prod.cajasProducidas * caja.numeroUnidades * tamaño.litros;
        
        if (!modelosMapa.has(modelo.id)) {
          modelosMapa.set(modelo.id, {
            id: modelo.id,
            nombre: modelo.nombre,
            litros: 0
          });
        }
        
        const modeloData = modelosMapa.get(modelo.id)!;
        modeloData.litros += litrosPorCaja;
      } catch (error) {
        console.error("Error procesando producción:", error);
      }
    });

    // Convertir a arreglo y calcular porcentajes
    const modelosArray = Array.from(modelosMapa.values());
    const totalLitros = modelosArray.reduce((sum, modelo) => sum + modelo.litros, 0);
    
    const result = modelosArray.map(modelo => ({
      id: modelo.id,
      nombre: modelo.nombre,
      litros: Math.round(modelo.litros * 10) / 10, // Redondear a 1 decimal
      porcentaje: totalLitros > 0 ? Math.round((modelo.litros / totalLitros) * 1000) / 10 : 0 // Porcentaje con 1 decimal
    }));

    // Ordenar por litros (descendente)
    result.sort((a, b) => b.litros - a.litros);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error al obtener modelos por litros:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
} 