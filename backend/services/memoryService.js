import { v4 as uuidv4 } from 'uuid';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import { QdrantVectorStore } from '../vectorStore/qdrantStore.js';
import { EmbeddingService } from '../vectorStore/embeddingService.js';
import { encode } from 'gpt-3-encoder';
import { storeMemory, advancedSearch, synchronizeCollections } from '../vectorStore.js';
import crypto from 'crypto';
import { EntityService } from './entityService.js';
import { EnrichmentService } from './enrichmentService.js';
import { KnowledgeGraphService } from './knowledgeGraphService.js';
import { TemporalService } from './temporalService.js';

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Use a lazy-loaded pattern service to avoid circular dependency
let patternServiceInstance = null;

/**
 * Memory Service
 * 
 * Handles storage and retrieval of memories in the vector store
 */
export class MemoryService {
  constructor(vectorStore, collectionName = 'memories') {
    this.vectorStore = vectorStore;
    this.collectionName = collectionName;
    this.embeddingCache = new Map();
    // Don't initialize patternService here to avoid circular dependency
    this.patternService = null;
    this.initialized = false;
    this.retryQueue = [];
    this.syncInterval = setInterval(this.processRetryQueue.bind(this), 60000);
    this.memories = [];
    this.entityService = new EntityService();
    this.enrichmentService = new EnrichmentService();
    this.knowledgeGraphService = new KnowledgeGraphService();
    this.temporalService = new TemporalService();
    
    // Create embedding service
    this.embeddingService = new EmbeddingService();
  }
  
  async initialize() {
    try {
      if (this.initialized) return true;
      
      // Initialize embedding service
      await this.embeddingService.initialize();
      
      // Initialize enrichment service
      await this.enrichmentService.initialize();
      
      // Get the knowledge graph service from the global services
      // This will be set when initializeServices completes in server.js
      if (!this.knowledgeGraphService && global.services) {
        this.knowledgeGraphService = global.services.knowledgeGraphService;
      }
      
      // We'll lazy-load the pattern service when needed

      // Set initialized flag
      this.initialized = true;
      console.log('✅ Memory service initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize memory service:', error);
      throw error;
    }
  }
  
  // Lazy-load pattern service when needed
  async getPatternService() {
    if (this.patternService) {
      return this.patternService;
    }
    
    // Import dynamically to avoid circular dependency
    const { PatternService } = await import('./patternService.js');
    this.patternService = new PatternService();
    // Don't initialize it here to avoid circular dependency
    return this.patternService;
  }
  
  /**
   * Store a new memory in the vector database
   * @param {Object} memory The memory to store
   * @returns {Object} The stored memory with ID
   */
  async storeMemory(memory) {
    try {
      if (!memory.content) {
        throw new Error('Memory content is required');
      }

      // Generate embedding for the memory content
      const vector = await this.generateEmbedding(memory.content);

      // Prepare the point for Qdrant
      const point = {
        id: memory.id || uuidv4(),
        vector: vector,
        payload: {
          content: memory.content,
          type: memory.type || 'general',
          timestamp: memory.timestamp || new Date().toISOString(),
          metadata: memory.metadata || {},
        }
      };

      console.log('Storing memory point:', {
        id: point.id,
        vectorSize: point.vector.length,
        payload: point.payload
      });

      // Store in vector database
      await this.vectorStore.upsert(point);

      return {
        id: point.id,
        ...point.payload
      };
    } catch (error) {
      console.error('Error storing memory:', error);
      if (error.response?.data) {
        console.error('Vector store error details:', error.response.data);
      }
      throw error;
    }
  }
  
  /**
   * Retrieve a memory by ID
   * @param {string} id The memory ID
   * @returns {Object} The memory object
   */
  async getMemory(id) {
    try {
      const response = await this.vectorStore.retrieve(this.collectionName, {
        ids: [id],
        with_payload: true
      });
      
      if (response.points && response.points.length > 0) {
        const point = response.points[0];
        return {
          id: point.id,
          content: point.payload.content,
          timestamp: point.payload.timestamp,
          tags: point.payload.tags || [],
          context: point.payload.context || {}
        };
      }
      
      return null;
    } catch (error) {
      console.error(`Error retrieving memory ${id}:`, error);
      throw error;
    }
  }
  
  /**
   * Retrieve all memories from the database
   * @returns {Array} All stored memories
   */
  async getAllMemories() {
    try {
      const response = await this.vectorStore.scroll(
        this.collectionName,
        { 
          limit: 1000,  // Adjust based on your needs
          with_payload: true,
          with_vectors: false
        }
      );
      
      return response.points.map(point => {
        return {
          id: point.id,
          content: point.payload.content,
          timestamp: point.payload.timestamp,
          tags: point.payload.tags || [],
          context: point.payload.context || {}
        };
      });
    } catch (error) {
      console.error("Error retrieving all memories:", error);
      throw error;
    }
  }
  
  /**
   * Find memories similar to a query
   * @param {string|Array} query - Either a text query or a pre-computed embedding vector
   * @param {Object} options - Search options
   * @returns {Array} Array of similar memories
   */
  async findSimilarMemories(query, options = {}) {
    try {
      const limit = options.limit || 5;
      const threshold = options.threshold || 0.3;
      
      console.log(`Searching for similar memories with threshold: ${threshold}`);
      
      // Check if query is a string and generate embedding if needed
      let embedding;
      if (typeof query === 'string') {
        console.log(`Converting text query to embedding: "${query}"`);
        embedding = await this.generateEmbedding(query);
      } else if (Array.isArray(query)) {
        embedding = query;
      } else {
        throw new Error('Query must be either a string or an embedding array');
      }
      
      // Perform the search with the embedding
      const response = await this.vectorStore.search(this.collectionName, {
        vector: embedding,
        limit: limit,
        with_payload: true,
        score_threshold: threshold
      });
      
      if (!response || !response.points || response.points.length === 0) {
        console.log(`Search returned no results.`);
        return [];
      }
      
      console.log(`Search found ${response.points.length} results`);
      
      return response.points.map(point => {
        return {
          id: point.id,
          content: point.payload?.content || 'No content',
          timestamp: point.payload?.timestamp || new Date().toISOString(),
          tags: point.payload?.tags || [],
          context: point.payload?.context || {},
          similarity: point.score || 0
        };
      });
    } catch (error) {
      console.error("Error finding similar memories:", error);
      throw error;
    }
  }
  
  /**
   * Delete a memory by ID
   * @param {string} id The memory ID to delete
   * @returns {boolean} Success status
   */
  async deleteMemory(id) {
    try {
      await this.vectorStore.delete(id);
      return true;
    } catch (error) {
      console.error(`Error deleting memory ${id}:`, error);
      throw error;
    }
  }
  
  /**
   * Generate an embedding vector for text
   * This is a simplified version - in a real implementation,
   * you would use a proper embedding model like OpenAI's or a local model
   * 
   * @param {string} text The text to embed
   * @returns {Array} The embedding vector
   */
  async generateEmbedding(text) {
    try {
      const response = await openai.embeddings.create({
        model: "text-embedding-ada-002",
        input: text,
      });

      if (!response.data || !response.data[0].embedding) {
        throw new Error('Invalid response from OpenAI API');
      }

      const embedding = response.data[0].embedding;
      
      // Validate embedding size
      if (embedding.length !== this.vectorStore.vectorSize) {
        throw new Error(`Embedding size mismatch: Got ${embedding.length}, expected ${this.vectorStore.vectorSize}`);
      }

      return embedding;
    } catch (error) {
      console.error('Error generating embedding:', error);
      throw error;
    }
  }

  /**
   * Process and store a memory
   * @param {string} content - Memory content
   * @param {Object} context - Additional context
   * @returns {Object} - Processed memory with patterns
   */
  async processMemory(content, context = {}) {
    if (!this.initialized) await this.initialize();
    
    // Create and add memory
    const memory = {
      id: uuidv4(),
      content,
      timestamp: new Date().toISOString(),
      ...context
    };
    
    await this.storeMemory(memory);
    
    // Process for patterns
    const patterns = await this.getPatternService().processContent(content, context);
    
    return {
      memory,
      patterns
    };
  }

  async store(memory) {
    try {
      const result = await storeMemory(memory);
      console.log(`Stored memory ${result.id}`);
      return result;
    } catch (error) {
      console.error('Storage failed, queuing for retry:', error);
      this.retryQueue.push(memory);
      return { success: false, error: 'Storage temporarily unavailable' };
    }
  }

  async processRetryQueue() {
    if (this.retryQueue.length > 0) {
      console.log(`Attempting to retry ${this.retryQueue.length} failed storage operations`);
      const successes = [];
      const failures = [];
      
      for (const memory of [...this.retryQueue]) {
        try {
          await this.store(memory);
          successes.push(memory);
          this.retryQueue = this.retryQueue.filter(m => m !== memory);
        } catch (error) {
          failures.push(memory);
        }
      }
      
      console.log(`Retry results: ${successes.length} succeeded, ${failures.length} failed`);
    }
  }

  async search(query, options) {
    try {
      return await advancedSearch(query, options);
    } catch (error) {
      console.error('Search failed:', error);
      return { results: [], error: 'Search temporarily unavailable' };
    }
  }

  async searchMemories(query, limit = 10) {
    try {
      // Generate embedding for the search query
      const queryVector = await this.generateEmbedding(query);

      // Search in vector database
      const results = await this.vectorStore.search(queryVector, limit);

      return results.map(result => ({
        id: result.id,
        content: result.payload.content,
        type: result.payload.type,
        timestamp: result.payload.timestamp,
        metadata: result.payload.metadata,
        similarity: result.score
      }));
    } catch (error) {
      console.error('Error searching memories:', error);
      throw error;
    }
  }

  async consolidateMemories(retentionDays = 180) {
    const cutoffDate = new Date(Date.now() - retentionDays * 86400000);
    
    // Get older memories
    const oldMemories = await this.search('', {
      filters: { timestamp: { lt: cutoffDate.toISOString() }},
      limit: 1000
    });

    // Create consolidated memories
    const summaries = await this.generateMemorySummaries(oldMemories);
    
    // Store summaries
    await Promise.all(summaries.map(summary => 
      this.storeMemory({
        content: summary.content,
        type: 'consolidated',
        source: 'system',
        importance: 0.7,
        related_memories: summary.ids
      })
    ));

    // Archive original memories
    await this.vectorStore.deletePoints(oldMemories.map(m => m.id));
  }

  async calculateDynamicImportance(memory) {
    // Base importance from initial storage
    let importance = memory.metadata.importance || 0.5;
    
    // Factor 1: Recency
    const ageDays = (Date.now() - new Date(memory.timestamp)) / 86400000;
    importance *= Math.max(0.7, 1 - (ageDays / 365));
    
    // Factor 2: Access Frequency
    const accessCount = memory.metadata.accessCount || 0;
    importance *= Math.min(1.5, 1 + (accessCount * 0.1));
    
    // Factor 3: Relationship Density
    const relationships = await this.knowledgeGraphService.getNodeRelations(memory.id);
    importance *= Math.min(2, 1 + (relationships.length * 0.2));
    
    // Factor 4: Contextual Relevance
    const contextMatches = await this.contextualRelevanceCheck(memory);
    importance *= contextMatches > 0 ? 1.2 : 0.8;
    
    return Math.min(1, Math.max(0, importance));
  }

  async contextualRelevanceCheck(memory) {
    const currentContext = this.temporalService.getTimeBasedContext();
    return advancedSearch('', {
      filters: {
        type: 'context',
        'metadata.timeOfDay': currentContext.timeOfDay,
        'metadata.dayOfWeek': currentContext.dayOfWeek
      },
      limit: 1
    });
  }

  async runAdaptiveRetention() {
    const allMemories = await this.search('', { limit: 10000 });
    
    // Update importance scores
    const updated = await Promise.all(
      allMemories.map(async memory => ({
        ...memory,
        metadata: {
          ...memory.metadata,
          importance: await this.calculateDynamicImportance(memory)
        }
      }))
    );
    
    // Re-store with updated importance
    await this.vectorStore.upsertBatch(this.collectionName, updated);
    
    // Delete low-importance memories
    const toDelete = updated.filter(m => m.metadata.importance < 0.2);
    await this.vectorStore.deletePoints(toDelete.map(m => m.id));
    
    return { updated: updated.length, deleted: toDelete.length };
  }

  async updateMemory(id, updates) {
    try {
      // First retrieve the existing memory
      const existingMemory = await this.vectorStore.getPoint(id);
      
      if (!existingMemory) {
        throw new Error(`Memory with id ${id} not found`);
      }

      // Merge updates with existing memory
      const updatedMemory = {
        ...existingMemory.payload,
        ...updates,
        timestamp: updates.timestamp || new Date().toISOString()
      };

      // If content was updated, generate new embedding
      const vector = updates.content ? 
        await this.generateEmbedding(updates.content) : 
        existingMemory.vector;

      // Store updated memory
      await this.vectorStore.upsert({
        id,
        vector,
        payload: updatedMemory
      });

      return {
        id,
        ...updatedMemory
      };
    } catch (error) {
      console.error('Error updating memory:', error);
      throw error;
    }
  }
}

export const memoryService = new MemoryService(); 