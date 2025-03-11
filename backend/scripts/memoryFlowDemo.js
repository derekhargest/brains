import { config } from 'dotenv';
config();

import fs from 'fs';
import { QdrantVectorStore } from '../vectorStore/qdrantStore.js';
import { MemoryService } from '../services/memoryService.js';

// Console styling
const COLORS = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

// Helper functions
const log = {
  title: (text) => console.log(`\n${COLORS.bold}${COLORS.cyan}🧠 ${text}${COLORS.reset}\n`),
  step: (text) => console.log(`${COLORS.bold}${COLORS.blue}➡️ ${text}${COLORS.reset}`),
  success: (text) => console.log(`${COLORS.green}✅ ${text}${COLORS.reset}`),
  info: (text) => console.log(`${COLORS.yellow}ℹ️ ${text}${COLORS.reset}`),
  error: (text) => console.log(`${COLORS.red}❌ ${text}${COLORS.reset}`),
  data: (label, data) => {
    console.log(`${COLORS.magenta}🔍 ${label}:${COLORS.reset}`);
    console.log(JSON.stringify(data, null, 2));
    console.log();
  }
};

// Sample memories
const sampleMemories = [
  {
    content: "Met with Sarah and Alex to discuss the AI project timeline. Sarah suggested we focus on data preparation first.",
    metadata: {
      importance: 0.8,
      source: "meeting",
      type: "work"
    }
  },
  {
    content: "Reviewed the latest research papers on transformer architectures. The findings show improvements in efficiency.",
    metadata: {
      importance: 0.7,
      source: "research",
      type: "work"
    }
  },
  {
    content: "Need to pick up groceries on the way home: milk, eggs, and bread.",
    metadata: {
      importance: 0.5,
      source: "note",
      type: "personal"
    }
  },
  {
    content: "Alex mentioned that the data preprocessing pipeline needs to be updated by next Friday.",
    metadata: {
      importance: 0.9,
      source: "conversation",
      type: "work"
    }
  },
  {
    content: "Sarah's birthday is next month on the 15th. Need to organize a surprise party.",
    metadata: {
      importance: 0.6,
      source: "calendar",
      type: "personal"
    }
  }
];

// Create an in-memory memory service for demo purposes
const createInMemoryMemoryService = () => {
  const memories = new Map();
  let nextId = 1;
  
  return {
    // Store a memory
    storeMemory: async (memory) => {
      const id = `mem_${nextId++}`;
      const storedMemory = {
        id,
        content: memory.content,
        metadata: memory.metadata || {},
        timestamp: new Date().toISOString(),
        vector: [], // Placeholder for actual vector in real implementation
      };
      memories.set(id, storedMemory);
      return storedMemory;
    },

    // Retrieve a memory
    getMemory: async (id) => {
      const memory = memories.get(id);
      if (!memory) {
        throw new Error(`Memory with ID ${id} not found`);
      }
      return memory;
    },

    // Update a memory
    updateMemory: async (id, updatedMemory) => {
      const memory = memories.get(id);
      if (!memory) {
        throw new Error(`Memory with ID ${id} not found`);
      }
      
      const updated = {
        ...memory,
        ...updatedMemory,
        id,
        timestamp: updatedMemory.timestamp || memory.timestamp
      };
      
      memories.set(id, updated);
      return updated;
    },

    // Delete a memory
    deleteMemory: async (id) => {
      const exists = memories.has(id);
      if (!exists) {
        throw new Error(`Memory with ID ${id} not found`);
      }
      memories.delete(id);
      return true;
    },

    // Search memories
    searchMemories: async (query, options = {}) => {
      // Simple text-based search for demo
      let results = Array.from(memories.values());
      
      // Apply text search if query is provided
      if (query) {
        results = results.filter(memory => 
          memory.content.toLowerCase().includes(query.toLowerCase())
        );
      }
      
      // Apply metadata filters if provided
      if (options.filters) {
        Object.entries(options.filters).forEach(([key, value]) => {
          results = results.filter(memory => 
            memory.metadata[key] === value
          );
        });
      }
      
      return results;
    },
    
    // Utility function to get all memories
    getAllMemories: async () => {
      return Array.from(memories.values());
    }
  };
};

/**
 * Demonstrates the memory flow in the brains!!! system
 */
async function runMemoryFlowDemo() {
  try {
    log.title("brains!!! memory flow demonstration");
    
    // STEP 1: Initialize memory service
    log.step("Initializing in-memory service for demonstration");
    
    // Using in-memory service for demo simplicity
    const memoryService = createInMemoryMemoryService();
    log.success("Memory service initialized");
    
    // STEP 2: Store memories
    log.step("Storing sample memories");
    
    const storedMemories = [];
    for (const memory of sampleMemories) {
      const storedMemory = await memoryService.storeMemory(memory);
      storedMemories.push(storedMemory);
      log.success(`Stored memory: "${memory.content.substring(0, 40)}..."`);
    }
    
    // STEP 3: Retrieve a specific memory
    log.step("Retrieving a specific memory by ID");
    
    const retrievedMemory = await memoryService.getMemory(storedMemories[0].id);
    log.data("Retrieved Memory", retrievedMemory);
    
    // STEP 4: Search memories
    log.step("Searching memories");
    
    // Text-based search
    const searchResults = await memoryService.searchMemories("AI project");
    log.data("Search Results for 'AI project'", searchResults);
    
    // Metadata-based search
    const filteredResults = await memoryService.searchMemories("", {
      filters: {
        type: "personal"
      }
    });
    log.data("Filtered Search Results for personal memories", filteredResults);
    
    // STEP 5: Update a memory
    log.step("Updating a memory");
    
    const memoryToUpdate = storedMemories[2];
    const updatedContent = memoryToUpdate.content + " Also need to get coffee.";
    
    const updatedMemory = await memoryService.updateMemory(memoryToUpdate.id, {
      content: updatedContent,
      metadata: {
        ...memoryToUpdate.metadata,
        importance: 0.6
      }
    });
    
    log.data("Updated Memory", updatedMemory);
    
    // STEP 6: Delete a memory
    log.step("Deleting a memory");
    
    await memoryService.deleteMemory(storedMemories[4].id);
    log.success(`Memory deleted: "${storedMemories[4].content.substring(0, 40)}..."`);
    
    // STEP 7: Verify deletion by retrieving all memories
    log.step("Verifying memory deletion");
    
    const remainingMemories = await memoryService.getAllMemories();
    log.data("Remaining Memories", remainingMemories);
    log.info(`${remainingMemories.length} memories remain (original: ${sampleMemories.length})`);
    
    // STEP 8: Export memory state to file
    log.step("Exporting demo results");
    
    const demoResults = {
      totalMemories: remainingMemories.length,
      memories: remainingMemories
    };
    
    fs.writeFileSync('demo-results.json', JSON.stringify(demoResults, null, 2));
    log.success("Demo results exported to demo-results.json");
    
    // Done
    log.title("MEMORY FLOW DEMO COMPLETED SUCCESSFULLY");
    
  } catch (error) {
    log.error(`Demo failed: ${error.message}`);
    console.error(error);
  }
}

// Run the demo
runMemoryFlowDemo();