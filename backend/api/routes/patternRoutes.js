import express from 'express';
import { PatternService } from '../../services/patternService.js';

const router = express.Router();

// Initialize services
let patternService;
const initializeServices = async () => {
  try {
    patternService = new PatternService();
    await patternService.initialize();
    console.log('Pattern service initialized for pattern routes');
    return true;
  } catch (error) {
    console.error('Failed to initialize services for pattern routes:', error);
    return false;
  }
};

// Initialize services when this module is loaded
initializeServices();

// Middleware to ensure services are initialized
const ensureServicesInitialized = async (req, res, next) => {
  if (!patternService) {
    const initialized = await initializeServices();
    if (!initialized) {
      return res.status(500).json({ error: 'Pattern services not available' });
    }
  }
  next();
};

// Apply middleware to all routes
router.use(ensureServicesInitialized);

/**
 * @route GET /api/patterns
 * @description Find all patterns in memories
 */
router.get('/', async (req, res) => {
  try {
    const { limit, minCount } = req.query;
    
    const options = {
      limit: limit ? parseInt(limit) : 100,
      minCount: minCount ? parseInt(minCount) : 2
    };
    
    const patterns = await patternService.findAllPatterns(options);
    res.json(patterns);
  } catch (error) {
    console.error('Error finding patterns:', error);
    res.status(500).json({ error: 'Failed to find patterns' });
  }
});

/**
 * @route GET /api/patterns/topics
 * @description Find topic patterns in memories
 */
router.get('/topics', async (req, res) => {
  try {
    const { limit, minCount } = req.query;
    
    const options = {
      limit: limit ? parseInt(limit) : 100,
      minCount: minCount ? parseInt(minCount) : 2
    };
    
    const topicPatterns = await patternService.detectTopicPatterns(options);
    res.json(topicPatterns);
  } catch (error) {
    console.error('Error finding topic patterns:', error);
    res.status(500).json({ error: 'Failed to find topic patterns' });
  }
});

/**
 * @route GET /api/patterns/entities
 * @description Find entity co-occurrence patterns in memories
 */
router.get('/entities', async (req, res) => {
  try {
    const { limit, minCount } = req.query;
    
    const options = {
      limit: limit ? parseInt(limit) : 100,
      minCount: minCount ? parseInt(minCount) : 2
    };
    
    const entityCooccurrences = await patternService.detectEntityCooccurrences(options);
    res.json(entityCooccurrences);
  } catch (error) {
    console.error('Error finding entity co-occurrences:', error);
    res.status(500).json({ error: 'Failed to find entity co-occurrences' });
  }
});

/**
 * @route GET /api/patterns/temporal
 * @description Find temporal patterns in memories
 */
router.get('/temporal', async (req, res) => {
  try {
    const { limit } = req.query;
    
    const options = {
      limit: limit ? parseInt(limit) : 100
    };
    
    const temporalPatterns = await patternService.detectTemporalPatterns(options);
    res.json(temporalPatterns);
  } catch (error) {
    console.error('Error finding temporal patterns:', error);
    res.status(500).json({ error: 'Failed to find temporal patterns' });
  }
});

export default router; 