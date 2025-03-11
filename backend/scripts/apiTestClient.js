/**
 * API Test Client
 * Tests direct HTTP requests to the API server
 */
const axios = require('axios');

const API_URL = 'http://localhost:3001';

async function testApiEndpoints() {
  console.log('Testing API endpoints...');
  
  try {
    // Test health endpoint
    console.log('\nTesting health endpoint:');
    const healthResponse = await axios.get(`${API_URL}/health`);
    console.log(`Status: ${healthResponse.status}`);
    console.log(`Response: ${JSON.stringify(healthResponse.data)}`);
    
    // Test memories endpoint
    console.log('\nTesting memories endpoint:');
    const memoriesResponse = await axios.get(`${API_URL}/api/memories`);
    console.log(`Status: ${memoriesResponse.status}`);
    console.log(`Found ${memoriesResponse.data.length} memories`);
    
    // Test search endpoint
    console.log('\nTesting search endpoint:');
    const searchResponse = await axios.post(`${API_URL}/api/memories/search`, {
      text: "project meeting about AI"
    });
    
    console.log(`Status: ${searchResponse.status}`);
    console.log(`Found ${searchResponse.data.length} results`);
    
    if (searchResponse.data.length > 0) {
      console.log('First result:');
      const result = searchResponse.data[0];
      console.log(`- Content: ${result.content}`);
      console.log(`- Similarity: ${result.similarity}`);
    }
    
    console.log('\n✅ All endpoints tested successfully!');
  } catch (error) {
    console.error('\n❌ API test failed:');
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error(`Error: ${JSON.stringify(error.response.data)}`);
    } else {
      console.error(error.message);
      console.error('Make sure the server is running on port 3001');
    }
  }
}

testApiEndpoints(); 