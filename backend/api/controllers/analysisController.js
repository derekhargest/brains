// Create a new controller for text analysis

export const analyzeText = async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({
        success: false,
        error: 'No text provided for analysis'
      });
    }
    
    // Get services from app.locals
    const { enrichmentService } = req.app.locals.services;
    
    if (!enrichmentService) {
      return res.status(500).json({
        success: false,
        error: 'Enrichment service not available'
      });
    }
    
    // Create a temporary memory object
    const tempMemory = {
      id: 'temp-' + Date.now(),
      content: text,
      timestamp: new Date().toISOString(),
      source: 'analysis'
    };
    
    // Analyze the text
    const analysis = await enrichmentService.enrichMemory(tempMemory);
    
    // Return the analysis results
    res.json({
      success: true,
      analysis: {
        entities: analysis.entities,
        tags: analysis.tags,
        sentiment: analysis.sentiment,
        metadata: analysis.metadata
      }
    });
  } catch (error) {
    console.error('Error analyzing text:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze text'
    });
  }
}; 