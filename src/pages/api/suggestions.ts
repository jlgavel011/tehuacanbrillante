import { NextApiRequest, NextApiResponse } from 'next';
import { MongoClient } from 'mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Log the request details
  console.log('Suggestion API called with method:', req.method);
  console.log('Request body:', req.body);

  if (req.method === 'POST') {
    const { user, message, date } = req.body;

    // Verify all required fields are present
    if (!user || !message || !date) {
      console.error('Missing required fields:', { user, message, date });
      return res.status(400).json({ error: 'Missing required fields', receivedData: { user, message, date } });
    }

    try {
      // Connect directly to MongoDB
      const uri = process.env.DATABASE_URL || '';
      if (!uri) {
        console.error('DATABASE_URL is empty');
        return res.status(500).json({ error: 'Database connection string is missing' });
      }

      console.log('Connecting to MongoDB...');
      const client = new MongoClient(uri);
      
      await client.connect();
      console.log('Connected to MongoDB');
      
      // Parse the connection string to get database name
      const dbName = uri.split('/').pop()?.split('?')[0] || 'tehuacan_brillante';
      console.log('Using database:', dbName);

      const database = client.db(dbName);
      const collection = database.collection('Suggestion');
      
      // Insert the suggestion
      const result = await collection.insertOne({
        user,
        message,
        date: new Date(date),
      });
      
      console.log('Suggestion inserted with ID:', result.insertedId);
      
      await client.close();
      res.status(200).json({ 
        success: true, 
        message: 'Suggestion stored successfully',
        id: result.insertedId
      });
    } catch (error) {
      console.error('Error storing suggestion:', error);
      res.status(500).json({ 
        error: 'Error storing suggestion', 
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
} 