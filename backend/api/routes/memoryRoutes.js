import express from 'express';
import { storeMemory, advancedSearch } from '../../vectorStore.js';

const router = express.Router();

// Get all memories
router.get('/', async (req, res) => {
  try {
    // Use a blank query to get all memories
    const memories = await advancedSearch('', { limit: 100 });
    res.json(memories);
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
    
    const result = await storeMemory(memory);
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
    
    const memories = await advancedSearch(query, { limit: 10 });
    res.json(memories);
  } catch (error) {
    console.error('Error searching memories:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router; 