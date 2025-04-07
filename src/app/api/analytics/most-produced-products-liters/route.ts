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
            modelo: true,
            sabor: true,
            tamaño: true,
            caja: true,
          },
        },
      },
    });

    console.log("Producciones encontradas:", completedProductions.length);

    // Calculate total liters produced by product
    const productsLitersMap = new Map<string, { 
      id: string; 
      nombre: string; 
      modelo: string;
      sabor: string;
      tamaño: string;
      litros: number; 
    }>();
    let totalLiters = 0;

    for (const orden of completedProductions) {
      try {
        // @ts-ignore
        if (!orden.producto?.tamaño || !orden.producto?.caja) {
          console.log("Orden sin producto completo:", orden.id);
          continue;
        }

        // @ts-ignore
        const productoId = orden.producto.id;
        // @ts-ignore
        const productoNombre = orden.producto.nombre;
        // @ts-ignore
        const modeloNombre = orden.producto.modelo?.nombre || "Desconocido";
        // @ts-ignore
        const saborNombre = orden.producto.sabor?.nombre || "Desconocido";
        // @ts-ignore
        const tamanoNombre = orden.producto.tamaño?.nombre || `${orden.producto.tamaño?.litros}L` || "Desconocido";
        
        const cajasProducidas = orden.cajasProducidas || 0;
        
        // Calculate liters: boxes × units per box × liters per unit
        // @ts-ignore
        const numeroUnidades = orden.producto.caja.numeroUnidades || 0;
        // @ts-ignore
        const litrosPorUnidad = orden.producto.tamaño.litros || 0;

        console.log(`Procesando orden ${orden.id}: cajas=${cajasProducidas}, unidades=${numeroUnidades}, litros=${litrosPorUnidad}`);
        
        const litrosProducidos = cajasProducidas * numeroUnidades * litrosPorUnidad;
        console.log("Litros producidos:", litrosProducidos);
        
        totalLiters += litrosProducidos;

        if (productsLitersMap.has(productoId)) {
          const current = productsLitersMap.get(productoId)!;
          productsLitersMap.set(productoId, {
            ...current,
            litros: current.litros + litrosProducidos,
          });
        } else {
          productsLitersMap.set(productoId, {
            id: productoId,
            nombre: productoNombre,
            modelo: modeloNombre,
            sabor: saborNombre,
            tamaño: tamanoNombre,
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
    console.log("Productos procesados:", productsLitersMap.size);

    // Convert map to array and sort by quantity in descending order
    const productsList = Array.from(productsLitersMap.entries()).map(
      ([productoId, data]) => {
        return {
          id: productoId,
          nombre: data.nombre,
          modelo: data.modelo,
          sabor: data.sabor,
          tamaño: data.tamaño,
          litros: Math.round(data.litros * 100) / 100, // Round to 2 decimal places
          porcentaje: totalLiters > 0 ? (data.litros / totalLiters) * 100 : 0,
        };
      }
    );

    // Sort by quantity
    productsList.sort((a, b) => b.litros - a.litros);

    // Take top 10
    const topProducts = productsList.slice(0, 10);

    console.log("Resultado final:", topProducts);

    return NextResponse.json(topProducts);
  } catch (error) {
    console.error("Error in most-produced-products-liters:", error);
    return NextResponse.json(
      { error: "Error processing request" },
      { status: 500 }
    );
  }
} 