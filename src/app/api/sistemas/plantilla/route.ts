import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Crear contenido CSV con encabezados y ejemplos
    const csvContent = 
      "Sistema,Subsistema,Sub-subsistema,ID_Linea_Produccion\n" +
      "Sistema Ejemplo 1,,,[ID_Linea_Produccion]\n" +
      "Sistema Ejemplo 2,Subsistema Ejemplo 1,,[ID_Linea_Produccion]\n" +
      "Sistema Ejemplo 2,Subsistema Ejemplo 1,Sub-subsistema Ejemplo 1,[ID_Linea_Produccion]\n" +
      "Sistema Ejemplo 2,Subsistema Ejemplo 2,,[ID_Linea_Produccion]\n" +
      "Sistema Ejemplo 3,Subsistema Ejemplo 3,Sub-subsistema Ejemplo 2,[ID_Linea_Produccion]\n";

    // Configurar respuesta como archivo CSV para descarga
    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": "attachment; filename=plantilla_sistemas.csv",
      },
    });
  } catch (error) {
    console.error("Error generando plantilla CSV:", error);
    return NextResponse.json(
      { error: "Error al generar la plantilla" },
      { status: 500 }
    );
  }
} 