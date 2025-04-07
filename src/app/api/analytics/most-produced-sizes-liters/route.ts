import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { addDays, parseISO } from "date-fns";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  if (!from || !to) {
    return NextResponse.json(
      { error: "Missing date parameters" },
      { status: 400 }
    );
  }

  try {
    const fromDate = parseISO(from);
    const toDate = addDays(parseISO(to), 1); // Include the end date

    console.log("Buscando producciones desde:", fromDate, "hasta:", toDate);

    // Get all completed production orders within the date range
    // @ts-ignore
    const completedProductions = await prisma.produccion.findMany({
      where: {
        estado: {
          in: ["FINALIZADO", "completada", "en_progreso"]
        },
        fechaProduccion: {
          gte: fromDate,
          lt: toDate,
        },
      },
      include: {
        producto: {
          include: {
            tamaño: true,
            caja: true,
          },
        },
      },
    });

    console.log("Producciones encontradas:", completedProductions.length);

    // Calculate total liters produced by size
    const sizesLitersMap = new Map<string, { id: string; nombre: string; litros: number }>();
    let totalLiters = 0;

    for (const orden of completedProductions) {
      try {
        // @ts-ignore
        if (!orden.producto?.tamaño) {
          console.log("Orden sin tamaño:", orden.id);
          continue;
        }

        // @ts-ignore
        const tamanoId = orden.producto.tamaño.id;
        // @ts-ignore
        const tamanoNombre = orden.producto.tamaño.descripcion || `${orden.producto.tamaño.litros}L`;
        const cajasProducidas = orden.cajasProducidas || 0;
        
        // Calculate liters: boxes × units per box × liters per unit
        // @ts-ignore
        const numeroUnidades = orden.producto.caja?.numeroUnidades || 0;
        // @ts-ignore
        const litrosPorUnidad = orden.producto.tamaño.litros || 0;

        console.log(`Procesando orden ${orden.id}: cajas=${cajasProducidas}, unidades=${numeroUnidades}, litros=${litrosPorUnidad}`);
        
        const litrosProducidos = cajasProducidas * numeroUnidades * litrosPorUnidad;
        console.log("Litros producidos:", litrosProducidos);
        
        totalLiters += litrosProducidos;

        if (sizesLitersMap.has(tamanoId)) {
          const current = sizesLitersMap.get(tamanoId)!;
          sizesLitersMap.set(tamanoId, {
            ...current,
            litros: current.litros + litrosProducidos,
          });
        } else {
          sizesLitersMap.set(tamanoId, {
            id: tamanoId,
            nombre: tamanoNombre,
            litros: litrosProducidos,
          });
        }
      } catch (error) {
        console.error("Error processing order:", error);
        // Skip this order and continue with others
        continue;
      }
    }

    console.log("Total litros:", totalLiters);
    console.log("Tamaños procesados:", sizesLitersMap.size);

    // Convert map to array and sort by quantity in descending order
    const sizesList = Array.from(sizesLitersMap.entries()).map(
      ([tamanoId, data]) => {
        return {
          id: tamanoId,
          nombre: data.nombre,
          litros: Math.round(data.litros * 100) / 100, // Round to 2 decimal places
          porcentaje: totalLiters > 0 ? (data.litros / totalLiters) * 100 : 0,
        };
      }
    );

    // Sort by quantity
    sizesList.sort((a, b) => b.litros - a.litros);

    console.log("Resultado final:", sizesList);

    return NextResponse.json(sizesList);
  } catch (error) {
    console.error("Error in most-produced-sizes-liters:", error);
    return NextResponse.json(
      { error: "Error processing request" },
      { status: 500 }
    );
  }
} 