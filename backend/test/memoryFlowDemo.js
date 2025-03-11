/**
 * Memory Flow Demonstration Script
 * This script demonstrates the current flow of memory processing in the system
 */
import { config } from 'dotenv';
config();

import { QdrantVectorStore } from '../vectorStore/qdrantStore.js';
import { MemoryService } from '../services/memoryService.js';
import { PatternService } from '../services/patternService.js';
import { KnowledgeGraphService } from '../services/knowledgeGraphService.js';

// Show colored console output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m"
};

function log(message, color = colors.reset) {
  console.log(color + message + colors.reset);
}

async function runDemo() {
  try {
    log("🧠 MEMORY FLOW DEMONSTRATION", colors.bright + colors.cyan);
    log("============================", colors.bright + colors.cyan);
    log("\nThis demonstration shows how memories are processed through the system.\n");
    
    // Step 1: Initialize Core Services
    log("Step 1: Initializing Core Services...", colors.bright + colors.yellow);
    
    log("  📊 Initializing Vector Store...", colors.blue);
    const vectorStore = new QdrantVectorStore();
    await vectorStore.initialize();
    log("  ✅ Vector Store Ready", colors.green);
    
    log("  🧠 Initializing Memory Service...", colors.blue);
    const memoryService = new MemoryService(vectorStore);
    await memoryService.initialize();
    log("  ✅ Memory Service Ready", colors.green);
    
    log("  🔍 Initializing Pattern Service...", colors.blue);
    const patternService = new PatternService();
    await patternService.initialize();
    log("  ✅ Pattern Service Ready", colors.green);
    
    log("  🕸️  Initializing Knowledge Graph Service...", colors.blue);
    const knowledgeGraphService = new KnowledgeGraphService();
    await knowledgeGraphService.initialize();
    log("  ✅ Knowledge Graph Service Ready", colors.green);
    
    // Step 2: Create Test Memories
    log("\nStep 2: Creating Test Memories...", colors.bright + colors.yellow);
    
    const memories = [
      {
        content: "Met with Sarah about the project deadline. Need to finish the report by Friday.",
        metadata: {
          source: "meeting_notes",
          importance: 0.8,
          type: "work",
          timestamp: new Date().toISOString()
        }
      },
      {
        content: "Learned about vector embeddings and how they can be used to find similar content.",
        metadata: {
          source: "research_notes",
          importance: 0.9,
          type: "learning",
          timestamp: new Date().toISOString()
        }
      },
      {
        content: "Need to buy milk and eggs at the grocery store this evening.",
        metadata: {
          source: "todo",
          importance: 0.5,
          type: "personal",
          timestamp: new Date().toISOString()
        }
      }
    ];
    
    // Step 3: Store Memories and Show Flow
    log("\nStep 3: Storing Memories and Processing Flow...", colors.bright + colors.yellow);
    
    log("\n🔄 MEMORY FLOW: Input → Vectorization → Storage → Pattern Analysis → Knowledge Graph", colors.magenta);
    
    for (const [index, memory] of memories.entries()) {
      log(`\n📝 Processing Memory ${index + 1}: "${memory.content.substring(0, 40)}..."`, colors.bright);
      
      // 3.1: Store memory
      log("  1️⃣ Sending to Memory Service...", colors.blue);
      const storedMemory = await memoryService.storeMemory(memory);
      log(`  ✅ Memory stored with ID: ${storedMemory.id}`, colors.green);
      
      // 3.2: Perform pattern detection
      log("  2️⃣ Detecting patterns...", colors.blue);
      const patterns = await patternService.detectPatterns(memory.content);
      log(`  ✅ Detected ${patterns.length} patterns:`, colors.green);
      
      for (const pattern of patterns) {
        log(`     - Type: ${pattern.type}, Confidence: ${pattern.confidence.toFixed(2)}`, colors.green);
      }
      
      // 3.3: Add to knowledge graph
      log("  3️⃣ Adding to Knowledge Graph...", colors.blue);
      
      // Extract concepts from the memory
      const conceptsInMemory = memory.content.split(/\s+/)
        .filter(word => word.length > 4)
        .map(word => word.replace(/[^a-zA-Z0-9]/g, ""))
        .filter(word => word.length > 4)
        .slice(0, 3);
      
      for (const concept of conceptsInMemory) {
        await knowledgeGraphService.addNode({
          type: "concept",
          name: concept,
          properties: {
            source: memory.metadata.type,
            importance: memory.metadata.importance
          }
        });
      }
      
      // Create relationships between memory and concepts
      for (const concept of conceptsInMemory) {
        await knowledgeGraphService.addEdge({
          from: `memory:${storedMemory.id}`,
          to: `concept:${concept}`,
          relationship: "contains",
          properties: {
            confidence: 0.9
          }
        });
      }
      
      log(`  ✅ Added to Knowledge Graph with ${conceptsInMemory.length} concepts`, colors.green);
    }
    
    // Step 4: Demonstrate Memory Retrieval
    log("\nStep 4: Demonstrating Memory Retrieval...", colors.bright + colors.yellow);
    
    // 4.1: Search by content
    log("\n🔍 Searching memories by content: 'project'", colors.blue);
    const searchResults = await memoryService.searchMemories("project");
    log(`  ✅ Found ${searchResults.length} results:`, colors.green);
    for (const result of searchResults) {
      log(`     - "${result.content.substring(0, 60)}..."`, colors.green);
      log(`       Relevance: ${result.score ? result.score.toFixed(2) : 'N/A'}`, colors.green);
    }
    
    // 4.2: Demonstrate pattern-based retrieval
    log("\n🧩 Finding memories with temporal patterns (dates, times)", colors.blue);
    const temporalPatterns = await patternService.findPatternsByType("temporal");
    if (temporalPatterns && temporalPatterns.length > 0) {
      log(`  ✅ Found ${temporalPatterns.length} temporal patterns`, colors.green);
      
      // Find memory IDs associated with these patterns
      const memoryIds = new Set();
      for (const pattern of temporalPatterns) {
        if (pattern.memoryId) {
          memoryIds.add(pattern.memoryId);
        }
      }
      
      log(`  ✅ These patterns are present in ${memoryIds.size} memories`, colors.green);
    } else {
      log("  ❗ No temporal patterns found", colors.red);
    }
    
    // 4.3: Demonstrate knowledge graph traversal
    log("\n🕸️ Finding related concepts in Knowledge Graph", colors.blue);
    const conceptStats = await knowledgeGraphService.getStatistics();
    log(`  ✅ Knowledge Graph contains ${conceptStats.totalNodes} nodes and ${conceptStats.totalEdges} edges`, colors.green);
    
    // Step 5: Show Memory Statistics
    log("\nStep 5: Memory System Statistics...", colors.bright + colors.yellow);
    
    try {
      const stats = await memoryService.getStatistics();
      log("  📊 Memory System Statistics:", colors.blue);
      log(`     - Total Memories: ${stats.totalMemories}`, colors.green);
      log(`     - By Type: ${JSON.stringify(stats.byType)}`, colors.green);
      log(`     - By Source: ${JSON.stringify(stats.bySource)}`, colors.green);
      log(`     - Importance Distribution: ${JSON.stringify(stats.importanceDistribution)}`, colors.green);
    } catch (error) {
      log(`  ❗ Could not fetch memory statistics: ${error.message}`, colors.red);
    }
    
    // Conclusion
    log("\n✨ DEMONSTRATION COMPLETE ✨", colors.bright + colors.cyan);
    log("This demonstrates the current memory flow in the system:", colors.cyan);
    log("1. Input memories are received", colors.cyan);
    log("2. Memories are vectorized for semantic search", colors.cyan);
    log("3. Patterns are detected and analyzed", colors.cyan);
    log("4. Relationships are stored in the Knowledge Graph", colors.cyan);
    log("5. Retrieval can happen through direct queries, semantic search, or graph traversal", colors.cyan);
    
    log("\nIn the MVP, we will keep only the core memory storage and retrieval functionality,", colors.yellow);
    log("removing the pattern analysis, knowledge graph, and advanced features.", colors.yellow);
    
  } catch (error) {
    log(`\n❌ Error during demonstration: ${error.message}`, colors.red);
    console.error(error);
  }
}

runDemo(); 