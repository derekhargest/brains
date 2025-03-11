import { OpenAI } from 'openai';
import { QdrantClient } from '@qdrant/js-client-rest';
import dotenv from 'dotenv';
import crypto from 'crypto';
import axios from 'axios';

dotenv.config();

// Initialize OpenAI for embeddings
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'demo-key'
});

// Single declaration at the top
export const qdrantClient = new QdrantClient({
  url: "http://localhost:6333",
  timeout: 5000
});

const COLLECTION_NAME = "derek_memories";
const VECTOR_SIZE = 1536; // Size for text-embedding-ada-002

// Fallback in-memory storage
let inMemoryStore = [];
let useInMemoryFallback = false;

// Check if OpenAI API key is available
const hasOpenAIKey = process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'demo-key';

// Collection names
const COLLECTIONS = {
  CORE: 'memory_core',
  TEMPORAL: 'memory_temporal',
  ENTITIES: 'memory_entities',
  KNOWLEDGE: 'memory_knowledge'
};

// Add at the top of the file
let collectionsInitialized = false;

const MEMORY_CACHE = new Map();
const CACHE_TTL = 60 * 1000; // 1 minute

/**
 * Check if Qdrant is available
 */
async function checkQdrantAvailability() {
  try {
    // New health check endpoint
    const response = await axios.get('http://localhost:6333');
    console.log("Qdrant version:", response.data.version);
    return true;
  } catch (error) {
    console.error("Qdrant is not available:", error.message);
    useInMemoryFallback = true;
    return false;
  }
}

// Check Qdrant on startup
checkQdrantAvailability().then(available => {
  if (!available) {
    console.log("Using in-memory fallback storage");
  }
});

/**
 * Create an embedding from text content
 */
async function createEmbedding(text) {
  if (!hasOpenAIKey) {
    // Return a fake embedding if no API key
    return Array(VECTOR_SIZE).fill(0).map(() => Math.random() - 0.5);
  }
  
  try {
    const response = await openai.embeddings.create({
      model: "text-embedding-ada-002",
      input: text
    });
    return response.data[0].embedding;
  } catch (error) {
    console.error("Error creating embedding:", error);
    // Return a fake embedding on error
    return Array(VECTOR_SIZE).fill(0).map(() => Math.random() - 0.5);
  }
}

/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(vecA, vecB) {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Initialize collections
 */
async function initializeCollections() {
  if (collectionsInitialized) {
    console.log('Collections already initialized');
    return;
  }

  try {
    // Get existing collections
    const response = await axios.get('http://localhost:6333/collections');
    const existingCollections = response.data.result.collections;
    
    const qdrantAvailable = await checkQdrantAvailability();
    if (!qdrantAvailable) {
      console.log('Using in-memory fallback for collections');
      return;
    }

    const requiredCollections = [
      COLLECTIONS.CORE,
      COLLECTIONS.TEMPORAL,
      COLLECTIONS.ENTITIES,
      COLLECTIONS.KNOWLEDGE
    ];

    for (const collectionName of requiredCollections) {
      try {
        const collectionExists = existingCollections.some(c => c.name === collectionName);

        if (!collectionExists) {
          console.log(`Creating collection: ${collectionName}`);
          await qdrantClient.createCollection(collectionName, {
            vectors: { size: VECTOR_SIZE, distance: 'Cosine' }
          });
        } else {
          console.log(`Using existing collection: ${collectionName}`);
        }
      } catch (error) {
        if (error.status === 409) {
          console.log(`Collection ${collectionName} already exists`);
        } else {
          console.error(`Error processing collection ${collectionName}:`, error);
        }
      }
    }

    console.log('Collections initialized successfully');
    collectionsInitialized = true;
  } catch (error) {
    console.error('Error initializing collections:', error);
    throw error;
  }
}

/**
 * Enhanced memory storage function
 */
async function storeMemory(memory) {
  try {
    // Generate embedding for the memory content
    const content = memory.content || `${memory.title || ''} ${memory.type || ''}`;
    const embedding = await createEmbedding(content);
    
    // Convert string ID to a valid Qdrant ID (UUID)
    let pointId;
    if (typeof memory.id === 'string') {
      // If it's already a UUID format, use it directly
      if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(memory.id)) {
        pointId = memory.id;
      } else {
        // Otherwise, generate a UUID using a hash of the string ID
        // This is a simple implementation - in production you might want a more robust UUID generator
        pointId = crypto.randomUUID();
        console.log(`Converted string ID "${memory.id}" to UUID "${pointId}"`);
      }
    } else if (typeof memory.id === 'number') {
      // If it's a number, use it directly
      pointId = memory.id;
    } else {
      // If no ID provided, generate a UUID
      pointId = crypto.randomUUID();
    }
    
    // Store the original ID in the payload
    const originalId = memory.id;
    
    // Prepare the point to store
    const point = {
      id: pointId,
      vector: embedding,
      payload: {
        ...memory,
        original_id: originalId,
        created_at: new Date().toISOString(),
        schema_version: '1.0'
      }
    };
    
    // Store in core collection
    await qdrantClient.upsert(COLLECTIONS.CORE, {
      points: [point]
    });
    
    // Determine if this memory should be in specialized collections
    if (memory.temporal && memory.temporal.timestamp) {
      // Also store in temporal collection
      await qdrantClient.upsert(COLLECTIONS.TEMPORAL, {
        points: [point]
      });
    }
    
    return { success: true, id: pointId, original_id: originalId };
  } catch (error) {
    console.error('Error storing memory:', error);
    throw error;
  }
}

/**
 * Specialized search functions
 */
async function searchByTimePattern(pattern, limit = 10) {
  try {
    // Use the temporal collection for time pattern queries
    const filter = {
      must: [
        {
          key: 'temporal.recurrence.pattern',
          match: {
            value: pattern
          }
        }
      ]
    };
    
    return await qdrantClient.search(COLLECTIONS.TEMPORAL, {
      filter,
      limit
    });
  } catch (error) {
    console.error('Error searching by time pattern:', error);
    throw error;
  }
}

/**
 * Sophisticated search that can query across collections
 */
async function advancedSearch(query, options = {}) {
  try {
    const embedding = await createEmbedding(query);
    const { filters = {}, limit = 10, collection = COLLECTIONS.CORE } = options;
    
    // Build a filter based on the provided options
    const filter = buildFilterFromOptions(filters);
    
    // Perform the search
    return await qdrantClient.search(collection, {
      vector: embedding,
      filter,
      limit
    });
  } catch (error) {
    console.error('Error performing advanced search:', error);
    throw error;
  }
}

/**
 * Helper to build Qdrant filters from options
 */
function buildFilterFromOptions(options) {
  const filter = { must: [] };
  
  Object.entries(options).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      // Handle different types of filters
      if (Array.isArray(value)) {
        // Array values treated as "should match any"
        const should = value.map(v => ({
          key: key,
          match: { value: v }
        }));
        filter.must.push({ should });
      } else if (typeof value === 'object') {
        // Objects can have range queries
        if (value.gte !== undefined) {
          filter.must.push({
            key: key,
            range: { gte: value.gte }
          });
        }
        if (value.lte !== undefined) {
          filter.must.push({
            key: key,
            range: { lte: value.lte }
          });
        }
      } else {
        // Simple exact match
        filter.must.push({
          key: key,
          match: { value }
        });
      }
    }
  });
  
  return filter.must.length > 0 ? filter : null;
}

/**
 * Complete the synchronization function
 */
async function synchronizeCollections() {
  console.log('Starting collection synchronization...');
  
  try {
    // Get all points from core collection
    const corePoints = await getAllPointsFromCollection(COLLECTIONS.CORE);
    console.log(`Found ${corePoints.length} points in core collection`);
    
    // Synchronize temporal collection
    await synchronizeCollection(
      corePoints, 
      COLLECTIONS.TEMPORAL, 
      point => point.payload.temporal && point.payload.temporal.timestamp
    );
    
    // Synchronize entities collection (when implemented)
    // await synchronizeCollection(
    //   corePoints, 
    //   COLLECTIONS.ENTITIES, 
    //   point => point.payload.entities && 
    //     (point.payload.entities.people?.length > 0 || 
    //      point.payload.entities.places?.length > 0 || 
    //      point.payload.entities.topics?.length > 0)
    // );
    
    // Synchronize knowledge collection (when implemented)
    // await synchronizeCollection(
    //   corePoints, 
    //   COLLECTIONS.KNOWLEDGE, 
    //   point => point.payload.knowledge
    // );
    
    console.log('Collection synchronization completed successfully');
  } catch (error) {
    console.error('Error during collection synchronization:', error);
    throw error;
  }
}

/**
 * Helper to get all points from a collection
 */
async function getAllPointsFromCollection(collectionName) {
  const batchSize = 100;
  let offset = 0;
  let allPoints = [];
  let batch;
  
  do {
    batch = await qdrantClient.scroll(collectionName, {
      limit: batchSize,
      offset: offset,
      with_payload: true,
      with_vectors: true
    });
    
    allPoints = allPoints.concat(batch.points);
    offset += batch.points.length;
  } while (batch.points.length === batchSize);
  
  return allPoints;
}

/**
 * Synchronize a specific collection based on a filter function
 */
async function synchronizeCollection(corePoints, targetCollection, filterFn) {
  // Get points that should be in this collection
  const pointsForCollection = corePoints.filter(filterFn);
  console.log(`${pointsForCollection.length} points should be in ${targetCollection}`);
  
  // Get existing points in the collection
  const existingPoints = await getAllPointsFromCollection(targetCollection);
  const existingIds = new Set(existingPoints.map(p => p.id));
  
  // Find points to add (in core but not in target)
  const pointsToAdd = pointsForCollection.filter(p => !existingIds.has(p.id));
  console.log(`Adding ${pointsToAdd.length} new points to ${targetCollection}`);
  
  // Add missing points in batches
  if (pointsToAdd.length > 0) {
    const batchSize = 100;
    for (let i = 0; i < pointsToAdd.length; i += batchSize) {
      const batch = pointsToAdd.slice(i, i + batchSize);
      await qdrantClient.upsert(targetCollection, {
        points: batch
      });
      console.log(`Added batch ${i/batchSize + 1} to ${targetCollection}`);
    }
  }
  
  return {
    total: pointsForCollection.length,
    added: pointsToAdd.length
  };
}

/**
 * Check the health of all collections
 */
async function checkCollectionsHealth() {
  const health = {
    overall: true,
    collections: {}
  };
  
  try {
    // Get all collections
    const collectionsResponse = await qdrantClient.getCollections();
    // Properly handle the API response format
    const collectionNames = collectionsResponse?.collections?.length 
      ? collectionsResponse.collections.map(c => c.name) 
      : [];
    
    console.log('Available collections for health check:', collectionNames);
    
    // Check each of our collections
    for (const collection of Object.values(COLLECTIONS)) {
      const exists = collectionNames.includes(collection);
      
      if (exists) {
        // Check collection info
        const info = await qdrantClient.getCollection(collection);
        const pointsCount = info.points_count || 0;
        
        health.collections[collection] = {
          exists: true,
          pointsCount,
          status: 'healthy'
        };
      } else {
        health.collections[collection] = {
          exists: false,
          pointsCount: 0,
          status: 'missing'
        };
        health.overall = false;
      }
    }
    
    return health;
  } catch (error) {
    console.error('Error checking collections health:', error);
    
    // Mark all collections as unhealthy
    for (const collection of Object.values(COLLECTIONS)) {
      health.collections[collection] = {
        exists: false,
        status: 'error',
        error: error.message
      };
    }
    
    health.overall = false;
    return health;
  }
}

/**
 * Converts a text query to an embedding and performs a semantic search
 */
async function optimizedSearch(query, options = {}) {
  const embedding = await createEmbedding(query);
  
  const searchOptions = {
    vector: embedding,
    limit: options.limit || 10,
    with_payload: true
  };
  
  // Apply filters if provided
  if (options.filters) {
    searchOptions.filter = buildFilterFromOptions(options.filters);
  }
  
  const results = await qdrantClient.search(COLLECTIONS.CORE, searchOptions);
  
  return results.map(result => ({
    id: result.id,
    content: result.payload.content,
    score: result.score,
    timestamp: result.payload.timestamp,
    metadata: result.payload.metadata
  }));
}

export async function hybridSearch(query, options = {}) {
  // Vector search
  const vectorResults = await advancedSearch(query, options);
  
  // Keyword search
  const keywordResults = await searchMemories(query, {
    filters: options.filters,
    limit: options.limit
  });

  // Combine and deduplicate
  const combined = [...vectorResults, ...keywordResults];
  const uniqueResults = Array.from(new Map(
    combined.map(item => [item.id, item])
  ).values());

  return uniqueResults.slice(0, options.limit);
}

// Export other utilities
export { 
  storeMemory,
  checkQdrantAvailability,
  initializeCollections,
  checkCollectionsHealth,
  advancedSearch,
  synchronizeCollections,
  searchByTimePattern,
  optimizedSearch,
  COLLECTIONS
}; 