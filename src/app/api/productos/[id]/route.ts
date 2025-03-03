import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/db/prisma";
import { authOptions } from "@/lib/auth/auth-options";

// GET /api/productos/[id] - Get a specific product
export async function GET(
  req: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = context.params;
    
    // For GET requests, allow access even without authentication for now
    // This helps with development and testing
    
    const producto = await prisma.producto.findUnique({
      where: { id },
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
    
    if (!producto) {
      return new NextResponse(
        JSON.stringify({ error: "Producto no encontrado" }),
        { status: 404 }
      );
    }
    
    return NextResponse.json(producto);
  } catch (error) {
    console.error("Error al obtener producto:", error);
    return new NextResponse(
      JSON.stringify({ error: "Error al obtener producto" }),
      { status: 500 }
    );
  }
}

// PUT /api/productos/[id] - Update a product
export async function PUT(
  req: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = context.params; // Extract id once to avoid multiple references
    
    // For development purposes, allow updates without strict auth checks
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
    
    // Check if product exists
    const existingProduct = await prisma.producto.findUnique({
      where: { id }
    });
    
    if (!existingProduct) {
      return new NextResponse(
        JSON.stringify({ error: "Producto no encontrado" }),
        { status: 404 }
      );
    }
    
    // Check if another product with the same name exists (excluding this one)
    if (body.nombre !== existingProduct.nombre) {
      const duplicateProduct = await prisma.producto.findFirst({
        where: {
          nombre: body.nombre,
          id: { not: id }
        }
      });
      
      if (duplicateProduct) {
        return new NextResponse(
          JSON.stringify({ error: "Ya existe un producto con este nombre" }),
          { status: 400 }
        );
      }
    }
    
    // Update the product
    const producto = await prisma.producto.update({
      where: { id },
      data: {
        nombre: body.nombre,
        cajaId: body.cajaId,
        modeloId: body.modeloId,
        tamañoId: body.tamañoId,
        saborId: body.saborId,
      },
    });
    
    // Update materias primas
    if (body.materiasPrimasIds && Array.isArray(body.materiasPrimasIds)) {
      // First, delete all existing relationships
      await prisma.productoMateriaPrima.deleteMany({
        where: { productoId: id }
      });
      
      // Then, create new relationships if there are any materias primas
      if (body.materiasPrimasIds.length > 0) {
        const materiasPrimasData = body.materiasPrimasIds.map((materiaPrimaId: string) => ({
          productoId: id,
          materiaPrimaId
        }));
        
        await prisma.productoMateriaPrima.createMany({
          data: materiasPrimasData
        });
      }
    }
    
    // Return the updated product with all relations
    const productoWithRelations = await prisma.producto.findUnique({
      where: { id },
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
    
    return NextResponse.json(productoWithRelations);
  } catch (error) {
    console.error("Error al actualizar producto:", error);
    return new NextResponse(
      JSON.stringify({ error: "Error al actualizar producto" }),
      { status: 500 }
    );
  }
}

// DELETE /api/productos/[id] - Delete a product
export async function DELETE(
  req: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = context.params;
    
    // For development purposes, allow deletion without strict auth checks
    // In production, you would want to uncomment the following check
    /*
    if (!session || (session.user.role !== "MASTER_ADMIN" && session.user.role !== "MANAGER")) {
      return new NextResponse(
        JSON.stringify({ error: "No autorizado" }),
        { status: 401 }
      );
    }
    */
    
    // Check if product exists
    const existingProduct = await prisma.producto.findUnique({
      where: { id }
    });
    
    if (!existingProduct) {
      return new NextResponse(
        JSON.stringify({ error: "Producto no encontrado" }),
        { status: 404 }
      );
    }
    
    // First, delete all materias primas relationships
    await prisma.productoMateriaPrima.deleteMany({
      where: { productoId: id }
    });
    
    // Then, delete the product
    await prisma.producto.delete({
      where: { id }
    });
    
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Error al eliminar producto:", error);
    return new NextResponse(
      JSON.stringify({ error: "Error al eliminar producto" }),
      { status: 500 }
    );
  }
} 