import { NextRequest, NextResponse } from "next/server";
import { MongoClient, ObjectId } from "mongodb";

// POST: Directly update the production speed of a product in a production line
export async function POST(req: NextRequest) {
  try {
    const { lineaId, productoId, velocidadProduccion } = await req.json();

    console.log("Direct update request received:", { lineaId, productoId, velocidadProduccion });

    if (!lineaId || !productoId) {
      return NextResponse.json(
        { message: "lineaId y productoId son requeridos" },
        { status: 400 }
      );
    }

    // Parse the velocidadProduccion value
    let speedValue = null;
    if (velocidadProduccion !== null && velocidadProduccion !== undefined) {
      console.log('velocidadProduccion before parsing:', velocidadProduccion);
      console.log('velocidadProduccion type:', typeof velocidadProduccion);
      
      speedValue = typeof velocidadProduccion === 'string' 
        ? parseFloat(velocidadProduccion) 
        : velocidadProduccion;
      
      console.log('speedValue after parsing:', speedValue);
      console.log('speedValue type:', typeof speedValue);
      
      if (isNaN(speedValue)) {
        return NextResponse.json(
          { message: "La velocidad de producción en cajas/hora debe ser un número válido" },
          { status: 400 }
        );
      }
    }

    // Connect to MongoDB directly
    const uri = process.env.DATABASE_URL || '';
    const client = new MongoClient(uri);
    
    try {
      await client.connect();
      console.log("Connected to MongoDB");
      
      const database = client.db("tehuacan_brillante");
      const collection = database.collection("productos_en_lineas");
      
      // Find the relation
      const relation = await collection.findOne({
        productoId: new ObjectId(productoId),
        lineaProduccionId: new ObjectId(lineaId)
      });
      
      if (!relation) {
        return NextResponse.json(
          { message: "El producto no está asignado a esta línea de producción" },
          { status: 404 }
        );
      }
      
      console.log("Found relation:", relation);
      
      // Update the document
      const result = await collection.updateOne(
        { 
          productoId: new ObjectId(productoId),
          lineaProduccionId: new ObjectId(lineaId)
        },
        { $set: { velocidadProduccion: speedValue } }
      );
      
      console.log("Update result:", result);
      
      // Verify the update by fetching the document again
      const updatedRelation = await collection.findOne({
        productoId: new ObjectId(productoId),
        lineaProduccionId: new ObjectId(lineaId)
      });
      
      console.log("Updated relation:", updatedRelation);
      console.log("Updated velocidadProduccion:", updatedRelation?.velocidadProduccion);
      console.log("velocidadProduccion field exists:", updatedRelation && 'velocidadProduccion' in updatedRelation);
      
      if (result.matchedCount === 0) {
        return NextResponse.json(
          { message: "No se pudo encontrar la relación para actualizar" },
          { status: 404 }
        );
      }
      
      // Return success
      return NextResponse.json({
        success: true,
        message: "Velocidad de producción en cajas/hora actualizada con éxito",
        data: {
          productoId,
          lineaProduccionId: lineaId,
          velocidadProduccion: speedValue
        }
      });
    } finally {
      await client.close();
      console.log("Disconnected from MongoDB");
    }
  } catch (error: any) {
    console.error("Error updating production speed:", error);
    return NextResponse.json(
      { 
        message: "Error al actualizar la velocidad de producción",
        details: error.message
      },
      { status: 500 }
    );
  }
} 