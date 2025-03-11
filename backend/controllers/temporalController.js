import { optimizedSearch } from '../vectorStore.js';
import { PatternService } from '../services/patternService.js';
import { validateTemporalQuery } from '../middleware/validators.js';

const patternService = new PatternService();

export const analyzeTemporalPatterns = async (req, res) => {
  const startTime = Date.now();
  const { days = 30, resolution = 'daily' } = req.query;
  
  try {
    const memories = await optimizedSearch('*', {
      filters: { timestamp: { gte: new Date(Date.now() - days * 86400000) }},
      limit: resolution === 'hourly' ? 5000 : 1000
    });

    const patterns = await patternService.detectTemporalPatterns(memories);
    
    res.json({
      success: true,
      patterns,
      metrics: {
        memoryCount: memories.length,
        processingTime: Date.now() - startTime
      }
    });
  } catch (error) {
    console.error('Temporal analysis failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze temporal patterns'
    });
  }
}; 