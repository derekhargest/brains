import express from 'express';
import { PatternService } from '../../services/patternService.js';
import { getPatterns } from '../controllers/patternController.js';

const router = express.Router();
const patternService = new PatternService();

// Define routes
router.get('/', async (req, res) => {
  try {
    const patterns = await patternService.getAllPatterns();
    res.json({ success: true, patterns });
  } catch (error) {
    console.error('Error getting patterns:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve patterns'
    });
  }
});

// Add other pattern-related routes
router.get('/insights', async (req, res) => {
  try {
    const insights = await patternService.getPatternInsights();
    res.json({ success: true, insights });
  } catch (error) {
    console.error('Error getting pattern insights:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve pattern insights'
    });
  }
});

// Get patterns by type
router.get('/type/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const patterns = await patternService.getPatternsByType(type);
    res.json(patterns);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get visualization data
router.get('/visualization/network', async (req, res) => {
  try {
    // Default network data if real data isn't available yet
    const defaultNetwork = {
      nodes: [
        { id: 'memory', label: 'Memory', size: 30 },
        { id: 'pattern', label: 'Pattern', size: 25 },
        { id: 'insight', label: 'Insight', size: 20 }
      ],
      edges: [
        { from: 'memory', to: 'pattern', value: 5 },
        { from: 'pattern', to: 'insight', value: 3 }
      ]
    };
    
    // Try to get real data, fall back to default
    try {
      const networkData = await patternService.generateNetworkVisualization();
      res.json(networkData);
    } catch (error) {
      console.warn('Using fallback network data:', error.message);
      res.json(defaultNetwork);
    }
  } catch (error) {
    console.error('Error generating network visualization:', error);
    res.status(500).json({ error: 'Failed to generate visualization' });
  }
});

router.get('/visualization/timeline', async (req, res) => {
  try {
    const timelineData = await patternService.getTimelineVisualizationData();
    res.json(timelineData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router; 