import assert from 'assert';
import { storeMemory, advancedSearch, checkQdrantAvailability } from '../vectorStore.js';

async function runMVPTests() {
  console.log('\n🧪 Running Brains!!! MVP Tests\n');
  const results = {
    passed: 0,
    failed: 0,
    tests: []
  };

  // Helper to run and track test results
  async function runTest(name, testFn) {
    try {
      console.log(`Running test: ${name}`);
      await testFn();
      results.passed++;
      results.tests.push({ name, status: 'passed' });
      console.log(`✅ Passed: ${name}\n`);
    } catch (error) {
      results.failed++;
      results.tests.push({ name, status: 'failed', error: error.message });
      console.log(`❌ Failed: ${name}`);
      console.log(`   Error: ${error.message}\n`);
    }
  }

  // 1. Infrastructure Tests
  await runTest('Database Connection', async () => {
    const available = await checkQdrantAvailability();
    assert(available, 'Qdrant should be available');
  });

  // 2. Memory Storage Tests
  await runTest('Store Memory', async () => {
    const memory = {
      content: 'Test memory for MVP validation',
      metadata: {
        importance: 0.8,
        source: 'mvp_test'
      }
    };
    const result = await storeMemory(memory);
    assert(result.success, 'Memory should be stored successfully');
    assert(result.id, 'Should return a memory ID');
  });

  // 3. Memory Retrieval Tests
  await runTest('Retrieve All Memories', async () => {
    const memories = await advancedSearch('', { limit: 10 });
    assert(Array.isArray(memories), 'Should return an array of memories');
    assert(memories.length > 0, 'Should have at least one memory');
  });

  // 4. Search Tests
  await runTest('Search Specific Memory', async () => {
    const query = 'MVP validation';
    const results = await advancedSearch(query, { 
      limit: 5,
      minScore: 0.3
    });
    assert(Array.isArray(results), 'Should return an array of results');
    assert(results.length > 0, 'Should find the test memory');
    assert(
      results[0].payload.content.includes('MVP'),
      'First result should contain search term'
    );
  });

  // 5. Metadata Tests
  await runTest('Store and Retrieve Memory with Metadata', async () => {
    const memory = {
      content: 'Memory with specific metadata',
      metadata: {
        importance: 0.9,
        tags: ['test', 'metadata'],
        custom: 'value'
      }
    };
    
    const stored = await storeMemory(memory);
    assert(stored.success, 'Memory should be stored');
    
    const retrieved = await advancedSearch('metadata', { limit: 1 });
    assert(retrieved.length > 0, 'Should find the memory');
    assert(
      retrieved[0].payload.metadata.importance === 0.9,
      'Should preserve importance value'
    );
  });

  // Print Summary
  console.log('\n📊 Test Summary:');
  console.log(`Passed: ${results.passed}`);
  console.log(`Failed: ${results.failed}`);
  console.log(`Total: ${results.passed + results.failed}`);

  if (results.failed > 0) {
    console.log('\n❌ Failed Tests:');
    results.tests
      .filter(t => t.status === 'failed')
      .forEach(test => {
        console.log(`- ${test.name}: ${test.error}`);
      });
  }

  return results;
}

// Run tests if called directly
if (process.argv[1].includes('mvpTest.js')) {
  runMVPTests()
    .then(results => {
      process.exit(results.failed > 0 ? 1 : 0);
    })
    .catch(error => {
      console.error('Test runner failed:', error);
      process.exit(1);
    });
}

export default runMVPTests; 