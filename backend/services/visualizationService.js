/**
 * Visualization Service
 * 
 * Generates visualization data from memories, patterns, and insights
 */

class VisualizationService {
  constructor() {
    this.colorMap = {
      // Node types
      memory: '#4285F4',      // Google Blue
      tag: '#0F9D58',         // Google Green
      concept: '#F4B400',     // Google Yellow
      person: '#DB4437',      // Google Red
      place: '#4285F4',       // Google Blue
      entity: '#AA46BB',      // Purple
      
      // Pattern types
      repeated_word: '#E67C73', // Red
      time_reference: '#F6BF26', // Yellow
      topical: '#33B679',      // Green
      behavioral: '#8E24AA',   // Purple
      relational: '#039BE5',   // Blue
      central_concept: '#D81B60'  // Pink
    };
  }
  
  /**
   * Generates a network visualization from memories and patterns
   */
  async generateNetworkData(memories, patterns) {
    const nodes = [];
    const links = [];
    const nodeIds = new Set();
    
    // Add memory nodes
    memories.forEach(memory => {
      const id = `memory-${memory.id}`;
      
      if (!nodeIds.has(id)) {
        nodeIds.add(id);
        nodes.push({
          id,
          label: memory.content.substring(0, 30) + (memory.content.length > 30 ? '...' : ''),
          type: 'memory',
          color: this.colorMap.memory,
          size: 15,
          timestamp: memory.timestamp
        });
        
        // Connect memories to their tags
        if (memory.tags && Array.isArray(memory.tags)) {
          memory.tags.forEach(tag => {
            const tagId = `tag-${tag}`;
            
            // Add tag node if it doesn't exist
            if (!nodeIds.has(tagId)) {
              nodeIds.add(tagId);
              nodes.push({
                id: tagId,
                label: tag,
                type: 'tag',
                color: this.colorMap.tag,
                size: 10
              });
            }
            
            // Add link between memory and tag
            links.push({
              source: id,
              target: tagId,
              type: 'has_tag',
              weight: 1
            });
          });
        }
      }
    });
    
    // Process patterns
    patterns.forEach(pattern => {
      if (!pattern.type || !pattern.content) return;
      
      const patternId = `pattern-${pattern.id || Math.random().toString(36).substring(2, 10)}`;
      
      // Add pattern node if it doesn't exist
      if (!nodeIds.has(patternId)) {
        nodeIds.add(patternId);
        nodes.push({
          id: patternId,
          label: pattern.content,
          type: pattern.type,
          color: this.colorMap[pattern.type] || '#999',
          size: 8 + (pattern.confidence ? pattern.confidence * 5 : 0)
        });
        
        // Link pattern to source memory
        if (pattern.source) {
          // Find memory node that has this content
          memories.forEach(memory => {
            if (memory.content === pattern.source) {
              const memoryId = `memory-${memory.id}`;
              if (nodeIds.has(memoryId)) {
                links.push({
                  source: memoryId,
                  target: patternId,
                  type: 'has_pattern',
                  weight: pattern.confidence || 0.5
                });
              }
            }
          });
        }
        
        // Connect central concepts to related patterns
        if (pattern.type === 'central_concept') {
          patterns.forEach(otherPattern => {
            if (otherPattern.id !== pattern.id && 
                otherPattern.content && 
                otherPattern.content.toLowerCase().includes(pattern.content.toLowerCase())) {
              
              const otherId = `pattern-${otherPattern.id || Math.random().toString(36).substring(2, 10)}`;
              if (nodeIds.has(otherId)) {
                links.push({
                  source: patternId,
                  target: otherId,
                  type: 'related_pattern',
                  weight: 0.7
                });
              }
            }
          });
        }
      }
    });
    
    return { nodes, links };
  }
  
  /**
   * Generates timeline visualization data
   */
  async generateTimelineData(memories, insights = []) {
    const timeline = [];
    
    // Add memories to timeline
    memories.forEach(memory => {
      timeline.push({
        id: `memory-${memory.id}`,
        type: 'memory',
        content: memory.content,
        timestamp: memory.timestamp,
        tags: memory.tags || []
      });
    });
    
    // Add insights to timeline
    insights.forEach(insight => {
      if (insight.timestamp) {
        timeline.push({
          id: `insight-${insight.id}`,
          type: 'insight',
          content: insight.content,
          insightType: insight.type,
          timestamp: insight.timestamp
        });
      }
    });
    
    // Sort by timestamp
    return timeline.sort((a, b) => {
      return new Date(a.timestamp) - new Date(b.timestamp);
    });
  }
  
  /**
   * Generates concept map visualization data
   */
  async generateConceptMapData(insights, patterns) {
    // Extract central concepts from insights
    const centralConcepts = insights
      .filter(i => i.type === 'central_concept')
      .map(i => {
        const match = i.content.match(/\"([^\"]+)\"/);
        return {
          id: `concept-${i.id}`,
          label: match ? match[1] : i.content,
          type: 'concept',
          strength: i.confidence || 0.5,
          relatedConcepts: i.relatedConcepts || []
        };
      });
    
    const nodes = [];
    const links = [];
    const nodeMap = new Map();
    
    // Add central concepts as nodes
    centralConcepts.forEach(concept => {
      nodeMap.set(concept.label, concept.id);
      nodes.push({
        id: concept.id,
        label: concept.label,
        type: 'concept',
        color: this.colorMap.concept,
        size: 10 + (concept.strength * 10)
      });
    });
    
    // Add related concepts and create links
    centralConcepts.forEach(concept => {
      // Only proceed if the concept has related concepts
      if (concept.relatedConcepts && concept.relatedConcepts.length > 0) {
        concept.relatedConcepts.forEach(related => {
          if (!nodeMap.has(related)) {
            const relatedId = `concept-${related.replace(/\s+/g, '-')}`;
            nodeMap.set(related, relatedId);
            nodes.push({
              id: relatedId,
              label: related,
              type: 'concept',
              color: this.colorMap.concept,
              size: 7 // Smaller than central concepts
            });
          }
          
          // Add link between concepts
          links.push({
            source: concept.id,
            target: nodeMap.get(related),
            type: 'related_concept',
            weight: 0.5
          });
        });
      }
    });
    
    return { nodes, links };
  }
}

module.exports = VisualizationService; 