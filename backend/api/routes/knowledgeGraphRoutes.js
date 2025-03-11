import express from 'express';
import { KnowledgeGraphService } from '../../services/knowledgeGraphService.js';

const router = express.Router();

// Initialize services
let knowledgeGraphService;
const initializeServices = async () => {
  try {
    knowledgeGraphService = new KnowledgeGraphService();
    await knowledgeGraphService.initialize();
    console.log('Knowledge graph service initialized for routes');
    return true;
  } catch (error) {
    console.error('Failed to initialize services for knowledge graph routes:', error);
    return false;
  }
};

// Initialize services when this module is loaded
initializeServices();

// Middleware to ensure services are initialized
const ensureServicesInitialized = async (req, res, next) => {
  if (!knowledgeGraphService) {
    const initialized = await initializeServices();
    if (!initialized) {
      return res.status(500).json({ error: 'Knowledge graph services not available' });
    }
  }
  next();
};

// Apply middleware to all routes
router.use(ensureServicesInitialized);

/**
 * @route GET /api/knowledge-graph
 * @description Get the current knowledge graph
 */
router.get('/', async (req, res) => {
  try {
    const graph = knowledgeGraphService.exportGraph();
    res.json(graph);
  } catch (error) {
    console.error('Error exporting knowledge graph:', error);
    res.status(500).json({ error: 'Failed to export knowledge graph' });
  }
});

/**
 * @route POST /api/knowledge-graph/create
 * @description Create a knowledge graph from memories
 */
router.post('/create', async (req, res) => {
  try {
    const { limit, clearExisting, connectSimilarMemories, connectCooccurringEntities } = req.body;
    
    const options = {
      limit: limit || 100,
      clearExisting: clearExisting !== false,
      connectSimilarMemories: connectSimilarMemories !== false,
      connectCooccurringEntities: connectCooccurringEntities !== false
    };
    
    const graph = await knowledgeGraphService.createGraphFromMemories(options);
    res.json(graph);
  } catch (error) {
    console.error('Error creating knowledge graph:', error);
    res.status(500).json({ error: 'Failed to create knowledge graph' });
  }
});

/**
 * @route GET /api/knowledge-graph/nodes
 * @description Get all nodes in the knowledge graph
 */
router.get('/nodes', async (req, res) => {
  try {
    const graph = knowledgeGraphService.exportGraph();
    res.json(graph.nodes);
  } catch (error) {
    console.error('Error getting knowledge graph nodes:', error);
    res.status(500).json({ error: 'Failed to get knowledge graph nodes' });
  }
});

/**
 * @route GET /api/knowledge-graph/edges
 * @description Get all edges in the knowledge graph
 */
router.get('/edges', async (req, res) => {
  try {
    const graph = knowledgeGraphService.exportGraph();
    res.json(graph.edges);
  } catch (error) {
    console.error('Error getting knowledge graph edges:', error);
    res.status(500).json({ error: 'Failed to get knowledge graph edges' });
  }
});

/**
 * @route GET /api/knowledge-graph/paths
 * @description Find paths between nodes
 */
router.get('/paths', async (req, res) => {
  try {
    const { startId, endId, maxDepth } = req.query;
    
    if (!startId || !endId) {
      return res.status(400).json({ error: 'Start and end node IDs are required' });
    }
    
    const options = {
      maxDepth: maxDepth ? parseInt(maxDepth) : 3
    };
    
    const paths = knowledgeGraphService.findPaths(startId, endId, options);
    res.json(paths);
  } catch (error) {
    console.error('Error finding paths in knowledge graph:', error);
    res.status(500).json({ error: 'Failed to find paths in knowledge graph' });
  }
});

/**
 * @route POST /api/knowledge-graph/node
 * @description Add a node to the knowledge graph
 */
router.post('/node', async (req, res) => {
  try {
    const { id, type, name, content, metadata } = req.body;
    
    if (!type) {
      return res.status(400).json({ error: 'Node type is required' });
    }
    
    const node = knowledgeGraphService.addNode({
      id,
      type,
      name,
      content,
      metadata,
      createdAt: new Date().toISOString()
    });
    
    res.status(201).json(node);
  } catch (error) {
    console.error('Error adding node to knowledge graph:', error);
    res.status(500).json({ error: 'Failed to add node to knowledge graph' });
  }
});

/**
 * @route POST /api/knowledge-graph/edge
 * @description Add an edge to the knowledge graph
 */
router.post('/edge', async (req, res) => {
  try {
    const { sourceId, targetId, type, weight } = req.body;
    
    if (!sourceId || !targetId) {
      return res.status(400).json({ error: 'Source and target node IDs are required' });
    }
    
    const edge = knowledgeGraphService.addEdge(sourceId, targetId, {
      type: type || 'related',
      weight: weight || 1.0,
      createdAt: new Date().toISOString()
    });
    
    res.status(201).json(edge);
  } catch (error) {
    console.error('Error adding edge to knowledge graph:', error);
    res.status(500).json({ error: 'Failed to add edge to knowledge graph' });
  }
});

export default router; 