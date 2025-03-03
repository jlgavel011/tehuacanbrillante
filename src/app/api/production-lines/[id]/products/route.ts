import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { MongoClient, ObjectId } from "mongodb";

// GET: Fetch all products for a specific production line
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const lineaId = params.id;

    // Verify the production line exists
    const lineaProduccion = await prisma.lineaProduccion.findUnique({
      where: { id: lineaId },
    });

    if (!lineaProduccion) {
      return NextResponse.json(
        { message: "Línea de producción no encontrada" },
        { status: 404 }
      );
    }

    // Direct MongoDB query to fix the data first
    try {
      const uri = process.env.DATABASE_URL || '';
      const client = new MongoClient(uri);
      await client.connect();
      console.log("Connected to MongoDB directly");
      
      const database = client.db("tehuacan_brillante");
      const collection = database.collection("productos_en_lineas");
      
      // First, check if the documents have the velocidadProduccion field
      const directResults = await collection.find({ 
        lineaProduccionId: new ObjectId(lineaId) 
      }).toArray();
      
      console.log('Direct MongoDB query results:', JSON.stringify(directResults.map(item => ({
        id: item._id.toString(),
        productoId: item.productoId.toString(),
        lineaProduccionId: item.lineaProduccionId.toString(),
        velocidadProduccion: item.velocidadProduccion,
        hasVelocidadProduccion: 'velocidadProduccion' in item
      })), null, 2));
      
      // If the velocidadProduccion field is missing, add it with a default value of 0
      for (const doc of directResults) {
        if (!('velocidadProduccion' in doc)) {
          console.log(`Adding missing velocidadProduccion field to document ${doc._id}`);
          await collection.updateOne(
            { _id: doc._id },
            { $set: { velocidadProduccion: 0 } }
          );
        }
      }
      
      await client.close();
    } catch (err) {
      console.error('Error with direct MongoDB query:', err);
    }

    // Now get all products in this production line with their details using Prisma
    const productosEnLinea = await prisma.productoEnLinea.findMany({
      where: { lineaProduccionId: lineaId },
      select: {
        id: true,
        productoId: true,
        lineaProduccionId: true,
        velocidadProduccion: true,
        producto: {
          select: {
            id: true,
            nombre: true,
            sabor: {
              select: {
                id: true,
                nombre: true
              }
            },
            tamaño: {
              select: {
                id: true,
                litros: true,
                nombre: true
              }
            },
            modelo: {
              select: {
                id: true,
                nombre: true
              }
            },
            caja: {
              select: {
                id: true,
                numeroUnidades: true,
                nombre: true
              }
            }
          }
        }
      }
    });

    // Log the raw data directly from Prisma
    console.log('Raw Prisma data after fix:', JSON.stringify(productosEnLinea.map((item: any) => ({
      id: item.id,
      productoId: item.productoId,
      lineaProduccionId: item.lineaProduccionId,
      velocidadProduccion: item.velocidadProduccion,
      hasVelocidadProduccion: 'velocidadProduccion' in item
    })), null, 2));

    // Get all available products (not yet in this production line)
    const allProducts = await prisma.producto.findMany({
      include: {
        sabor: true,
        tamaño: true,
        modelo: true,
        caja: true,
        lineasProduccion: {
          include: {
            lineaProduccion: true,
          },
        },
      },
    });

    // Filter out products that are already in the production line
    const productosEnLineaIds = productosEnLinea.map(
      (pel: any) => pel.productoId
    );
    
    // Get available products with information about other production lines they're assigned to
    const availableProducts = allProducts
      .filter((product: any) => !productosEnLineaIds.includes(product.id))
      .map((product: any) => {
        // Get other production lines this product is assigned to
        const otherLines = product.lineasProduccion
          .filter((pl: any) => pl.lineaProduccionId !== lineaId)
          .map((pl: any) => ({
            id: pl.lineaProduccionId,
            nombre: pl.lineaProduccion.nombre,
            velocidadProduccion: pl.velocidadProduccion
          }));
        
        return {
          ...product,
          otherProductionLines: otherLines
        };
      });

    return NextResponse.json({
      productosEnLinea,
      availableProducts,
    });
  } catch (error) {
    console.error("Error fetching products for production line:", error);
    return NextResponse.json(
      { message: "Error al obtener productos" },
      { status: 500 }
    );
  }
}

// POST: Add a product to a production line
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const lineaId = params.id;
    const { productoId, velocidadProduccion } = await req.json();

    console.log("POST request received:", { lineaId, productoId, velocidadProduccion });

    if (!productoId) {
      return NextResponse.json(
        { message: "ID de producto requerido" },
        { status: 400 }
      );
    }

    // Verify the production line exists
    const lineaProduccion = await prisma.lineaProduccion.findUnique({
      where: { id: lineaId },
    });

    if (!lineaProduccion) {
      return NextResponse.json(
        { message: "Línea de producción no encontrada" },
        { status: 404 }
      );
    }

    // Verify the product exists
    const producto = await prisma.producto.findUnique({
      where: { id: productoId },
    });

    if (!producto) {
      return NextResponse.json(
        { message: "Producto no encontrado" },
        { status: 404 }
      );
    }

    // Check if the product is already in the production line
    const existingRelation = await prisma.productoEnLinea.findFirst({
      where: {
        lineaProduccionId: lineaId,
        productoId,
      },
    });

    if (existingRelation) {
      return NextResponse.json(
        { message: "El producto ya está asignado a esta línea de producción" },
        { status: 400 }
      );
    }

    // Parse velocidadProduccion if provided
    let speedValue = null;
    if (velocidadProduccion !== undefined && velocidadProduccion !== null) {
      speedValue = typeof velocidadProduccion === 'string' 
        ? parseFloat(velocidadProduccion) 
        : velocidadProduccion;
        
      if (isNaN(speedValue)) {
        speedValue = null;
      }
    }

    // Add the product to the production line
    try {
      console.log("Creating ProductoEnLinea with:", {
        productoId,
        lineaProduccionId: lineaId,
        velocidadProduccion: speedValue
      });

      // Create the relation
      const productoEnLinea = await prisma.productoEnLinea.create({
        data: {
          productoId,
          lineaProduccionId: lineaId,
          velocidadProduccion: speedValue
        },
      });

      console.log("ProductoEnLinea created successfully:", productoEnLinea);
      return NextResponse.json(productoEnLinea);
    } catch (createError: any) {
      console.error("Database error creating relation:", createError);
      // Log more details about the error
      if (createError.code) {
        console.error("Error code:", createError.code);
      }
      if (createError.meta) {
        console.error("Error meta:", createError.meta);
      }
      
      return NextResponse.json(
        { 
          message: "Error al crear la relación en la base de datos",
          details: createError.message
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("Error adding product to production line:", error);
    return NextResponse.json(
      { 
        message: "Error al agregar producto a la línea de producción",
        details: error.message
      },
      { status: 500 }
    );
  }
}

// DELETE: Remove a product from a production line
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const lineaId = params.id;
    const url = new URL(req.url);
    const productoId = url.searchParams.get("productoId");

    if (!productoId) {
      return NextResponse.json(
        { message: "ID de producto requerido" },
        { status: 400 }
      );
    }

    // Verify the production line exists
    const lineaProduccion = await prisma.lineaProduccion.findUnique({
      where: { id: lineaId },
    });

    if (!lineaProduccion) {
      return NextResponse.json(
        { message: "Línea de producción no encontrada" },
        { status: 404 }
      );
    }

    // Find the relation
    const relation = await prisma.productoEnLinea.findFirst({
      where: {
        lineaProduccionId: lineaId,
        productoId,
      },
    });

    if (!relation) {
      return NextResponse.json(
        { message: "El producto no está asignado a esta línea de producción" },
        { status: 404 }
      );
    }

    // Remove the product from the production line
    await prisma.productoEnLinea.delete({
      where: {
        id: relation.id,
      },
    });

    return NextResponse.json({
      message: "Producto eliminado de la línea de producción con éxito",
    });
  } catch (error) {
    console.error("Error removing product from production line:", error);
    return NextResponse.json(
      { message: "Error al eliminar producto de la línea de producción" },
      { status: 500 }
    );
  }
} 