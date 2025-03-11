import { KnowledgeGraphService } from '../../services/knowledgeGraphService.js';

export const getEntityConnections = async (req, res) => {
  try {
    const { entity, depth = 1 } = req.query;
    
    if (!entity) {
      return res.status(400).json({
        success: false,
        error: 'Entity name is required'
      });
    }
    
    const { knowledgeGraphService } = req.app.locals.services;
    
    if (!knowledgeGraphService) {
      return res.status(500).json({
        success: false,
        error: 'Knowledge graph service not available'
      });
    }
    
    const connections = await knowledgeGraphService.getConnectedNodes(
      entity, 
      parseInt(depth, 10) || 1
    );
    
    res.json({
      success: true,
      connections
    });
  } catch (error) {
    console.error('Error getting entity connections:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve entity connections'
    });
  }
};

export const searchEntities = async (req, res) => {
  try {
    const { query, types, limit = 10 } = req.query;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Search query is required'
      });
    }
    
    const { knowledgeGraphService } = req.app.locals.services;
    
    if (!knowledgeGraphService) {
      return res.status(500).json({
        success: false,
        error: 'Knowledge graph service not available'
      });
    }
    
    const typeArray = types ? types.split(',') : null;
    const results = await knowledgeGraphService.searchNodes(
      query, 
      typeArray, 
      parseInt(limit, 10)
    );
    
    res.json({
      success: true,
      results
    });
  } catch (error) {
    console.error('Error searching entities:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search entities'
    });
  }
};

export const getGraphVisualization = async (req, res) => {
  try {
    const { centralNode, maxNodes = 20 } = req.query;
    
    const { knowledgeGraphService } = req.app.locals.services;
    
    if (!knowledgeGraphService) {
      return res.status(500).json({
        success: false,
        error: 'Knowledge graph service not available'
      });
    }
    
    // Log current graph state
    console.log(`Visualization request. Graph has ${knowledgeGraphService.nodes.size} nodes and ${knowledgeGraphService.edges.size} edges`);
    
    // If graph is empty, return a clear message
    if (knowledgeGraphService.nodes.size === 0) {
      return res.json({
        success: true,
        graph: { nodes: [], edges: [] },
        message: 'Graph is empty. Try adding test data first.'
      });
    }
    
    const visualizationData = await knowledgeGraphService.getVisualizationData(
      centralNode,
      parseInt(maxNodes, 10)
    );
    
    res.json({
      success: true,
      graph: visualizationData
    });
  } catch (error) {
    console.error('Error generating graph visualization:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate graph visualization'
    });
  }
};

export const getGraphStatistics = async (req, res) => {
  try {
    const { knowledgeGraphService } = req.app.locals.services;
    
    if (!knowledgeGraphService) {
      return res.status(500).json({
        success: false,
        error: 'Knowledge graph service not available'
      });
    }
    
    const statistics = await knowledgeGraphService.getStatistics();
    
    res.json({
      success: true,
      statistics
    });
  } catch (error) {
    console.error('Error getting graph statistics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get graph statistics'
    });
  }
}; 