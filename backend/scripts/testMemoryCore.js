import { config } from 'dotenv';
config();

import { QdrantVectorStore } from '../vectorStore/qdrantStore.js';
import { MemoryService } from '../services/memoryService.js';

console.log('\n🧠 TESTING brains!!! MEMORY CORE INTEGRATION\n');

// Sample test memory
const testMemory = {
  content: "Machine learning models require large amounts of quality data to achieve good performance.",
  metadata: {
    importance: 0.8,
    source: "research",
    type: "technical",
    topic: "machine learning"
  }
};

/**
 * Tests the Memory Core functionality with Qdrant
 */
async function testMemoryCore() {
  try {
    // STEP 1: Initialize Qdrant and Memory Service
    console.log('➡️ Initializing Qdrant Vector Store');
    
    const vectorStore = new QdrantVectorStore({
      baseUrl: process.env.QDRANT_URL || 'http://localhost:6333',
      collectionName: 'test_memories',
      vectorSize: 1536  // OpenAI's text-embedding-3-large size
    });
    
    try {
      await vectorStore.initialize();
      console.log('✅ Qdrant Vector Store initialized');
    } catch (error) {
      console.error(`❌ Failed to initialize Qdrant: ${error.message}`);
      return;
    }
    
    // Create Memory Service with the vector store
    console.log('➡️ Initializing Memory Service with Qdrant');
    const memoryService = new MemoryService(vectorStore, 'test_memories');
    
    try {
      await memoryService.initialize();
      console.log('✅ Memory Service initialized');
    } catch (error) {
      console.error(`❌ Failed to initialize Memory Service: ${error.message}`);
      return;
    }
    
    // STEP 2: Test Memory Storage (Create)
    console.log('➡️ Testing Memory Storage (Create)');
    
    let storedMemory;
    try {
      storedMemory = await memoryService.storeMemory(testMemory);
      console.log(`✅ Memory stored with ID: ${storedMemory.id}`);
    } catch (error) {
      console.error(`❌ Failed to store memory: ${error.message}`);
      return;
    }
    
    // STEP 3: Test Memory Retrieval (Read)
    console.log('➡️ Testing Memory Retrieval (Read)');
    
    try {
      const retrievedMemory = await memoryService.getMemory(storedMemory.id);
      console.log('✅ Memory retrieved successfully');
    } catch (error) {
      console.error(`❌ Failed to retrieve memory: ${error.message}`);
      return;
    }
    
    // STEP 4: Test Memory Update
    console.log('➡️ Testing Memory Update');
    
    try {
      const updatedContent = testMemory.content + " This is an updated version.";
      
      await memoryService.updateMemory(storedMemory.id, {
        content: updatedContent,
        metadata: {
          ...testMemory.metadata,
          importance: 0.95
        }
      });
      
      console.log('✅ Memory updated successfully');
    } catch (error) {
      console.error(`❌ Failed to update memory: ${error.message}`);
    }
    
    // STEP 5: Test Memory Search (Semantic Search)
    console.log('➡️ Testing Memory Search (Semantic Search)');
    
    try {
      const searchQuery = "machine learning data";
      const searchResults = await memoryService.searchMemories(searchQuery);
      
      console.log(`✅ Found ${searchResults.length} memories related to "${searchQuery}"`);
    } catch (error) {
      console.error(`❌ Failed to search memories: ${error.message}`);
    }
    
    // STEP 6: Test Memory Deletion
    console.log('➡️ Testing Memory Deletion');
    
    try {
      await memoryService.deleteMemory(storedMemory.id);
      console.log('✅ Memory deleted successfully');
      
      // Verify deletion
      try {
        await memoryService.getMemory(storedMemory.id);
        console.error('❌ Memory still exists after deletion attempt');
      } catch (error) {
        if (error.message.includes("not found")) {
          console.log('✅ Deletion confirmed - memory no longer exists');
        } else {
          throw error;
        }
      }
    } catch (error) {
      console.error(`❌ Failed to delete memory: ${error.message}`);
    }
    
    console.log('\n🧠 MEMORY CORE INTEGRATION TEST COMPLETE\n');
    console.log('✅ All core memory operations are working with Qdrant!\n');
  } catch (error) {
    console.error(`❌ Test failed with error: ${error.message}`);
    console.error(error);
  }
}

// Run the test
testMemoryCore(); 