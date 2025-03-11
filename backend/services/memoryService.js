import { v4 as uuidv4 } from 'uuid';
import { PatternService } from './patternService.js';
import { QdrantVectorStore } from '../vectorStore/qdrantStore.js';
import { EmbeddingService } from '../vectorStore/embeddingService.js';
import { encode } from 'gpt-3-encoder';
import { storeMemory, advancedSearch, synchronizeCollections } from '../vectorStore.js';
import crypto from 'crypto';
import { EntityService } from './entityService.js';
import { EnrichmentService } from './enrichmentService.js';
import { KnowledgeGraphService } from './knowledgeGraphService.js';
import { TemporalService } from './temporalService.js';

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
    this.patternService = new PatternService();
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
      
      this.initialized = true;
      console.log('✅ Memory service initialized successfully');
      return true;
    } catch (error) {
      console.error('Error initializing MemoryService:', error);
      return false;
    }
  }
  
  /**
   * Store a new memory in the vector database
   * @param {Object} memory The memory to store
   * @returns {Object} The stored memory with ID
   */
  async storeMemory(memory) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }
      
      // Generate ID if not provided
      if (!memory.id) {
        memory.id = uuidv4();
      }
      
      // Add timestamp if not provided
      if (!memory.timestamp) {
        memory.timestamp = new Date().toISOString();
      }
      
      // Enrich memory with additional metadata
      const enrichedMemory = await this.enrichmentService.enrichMemory(memory);
      
      // Create embedding for the memory content
      const embedding = await this.embeddingService.getEmbedding(enrichedMemory.content);
      
      // Store in vector database
      await this.vectorStore.upsert(this.collectionName, {
        id: enrichedMemory.id,
        vector: embedding,
        payload: enrichedMemory
      });
      
      // Explicitly check if knowledgeGraphService exists
      if (this.knowledgeGraphService) {
        console.log('Updating knowledge graph with memory:', enrichedMemory.id);
        await this.knowledgeGraphService.processMemory(enrichedMemory);
      } else {
        console.error('Knowledge graph service not available in memory service!');
      }
      
      console.log(`Memory stored: ${enrichedMemory.id}`);
      return enrichedMemory;
    } catch (error) {
      console.error('Error storing memory:', error);
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
      await this.vectorStore.delete(this.collectionName, {
        points: [id]
      });
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
    // Check cache first
    if (this.embeddingCache.has(text)) {
      return this.embeddingCache.get(text);
    }
    
    try {
      // Simple hash function to convert text to a number
      function simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
          const char = str.charCodeAt(i);
          hash = ((hash << 5) - hash) + char;
          hash = hash & hash; // Convert to 32bit integer
        }
        return hash;
      }
      
      // Generate a deterministic but simple embedding based on the text
      const tokens = text.toLowerCase().split(/\s+/);
      const embedding = new Array(384).fill(0);
      
      // Use token positions to influence the embedding
      tokens.forEach((token, i) => {
        const hashValue = simpleHash(token);
        const position = Math.abs(hashValue) % 384;
        embedding[position] += 1.0;
        
        // Add some influence from neighboring positions
        embedding[(position + 1) % 384] += 0.5;
        embedding[(position + 2) % 384] += 0.25;
      });
      
      // Normalize the embedding to unit length
      const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
      const normalizedEmbedding = embedding.map(val => val / magnitude);
      
      // Cache the result
      this.embeddingCache.set(text, normalizedEmbedding);
      
      return normalizedEmbedding;
    } catch (error) {
      console.error("Error generating embedding:", error);
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
    const patterns = await this.patternService.processContent(content, context);
    
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

  async searchMemories(query) {
    return this.memories.filter(m => 
      m.content.toLowerCase().includes(query.toLowerCase())
    );
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
}

export const memoryService = new MemoryService(); 