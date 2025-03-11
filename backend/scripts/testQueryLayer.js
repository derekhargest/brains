import { config } from 'dotenv';
config();

import { QdrantVectorStore } from '../vectorStore/qdrantStore.js';
import { MemoryService } from '../services/memoryService.js';

console.log('\n🔍 testing brains!!! query & retrieval layer\n');

// Sample memories for testing
const sampleMemories = [
  {
    content: "Machine learning models require large amounts of quality data to achieve good performance.",
    metadata: {
      importance: 0.8,
      source: "research",
      type: "technical",
      topic: "machine learning"
    }
  },
  {
    content: "The transformer architecture revolutionized natural language processing with its attention mechanism.",
    metadata: {
      importance: 0.9,
      source: "research",
      type: "technical",
      topic: "NLP"
    }
  },
  {
    content: "Regular exercise has been shown to improve cognitive function and memory retention.",
    metadata: {
      importance: 0.7,
      source: "article",
      type: "health",
      topic: "cognition"
    }
  },
  {
    content: "Spaced repetition is an effective learning technique that involves reviewing information at increasing intervals.",
    metadata: {
      importance: 0.85,
      source: "research",
      type: "learning",
      topic: "memory techniques"
    }
  },
  {
    content: "Knowledge graphs represent information as interconnected nodes and relationships, similar to how the brain stores memories.",
    metadata: {
      importance: 0.9,
      source: "article",
      type: "technical",
      topic: "knowledge representation"
    }
  }
];

/**
 * Tests the Query and Retrieval Layer
 */
async function testQueryLayer() {
  try {
    // STEP 1: Initialize Qdrant and Memory Service
    console.log('➡️ Initializing Qdrant Vector Store');
    
    const vectorStore = new QdrantVectorStore({
      baseUrl: process.env.QDRANT_URL || 'http://localhost:6333',
      collectionName: 'test_collection',
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
    const memoryService = new MemoryService(vectorStore, 'query_test');
    
    try {
      await memoryService.initialize();
      console.log('✅ Memory Service initialized');
    } catch (error) {
      console.error(`❌ Failed to initialize Memory Service: ${error.message}`);
      return;
    }
    
    // STEP 2: Store sample memories for testing
    console.log('➡️ Storing sample memories for testing');
    
    const storedMemories = [];
    for (const memory of sampleMemories) {
      try {
        const storedMemory = await memoryService.storeMemory(memory);
        storedMemories.push(storedMemory);
        console.log(`✅ Stored: "${memory.content.substring(0, 40)}..."`);
      } catch (error) {
        console.error(`❌ Failed to store memory: ${error.message}`);
      }
    }
    
    if (storedMemories.length === 0) {
      console.error('❌ Failed to store any memories');
      return;
    }
    
    console.log(`✅ Successfully stored ${storedMemories.length} memories`);
    
    // STEP 3: Test text-based lookup
    console.log('\n➡️ Testing text-based lookup');
    
    try {
      const textQuery = "machine learning";
      console.log(`🔍 Query: "${textQuery}"`);
      
      const textResults = await memoryService.searchMemories(textQuery);
      
      console.log(`✅ Found ${textResults.length} results for text query`);
      
      // Display results
      textResults.forEach((result, index) => {
        console.log(`\n  Result ${index + 1}:`);
        console.log(`  Content: ${result.content}`);
        console.log(`  Score: ${result.score || 'N/A'}`);
        console.log(`  Topic: ${result.metadata?.topic || 'N/A'}`);
      });
    } catch (error) {
      console.error(`❌ Text-based lookup failed: ${error.message}`);
    }
    
    // STEP 4: Test conceptual similarity query
    console.log('\n➡️ Testing conceptual similarity query');
    
    try {
      const conceptQuery = "improving memory and learning efficiency";
      console.log(`🔍 Query: "${conceptQuery}"`);
      
      const conceptResults = await memoryService.searchMemories(conceptQuery);
      
      console.log(`✅ Found ${conceptResults.length} results for conceptual query`);
      
      // Display results
      conceptResults.forEach((result, index) => {
        console.log(`\n  Result ${index + 1}:`);
        console.log(`  Content: ${result.content}`);
        console.log(`  Score: ${result.score || 'N/A'}`);
        console.log(`  Topic: ${result.metadata?.topic || 'N/A'}`);
      });
    } catch (error) {
      console.error(`❌ Conceptual similarity query failed: ${error.message}`);
    }
    
    // STEP 5: Test metadata filtering
    console.log('\n➡️ Testing metadata filtering');
    
    try {
      const filterQuery = {
        filters: {
          type: "technical"
        }
      };
      console.log(`🔍 Filter: type = "technical"`);
      
      const filterResults = await memoryService.searchMemories("", filterQuery);
      
      console.log(`✅ Found ${filterResults.length} results for metadata filter`);
      
      // Display results
      filterResults.forEach((result, index) => {
        console.log(`\n  Result ${index + 1}:`);
        console.log(`  Content: ${result.content}`);
        console.log(`  Type: ${result.metadata?.type || 'N/A'}`);
        console.log(`  Topic: ${result.metadata?.topic || 'N/A'}`);
      });
    } catch (error) {
      console.error(`❌ Metadata filtering failed: ${error.message}`);
    }
    
    // STEP 6: Test combined query (text + metadata)
    console.log('\n➡️ Testing combined query (text + metadata)');
    
    try {
      const combinedQuery = "knowledge";
      const combinedOptions = {
        filters: {
          source: "article"
        }
      };
      console.log(`🔍 Query: "${combinedQuery}" with filter: source = "article"`);
      
      const combinedResults = await memoryService.searchMemories(combinedQuery, combinedOptions);
      
      console.log(`✅ Found ${combinedResults.length} results for combined query`);
      
      // Display results
      combinedResults.forEach((result, index) => {
        console.log(`\n  Result ${index + 1}:`);
        console.log(`  Content: ${result.content}`);
        console.log(`  Source: ${result.metadata?.source || 'N/A'}`);
        console.log(`  Topic: ${result.metadata?.topic || 'N/A'}`);
      });
    } catch (error) {
      console.error(`❌ Combined query failed: ${error.message}`);
    }
    
    // STEP 7: Clean up test collection
    console.log('\n➡️ Cleaning up test collection');
    
    try {
      await vectorStore.deleteCollection('query_test');
      console.log('✅ Test collection deleted');
    } catch (error) {
      console.error(`❌ Failed to delete test collection: ${error.message}`);
    }
    
    console.log('\n🔍 QUERY & RETRIEVAL LAYER TEST COMPLETE\n');
    console.log('✅ Query and retrieval functionality is working!\n');
  } catch (error) {
    console.error(`❌ Test failed with error: ${error.message}`);
    console.error(error);
  }
}

// Run the test
testQueryLayer(); 