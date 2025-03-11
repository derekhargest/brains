import express from 'express';

const router = express.Router();

// Simple diagnostic route
router.get('/health', (req, res) => {
  res.json({ 
    status: 'Graph routes working', 
    timestamp: new Date().toISOString() 
  });
});

// Debug endpoint
router.get('/debug', (req, res) => {
  try {
    const { knowledgeGraphService } = req.app.locals.services || {};
    
    if (!knowledgeGraphService) {
      return res.status(500).json({
        success: false,
        error: 'Knowledge graph service not available'
      });
    }
    
    // Get graph data for debugging
    const nodeCount = knowledgeGraphService.nodes?.size || 0;
    const edgeCount = knowledgeGraphService.edges?.size || 0;
    
    res.json({
      success: true,
      debug: {
        nodeCount,
        edgeCount,
        serviceInitialized: knowledgeGraphService.initialized || false
      }
    });
  } catch (error) {
    console.error('Error debugging graph:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get graph debug info: ' + error.message
    });
  }
});

// Export the router
export default router; 