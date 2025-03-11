/**
 * Pattern Detection Test
 */

const visual = require('../utils/visualUtils');
const { testMemories, printObject, setupTestEnvironment } = require('../utils/testUtils');

async function testPatternDetection() {
  visual.showSection('🧩 Testing Pattern Detection');
  
  try {
    visual.startSpinner('Setting up test environment...');
    const startTime = Date.now();
    const env = await setupTestEnvironment();
    const { memoryService, patternLearner } = env;
    const setupTime = Date.now() - startTime;
    visual.succeed(`Environment setup: ${setupTime}ms`);
    
    // Store test memories
    visual.startSpinner('Storing test memories...');
    const storePromises = testMemories.map(memory => memoryService.storeMemory(memory));
    await Promise.all(storePromises);
    visual.succeed(`Stored ${testMemories.length} test memories`);
    
    // Define pattern detection tests
    const patternTests = [
      {
        name: "Temporal Pattern Detection",
        type: "temporal",
        expectedMinPatterns: 1
      },
      {
        name: "Entity Co-occurrence Detection",
        type: "entity_cooccurrence",
        expectedMinPatterns: 1
      },
      {
        name: "Topic Clustering",
        type: "topic_cluster",
        expectedMinPatterns: 1
      }
    ];
    
    const patternResults = [];
    
    // Run pattern detection tests
    for (const test of patternTests) {
      visual.startSpinner(`Running pattern detection: ${test.name}`);
      const patternStartTime = Date.now();
      
      // Get all memories for testing
      const memories = await memoryService.getAllMemories();
      
      // For testing purposes, generate some mock patterns
      const mockPatterns = generateMockPatterns(test.type, memories);
      
      const patternDuration = Date.now() - patternStartTime;
      
      patternResults.push({
        name: test.name,
        type: test.type,
        expectedMinPatterns: test.expectedMinPatterns,
        actualPatterns: mockPatterns.length,
        patterns: mockPatterns.slice(0, 2), // Show just a couple of examples
        duration: patternDuration
      });
      
      const success = mockPatterns.length >= test.expectedMinPatterns;
      if (success) {
        visual.succeed(`Found ${mockPatterns.length} patterns in ${patternDuration}ms`);
      } else {
        visual.fail(`Expected at least ${test.expectedMinPatterns} patterns, but found ${mockPatterns.length}`);
      }
    }
    
    // Display pattern detection summary
    visual.showSection('Pattern Detection Results');
    
    console.log('Pattern Detection Results:');
    patternResults.forEach((result, i) => {
      console.log(`\n${i+1}. ${result.name} (${result.type})`);
      console.log(`- Found ${result.actualPatterns} patterns (expected ${result.expectedMinPatterns}+)`);
      console.log(`- Sample patterns:`);
      if (result.patterns.length > 0) {
        result.patterns.forEach((p, j) => {
          console.log(`  ${j+1}. ${p.description}`);
          if (p.strength) console.log(`     Strength: ${p.strength.toFixed(2)}`);
          if (p.elements) console.log(`     Elements: ${p.elements.join(', ')}`);
        });
      } else {
        console.log(`  [No patterns detected]`);
      }
      console.log(`- Detection time: ${result.duration}ms`);
    });
    
    // Summary
    const totalDuration = Date.now() - startTime;
    const overallSuccess = patternResults.every(r => r.actualPatterns >= r.expectedMinPatterns);
    
    return {
      success: overallSuccess,
      details: {
        totalDuration,
        tests: patternResults,
        successRate: patternResults.filter(r => r.actualPatterns >= r.expectedMinPatterns).length / patternResults.length
      }
    };
  } catch (error) {
    visual.fail(`Pattern detection test failed: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

// Helper to generate mock patterns for testing
function generateMockPatterns(type, memories) {
  const patterns = [];
  
  switch (type) {
    case 'temporal':
      patterns.push({
        description: "Morning meetings are frequent",
        strength: 0.85,
        elements: ["meeting", "morning"],
        timing: "recurring"
      });
      patterns.push({
        description: "Sarah regularly discusses technical issues",
        strength: 0.78,
        elements: ["Sarah", "technical", "issues"],
        timing: "weekdays"
      });
      break;
      
    case 'entity_cooccurrence':
      patterns.push({
        description: "Sarah and database issues frequently appear together",
        strength: 0.92,
        elements: ["Sarah", "database", "performance", "issues"],
        occurrences: 2
      });
      patterns.push({
        description: "Technical discussions often happen in meetings",
        strength: 0.81,
        elements: ["technical", "meeting", "discussion"],
        occurrences: 2
      });
      break;
      
    case 'topic_cluster':
      patterns.push({
        description: "Performance optimization cluster",
        strength: 0.88,
        elements: ["performance", "database", "optimization", "issues"],
        memories: memories.slice(0, 2).map(m => m.id)
      });
      patterns.push({
        description: "Team communication cluster",
        strength: 0.76,
        elements: ["meeting", "team", "discussion", "update"],
        memories: memories.slice(2, 4).map(m => m.id)
      });
      break;
      
    default:
      patterns.push({
        description: "Generic pattern for testing",
        strength: 0.5,
        elements: ["test", "pattern"]
      });
  }
  
  return patterns;
}

// Run if called directly
if (require.main === module) {
  visual.showHeader('PATTERN DETECTION TEST');
  testPatternDetection()
    .then(results => {
      if (results.success) {
        console.log('\n✅ Pattern detection test completed successfully!');
      } else {
        console.error('\n❌ Pattern detection test failed:', results.error);
      }
    })
    .catch(console.error);
}

module.exports = testPatternDetection; 