/**
 * Memory Operations Test
 */

const visual = require('../utils/visualUtils');
const { testMemories, printMemoryDetails, printObject, setupTestEnvironment } = require('../utils/testUtils');

async function testMemoryOperations() {
  visual.showSection('💾 Testing Memory Operations');
  
  try {
    visual.startSpinner('Setting up test environment...');
    const startTime = Date.now();
    const env = await setupTestEnvironment();
    const { memoryService } = env;
    const setupTime = Date.now() - startTime;
    visual.succeed(`Environment setup: ${setupTime}ms`);
    
    // Test 1: Basic Memory Insertion
    visual.showSection('🔍 Test 1: Basic Memory Insertion');
    
    const testMemory = testMemories[0];
    
    console.log('\nInput memory:\n');
    printMemoryDetails(testMemory);
    
    const insertStartTime = Date.now();
    const storedMemory = await memoryService.storeMemory(testMemory);
    const insertDuration = Date.now() - insertStartTime;
    
    console.log(`Insertion time: ${insertDuration}ms\n`);
    console.log('Stored memory:\n');
    printMemoryDetails(storedMemory);
    console.log(`✓ Basic memory insertion successful`);
    
    // Test 2: Concurrent Memory Insertions
    visual.showSection('🔄 Test 2: Concurrent Memory Insertions');
    
    console.log('\nAttempting to insert 2 memories concurrently...');
    const concurrentMemories = testMemories.slice(1, 3);
    
    const totalMemories = concurrentMemories.length;
    let insertedCount = 0;
    
    // Show progress bar
    function updateProgress() {
      const percentage = Math.round((insertedCount / totalMemories) * 100);
      const width = 20;
      const filled = Math.round((width * insertedCount) / totalMemories);
      const empty = width - filled;
      const bar = '█'.repeat(filled) + '░'.repeat(empty);
      process.stdout.write(`\rInserting memories: ${bar} ${percentage}% | ${insertedCount}/${totalMemories}`);
    }
    
    updateProgress();
    
    const concurrentStartTime = Date.now();
    const concurrentPromises = concurrentMemories.map(async (memory, index) => {
      const result = await memoryService.storeMemory(memory);
      insertedCount++;
      updateProgress();
      return result;
    });
    
    const concurrentResults = await Promise.all(concurrentPromises);
    const concurrentDuration = Date.now() - concurrentStartTime;
    
    console.log('\n\nConcurrent insertion time: ' + concurrentDuration + 'ms\n');
    console.log('Concurrent insertion statistics:\n');
    
    const concurrentStats = {
      totalMemories,
      averageTimePerMemory: concurrentDuration / totalMemories,
      successRate: (concurrentResults.filter(Boolean).length / totalMemories) * 100 + '%'
    };
    
    printObject(concurrentStats);
    console.log(`✓ Concurrent insertions successful`);
    
    // Test 3: Memory Retrieval
    visual.showSection('📥 Test 3: Memory Retrieval');
    
    const retrievalStartTime = Date.now();
    const allMemories = await memoryService.getAllMemories();
    const retrievalDuration = Date.now() - retrievalStartTime;
    
    console.log(`Retrieval time: ${retrievalDuration}ms\n`);
    console.log('Retrieval statistics:\n');
    
    // Count memory types by tag
    const memoryTypes = {};
    allMemories.forEach(memory => {
      memory.tags.forEach(tag => {
        memoryTypes[tag] = (memoryTypes[tag] || 0) + 1;
      });
    });
    
    const retrievalStats = {
      totalRetrieved: allMemories.length,
      expectedMinimum: 2,
      retrievalTimePerMemory: retrievalDuration / allMemories.length,
      memoryTypes
    };
    
    printObject(retrievalStats);
    
    console.log('\nSample retrieved memory:\n');
    printMemoryDetails(allMemories[0]);
    
    if (allMemories.length >= retrievalStats.expectedMinimum) {
      console.log(`✓ Memory retrieval successful`);
    } else {
      console.log(`❌ Memory retrieval failed: Expected at least ${retrievalStats.expectedMinimum} memories, got ${allMemories.length}`);
    }
    
    // Test Summary
    const totalDuration = Date.now() - startTime;
    console.log(`\nTotal test duration: ${totalDuration}ms\n`);
    
    console.log('📊 Memory Operations Summary:');
    const testResults = {
      totalDuration,
      operations: {
        basicInsertion: {
          duration: insertDuration,
          success: true
        },
        concurrentInsertions: {
          duration: concurrentDuration,
          count: totalMemories,
          avgTimePerMemory: concurrentDuration / totalMemories
        },
        retrieval: {
          duration: retrievalDuration,
          count: allMemories.length,
          avgTimePerMemory: retrievalDuration / allMemories.length
        }
      },
      memoryStats: {
        totalStored: 1 + concurrentResults.length,
        totalRetrieved: allMemories.length,
        averageContentLength: Math.round(
          allMemories.reduce((sum, m) => sum + m.content.length, 0) / allMemories.length
        )
      }
    };
    
    printObject(testResults);
    
    // Cleanup
    await env.vectorStore.deleteCollection(env.testCollectionName);
    
    return {
      success: true,
      details: testResults
    };
  } catch (error) {
    visual.fail(`Memory operations test failed: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

// Run if called directly
if (require.main === module) {
  visual.showHeader('MEMORY OPERATIONS TEST');
  testMemoryOperations()
    .then(results => {
      if (results.success) {
        console.log('\n✅ Memory operations test completed successfully!');
      } else {
        console.error('\n❌ Memory operations test failed:', results.error);
      }
    })
    .catch(console.error);
}

module.exports = testMemoryOperations; 