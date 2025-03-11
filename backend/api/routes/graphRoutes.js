import express from 'express';
import { 
  getEntityConnections,
  searchEntities,
  getGraphVisualization,
  getGraphStatistics
} from '../controllers/graphController.js';

const router = express.Router();

// Get connections for an entity
router.get('/connections/:entityId', async (req, res) => {
  try {
    const { knowledgeGraphService } = req.app.locals.services;
    const { entityId } = req.params;
    const depth = parseInt(req.query.depth) || 2;
    
    const connections = await knowledgeGraphService.getConnectedNodes(entityId, depth);
    res.json({ success: true, connections });
  } catch (error) {
    console.error('Error fetching connections:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Search entities in the graph
router.get('/search', searchEntities);

// Get graph visualization data
router.get('/visualization', getGraphVisualization);

// Get graph statistics
router.get('/statistics', getGraphStatistics);

// Add this route to graphRoutes.js
router.get('/debug', async (req, res) => {
  try {
    const { knowledgeGraphService } = req.app.locals.services;
    
    if (!knowledgeGraphService) {
      return res.status(500).json({
        success: false,
        error: 'Knowledge graph service not available'
      });
    }
    
    // Get raw graph data for debugging
    const nodeArray = Array.from(knowledgeGraphService.nodes.entries()).map(([key, value]) => ({
      key,
      ...value
    }));
    
    const edgeArray = Array.from(knowledgeGraphService.edges.entries()).map(([key, value]) => ({
      key,
      ...value
    }));
    
    res.json({
      success: true,
      debug: {
        nodeCount: knowledgeGraphService.nodes.size,
        edgeCount: knowledgeGraphService.edges.size,
        sampleNodes: nodeArray.slice(0, 10),
        sampleEdges: edgeArray.slice(0, 10)
      }
    });
  } catch (error) {
    console.error('Error debugging graph:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get graph debug info'
    });
  }
});

// Add this test route to directly add a test memory with entities
router.post('/test-memory', async (req, res) => {
  try {
    const { memoryService } = req.app.locals.services;
    
    if (!memoryService) {
      return res.status(500).json({
        success: false,
        error: 'Memory service not available'
      });
    }
    
    // Create a test memory with explicitly defined entities
    const testMemory = {
      content: "Had lunch with Sarah Johnson from Microsoft at Central Park yesterday.",
      entities: {
        people: ["Sarah Johnson"],
        organizations: ["Microsoft"],
        places: ["Central Park"]
      }
    };
    
    // Store the memory
    const storedMemory = await memoryService.storeMemory(testMemory);
    
    res.json({
      success: true,
      memory: storedMemory
    });
  } catch (error) {
    console.error('Error creating test memory:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create test memory'
    });
  }
});

// Add this test endpoint to directly create nodes and edges
router.post('/test-direct', async (req, res) => {
  try {
    const { knowledgeGraphService } = req.app.locals.services;
    
    if (!knowledgeGraphService) {
      return res.status(500).json({
        success: false,
        error: 'Knowledge graph service not available'
      });
    }
    
    // Create some test nodes and edges directly
    const personNode = knowledgeGraphService.addNode('PERSON', 'John Doe', { occupation: 'Developer' });
    const orgNode = knowledgeGraphService.addNode('ORGANIZATION', 'ACME Corp');
    const placeNode = knowledgeGraphService.addNode('PLACE', 'San Francisco');
    const memoryNode = knowledgeGraphService.addNode('MEMORY', 'test-memory-1', { 
      content: 'Met with John Doe from ACME Corp in San Francisco'
    });
    
    // Add some edges
    knowledgeGraphService.addEdge(personNode, orgNode, 'WORKS_AT');
    knowledgeGraphService.addEdge(personNode, memoryNode, 'MENTIONED_IN');
    knowledgeGraphService.addEdge(orgNode, memoryNode, 'MENTIONED_IN');
    knowledgeGraphService.addEdge(placeNode, memoryNode, 'MENTIONED_IN');
    knowledgeGraphService.addEdge(memoryNode, placeNode, 'HAPPENED_AT');
    
    // Get the count of nodes and edges
    const nodeCount = knowledgeGraphService.nodes.size;
    const edgeCount = knowledgeGraphService.edges.size;
    
    res.json({
      success: true,
      result: {
        message: 'Test data created successfully',
        nodeCount,
        edgeCount
      }
    });
  } catch (error) {
    console.error('Error creating test data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create test data'
    });
  }
});

// Add this very simple test endpoint
router.post('/test-simple', async (req, res) => {
  try {
    const { knowledgeGraphService } = req.app.locals.services;
    
    if (!knowledgeGraphService) {
      return res.status(500).json({
        success: false,
        error: 'Knowledge graph service not available'
      });
    }
    
    // Try to add just one node
    console.log('Knowledge graph service:', knowledgeGraphService);
    console.log('Knowledge graph nodes:', knowledgeGraphService.nodes);
    console.log('Knowledge graph addNode method:', knowledgeGraphService.addNode);
    
    const testNode = knowledgeGraphService.addNode('TEST', 'Test Node', { test: true });
    
    res.json({
      success: true,
      node: testNode,
      nodeCount: knowledgeGraphService.nodes.size
    });
  } catch (error) {
    console.error('Error in simple test:', error);
    res.status(500).json({
      success: false,
      error: 'Simple test failed: ' + error.message
    });
  }
});

// Add this diagnostic endpoint
router.get('/services-info', async (req, res) => {
  try {
    // Get all services from app.locals
    const services = req.app.locals.services;
    
    // Check global services
    const globalServices = global.services;
    
    // Build response
    const serviceInfo = {
      availableServices: Object.keys(services || {}),
      globalServicesAvailable: !!globalServices,
      globalService
    };
    
    res.json({
      success: true,
      service: serviceInfo
    });
  } catch (error) {
    console.error('Error checking service:', error);
    res.status(500).json({
      success: false,
      error: 'Service check failed: ' + error.message
    });
  }
});

// Add this route to test visualization data
router.get('/visualization-test', (req, res) => {
  try {
    const { knowledgeGraphService } = req.app.locals.services;
    
    if (!knowledgeGraphService) {
      return res.status(500).json({
        success: false,
        error: 'Knowledge graph service not available'
      });
    }
    
    // If the graph is empty, create some test data
    if (knowledgeGraphService.nodes.size === 0) {
      // Create some test nodes and edges directly
      const personNode = knowledgeGraphService.addNode('PERSON', 'John Doe', { occupation: 'Developer' });
      const orgNode = knowledgeGraphService.addNode('ORGANIZATION', 'ACME Corp');
      const placeNode = knowledgeGraphService.addNode('PLACE', 'San Francisco');
      const memoryNode = knowledgeGraphService.addNode('MEMORY', 'test-memory-1', { 
        content: 'Met with John Doe from ACME Corp in San Francisco'
      });
      
      // Add some edges
      knowledgeGraphService.addEdge(personNode, orgNode, 'WORKS_AT');
      knowledgeGraphService.addEdge(personNode, memoryNode, 'MENTIONED_IN');
      knowledgeGraphService.addEdge(orgNode, memoryNode, 'MENTIONED_IN');
      knowledgeGraphService.addEdge(placeNode, memoryNode, 'MENTIONED_IN');
      knowledgeGraphService.addEdge(memoryNode, placeNode, 'HAPPENED_AT');
    }
    
    // Generate a simple visualization output
    const nodes = Array.from(knowledgeGraphService.nodes.values()).map(node => ({
      id: node.id,
      label: node.name,
      group: node.type
    }));
    
    const edges = Array.from(knowledgeGraphService.edges.values()).map(edge => {
      const fromNode = Array.from(knowledgeGraphService.nodes.values())
        .find(n => `${n.type}:${n.name}`.toLowerCase() === edge.from);
      
      const toNode = Array.from(knowledgeGraphService.nodes.values())
        .find(n => `${n.type}:${n.name}`.toLowerCase() === edge.to);
      
      return {
        from: fromNode.id,
        to: toNode.id,
        label: edge.relationship
      };
    });
    
    res.json({
      success: true,
      graph: { nodes, edges },
      stats: {
        nodeCount: knowledgeGraphService.nodes.size,
        edgeCount: knowledgeGraphService.edges.size
      }
    });
  } catch (error) {
    console.error('Error generating test visualization:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate test visualization: ' + error.message
    });
  }
});

// Implement knowledge graph reasoning
class GraphReasoning {
  constructor(knowledgeGraphService) {
    this.kgService = knowledgeGraphService;
  }
  
  async findConnections(entityA, entityB, maxDepth = 3) {
    // Algorithm to find all paths between entities
    return this.breadthFirstSearch(entityA, entityB, maxDepth);
  }
  
  async inferNewRelationships() {
    // Pattern-based inference to discover implied relationships
    // For example: If A works_at B and B located_in C → A works_in C
    const rules = [
      { condition: ['PERSON', 'WORKS_AT', 'ORGANIZATION', 'LOCATED_IN', 'PLACE'], 
        inference: ['PERSON', 'WORKS_IN', 'PLACE'] }
    ];
    
    // Implementation
  }
}

// Add temporal attributes to graph entities
function addNode(type, name, properties = {}) {
  // Add temporal tracking
  const node = {
    type,
    name,
    // Add temporal attributes
    createdAt: properties.createdAt || new Date().toISOString(),
    validFrom: properties.validFrom,
    validUntil: properties.validUntil,
    confidence: properties.confidence || 1.0
  };
  return node;
}

// Timeline generation
function generateTimeline(entityName, type) {
  // Find all memories and events related to an entity
  // Sort chronologically and return as timeline
}

// Extend memory service to handle multiple modalities
class EnhancedMemoryService {
  constructor() {
    this.textVectorStore = new VectorStore('text');
    this.imageVectorStore = new VectorStore('image');
    this.audioVectorStore = new VectorStore('audio');
  }
  
  async storeMultiModalMemory(memory) {
    // Store text content
    await this.storeTextMemory(memory.text);
    
    // Process and store image content if present
    if (memory.images && memory.images.length) {
      await this.processImageContent(memory.images);
    }
    
    // Process audio if present
    if (memory.audio) {
      await this.processAudioContent(memory.audio);
    }
  }
  
  async searchCrossModal(query, options = {}) {
    // Search across all modalities and combine results
    const textResults = await this.textVectorStore.search(query);
    
    if (options.includeImages) {
      const imageResults = await this.imageVectorStore.search(query);
      // Merge results
    }
    
    return combinedResults;
  }
}

class InsightEngine {
  constructor(knowledgeGraph, memoryService) {
    this.knowledgeGraph = knowledgeGraph;
    this.memoryService = memoryService;
  }
  
  async generateInsights() {
    // 1. Pattern detection in temporal data
    const patterns = await this.detectTemporalPatterns();
    
    // 2. Entity relationship analysis
    const entityInsights = await this.analyzeEntityRelationships();
    
    // 3. Information gap identification
    const knowledgeGaps = await this.identifyKnowledgeGaps();
    
    return {
      patterns,
      entityInsights,
      knowledgeGaps
    };
  }
  
  async detectTemporalPatterns() {
    // Identify recurring events, frequency of interactions
    // Use time-series analysis on entity appearances
  }
  
  async analyzeEntityRelationships() {
    // Find central entities, relationship clusters
    // Calculate graph centrality metrics
  }
}

export default router; 

export class GraphRoutes {
  constructor() {
    this.nodes = new Map();
  }

  // Basic node addition
  addNode(type, name, properties = {}) {
    const id = `${type}-${Date.now()}`;
    const node = { id, type, name, properties };
    this.nodes.set(id, node);
    return node;
  }
}

// Test the class directly
const testGraph = new GraphRoutes();
console.log('Test node:', testGraph.addNode('TEST', 'TestNode')); 