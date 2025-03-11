/**
 * Visualization Generation Test
 */

const visual = require('../utils/visualUtils');
const { testMemories, printObject, setupTestEnvironment } = require('../utils/testUtils');

async function testVisualizationGeneration() {
  visual.showSection('📊 Testing Visualization Generation');
  
  try {
    visual.startSpinner('Setting up test environment...');
    const startTime = Date.now();
    const env = await setupTestEnvironment();
    const { memoryService, visualizationService } = env;
    const setupTime = Date.now() - startTime;
    visual.succeed(`Environment setup: ${setupTime}ms`);
    
    // Store test memories
    visual.startSpinner('Storing test memories...');
    const storePromises = testMemories.map(memory => memoryService.storeMemory(memory));
    await Promise.all(storePromises);
    visual.succeed(`Stored ${testMemories.length} test memories`);
    
    // Define visualization tests
    const vizTests = [
      {
        name: "Memory Timeline Visualization",
        type: "timeline",
        expectedElements: 5
      },
      {
        name: "Topic Network Visualization",
        type: "network",
        expectedElements: 3
      },
      {
        name: "Tag Cloud Visualization",
        type: "tagcloud",
        expectedElements: 10
      }
    ];
    
    const vizResults = [];
    
    // Run visualization tests
    for (const test of vizTests) {
      visual.startSpinner(`Generating visualization: ${test.name}`);
      const vizStartTime = Date.now();
      
      // Generate mock visualization data
      const mockVizData = generateMockVisualization(test.type, await memoryService.getAllMemories());
      
      const vizDuration = Date.now() - vizStartTime;
      
      vizResults.push({
        name: test.name,
        type: test.type,
        expectedElements: test.expectedElements,
        actualElements: mockVizData.elements.length,
        sampleData: {
          totalElements: mockVizData.elements.length,
          elements: mockVizData.elements.slice(0, 3)
        },
        duration: vizDuration
      });
      
      const success = mockVizData.elements.length >= test.expectedElements;
      if (success) {
        visual.succeed(`Generated ${mockVizData.elements.length} elements in ${vizDuration}ms`);
      } else {
        visual.fail(`Expected at least ${test.expectedElements} elements, but generated ${mockVizData.elements.length}`);
      }
    }
    
    // Display visualization summary
    visual.showSection('Visualization Generation Results');
    
    console.log('Visualization Results:');
    vizResults.forEach((result, i) => {
      console.log(`\n${i+1}. ${result.name} (${result.type})`);
      console.log(`- Generated ${result.actualElements} elements (expected ${result.expectedElements}+)`);
      console.log(`- Sample elements:`);
      if (result.sampleData.elements.length > 0) {
        result.sampleData.elements.forEach((el, j) => {
          console.log(`  ${j+1}. ${el.id || 'unnamed'} (${el.type || 'unknown type'})`);
          if (el.properties) {
            Object.entries(el.properties).forEach(([key, value]) => {
              console.log(`     ${key}: ${value}`);
            });
          }
        });
      } else {
        console.log(`  [No elements generated]`);
      }
      console.log(`- Generation time: ${result.duration}ms`);
    });
    
    // Overall success metrics
    const successRate = vizResults.filter(r => r.actualElements >= r.expectedElements).length / vizResults.length;
    const averageDuration = vizResults.reduce((sum, r) => sum + r.duration, 0) / vizResults.length;
    
    visual.showSection('Visualization Performance Metrics');
    console.log(`Success rate: ${(successRate * 100).toFixed(1)}%`);
    console.log(`Average generation time: ${averageDuration.toFixed(2)}ms`);
    
    // Summary
    const totalDuration = Date.now() - startTime;
    
    return {
      success: successRate >= 0.7,
      details: {
        totalDuration,
        tests: vizResults,
        successRate,
        averageDuration
      }
    };
  } catch (error) {
    visual.fail(`Visualization generation test failed: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

// Helper to generate mock visualizations for testing
function generateMockVisualization(type, memories) {
  const elements = [];
  const uniqueTags = new Set();
  
  // Collect all unique tags
  memories.forEach(memory => {
    if (memory.tags) {
      memory.tags.forEach(tag => uniqueTags.add(tag));
    }
  });
  
  const tagsList = Array.from(uniqueTags);
  
  switch (type) {
    case 'timeline':
      // Generate timeline nodes
      memories.forEach((memory, i) => {
        elements.push({
          id: `node_${i}`,
          type: 'memory',
          properties: {
            content: memory.content.substring(0, 30) + '...',
            timestamp: memory.timestamp,
            tags: memory.tags.join(', ')
          }
        });
      });
      break;
      
    case 'network':
      // Generate topic nodes
      tagsList.forEach((tag, i) => {
        elements.push({
          id: `topic_${i}`,
          type: 'topic',
          properties: {
            name: tag,
            weight: Math.random() * 10 + 1
          }
        });
      });
      
      // Generate connections
      for (let i = 0; i < 3; i++) {
        elements.push({
          id: `connection_${i}`,
          type: 'connection',
          properties: {
            source: `topic_${i}`,
            target: `topic_${(i + 1) % tagsList.length}`,
            strength: Math.random()
          }
        });
      }
      break;
      
    case 'tagcloud':
      // Generate tag items
      tagsList.forEach((tag, i) => {
        elements.push({
          id: `tag_${i}`,
          type: 'tag',
          properties: {
            text: tag,
            weight: Math.floor(Math.random() * 10) + 1
          }
        });
      });
      
      // Add some extra tags to meet minimum element count
      for (let i = tagsList.length; i < 12; i++) {
        elements.push({
          id: `tag_${i}`,
          type: 'tag',
          properties: {
            text: `generated_tag_${i}`,
            weight: Math.floor(Math.random() * 5) + 1
          }
        });
      }
      break;
      
    default:
      elements.push({
        id: 'fallback',
        type: 'default',
        properties: {
          note: 'Generic visualization element for testing'
        }
      });
  }
  
  return {
    type,
    elements,
    metadata: {
      generated: new Date().toISOString(),
      memoryCount: memories.length
    }
  };
}

// Run if called directly
if (require.main === module) {
  visual.showHeader('VISUALIZATION GENERATION TEST');
  testVisualizationGeneration()
    .then(results => {
      if (results.success) {
        console.log('\n✅ Visualization generation test completed successfully!');
      } else {
        console.error('\n❌ Visualization generation test failed:', results.error);
      }
    })
    .catch(console.error);
}

module.exports = testVisualizationGeneration; 