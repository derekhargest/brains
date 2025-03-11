import axios from 'axios';
import { checkQdrantAvailability, initializeCollections, checkCollectionsHealth } from '../vectorStore.js';

async function checkQdrant() {
  try {
    const baseUrl = 'http://localhost:6333';
    
    // Check if Qdrant is running
    console.log('Checking Qdrant server...');
    const healthResponse = await axios.get(`${baseUrl}/health`);
    console.log(`Qdrant server health: ${JSON.stringify(healthResponse.data)}`);
    
    // Get list of collections
    console.log('Checking collections...');
    const collectionsResponse = await axios.get(`${baseUrl}/collections`);
    console.log(`Found collections: ${collectionsResponse.data.result.collections.map(c => c.name).join(', ') || 'none'}`);
    
    // Create a test collection
    const testCollectionName = `test_${Date.now()}`;
    console.log(`Creating test collection: ${testCollectionName}...`);
    await axios.put(`${baseUrl}/collections/${testCollectionName}`, {
      vectors: {
        size: 384,
        distance: 'Cosine'
      }
    });
    
    // Insert a test point
    console.log('Inserting test point...');
    await axios.put(`${baseUrl}/collections/${testCollectionName}/points`, {
      points: [
        {
          id: "test-id-1",
          vector: Array(384).fill(0).map(() => Math.random()),
          payload: { test: true }
        }
      ]
    });
    
    console.log('Successfully inserted test point!');
    
    // Clean up
    console.log('Cleaning up test collection...');
    await axios.delete(`${baseUrl}/collections/${testCollectionName}`);
    
    console.log('✅ Qdrant seems to be working correctly!');
  } catch (error) {
    console.error('Error checking Qdrant:', error.response?.data || error.message);
  }
}

async function fullSystemCheck() {
  console.log('=== Starting System Diagnostic ===');
  
  // 1. Check Qdrant connection
  const qdrantAvailable = await checkQdrantAvailability();
  console.log(`Qdrant Connection: ${qdrantAvailable ? '✅' : '❌'}`);
  
  // 2. Initialize collections if needed
  if (qdrantAvailable) {
    console.log('Initializing collections...');
    await initializeCollections();
  }
  
  // 3. Verify collection health
  const health = await checkCollectionsHealth();
  console.log('\nCollection Health Report:');
  Object.entries(health.collections).forEach(([name, status]) => {
    console.log(`- ${name.padEnd(15)}: ${status.exists ? 'EXISTS' : 'MISSING'} | Points: ${status.pointsCount}`);
  });
  
  // 4. Final status
  console.log(`\nOverall System Status: ${health.overall ? '✅ HEALTHY' : '❌ DEGRADED'}`);
}

// Run the check
checkQdrant();
fullSystemCheck().catch(console.error); 