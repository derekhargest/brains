// Convert from CommonJS to ES Modules
import { MemoryService } from '../../services/memoryService.js';
import { optimizedSearch } from '../../vectorStore.js';

const memoryService = new MemoryService();

export const getMemories = async (req, res) => {
  try {
    const { query, limit = 10, filters } = req.query;
    const memories = await optimizedSearch(query || '*', { 
      limit: parseInt(limit, 10),
      filters: filters ? JSON.parse(filters) : undefined
    });
    
    res.json({
      success: true,
      memories
    });
  } catch (error) {
    console.error('Error fetching memories:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve memories'
    });
  }
};

export const createMemory = async (req, res) => {
  try {
    const { content, metadata } = req.body;
    
    if (!content) {
      return res.status(400).json({
        success: false,
        error: 'Memory content is required'
      });
    }
    
    const result = await memoryService.storeMemory(content, metadata);
    
    res.status(201).json({
      success: true,
      memory: result
    });
  } catch (error) {
    console.error('Error creating memory:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create memory'
    });
  }
}; 