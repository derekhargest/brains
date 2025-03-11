import express from 'express';
import { storeMemory, advancedSearch, getMemory, findSimilarMemories, searchMemories } from '../../vectorStore.js';
import logger from '../../utils/logger.js';

const router = express.Router();

// Get all memories
router.get('/', async (req, res) => {
  try {
    const memories = await advancedSearch('', { 
      limit: 100,
      includeMetadata: true
    });

    // Transform the results to match the same format as search
    const formattedMemories = memories.map(memory => ({
      content: memory.payload?.content,
      timestamp: memory.payload?.timestamp || new Date().toISOString(),
      metadata: {
        importance: memory.payload?.metadata?.importance || 0,
        ...(memory.payload?.metadata || {})
      }
    }));

    res.json(formattedMemories);
  } catch (error) {
    console.error('Error retrieving memories:', error);
    res.status(500).json({ error: error.message });
  }
});

// Store a new memory
router.post('/', async (req, res) => {
  try {
    const { content, metadata } = req.body;
    
    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }
    
    const memory = {
      id: `memory_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      content: content,
      metadata: metadata || {},
      timestamp: new Date().toISOString(),
      source: 'api'
    };
    
    // Add this debug log
    console.log('Storing memory:', JSON.stringify(memory, null, 2));
    
    const result = await storeMemory(memory);
    
    // Add this debug log
    console.log('Store result:', JSON.stringify(result, null, 2));
    
    res.json(result);
  } catch (error) {
    console.error('Error storing memory:', error);
    res.status(500).json({ error: error.message });
  }
});

// Search memories
router.get('/search', async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query) {
      return res.status(400).json({ error: 'Query parameter is required' });
    }
    
    const memories = await advancedSearch(query, { 
      limit: 10,
      includeMetadata: true,
      minScore: 0.3
    });

    // Filter and transform results
    const formattedMemories = memories
      .filter(memory => {
        const content = memory.payload?.content || '';
        return content.toLowerCase().includes(query.toLowerCase());
      })
      .map(memory => ({
        content: memory.payload?.content,
        timestamp: memory.payload?.timestamp || new Date().toISOString(),
        metadata: {
          importance: memory.payload?.metadata?.importance || 0,
          ...(memory.payload?.metadata || {})
        }
      }));
    
    res.json(formattedMemories);
  } catch (error) {
    console.error('Error searching memories:', error);
    res.status(500).json({ error: error.message });
  }
});

// Store memory route
router.post('/store', async (req, res) => {
  try {
    const { content, type = 'general', metadata = {} } = req.body;
    
    if (!content) {
      logger.warn('Memory', 'Attempted to store memory without content');
      return res.status(400).json({
        success: false,
        error: 'Memory content is required'
      });
    }
    
    logger.info('Memory', `Storing new memory: ${type}`);
    logger.debug('Memory', 'Memory content:', content);
    
    // Call your existing memory storage function
    const memoryId = await storeMemory(content, type, metadata);
    
    logger.info('Memory', `Successfully stored memory with ID: ${memoryId}`);
    
    res.status(201).json({
      success: true,
      id: memoryId,
      message: 'Memory stored successfully'
    });
  } catch (error) {
    logger.error('Memory', 'Failed to store memory', error);
    
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Retrieve memory route
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    logger.info('Memory', `Retrieving memory: ${id}`);
    
    // Call your existing memory retrieval function
    const memory = await getMemory(id);
    
    if (!memory) {
      logger.warn('Memory', `Memory not found: ${id}`);
      return res.status(404).json({
        success: false,
        error: 'Memory not found'
      });
    }
    
    logger.info('Memory', `Successfully retrieved memory: ${id}`);
    logger.debug('Memory', 'Memory data:', memory);
    
    res.json({
      success: true,
      memory
    });
  } catch (error) {
    logger.error('Memory', `Failed to retrieve memory: ${req.params.id}`, error);
    
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Search memories route
router.get('/search', async (req, res) => {
  try {
    const { query, limit = 10 } = req.query;
    
    logger.info('Memory', `Searching memories: "${query}"`);
    
    const memories = await searchMemories(query, limit);
    
    logger.info('Memory', `Found ${memories.length} memories matching "${query}"`);
    
    res.json({
      success: true,
      results: memories
    });
  } catch (error) {
    logger.error('Memory', `Failed to search memories`, error);
    
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Similar memories route
router.get('/similar/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 5 } = req.query;
    
    logger.info('Memory', `Finding memories similar to: ${id}`);
    
    const similarMemories = await findSimilarMemories(id, limit);
    
    logger.info('Memory', `Found ${similarMemories.length} similar memories`);
    
    res.json({
      success: true,
      results: similarMemories
    });
  } catch (error) {
    logger.error('Memory', `Failed to find similar memories`, error);
    
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router; 