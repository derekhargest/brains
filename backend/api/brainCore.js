import { MemoryService } from '../services/memoryService.js';
import { PatternService } from '../services/patternService.js';
import { KnowledgeGraphService } from '../services/knowledgeGraphService.js';
import { QdrantVectorStore } from '../vectorStore/qdrantStore.js';

/**
 * BrainCore - Main interface for the brains!!! cognitive system
 * Provides simplified access to the sophisticated underlying architecture
 */
class BrainCore {
  constructor() {
    this.initialized = false;
    this.memoryService = null;
    this.patternService = null;
    this.knowledgeGraphService = null;
    this.vectorStore = null;
  }

  /**
   * Initialize the brain core and all required services
   * @param {string} collectionName Optional name for the vector store collection
   */
  async initialize(collectionName = 'memories') {
    if (this.initialized) return;

    // Initialize vector store
    this.vectorStore = new QdrantVectorStore({
      baseUrl: process.env.QDRANT_URL || 'http://localhost:6333',
      collectionName: collectionName,
      vectorSize: 384
    });
    await this.vectorStore.initialize();

    // Initialize core services
    this.memoryService = new MemoryService(this.vectorStore);
    this.patternService = new PatternService();
    this.knowledgeGraphService = new KnowledgeGraphService();

    await Promise.all([
      this.memoryService.initialize(),
      this.patternService.initialize(),
      this.knowledgeGraphService.initialize()
    ]);

    this.initialized = true;
  }

  /**
   * Store a new memory with automatic pattern detection and knowledge graph updates
   */
  async storeMemory(content, metadata = {}) {
    if (!this.initialized) await this.initialize();

    // Store the memory
    const memory = await this.memoryService.storeMemory({
      content,
      metadata: {
        ...metadata,
        timestamp: new Date().toISOString()
      }
    });

    // Process patterns asynchronously
    this.processMemoryPatterns(memory);

    return memory;
  }

  /**
   * Retrieve a specific memory by ID
   */
  async retrieveMemory(id) {
    if (!this.initialized) await this.initialize();
    return this.memoryService.getMemory(id);
  }

  /**
   * Search memories using natural language or structured query
   */
  async searchMemories(query, options = {}) {
    if (!this.initialized) await this.initialize();
    return this.memoryService.searchMemories(query, options);
  }

  /**
   * Detect patterns in content without storing it as a memory
   */
  async detectPatterns(content) {
    if (!this.initialized) await this.initialize();
    return this.patternService.detectPatternsInContent(content);
  }

  /**
   * Get insights derived from stored memories and patterns
   */
  async getInsights(options = {}) {
    if (!this.initialized) await this.initialize();
    return this.patternService.generateInsights(options);
  }

  /**
   * Add a concept or relationship to the knowledge graph
   */
  async addToKnowledgeGraph(data) {
    if (!this.initialized) await this.initialize();
    return this.knowledgeGraphService.addNode(data);
  }

  /**
   * Find concepts related to the given one in the knowledge graph
   */
  async findRelatedConcepts(concept) {
    if (!this.initialized) await this.initialize();
    return this.knowledgeGraphService.findRelatedNodes(concept);
  }

  /**
   * Internal method to process patterns for a memory
   * This happens asynchronously to not block the main operations
   */
  async processMemoryPatterns(memory) {
    try {
      const detectedPatterns = await this.patternService.learnFromMemory(memory);
      if (detectedPatterns.length > 0) {
        await this.knowledgeGraphService.addRelationship(
          memory.metadata.source,
          'HAS_PATTERN',
          detectedPatterns[0].type
        );
      }
    } catch (error) {
      console.error('Error processing memory patterns:', error);
    }
  }
}

// Export both the class and a singleton instance
export { BrainCore };
const brainCore = new BrainCore();
export default brainCore; 