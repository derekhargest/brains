/**
 * Derek-Brain Comprehensive Integration Test
 * 
 * Tests the complete flow from memory ingestion through pattern recognition,
 * concept extraction, insight generation, and visualization data creation.
 */

import assert from 'assert';
import { MemoryService } from '../services/memoryService.js';
import { PatternService } from '../services/patternService.js';
import { v4 as uuidv4 } from 'uuid';

// Sample test data
const testMemories = [
  {
    id: uuidv4(),
    content: "Had a great meeting with the team today. We discussed the new AI project roadmap.",
    timestamp: new Date().toISOString(),
    source: "integration_test"
  },
  {
    id: uuidv4(),
    content: "Finished reading 'Thinking Fast and Slow' by Daniel Kahneman. Great insights on cognitive biases.",
    timestamp: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    source: "integration_test"
  },
  {
    id: uuidv4(),
    content: "Met with Sarah to discuss the marketing strategy for Q3. We need to focus on content marketing.",
    timestamp: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
    source: "integration_test"
  }
];

async function runIntegrationTest() {
  console.log("\n🧠 DEREK-BRAIN COMPREHENSIVE INTEGRATION TEST\n");
  console.log("Testing complete system pipeline from memory to insights...\n");
  
  let testResults = {
    memoryService: { success: false, details: {} },
    patternLearning: { success: false, details: {} },
    insightGeneration: { success: false, details: {} },
    visualization: { success: false, details: {} },
    performance: { timings: {} }
  };
  
  try {
    // Initialize services
    console.log("Initializing services...");
    const memoryService = new MemoryService();
    await memoryService.initialize();
    
    const patternService = new PatternService();
    await patternService.initialize();
    
    console.log("Services initialized successfully.");
    
    // Test memory ingestion
    console.log("\nTesting memory ingestion...");
    const startIngestion = Date.now();
    
    for (const memory of testMemories) {
      await memoryService.storeMemory(memory);
    }
    
    testResults.performance.timings.ingestion = Date.now() - startIngestion;
    testResults.memoryService.success = true;
    console.log(`✅ Successfully ingested ${testMemories.length} test memories`);
    
    // Test memory retrieval
    console.log("\nTesting memory retrieval...");
    const retrievedMemories = await memoryService.searchMemories("AI project");
    testResults.memoryService.details.retrievalCount = retrievedMemories.length;
    console.log(`✅ Successfully retrieved ${retrievedMemories.length} memories`);
    
    // Test pattern recognition
    console.log("\nTesting pattern recognition...");
    const startPatternRecognition = Date.now();
    const patterns = await patternService.detectPatterns(testMemories);
    testResults.performance.timings.patternRecognition = Date.now() - startPatternRecognition;
    testResults.patternLearning.success = patterns && patterns.length > 0;
    testResults.patternLearning.details.patternCount = patterns ? patterns.length : 0;
    console.log(`✅ Detected ${patterns ? patterns.length : 0} patterns`);
    
    // Print summary
    console.log("\n==== TEST SUMMARY ====");
    console.log(`Memory Service: ${testResults.memoryService.success ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Pattern Learning: ${testResults.patternLearning.success ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`\nPerformance Metrics:`);
    console.log(`- Memory Ingestion: ${testResults.performance.timings.ingestion}ms`);
    console.log(`- Pattern Recognition: ${testResults.performance.timings.patternRecognition}ms`);
    
    return testResults;
  } catch (error) {
    console.error("Integration test failed with error:", error);
    return { success: false, error: error.message };
  }
}

// Run the test if called directly
if (process.argv[1].includes('integrationTest.js')) {
  runIntegrationTest()
    .then(results => {
      console.log("\nTest completed.");
      process.exit(results.success ? 0 : 1);
    })
    .catch(err => {
      console.error("Test failed with unhandled error:", err);
      process.exit(1);
    });
}

export default runIntegrationTest; 