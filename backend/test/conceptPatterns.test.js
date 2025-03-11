/**
 * Test for ConceptPatterns module
 */
import { describe, test } from './testUtils.js';
import assert from 'assert';
import { PatternLearner } from '../patternMatching/patternLearner.js';
import { NLPPatternDetector } from '../patternMatching/nlpPatternDetector.js';

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

describe('Concept Pattern Learning', () => {
  const learner = new PatternLearner();
  const detector = new NLPPatternDetector();

  test('should learn basic patterns', async () => {
    const text = "The quick brown fox jumps over the lazy dog";
    const patterns = await detector.detectPatterns(text);
    const learned = await learner.learnFromPatterns(patterns);
    
    assert(Array.isArray(learned));
    assert(learned.length > 0);
    assert(learned[0].hasOwnProperty('confidence'));
  });

  test('should identify concept relationships', async () => {
    const text = "Machine learning is a subset of artificial intelligence";
    const patterns = await detector.detectPatterns(text);
    const concepts = await learner.extractConcepts(patterns);
    
    assert(Array.isArray(concepts));
    assert(concepts.length > 0);
    assert(concepts.some(c => c.type === 'relationship'));
  });

  test('should handle empty input', async () => {
    const patterns = [];
    const learned = await learner.learnFromPatterns(patterns);
    
    assert(Array.isArray(learned));
    assert(learned.length === 0);
  });

  test('should merge similar concepts', async () => {
    const texts = [
      "AI systems can learn from data",
      "Artificial intelligence uses machine learning",
      "AI and machine learning are related technologies"
    ];
    
    const allPatterns = [];
    for (const text of texts) {
      const patterns = await detector.detectPatterns(text);
      allPatterns.push(...patterns);
    }
    
    const concepts = await learner.extractConcepts(allPatterns);
    assert(concepts.some(c => c.type === 'merged'));
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