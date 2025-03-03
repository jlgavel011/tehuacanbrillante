// Script to fix the velocidadProduccion field in the database
require('dotenv').config();
const { MongoClient } = require('mongodb');

async function main() {
  const uri = process.env.DATABASE_URL;
  if (!uri) {
    console.error('DATABASE_URL environment variable is not set');
    process.exit(1);
  }

  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const database = client.db('tehuacan_brillante');
    const collection = database.collection('productos_en_lineas');

    // Find all documents in the collection
    const documents = await collection.find({}).toArray();
    console.log(`Found ${documents.length} documents in the collection`);

    // Check each document for the velocidadProduccion field
    let updatedCount = 0;
    for (const doc of documents) {
      console.log(`Document ${doc._id}:`, doc);
      
      if (!('velocidadProduccion' in doc)) {
        console.log(`Adding velocidadProduccion field to document ${doc._id}`);
        
        // Update the document to add the velocidadProduccion field
        const result = await collection.updateOne(
          { _id: doc._id },
          { $set: { velocidadProduccion: 0 } }
        );
        
        if (result.modifiedCount === 1) {
          updatedCount++;
        }
      } else {
        console.log(`Document ${doc._id} already has velocidadProduccion field: ${doc.velocidadProduccion}`);
      }
    }

    console.log(`Updated ${updatedCount} documents`);

    // Verify the updates
    const updatedDocuments = await collection.find({}).toArray();
    for (const doc of updatedDocuments) {
      console.log(`Document ${doc._id} velocidadProduccion:`, doc.velocidadProduccion);
    }

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.close();
    console.log('Disconnected from MongoDB');
  }
}

main();
