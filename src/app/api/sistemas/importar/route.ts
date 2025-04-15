import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { prisma } from "@/lib/db/prisma";
import { parse } from "csv-parse/sync";

// Interfaz para los resultados de la importación
interface ImportResult {
  sistemas: {
    creados: number;
    existentes: number;
    fallidos: number;
  };
  subsistemas: {
    creados: number;
    existentes: number;
    fallidos: number;
  };
  subsubsistemas: {
    creados: number;
    existentes: number;
    fallidos: number;
  };
  errores: string[];
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Obtener el archivo CSV de la solicitud
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No se encontró el archivo CSV" },
        { status: 400 }
      );
    }

    // Verificar que sea un archivo CSV
    if (!file.name.endsWith(".csv")) {
      return NextResponse.json(
        { error: "El archivo debe ser en formato CSV" },
        { status: 400 }
      );
    }

    // Leer el contenido del archivo CSV
    const buffer = await file.arrayBuffer();
    const csvContent = new TextDecoder().decode(buffer);

    // Parsear el contenido CSV
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    // Inicializar objeto de resultados
    const resultado: ImportResult = {
      sistemas: { creados: 0, existentes: 0, fallidos: 0 },
      subsistemas: { creados: 0, existentes: 0, fallidos: 0 },
      subsubsistemas: { creados: 0, existentes: 0, fallidos: 0 },
      errores: [],
    };

    // Procesar cada fila del CSV
    for (const fila of records) {
      try {
        const nombreSistema = fila["Sistema"]?.trim();
        const nombreSubsistema = fila["Subsistema"]?.trim();
        const nombreSubsubsistema = fila["Sub-subsistema"]?.trim();
        const lineaProduccionId = fila["ID_Linea_Produccion"]?.trim();

        if (!nombreSistema || !lineaProduccionId) {
          resultado.errores.push(
            `Fila ignorada: El nombre del sistema y el ID de línea de producción son obligatorios`
          );
          continue;
        }

        // Verificar que la línea de producción existe
        const lineaProduccion = await prisma.lineaProduccion.findUnique({
          where: { id: lineaProduccionId },
        });

        if (!lineaProduccion) {
          resultado.errores.push(
            `Sistema "${nombreSistema}": La línea de producción con ID "${lineaProduccionId}" no existe`
          );
          resultado.sistemas.fallidos++;
          continue;
        }

        // Crear o recuperar el sistema
        let sistema = await prisma.sistema.findFirst({
          where: {
            nombre: { equals: nombreSistema, mode: "insensitive" },
            lineaProduccionId: lineaProduccionId,
          },
        });

        if (!sistema) {
          sistema = await prisma.sistema.create({
            data: {
              nombre: nombreSistema,
              lineaProduccionId: lineaProduccionId,
            },
          });
          resultado.sistemas.creados++;
        } else {
          resultado.sistemas.existentes++;
        }

        // Si hay un subsistema, crearlo o recuperarlo
        if (nombreSubsistema) {
          let subsistema = await prisma.subsistema.findFirst({
            where: {
              nombre: { equals: nombreSubsistema, mode: "insensitive" },
              sistemaId: sistema.id,
            },
          });

          if (!subsistema) {
            subsistema = await prisma.subsistema.create({
              data: {
                nombre: nombreSubsistema,
                sistemaId: sistema.id,
              },
            });
            resultado.subsistemas.creados++;
          } else {
            resultado.subsistemas.existentes++;
          }

          // Si hay un subsubsistema, crearlo o recuperarlo
          if (nombreSubsubsistema) {
            const subsubsistema = await prisma.subsubsistema.findFirst({
              where: {
                nombre: { equals: nombreSubsubsistema, mode: "insensitive" },
                subsistemaId: subsistema.id,
              },
            });

            if (!subsubsistema) {
              await prisma.subsubsistema.create({
                data: {
                  nombre: nombreSubsubsistema,
                  subsistemaId: subsistema.id,
                },
              });
              resultado.subsubsistemas.creados++;
            } else {
              resultado.subsubsistemas.existentes++;
            }
          }
        }
      } catch (error: any) {
        console.error("Error procesando fila:", error);
        resultado.errores.push(`Error procesando fila: ${error.message || 'Error desconocido'}`);
      }
    }

    return NextResponse.json(resultado);
  } catch (error: any) {
    console.error("Error importando CSV:", error);
    return NextResponse.json(
      { error: `Error al importar el archivo CSV: ${error.message || 'Error desconocido'}` },
      { status: 500 }
    );
  }
} 