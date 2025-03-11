import { memoryService } from '../services/memoryService.js';

const TEST_DATA = {
  content: "Test memory from full flow check",
  metadata: {
    type: "system-check",
    importance: 0.9,
    temporal: {
      timestamp: new Date().toISOString()
    }
  }
};

async function testFullFlow() {
  console.log('=== Starting Integration Test ===');
  
  // 1. Test memory storage
  console.log('Storing test memory...');
  const storageResult = await memoryService.store(TEST_DATA);
  if (!storageResult.success) throw new Error('Storage failed');
  
  // 2. Test memory retrieval
  console.log('Searching for test memory...');
  const searchResult = await memoryService.search(TEST_DATA.content, { limit: 1 });
  if (!searchResult.results.length) throw new Error('Search failed');
  
  // 3. Verify content match
  const match = searchResult.results[0].content === TEST_DATA.content;
  if (!match) throw new Error('Content mismatch');
  
  // 4. Test synchronization
  console.log('Testing collection sync...');
  const syncResult = await synchronizeCollections();
  if (!syncResult.success) throw new Error('Sync failed');
  
  console.log('=== All Tests Passed ✅ ===');
}

testFullFlow().catch(err => {
  console.error('!!! Test Failed:', err);
  process.exit(1);
}); 