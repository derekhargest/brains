import { config } from 'dotenv';
import { describe, test, expect } from './testUtils.js';
import { PatternLearner } from '../patternMatching/patternLearner.js';
import assert from 'assert';

config();

// Define the tests
describe('Pattern Matching Tests', () => {
  test('should initialize pattern learner', async () => {
    const learner = new PatternLearner();
    await learner.initialize();
    assert(learner.initialized, 'Pattern learner should be initialized');
  });

  test('should learn from a simple memory', async () => {
    const learner = new PatternLearner();
    await learner.initialize();
    
    const memory = "Morning coffee while coding at 9am";
    const patterns = await learner.learnFromMemory(memory);
    
    // Check that we got patterns
    assert(patterns.length > 0, 'Expected to detect at least one pattern');
    
    // Check storage stats
    const stats = await learner.storage.getStats();
    console.log('Learning stats:', JSON.stringify(stats, null, 2));
    
    assert(stats.totalMatches > 0, 'Expected to find at least one pattern');
  });

  test('should handle empty memory', async () => {
    const learner = new PatternLearner();
    await learner.initialize();
    
    // Reset storage stats for this test
    learner.storage.stats.totalMatches = 0;
    learner.storage.stats.totalMisses = 0;
    learner.storage.stats.averageConfidence = 0;
    
    // Test with empty memory
    const patterns = await learner.learnFromMemory("");
    assert(patterns.length === 0, 'Expected no patterns for empty memory');
    
    // Test storage stats
    const stats = await learner.storage.getStats();
    console.log('Empty memory stats:', JSON.stringify(stats, null, 2));
    
    assert(stats.totalMatches === 0, 'Expected no pattern matches for empty memory');
  });

  test('should detect multiple pattern types', async () => {
    const learner = new PatternLearner();
    await learner.initialize();
    
    const memory = "Meeting with Sarah at 2pm about coding";
    const patterns = await learner.learnFromMemory(memory);
    
    // Check specific pattern types
    const patternTypes = patterns.map(p => p.type);
    assert(patternTypes.includes('temporal'), 'Expected to find temporal pattern');
    assert(patternTypes.includes('relational'), 'Expected to find relational pattern');
    
    // Check storage
    const stats = await learner.storage.getStats();
    
    assert(stats.patterns.temporal.length > 0, 'Expected to find temporal pattern in storage');
    assert(stats.patterns.relational.length > 0, 'Expected to find relational pattern in storage');
  });
  
  test('should build concept relationships', async () => {
    const learner = new PatternLearner();
    await learner.initialize();
    
    // Learn from memories with related concepts
    await learner.learnFromMemory("Working on AI project coding");
    await learner.learnFromMemory("The AI model needs improvement");
    await learner.learnFromMemory("Coding the new machine learning feature");
    
    // Get insights
    const insights = await learner.getInsights();
    
    // Check for concept relationships
    assert(insights.conceptualInsights.centralConcepts.length > 0, 
           'Expected to find central concepts');
           
    // Find the AI concept
    const aiConcept = insights.conceptualInsights.centralConcepts
      .find(c => c.concept === 'ai');
      
    // Either AI or coding should be found and have related concepts
    const codeOrAi = insights.conceptualInsights.centralConcepts
      .find(c => c.concept === 'ai' || c.concept === 'coding');
      
    assert(codeOrAi, 'Expected to find AI or coding concept');
    assert(codeOrAi.relatedConcepts.length > 0, 
           'Expected to find related concepts');
  });
});

// Helper function to run tests
async function runTests() {
  console.log('🧪 Running Pattern Matching Tests...\n');
  
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
          await test.fn();
          console.log('✅');
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
  runTests();
}

module.exports = { runTests }; 