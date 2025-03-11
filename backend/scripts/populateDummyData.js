import { config } from 'dotenv';
config();

import { QdrantVectorStore } from '../vectorStore/qdrantStore.js';
import { MemoryService } from '../services/memoryService.js';
import { PatternService } from '../services/patternService.js';
import { KnowledgeGraphService } from '../services/knowledgeGraphService.js';

console.log('\n🧠 POPULATING brains!!! WITH DUMMY DATA\n');

// Sample memories with rich metadata for pattern detection
const sampleMemories = [
  {
    content: "Machine learning models require large amounts of quality data to achieve good performance.",
    metadata: {
      importance: 0.8,
      source: "research",
      type: "technical",
      topic: "machine learning",
      entities: ["machine learning", "data quality", "performance"]
    }
  },
  {
    content: "The transformer architecture revolutionized natural language processing with its attention mechanism.",
    metadata: {
      importance: 0.9,
      source: "research",
      type: "technical",
      topic: "NLP",
      entities: ["transformer", "NLP", "attention mechanism"]
    }
  },
  {
    content: "Regular exercise has been shown to improve cognitive function and memory retention.",
    metadata: {
      importance: 0.7,
      source: "article",
      type: "health",
      topic: "cognition",
      entities: ["exercise", "cognitive function", "memory retention"]
    }
  },
  {
    content: "Spaced repetition is an effective learning technique that involves reviewing information at increasing intervals.",
    metadata: {
      importance: 0.85,
      source: "research",
      type: "learning",
      topic: "memory techniques",
      entities: ["spaced repetition", "learning technique", "memory"]
    }
  },
  {
    content: "Knowledge graphs represent information as interconnected nodes and relationships, similar to how the brain stores memories.",
    metadata: {
      importance: 0.9,
      source: "article",
      type: "technical",
      topic: "knowledge representation",
      entities: ["knowledge graphs", "nodes", "relationships", "brain", "memory"]
    }
  },
  {
    content: "Deep learning has shown remarkable success in computer vision tasks such as image classification and object detection.",
    metadata: {
      importance: 0.85,
      source: "research",
      type: "technical",
      topic: "deep learning",
      entities: ["deep learning", "computer vision", "image classification", "object detection"]
    }
  },
  {
    content: "The hippocampus plays a crucial role in forming new memories and spatial navigation in the brain.",
    metadata: {
      importance: 0.75,
      source: "article",
      type: "health",
      topic: "neuroscience",
      entities: ["hippocampus", "memory formation", "spatial navigation", "brain"]
    }
  },
  {
    content: "Meeting with Alex and Sarah to discuss the AI project timeline. Sarah suggested focusing on data preparation first.",
    metadata: {
      importance: 0.8,
      source: "meeting",
      type: "work",
      topic: "project management",
      entities: ["Alex", "Sarah", "AI project", "data preparation"]
    }
  },
  {
    content: "Alex mentioned that the data preprocessing pipeline needs to be updated by next Friday.",
    metadata: {
      importance: 0.9,
      source: "conversation",
      type: "work",
      topic: "data engineering",
      entities: ["Alex", "data preprocessing", "pipeline"]
    }
  },
  {
    content: "Sarah's birthday is next month on the 15th. Need to organize a surprise party.",
    metadata: {
      importance: 0.6,
      source: "calendar",
      type: "personal",
      topic: "events",
      entities: ["Sarah", "birthday", "surprise party"]
    }
  },
  {
    content: "Meditation for 20 minutes each morning has improved my focus and stress levels.",
    metadata: {
      importance: 0.7,
      source: "journal",
      type: "personal",
      topic: "mindfulness",
      entities: ["meditation", "focus", "stress reduction"]
    }
  },
  {
    content: "The recursive neural network architecture is particularly effective for processing sequential data with hierarchical structure.",
    metadata: {
      importance: 0.85,
      source: "research",
      type: "technical",
      topic: "neural networks",
      entities: ["recursive neural network", "sequential data", "hierarchical structure"]
    }
  },
  {
    content: "Graph neural networks can learn representations of nodes in a graph by aggregating information from neighboring nodes.",
    metadata: {
      importance: 0.9,
      source: "research",
      type: "technical",
      topic: "graph learning",
      entities: ["graph neural networks", "node representation", "information aggregation"]
    }
  },
  {
    content: "Meeting with the data engineering team to discuss the knowledge graph implementation. Alex suggested using Qdrant for vector storage.",
    metadata: {
      importance: 0.8,
      source: "meeting",
      type: "work",
      topic: "knowledge graph",
      entities: ["data engineering team", "knowledge graph", "Alex", "Qdrant", "vector storage"]
    }
  },
  {
    content: "Sarah presented her research on transfer learning techniques for low-resource domains.",
    metadata: {
      importance: 0.75,
      source: "presentation",
      type: "work",
      topic: "transfer learning",
      entities: ["Sarah", "transfer learning", "low-resource domains"]
    }
  }
];

/**
 * Populates the brains!!! system with dummy data for testing
 */
async function populateDummyData() {
  let vectorStore, memoryService, patternService, knowledgeGraphService;
  
  try {
    console.log('➡️ Initializing services');
    
    // Initialize vector store
    console.log('Initializing vector store...');
    vectorStore = new QdrantVectorStore({
      baseUrl: process.env.QDRANT_URL || 'http://localhost:6333',
      collectionName: 'dummy_data',
      vectorSize: 1536  // OpenAI's text-embedding-3-large size
    });
    
    try {
      await vectorStore.initialize();
      console.log('✅ Vector store initialized');
    } catch (error) {
      console.error('❌ Vector store initialization failed:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      throw error;
    }
    
    // Initialize memory service
    console.log('Initializing memory service...');
    memoryService = new MemoryService(vectorStore);
    try {
      await memoryService.initialize();
      console.log('✅ Memory service initialized');
    } catch (error) {
      console.error('❌ Memory service initialization failed:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      throw error;
    }
    
    // Initialize pattern service
    console.log('Initializing pattern service...');
    patternService = new PatternService();
    try {
      await patternService.initialize();
      console.log('✅ Pattern service initialized');
    } catch (error) {
      console.error('❌ Pattern service initialization failed:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      throw error;
    }
    
    // Initialize knowledge graph service
    console.log('Initializing knowledge graph service...');
    knowledgeGraphService = new KnowledgeGraphService();
    try {
      await knowledgeGraphService.initialize();
      console.log('✅ Knowledge graph service initialized');
    } catch (error) {
      console.error('❌ Knowledge graph service initialization failed:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      throw error;
    }
    
    // Store sample memories
    console.log('\n➡️ Storing sample memories');
    
    const storedMemories = [];
    for (const memory of sampleMemories) {
      try {
        console.log(`Storing memory: "${memory.content.substring(0, 40)}..."`);
        const storedMemory = await memoryService.storeMemory(memory);
        storedMemories.push(storedMemory);
        console.log(`✅ Successfully stored memory`);
      } catch (error) {
        console.error(`❌ Failed to store memory:`, error);
        console.error('Memory that failed:', JSON.stringify(memory, null, 2));
        console.error('Error details:', JSON.stringify(error, null, 2));
      }
    }
    
    console.log(`\n✅ Successfully stored ${storedMemories.length} out of ${sampleMemories.length} memories`);
    
    // Generate patterns
    console.log('\n➡️ Generating patterns');
    
    try {
      console.log('Finding patterns in stored memories...');
      const patterns = await patternService.findAllPatterns();
      console.log('✅ Patterns generated');
      
      // Log some pattern statistics
      if (patterns.topics && patterns.topics.length > 0) {
        console.log(`📊 Found ${patterns.topics.length} topic patterns`);
        console.log('   Top topics:');
        patterns.topics.slice(0, 3).forEach(topic => {
          console.log(`   - ${topic.topic} (${topic.count} occurrences)`);
        });
      }
      
      if (patterns.entityCooccurrences && patterns.entityCooccurrences.length > 0) {
        console.log(`📊 Found ${patterns.entityCooccurrences.length} entity co-occurrences`);
        console.log('   Top co-occurrences:');
        patterns.entityCooccurrences.slice(0, 3).forEach(cooccurrence => {
          console.log(`   - ${cooccurrence.entities[0]} & ${cooccurrence.entities[1]} (${cooccurrence.count} times)`);
        });
      }
    } catch (error) {
      console.error('❌ Failed to generate patterns:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
    }
    
    // Create knowledge graph
    console.log('\n➡️ Creating knowledge graph');
    
    try {
      console.log('Building knowledge graph from memories...');
      const graphOptions = {
        clearExisting: true,
        connectSimilarMemories: true,
        connectCooccurringEntities: true
      };
      
      const graph = await knowledgeGraphService.createGraphFromMemories(graphOptions);
      console.log('✅ Knowledge graph created');
      
      // Log some graph statistics
      if (graph) {
        console.log(`📊 Graph statistics:`);
        console.log(`   - Nodes: ${graph.nodes?.length || 0}`);
        console.log(`   - Edges: ${graph.edges?.length || 0}`);
      }
    } catch (error) {
      console.error('❌ Failed to create knowledge graph:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
    }
    
    console.log('\n✅ Dummy data population completed!');
  } catch (error) {
    console.error('\n❌ Failed to populate dummy data:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));
    process.exit(1);
  }
}

// Run the population script
populateDummyData().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
}); 