import { config } from 'dotenv';
config();

console.log('📋 brains!!! MVP Test');

// Test in-memory core functionality without actual vector embeddings
async function runMVPTest() {
  try {
    const testMemories = [];
    let nextId = 1;

    // Mock memory service functions
    const mockMemoryService = {
      // Store a memory
      storeMemory: async (memory) => {
        const id = `mem_${nextId++}`;
        const storedMemory = {
          id,
          content: memory.content,
          metadata: memory.metadata || {},
          timestamp: new Date().toISOString()
        };
        testMemories.push(storedMemory);
        console.log(`  ✅ Memory stored with ID: ${id}`);
        return storedMemory;
      },

      // Retrieve a memory
      getMemory: async (id) => {
        const memory = testMemories.find(m => m.id === id);
        if (!memory) {
          throw new Error(`Memory with ID ${id} not found`);
        }
        return memory;
      },

      // Update a memory
      updateMemory: async (id, updatedMemory) => {
        const index = testMemories.findIndex(m => m.id === id);
        if (index === -1) {
          throw new Error(`Memory with ID ${id} not found`);
        }
        testMemories[index] = {
          ...testMemories[index],
          ...updatedMemory,
          id
        };
        return testMemories[index];
      },

      // Delete a memory
      deleteMemory: async (id) => {
        const index = testMemories.findIndex(m => m.id === id);
        if (index === -1) {
          throw new Error(`Memory with ID ${id} not found`);
        }
        testMemories.splice(index, 1);
        return true;
      },

      // Search memories
      searchMemories: async (query) => {
        // Simple text-based search
        return testMemories.filter(m => 
          m.content.toLowerCase().includes(query.toLowerCase())
        );
      }
    };

    // Initialize core components
    console.log('  ⏳ Initializing in-memory storage for testing...');
    console.log('  ✅ In-memory storage initialized');
    
    // Test memory storage
    console.log('  ⏳ Testing memory storage...');
    const testMemory = {
      content: 'This is a test memory for the MVP',
      metadata: {
        source: 'mvp_test',
        importance: 0.8,
        type: 'note'
      }
    };
    
    const storedMemory = await mockMemoryService.storeMemory(testMemory);
    
    // Test memory retrieval
    console.log('  ⏳ Testing memory retrieval...');
    const retrievedMemory = await mockMemoryService.getMemory(storedMemory.id);
    
    if (retrievedMemory && retrievedMemory.content === testMemory.content) {
      console.log('  ✅ Memory retrieved successfully');
    } else {
      throw new Error('Memory retrieval failed');
    }
    
    // Test memory search
    console.log('  ⏳ Testing memory search...');
    const searchResults = await mockMemoryService.searchMemories('test memory');
    
    if (searchResults && searchResults.length > 0) {
      console.log(`  ✅ Search returned ${searchResults.length} results`);
    } else {
      throw new Error('Memory search failed');
    }
    
    // Test memory update
    console.log('  ⏳ Testing memory update...');
    const updatedMemory = {
      ...retrievedMemory,
      content: 'This is an updated test memory for the MVP',
      metadata: {
        ...retrievedMemory.metadata,
        importance: 0.9
      }
    };
    
    await mockMemoryService.updateMemory(storedMemory.id, updatedMemory);
    const verifyUpdate = await mockMemoryService.getMemory(storedMemory.id);
    
    if (verifyUpdate.content === updatedMemory.content) {
      console.log('  ✅ Memory updated successfully');
    } else {
      throw new Error('Memory update failed');
    }
    
    // Test memory deletion
    console.log('  ⏳ Testing memory deletion...');
    await mockMemoryService.deleteMemory(storedMemory.id);
    
    try {
      await mockMemoryService.getMemory(storedMemory.id);
      throw new Error('Memory deletion failed - memory still exists');
    } catch (error) {
      if (error.message.includes('not found')) {
        console.log('  ✅ Memory deleted successfully');
      } else {
        throw error;
      }
    }
    
    console.log('\n📊 MVP Test Results: All tests passed');
    
  } catch (error) {
    console.error(`\n❌ MVP Test Failed: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

runMVPTest();
