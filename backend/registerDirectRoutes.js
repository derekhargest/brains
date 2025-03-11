/**
 * Register direct routes for testing and debugging
 * @param {Express} app - Express app
 */
export function registerDirectRoutes(app) {
  // Ensure the app exists
  if (!app || !app.get) {
    console.error('Invalid app passed to registerDirectRoutes');
    return;
  }
  
  // Add a health check route
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });
  
  // Service check route
  app.get('/api/services', (req, res) => {
    const services = req.app.locals.services || {};
    const serviceNames = Object.keys(services);
    
    res.json({
      success: true, 
      serviceCount: serviceNames.length,
      services: serviceNames,
      details: serviceNames.reduce((acc, name) => {
        const service = services[name];
        acc[name] = {
          initialized: !!service.initialized,
          type: service.constructor.name
        };
        return acc;
      }, {})
    });
  });
  
  // Knowledge graph test route
  app.post('/api/test/graph', async (req, res) => {
    try {
      const { knowledgeGraphService } = req.app.locals.services || {};
      
      if (!knowledgeGraphService) {
        return res.status(500).json({
          success: false,
          error: 'Knowledge graph service not available'
        });
      }
      
      // Create test nodes
      const personNode = knowledgeGraphService.addNode('PERSON', 'John Doe', { test: true });
      const placeNode = knowledgeGraphService.addNode('PLACE', 'Test City', { test: true });
      
      // Create test edge
      const edge = knowledgeGraphService.addEdge(personNode, placeNode, 'VISITED');
      
      res.json({
        success: true,
        nodes: {
          count: knowledgeGraphService.nodes.size,
          person: personNode,
          place: placeNode
        },
        edges: {
          count: knowledgeGraphService.edges.size,
          visited: edge
        }
      });
    } catch (error) {
      console.error('Graph test error:', error);
      res.status(500).json({
        success: false,
        error: 'Graph test failed: ' + error.message
      });
    }
  });
  
  // Get graph stats
  app.get('/api/graph-stats', (req, res) => {
    try {
      const { knowledgeGraphService } = req.app.locals.services || {};
      
      if (!knowledgeGraphService) {
        return res.status(500).json({
          success: false,
          error: 'Knowledge graph service not available'
        });
      }
      
      res.json({
        success: true,
        stats: {
          nodeCount: knowledgeGraphService.nodes.size,
          edgeCount: knowledgeGraphService.edges.size
        }
      });
    } catch (error) {
      console.error('Error getting graph stats:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get graph stats: ' + error.message
      });
    }
  });
  
  console.log('✅ Direct routes registered successfully');
}

export default registerDirectRoutes; 