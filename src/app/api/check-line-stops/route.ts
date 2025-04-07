import { NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const lineId = searchParams.get('lineId');
    
    if (!lineId) {
      return NextResponse.json({ error: 'Line ID is required' }, { status: 400 });
    }
    
    // Connect to MongoDB directly
    const uri = process.env.DATABASE_URL || '';
    const client = new MongoClient(uri);
    
    try {
      await client.connect();
      console.log("Connected to MongoDB");
      
      const database = client.db("tehuacan_brillante");
      const parosCollection = database.collection('paros');
      
      // Find all stops for the specified line
      const stops = await parosCollection.find({
        lineaProduccionId: new ObjectId(lineId)
      }).toArray();
      
      return NextResponse.json({
        lineId,
        totalStops: stops.length,
        stops: stops
      });
    } finally {
      await client.close();
      console.log("Disconnected from MongoDB");
    }
  } catch (error) {
    console.error('Error querying stops:', error);
    return NextResponse.json({ error: 'Failed to fetch stops' }, { status: 500 });
  }
} 