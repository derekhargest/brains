require('dotenv').config();
const { runTests } = require('./patternMatching.test');
const { runConceptTests } = require('./conceptPatterns.test');

async function runPatternDemo() {
  console.log('🧠 Running Pattern Matching Demo...');

  // Import the PatternLearner and test utilities
  const { PatternLearner } = require('../patternMatching/patternLearner');
  const { describe, test } = require('./testUtils');

  console.log('🧪 Running Pattern Matching Tests...');

  // Define the pattern matching tests
  describe('Pattern Matching Tests', () => {
    test('should initialize pattern learner', async () => {
      const learner = new PatternLearner();
      await learner.initialize();
      if (!learner.storage) {
        throw new Error('Expected learner to have storage initialized');
      }
    });

    test('should learn from a simple memory', async () => {
      const learner = new PatternLearner();
      await learner.initialize();
      
      const memory = "Morning coffee while coding at 9am";
      await learner.learnFromMemory(memory);
      
      const stats = await learner.storage.getStats();
      console.log('Learning stats:', JSON.stringify(stats, null, 2));
      
      if (stats.totalMatches === 0) {
        throw new Error('Expected to find at least one pattern');
      }
    });

    test('should handle empty memory', async () => {
      const learner = new PatternLearner();
      await learner.initialize();
      
      // Reset stats first to ensure clean state
      learner.storage.stats.totalMatches = 0;
      learner.storage.stats.totalMisses = 0;
      
      await learner.learnFromMemory("");
      const stats = await learner.storage.getStats();
      console.log('Empty memory stats:', JSON.stringify(stats, null, 2));
      
      if (stats.totalMatches !== 0) {
        throw new Error('Expected no patterns for empty memory');
      }
    });

    test('should detect multiple pattern types', async () => {
      const learner = new PatternLearner();
      await learner.initialize();
      
      await learner.learnFromMemory("Meeting with Sarah at 2pm about coding");
      const stats = await learner.storage.getStats();
      
      if (!stats.patterns || !stats.patterns.temporal || !stats.patterns.temporal.length) {
        throw new Error('Expected to find temporal pattern');
      }
      if (!stats.patterns || !stats.patterns.relational || !stats.patterns.relational.length) {
        throw new Error('Expected to find relational pattern');
      }
    });
  });

  // Now run NLP tests
  console.log('\n🧪 Running NLP Pattern Detector Tests...');
  require('./nlpPatternDetector.test');

  // Run pattern system tests if desired
  // console.log('\n🧪 Running Pattern System Integration Tests...');
  // require('./patternSystem.test');

  // Add a summary message for the entire test suite
  console.log('\n✨ Pattern matching demo completed successfully!');
}

// Run if called directly
if (require.main === module) {
  runPatternDemo();
}

module.exports = { runPatternDemo }; 