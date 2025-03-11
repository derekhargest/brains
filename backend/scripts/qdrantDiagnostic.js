/**
 * Qdrant Diagnostic Tool
 * 
 * This script helps diagnose issues with Qdrant vector search
 */

const { QdrantClient } = require('@qdrant/js-client-rest');

async function runDiagnostic() {
  console.log("=== Qdrant Diagnostic Tool ===\n");
  
  // Connect to Qdrant
  const client = new QdrantClient({ 
    url: process.env.QDRANT_URL || 'http://localhost:6333'
  });
  
  try {
    // Check server status
    console.log("Checking Qdrant server status...");
    const telemetry = await client.getTelemetry();
    console.log(`✓ Connected to Qdrant version: ${telemetry.version}`);
    
    // List collections
    console.log("\nListing collections...");
    const collections = await client.getCollections();
    console.log(`Found ${collections.collections.length} collections`);
    
    // For each collection, get details
    for (const collection of collections.collections) {
      console.log(`\n== Collection: ${collection.name} ==`);
      
      const info = await client.getCollection(collection.name);
      
      // Check vector configuration
      console.log("Vector configuration:");
      if (info.config?.vectors) {
        console.log(JSON.stringify(info.config.vectors, null, 2));
      } else if (info.config?.params?.vectors) {
        console.log(JSON.stringify(info.config.params.vectors, null, 2));
      } else {
        console.log("Could not determine vector configuration");
      }
      
      // Count points
      const count = await client.count(collection.name);
      console.log(`Points count: ${count.count}`);
      
      // Get sample points (if any exist)
      if (count.count > 0) {
        console.log("\nSample points:");
        const points = await client.scroll(collection.name, { limit: 1, with_payload: true });
        if (points.points.length > 0) {
          const point = points.points[0];
          console.log(`ID: ${point.id}`);
          console.log(`Payload: ${JSON.stringify(point.payload)}`);
        }
        
        // Perform a test search with a random vector to check format
        console.log("\nTesting search with random vector...");
        try {
          // Create random vector with same dimensions as the collection
          const vectorSize = info.config?.vectors?.size || 
                             info.config?.params?.vectors?.size || 
                             384;
          
          const randomVector = Array(vectorSize).fill(0).map(() => Math.random());
          
          // Test search in both formats
          console.log(`Testing search with direct vector format...`);
          const searchResult1 = await client.search(collection.name, {
            vector: randomVector,
            limit: 1
          });
          console.log(`Direct vector search returned ${searchResult1.length} results`);
          
          // If that failed, try named vector format
          console.log(`Testing search with named vector format...`);
          const searchResult2 = await client.search(collection.name, {
            vector: { 
              name: "default", // or the actual vector name if known
              vector: randomVector 
            },
            limit: 1
          });
          console.log(`Named vector search returned ${searchResult2.length} results`);
        } catch (searchError) {
          console.error(`Search test failed: ${searchError.message}`);
        }
      }
    }
  } catch (error) {
    console.error("Diagnostic failed:", error);
  }
}

runDiagnostic().catch(console.error); 