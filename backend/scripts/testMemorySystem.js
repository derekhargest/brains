import { MemoryService } from '../services/memoryService.js';
import { QdrantVectorStore } from '../vectorStore/qdrantStore.js';
import dotenv from 'dotenv';

dotenv.config();

const vectorStore = new QdrantVectorStore({
  collectionName: 'test_memories',
  vectorSize: 1536 // OpenAI's ada-002 embedding size
});

const memoryService = new MemoryService(vectorStore);

async function runTest() {
  try {
    console.log('🧠 Testing Memory System...');
    
    // Initialize services
    console.log('\n1. Initializing services...');
    await memoryService.initialize();
    console.log('✅ Services initialized');

    // Test storing a memory
    console.log('\n2. Storing test memory...');
    const testMemory = await memoryService.storeMemory({
      content: "This is a test memory about artificial intelligence and its impact on society.",
      type: 'test',
      metadata: {
        importance: 0.8,
        source: 'test_script'
      }
    });
    console.log('✅ Memory stored:', testMemory);

    // Test searching memories
    console.log('\n3. Searching for similar memories...');
    const searchResults = await memoryService.searchMemories(
      "Tell me about AI's impact",
      5
    );
    console.log('✅ Search results:', searchResults);

    // Test updating memory
    console.log('\n4. Updating test memory...');
    const updatedMemory = await memoryService.updateMemory(testMemory.id, {
      content: "Updated: This is a test memory about AI and machine learning.",
      metadata: {
        ...testMemory.metadata,
        updated: true
      }
    });
    console.log('✅ Memory updated:', updatedMemory);

    // Test deleting memory
    console.log('\n5. Deleting test memory...');
    await memoryService.deleteMemory(testMemory.id);
    console.log('✅ Memory deleted');

    console.log('\n🎉 All tests completed successfully!');
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

runTest(); 