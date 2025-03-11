/**
 * Test for ConceptPatterns module
 */
const { describe, test } = require('./testUtils');
const assert = require('assert');
const PatternLearner = require('../patternMatching/patternLearner');
const NLPPatternDetector = require('../patternMatching/nlpPatternDetector');

// Make sure to properly stub dependent components if needed
class MockStorage {
  constructor() {
    this.patterns = [];
  }
  
  async storePattern(pattern) {
    this.patterns.push(pattern);
    return pattern;
  }
  
  async getPatterns() {
    return this.patterns;
  }
}

describe('Concept Pattern Tests', () => {
  test('should process patterns from text', async () => {
    // Create a pattern learner
    const learner = new PatternLearner();
    await learner.initialize();
    
    // Use the learnFromMemory method which we know exists
    const memory = "Working on AI and machine learning projects with Sarah";
    const patterns = await learner.learnFromMemory(memory);
    
    // Simple assertions
    assert(patterns && patterns.length > 0, 'Should detect at least one pattern');
    
    // Get insights to test concept extraction
    const insights = await learner.getInsights();
    assert(insights, 'Should generate insights');
    
    // Log some useful debug info
    console.log(`Found ${patterns.length} patterns`);
    if (insights.conceptualInsights) {
      console.log(`Found ${insights.conceptualInsights.centralConcepts?.length || 0} central concepts`);
    }
  });
  
  test('should detect patterns with NLP detector', async () => {
    const detector = new NLPPatternDetector();
    await detector.initialize();
    
    const sampleText = "Working on AI and machine learning projects with Sarah";
    const result = await detector.detectPatterns(sampleText);
    
    // Simple assertions that should work with the actual implementation
    assert(result, 'Should return a result object');
    assert(result.patterns, 'Should detect some patterns');
    
    // Log detected pattern types
    const patternTypes = Object.keys(result.patterns);
    console.log(`Detected pattern types: ${patternTypes.join(', ')}`);
  });
});

// Helper function to run tests
async function runConceptTests() {
  console.log('🧪 Running Concept Pattern Tests...\n');
  
  let passed = 0;
  let failed = 0;
  
  try {
    for (const suite of Object.keys(describe.suites)) {
      console.log(`\n📋 ${suite}`);
      const tests = describe.suites[suite];

      for (const test of tests) {
        if (!test.name) continue;
        
        process.stdout.write(`  ⏳ ${test.name}... `);
        try {
          const result = await test.fn();
          console.log('✅');
          if (result) {
            console.log('  📊 Results:', result);
          }
          passed++;
        } catch (error) {
          console.log('❌');
          console.error(`    ${error.message}`);
          failed++;
        }
      }
    }

    console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed\n`);
    
    if (failed > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Test runner error:', error);
    process.exit(1);
  }
}

// Run tests if file is executed directly
if (require.main === module) {
  runConceptTests();
}

module.exports = { runConceptTests }; 