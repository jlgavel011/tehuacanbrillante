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

    // Calculate total liters produced by box type
    const boxesLitersMap = new Map<string, { id: string; nombre: string; litros: number }>();
    let totalLiters = 0;

    for (const orden of completedProductions) {
      try {
        // @ts-ignore
        if (!orden.producto?.caja) {
          console.log("Orden sin caja:", orden.id);
          continue;
        }

        // @ts-ignore
        const cajaId = orden.producto.caja.id;
        // @ts-ignore
        const cajaNombre = orden.producto.caja.nombre || "Desconocido";
        const cajasProducidas = orden.cajasProducidas || 0;
        
        // Calculate liters: boxes × units per box × liters per unit
        // @ts-ignore
        const numeroUnidades = orden.producto.caja.numeroUnidades || 0;
        // @ts-ignore
        const litrosPorUnidad = orden.producto.tamaño?.litros || 0;

        console.log(`Procesando orden ${orden.id}: cajas=${cajasProducidas}, unidades=${numeroUnidades}, litros=${litrosPorUnidad}`);
        
        const litrosProducidos = cajasProducidas * numeroUnidades * litrosPorUnidad;
        console.log("Litros producidos:", litrosProducidos);
        
        totalLiters += litrosProducidos;

        if (boxesLitersMap.has(cajaId)) {
          const current = boxesLitersMap.get(cajaId)!;
          boxesLitersMap.set(cajaId, {
            ...current,
            litros: current.litros + litrosProducidos,
          });
        } else {
          boxesLitersMap.set(cajaId, {
            id: cajaId,
            nombre: cajaNombre,
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
    console.log("Cajas procesadas:", boxesLitersMap.size);

    // Convert map to array and sort by quantity in descending order
    const boxesList = Array.from(boxesLitersMap.entries()).map(
      ([cajaId, data]) => {
        return {
          id: cajaId,
          nombre: data.nombre,
          litros: Math.round(data.litros * 100) / 100, // Round to 2 decimal places
          porcentaje: totalLiters > 0 ? (data.litros / totalLiters) * 100 : 0,
        };
      }
    );

    // Sort by quantity
    boxesList.sort((a, b) => b.litros - a.litros);

    console.log("Resultado final:", boxesList);

    return NextResponse.json(boxesList);
  } catch (error) {
    console.error("Error in most-produced-boxes-liters:", error);
    return NextResponse.json(
      { error: "Error processing request" },
      { status: 500 }
    );
  }
} 