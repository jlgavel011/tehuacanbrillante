import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Get all tipos de paro
    const tiposParo = await prisma.tipoParo.findMany({
      orderBy: {
        nombre: "asc",
      },
    });

    return NextResponse.json(tiposParo);
  } catch (error) {
    console.error("[TIPOS_PARO_GET]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
} 