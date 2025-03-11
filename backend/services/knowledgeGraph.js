// Add to KnowledgeGraph class
async storeInsights(insights) {
  const insightNodes = insights.map(insight => ({
    type: 'ReflectiveInsight',
    properties: {
      insightType: insight.type,
      confidence: insight.confidence,
      derivationMethod: insight.source,
      firstObserved: new Date().toISOString()
    }
  }));
  
  await this.batchCreateNodes(insightNodes);
  
  // Link insights to relevant concepts
  for(const [index, insight] of insights.entries()) {
    const relatedConcepts = await this.findRelatedConcepts(
      insight.context, 
      3
    );
    
    for(const concept of relatedConcepts) {
      await this.createRelationship(
        insightNodes[index].id,
        concept.id,
        'INFORMED_BY'
      );
    }
  }
} 