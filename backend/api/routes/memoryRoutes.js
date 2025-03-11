import express from 'express';
import { MemoryService } from '../../services/memoryService.js';
import { QdrantVectorStore } from '../../vectorStore/qdrantStore.js';

const router = express.Router();

// Initialize services
let memoryService;
const initializeServices = async () => {
  try {
    const vectorStore = new QdrantVectorStore({
      baseUrl: process.env.QDRANT_URL || 'http://localhost:6333',
      collectionName: 'memories',
      vectorSize: 384  // Keep consistent with existing collection
    });
    
    await vectorStore.initialize();
    console.log('Vector store initialized for memory routes');
    
    memoryService = new MemoryService(vectorStore);
    await memoryService.initialize();
    console.log('Memory service initialized for memory routes');
    
    return true;
  } catch (error) {
    console.error('Failed to initialize services for memory routes:', error);
    return false;
  }
};

// Initialize services when this module is loaded
initializeServices();

// Middleware to ensure services are initialized
const ensureServicesInitialized = async (req, res, next) => {
  if (!memoryService) {
    const initialized = await initializeServices();
    if (!initialized) {
      return res.status(500).json({ error: 'Memory services not available' });
    }
  }
  next();
};

// Apply middleware to all routes
router.use(ensureServicesInitialized);

/**
 * @route POST /api/memories
 * @description Store a new memory
 */
router.post('/', async (req, res) => {
  try {
    const { content, metadata } = req.body;
    
    if (!content) {
      return res.status(400).json({ error: 'Memory content is required' });
    }
    
    const memory = await memoryService.storeMemory({ content, metadata });
    res.status(201).json(memory);
  } catch (error) {
    console.error('Error storing memory:', error);
    res.status(500).json({ error: 'Failed to store memory' });
  }
});

/**
 * @route GET /api/memories/:id
 * @description Retrieve a specific memory by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const memory = await memoryService.getMemory(req.params.id);
    
    if (!memory) {
      return res.status(404).json({ error: 'Memory not found' });
    }
    
    res.json(memory);
  } catch (error) {
    console.error('Error retrieving memory:', error);
    
    if (error.message.includes('not found')) {
      return res.status(404).json({ error: 'Memory not found' });
    }
    
    res.status(500).json({ error: 'Failed to retrieve memory' });
  }
});

/**
 * @route PUT /api/memories/:id
 * @description Update a memory
 */
router.put('/:id', async (req, res) => {
  try {
    const { content, metadata } = req.body;
    
    if (!content && !metadata) {
      return res.status(400).json({ error: 'Nothing to update' });
    }
    
    const updatedMemory = await memoryService.updateMemory(req.params.id, { content, metadata });
    res.json(updatedMemory);
  } catch (error) {
    console.error('Error updating memory:', error);
    
    if (error.message.includes('not found')) {
      return res.status(404).json({ error: 'Memory not found' });
    }
    
    res.status(500).json({ error: 'Failed to update memory' });
  }
});

/**
 * @route DELETE /api/memories/:id
 * @description Delete a memory
 */
router.delete('/:id', async (req, res) => {
  try {
    await memoryService.deleteMemory(req.params.id);
    res.json({ success: true, message: 'Memory deleted successfully' });
  } catch (error) {
    console.error('Error deleting memory:', error);
    
    if (error.message.includes('not found')) {
      return res.status(404).json({ error: 'Memory not found' });
    }
    
    res.status(500).json({ error: 'Failed to delete memory' });
  }
});

/**
 * @route GET /api/memories
 * @description Search memories with optional query and filters
 */
router.get('/', async (req, res) => {
  try {
    const { query, type, source, topic, importance, limit } = req.query;
    
    // Build filters from query parameters
    const filters = {};
    if (type) filters.type = type;
    if (source) filters.source = source;
    if (topic) filters.topic = topic;
    if (importance) filters.importance = parseFloat(importance);
    
    // Set options
    const options = {
      filters: Object.keys(filters).length > 0 ? filters : undefined,
      limit: limit ? parseInt(limit) : undefined
    };
    
    const memories = await memoryService.searchMemories(query || "", options);
    res.json(memories);
  } catch (error) {
    console.error('Error searching memories:', error);
    res.status(500).json({ error: 'Failed to search memories' });
  }
});

/**
 * @route POST /api/memories/query
 * @description Advanced query endpoint with full options
 */
router.post('/query', async (req, res) => {
  try {
    const { query, filters, limit, includeVector } = req.body;
    
    const options = {
      filters,
      limit: limit || 10,
      includeVector: includeVector || false
    };
    
    const memories = await memoryService.searchMemories(query || "", options);
    res.json(memories);
  } catch (error) {
    console.error('Error querying memories:', error);
    res.status(500).json({ error: 'Failed to query memories' });
  }
});

/**
 * @route GET /api/memories/similar/:id
 * @description Find memories similar to a specific memory
 */
router.get('/similar/:id', async (req, res) => {
  try {
    const { limit } = req.query;
    
    const options = {
      limit: limit ? parseInt(limit) : 5
    };
    
    const memory = await memoryService.getMemory(req.params.id);
    
    if (!memory) {
      return res.status(404).json({ error: 'Memory not found' });
    }
    
    const similarMemories = await memoryService.findSimilarMemories(memory, options);
    res.json(similarMemories);
  } catch (error) {
    console.error('Error finding similar memories:', error);
    
    if (error.message.includes('not found')) {
      return res.status(404).json({ error: 'Memory not found' });
    }
    
    res.status(500).json({ error: 'Failed to find similar memories' });
  }
});

export default router; 