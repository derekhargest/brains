/**
 * Derek-Brain Test Runner
 * 
 * Runs individual tests or all tests in sequence
 */

const visual = require('./utils/visualUtils');
const testMemoryOperations = require('./tests/memoryTest');
const testSearchCapabilities = require('./tests/searchTest');
const testPatternDetection = require('./tests/patternTest');
const testVisualizationGeneration = require('./tests/visualizationTest');
const { setupTestEnvironment } = require('./utils/testUtils');

// Configuration
const DEFAULT_TESTS = ['memory'];

async function runTests(tests = DEFAULT_TESTS) {
  visual.showHeader('🧪 DEREK-BRAIN TEST RUNNER');
  
  const results = {};
  let startTime = Date.now();
  
  // Map of test names to test functions
  const testMap = {
    'memory': testMemoryOperations,
    'search': testSearchCapabilities,
    'pattern': testPatternDetection,
    'visualization': testVisualizationGeneration
  };
  
  // Validate requested tests
  const validTests = tests.filter(test => testMap[test]);
  if (validTests.length === 0) {
    console.log('No valid tests specified. Available tests:');
    Object.keys(testMap).forEach(test => console.log(`- ${test}`));
    return;
  }
  
  console.log(`Running ${validTests.length} tests: ${validTests.join(', ')}\n`);
  
  // Set up environment once for all tests
  const env = await setupTestEnvironment();
  
  // Run each test
  for (let i = 0; i < validTests.length; i++) {
    const testName = validTests[i];
    const testFn = testMap[testName];
    
    visual.showSection(`Running test: ${testName} (${i+1}/${validTests.length})`);
    
    try {
      const testResult = await testFn();
      results[testName] = testResult;
    } catch (error) {
      results[testName] = { success: false, error: error.message };
      console.error(`Test ${testName} failed with an exception:`, error);
    }
    
    // Show progress after each test
    visual.showProgress(i+1, validTests.length, 'Test Progress:');
    console.log('\n');
  }
  
  // Display simple data point count
  visual.showSection('📈 Data Points');
  try {
    // Get the actual count of memories in the system
    const memoryCount = (await env.memoryService.getAllMemories()).length;
    console.log(`Total Data Points: ${memoryCount}`);
  } catch (error) {
    console.log(`Total Data Points: Could not retrieve (${error.message})`);
  }
  
  // Show summary
  visual.showHeader('TEST RESULTS SUMMARY');
  
  const totalTests = validTests.length;
  const passedTests = Object.values(results).filter(r => r.success).length;
  
  console.log(`Tests run: ${totalTests}`);
  console.log(`Tests passed: ${passedTests}`);
  console.log(`Tests failed: ${totalTests - passedTests}`);
  console.log(`Success rate: ${Math.round((passedTests / totalTests) * 100)}%`);
  console.log(`Total duration: ${((Date.now() - startTime) / 1000).toFixed(2)}s\n`);
  
  // Show individual test results
  Object.entries(results).forEach(([testName, result]) => {
    const status = result.success ? '✅ PASSED' : '❌ FAILED';
    console.log(`${testName}: ${status}`);
    if (!result.success && result.error) {
      console.log(`  Error: ${result.error}`);
    }
  });
  
  // Clean up collection
  try {
    await env.vectorStore.deleteCollection(env.testCollectionName);
    console.log(`\nTest cleanup: Deleted collection ${env.testCollectionName}`);
  } catch (error) {
    console.log(`\nWarning: Could not delete test collection: ${error.message}`);
  }
  
  return results;
}

// Parse command line arguments to determine which tests to run
function parseArgs() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    return DEFAULT_TESTS;
  }
  
  if (args.includes('all')) {
    return ['memory', 'search', 'pattern', 'visualization'];
  }
  
  return args;
}

// Run if called directly
if (require.main === module) {
  const testsToRun = parseArgs();
  runTests(testsToRun)
    .then(() => {
      console.log('\nTest run complete.');
    })
    .catch(error => {
      console.error('Test runner failed:', error);
      process.exit(1);
    });
}

module.exports = { runTests }; 