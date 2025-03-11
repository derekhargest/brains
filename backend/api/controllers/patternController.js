import { PatternService } from '../../services/patternService.js';

const patternService = new PatternService();

export const getPatterns = async (req, res) => {
  try {
    const patterns = await patternService.getAllPatterns();
    
    res.json({
      success: true,
      patterns
    });
  } catch (error) {
    console.error('Error retrieving patterns:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve patterns'
    });
  }
};

// Add other pattern-related controller methods here 