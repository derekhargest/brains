/**
 * Full System Integration Test
 * Tests the entire Derek-Brain system from API to storage
 */

const assert = require('assert');
const axios = require('axios');
const PatternService = require('../services/patternService');
const TestPatternStorage = require('../patterns/storage/testStorage');

// Configuration
const API_URL = process.env.API_URL || 'http://localhost:3001/api';
const TEST_TIMEOUT = 5000;

// Test data
const testMemories = [
  { content: "Had coffee this morning while reviewing project plans", timestamp: new Date().toISOString() },
  { content: "Meeting with Sarah about the new feature. She thinks we should launch next week.", timestamp: new Date().toISOString() },
  { content: "Feeling tired after a long day of coding. Need to get more sleep tonight.", timestamp: new Date().toISOString() },
  { content: "Planning to visit my parents this weekend. Mom is making her famous lasagna.", timestamp: new Date().toISOString() },
  { content: "Read an interesting article about AI pattern recognition today during lunch.", timestamp: new Date().toISOString() },
];

// Test suite
async function runTests() {
  console.log('🧪 Running Derek-Brain Full System Test');
  
  let passed = 0;
  let failed = 0;
  
  // Test direct pattern detection
  await runTest('Pattern detection works directly', async () => {
    const storage = new TestPatternStorage();
    const patternService = new PatternService(storage);
    await patternService.initialize();
    
    const memory = testMemories[0];
    const patterns = await patternService.processContent(memory.content, { timestamp: memory.timestamp });
    
    assert(patterns.length > 0, 'Expected at least one pattern to be detected');
    assert(patterns.some(p => p.type === 'temporal'), 'Expected temporal pattern detection');
    
    // Clear after test
    await storage.clearPatterns();
  });
  
  // Test API health check
  await runTest('API is running', async () => {
    try {
      const response = await axios.get(`${API_URL.replace('/api', '')}/`);
      assert.strictEqual(response.status, 200, 'Expected 200 OK response');
      assert(response.data.includes('Derek-Brain API'), 'Expected API health message');
    } catch (error) {
      throw new Error(`API not reachable: ${error.message}`);
    }
  });
  
  // Test memory API
  await runTest('Memory API endpoints work', async () => {
    try {
      // Add a memory
      const memory = testMemories[1];
      const addResponse = await axios.post(`${API_URL}/memories`, memory);
      
      assert.strictEqual(addResponse.status, 201, 'Expected 201 Created response');
      assert(addResponse.data.memory, 'Expected memory object in response');
      assert.strictEqual(addResponse.data.memory.content, memory.content, 'Expected added memory content to match');
      
      // Get all memories
      const getResponse = await axios.get(`${API_URL}/memories`);
      assert.strictEqual(getResponse.status, 200, 'Expected 200 OK response');
      assert(Array.isArray(getResponse.data), 'Expected array of memories');
      assert(getResponse.data.some(m => m.content === memory.content), 'Expected to find added memory');
      
      // Search memories
      const searchTerm = 'Sarah';
      const searchResponse = await axios.post(`${API_URL}/memories/search`, { text: searchTerm });
      assert.strictEqual(searchResponse.status, 200, 'Expected 200 OK response');
      assert(Array.isArray(searchResponse.data), 'Expected array of search results');
      assert(searchResponse.data.some(m => m.content.includes(searchTerm)), 'Expected search results to contain search term');
      
    } catch (error) {
      throw new Error(`Memory API test failed: ${error.message}`);
    }
  });
  
  // Test pattern API
  await runTest('Pattern API endpoints work', async () => {
    try {
      // Get insights
      const insightsResponse = await axios.get(`${API_URL}/patterns/insights`);
      assert.strictEqual(insightsResponse.status, 200, 'Expected 200 OK response');
      assert(insightsResponse.data.conceptualInsights, 'Expected conceptual insights');
      assert(insightsResponse.data.relationshipInsights, 'Expected relationship insights');
      
      // Get network visualization
      const networkResponse = await axios.get(`${API_URL}/patterns/visualization/network`);
      assert.strictEqual(networkResponse.status, 200, 'Expected 200 OK response');
      assert(networkResponse.data.nodes, 'Expected nodes in network data');
      assert(networkResponse.data.links, 'Expected links in network data');
      
    } catch (error) {
      throw new Error(`Pattern API test failed: ${error.message}`);
    }
  });
  
  // Test preference API
  await runTest('Preference API endpoints work', async () => {
    try {
      const testKey = 'testPref';
      const testValue = { setting: true, color: 'blue' };
      
      // Set preference
      const setResponse = await axios.post(`${API_URL}/preferences`, { key: testKey, value: testValue });
      assert.strictEqual(setResponse.status, 201, 'Expected 201 Created response');
      assert.strictEqual(setResponse.data.key, testKey, 'Expected correct key in response');
      assert.deepStrictEqual(setResponse.data.value, testValue, 'Expected correct value in response');
      
      // Get preference
      const getResponse = await axios.get(`${API_URL}/preferences/${testKey}`);
      assert.strictEqual(getResponse.status, 200, 'Expected 200 OK response');
      assert.strictEqual(getResponse.data.key, testKey, 'Expected correct key in get response');
      assert.deepStrictEqual(getResponse.data.value, testValue, 'Expected correct value in get response');
      
      // Get all preferences
      const getAllResponse = await axios.get(`${API_URL}/preferences`);
      assert.strictEqual(getAllResponse.status, 200, 'Expected 200 OK response');
      assert(Array.isArray(getAllResponse.data), 'Expected array of preferences');
      assert(getAllResponse.data.some(p => p.key === testKey), 'Expected to find added preference');
      
      // Delete preference
      const deleteResponse = await axios.delete(`${API_URL}/preferences/${testKey}`);
      assert.strictEqual(deleteResponse.status, 200, 'Expected 200 OK response');
      assert.strictEqual(deleteResponse.data.success, true, 'Expected success:true in delete response');
      
    } catch (error) {
      throw new Error(`Preference API test failed: ${error.message}`);
    }
  });
  
  // Test end-to-end flow
  await runTest('End-to-end memory to patterns flow', async () => {
    try {
      // Add several memories
      for (const memory of testMemories) {
        await axios.post(`${API_URL}/memories`, memory);
      }
      
      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check for patterns
      const patternsResponse = await axios.get(`${API_URL}/patterns`);
      assert.strictEqual(patternsResponse.status, 200, 'Expected 200 OK response');
      assert(Array.isArray(patternsResponse.data), 'Expected array of patterns');
      assert(patternsResponse.data.length > 0, 'Expected patterns to be detected');
      
      // Verify insights are generated
      const insightsResponse = await axios.get(`${API_URL}/patterns/insights`);
      assert.strictEqual(insightsResponse.status, 200, 'Expected 200 OK response');
      
      const concepts = insightsResponse.data.conceptualInsights.centralConcepts;
      assert(concepts.length > 0, 'Expected central concepts to be generated');
      
      // Verify relationships
      const relationships = insightsResponse.data.relationshipInsights;
      assert(relationships.length > 0, 'Expected relationships to be detected');
      
    } catch (error) {
      throw new Error(`End-to-end test failed: ${error.message}`);
    }
  });
  
  // Print results
  console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed\n`);
  return passed === 5; // All tests passed
  
  // Helper function to run and track tests
  async function runTest(name, testFn) {
    console.log(`\n⏳ ${name}...`);
    try {
      await Promise.race([
        testFn(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Test timed out')), TEST_TIMEOUT)
        )
      ]);
      console.log('✅ Passed');
      passed++;
    } catch (error) {
      console.log('❌ Failed');
      console.error(`   ${error.message}`);
      failed++;
    }
  }
}

// Run the tests if this file is executed directly
if (require.main === module) {
  runTests()
    .then(success => {
      if (!success) {
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('Error running tests:', error);
      process.exit(1);
    });
}

module.exports = { runTests }; 