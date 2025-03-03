import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/db/prisma";
import { authOptions } from "@/lib/auth/auth-options";

// GET /api/productos - Get all products
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // For GET requests, allow access even without authentication for now
    // This helps with development and testing
    
    const productos = await prisma.producto.findMany({
      include: {
        caja: true,
        modelo: true,
        sabor: true,
        tamaño: true,
        materiasPrimas: {
          include: {
            materiaPrima: true
          }
        }
      },
    });
    
    return NextResponse.json(productos);
  } catch (error) {
    console.error("Error al obtener productos:", error);
    return new NextResponse(
      JSON.stringify({ error: "Error al obtener productos" }),
      { status: 500 }
    );
  }
}

// POST /api/productos - Create a new product
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // For development purposes, allow creation without strict auth checks
    // In production, you would want to uncomment the following check
    /*
    if (!session || (session.user.role !== "MASTER_ADMIN" && session.user.role !== "MANAGER")) {
      return new NextResponse(
        JSON.stringify({ error: "No autorizado" }),
        { status: 401 }
      );
    }
    */
    
    const body = await req.json();
    
    // Validate required fields
    if (!body.nombre || !body.cajaId || !body.modeloId || !body.tamañoId || !body.saborId) {
      return new NextResponse(
        JSON.stringify({ error: "Faltan campos obligatorios" }),
        { status: 400 }
      );
    }
    
    // Check if product already exists
    const existingProduct = await prisma.producto.findFirst({
      where: {
        nombre: body.nombre
      }
    });
    
    if (existingProduct) {
      return new NextResponse(
        JSON.stringify({ error: "Ya existe un producto con este nombre" }),
        { status: 400 }
      );
    }
    
    // Create the product
    const producto = await prisma.producto.create({
      data: {
        nombre: body.nombre,
        cajaId: body.cajaId,
        modeloId: body.modeloId,
        tamañoId: body.tamañoId,
        saborId: body.saborId,
      },
    });
    
    // Add materias primas if provided
    if (body.materiasPrimasIds && Array.isArray(body.materiasPrimasIds) && body.materiasPrimasIds.length > 0) {
      const materiasPrimasData = body.materiasPrimasIds.map((materiaPrimaId: string) => ({
        productoId: producto.id,
        materiaPrimaId
      }));
      
      await prisma.productoMateriaPrima.createMany({
        data: materiasPrimasData
      });
    }
    
    // Return the created product with all relations
    const productoWithRelations = await prisma.producto.findUnique({
      where: { id: producto.id },
      include: {
        caja: true,
        modelo: true,
        sabor: true,
        tamaño: true,
        materiasPrimas: {
          include: {
            materiaPrima: true
          }
        }
      }
    });
    
    return NextResponse.json(productoWithRelations, { status: 201 });
  } catch (error) {
    console.error("Error al crear producto:", error);
    return new NextResponse(
      JSON.stringify({ error: "Error al crear producto" }),
      { status: 500 }
    );
  }
} 