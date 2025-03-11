/**
 * Simple test to verify basic functionality
 */
const assert = require('assert');
const PatternService = require('../services/patternService');
const TestPatternStorage = require('../patterns/storage/testStorage');

async function runSimpleTest() {
  console.log('🧪 Running simple test...');
  
  try {
    // Test pattern detection directly
    const storage = new TestPatternStorage();
    const patternService = new PatternService(storage);
    await patternService.initialize();
    
    const testContent = "Had coffee this morning while reviewing project plans";
    const patterns = await patternService.processContent(testContent, { timestamp: new Date().toISOString() });
    
    console.log('Detected patterns:', patterns.length);
    assert(patterns.length > 0, 'Expected at least one pattern to be detected');
    
    console.log('✅ Test passed!');
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the test
runSimpleTest(); 