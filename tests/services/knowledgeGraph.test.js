import { KnowledgeGraph } from '../../backend/services/knowledgeGraph.js';

describe('KnowledgeGraph Reflection Integration', () => {
  const kg = new KnowledgeGraph();
  
  test('should store insights with proper relationships', async () => {
    const mockInsight = {
      type: 'ineffective_pattern',
      context: 'physics',
      confidence: 0.89
    };
    
    await kg.storeInsights([mockInsight]);
    
    const insightNode = kg.nodes.find(n => n.type === 'ReflectiveInsight');
    expect(insightNode.properties.confidence).toBe(0.89);
    
    const relationships = kg.relationships.filter(r => 
      r.type === 'INFORMED_BY' && r.from === insightNode.id
    );
    expect(relationships.length).toBeGreaterThan(0);
  });
}); 