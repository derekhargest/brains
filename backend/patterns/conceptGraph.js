/**
 * Concept Graph
 * Represents relationships between concepts found in patterns
 */

class ConceptGraph {
  constructor() {
    this.nodes = new Map(); // Map of concept -> { connections, frequency, ... }
    this.edges = new Map(); // Map of conceptA:conceptB -> { strength, occurrences, ... }
  }
  
  /**
   * Add concepts to the graph
   * @param {Array<string>} concepts - Array of concept strings
   * @param {string} patternId - ID of the pattern these concepts are from
   */
  addConcepts(concepts, patternId) {
    if (!concepts || !Array.isArray(concepts) || concepts.length === 0) return;
    
    // Add or update each concept node
    concepts.forEach(concept => {
      if (!concept) return;
      
      const key = concept.toLowerCase();
      
      if (!this.nodes.has(key)) {
        this.nodes.set(key, { 
          concept: key,
          frequency: 1,
          patterns: new Set([patternId]),
          lastSeen: Date.now()
        });
      } else {
        const node = this.nodes.get(key);
        node.frequency++;
        node.patterns.add(patternId);
        node.lastSeen = Date.now();
      }
      
      // Create edges between all concepts in this pattern
      concepts.forEach(otherConcept => {
        if (!otherConcept || concept === otherConcept) return;
        
        const otherKey = otherConcept.toLowerCase();
        const edgeKey = [key, otherKey].sort().join(':');
        
        if (!this.edges.has(edgeKey)) {
          this.edges.set(edgeKey, {
            source: key,
            target: otherKey,
            strength: 1,
            occurrences: 1,
            lastSeen: Date.now()
          });
        } else {
          const edge = this.edges.get(edgeKey);
          edge.occurrences++;
          edge.strength = Math.log(edge.occurrences + 1) / Math.log(2); // Log scale for strength
          edge.lastSeen = Date.now();
        }
      });
    });
  }
  
  /**
   * Get related concepts for a given concept
   * @param {string} concept - The concept to find relations for
   * @param {number} maxDepth - Maximum traversal depth
   * @returns {Array} Array of related concepts with strength
   */
  getRelatedConcepts(concept, maxDepth = 1) {
    if (!concept || !this.nodes.has(concept.toLowerCase())) {
      return [];
    }
    
    const key = concept.toLowerCase();
    const visited = new Set([key]);
    const result = [];
    
    // Get direct connections (depth 1)
    for (const [edgeKey, edge] of this.edges.entries()) {
      if (edge.source === key || edge.target === key) {
        const relatedConcept = edge.source === key ? edge.target : edge.source;
        result.push({
          concept: relatedConcept,
          strength: edge.strength,
          occurrences: edge.occurrences,
          depth: 1
        });
        
        if (maxDepth > 1) {
          visited.add(relatedConcept);
        }
      }
    }
    
    // If maxDepth > 1, get indirect connections using BFS
    if (maxDepth > 1) {
      const queue = result.map(r => ({ ...r, depth: 1 }));
      
      while (queue.length > 0) {
        const current = queue.shift();
        
        if (current.depth >= maxDepth) continue;
        
        for (const [edgeKey, edge] of this.edges.entries()) {
          if (edge.source === current.concept || edge.target === current.concept) {
            const nextConcept = edge.source === current.concept ? edge.target : edge.source;
            
            if (!visited.has(nextConcept)) {
              visited.add(nextConcept);
              
              const newRelationship = {
                concept: nextConcept,
                strength: edge.strength * 0.5, // Reduce strength for indirect connections
                occurrences: edge.occurrences,
                depth: current.depth + 1
              };
              
              result.push(newRelationship);
              queue.push(newRelationship);
            }
          }
        }
      }
    }
    
    // Sort by strength
    return result.sort((a, b) => b.strength - a.strength);
  }
  
  /**
   * Generate network visualization data from the graph
   * @returns {Object} Data suitable for visualization
   */
  generateNetworkData() {
    const nodes = [];
    const links = [];
    
    // Add nodes
    for (const [key, node] of this.nodes.entries()) {
      nodes.push({
        id: key,
        label: key,
        value: node.frequency,
        title: `${key} (${node.frequency} occurrences)` 
      });
    }
    
    // Add links
    for (const [key, edge] of this.edges.entries()) {
      links.push({
        id: key,
        from: edge.source,
        to: edge.target,
        value: edge.strength,
        title: `${edge.occurrences} co-occurrences`
      });
    }
    
    return { nodes, links };
  }
  
  /**
   * Find the most central concepts in the graph
   * @param {number} limit - Maximum number of concepts to return
   * @returns {Array} Array of central concepts
   */
  getCentralConcepts(limit = 10) {
    const conceptScores = new Map();
    
    // Calculate centrality scores
    for (const [key, node] of this.nodes.entries()) {
      // Start with the frequency as the base score
      const connections = this.getRelatedConcepts(key);
      const connectionScore = connections.reduce((sum, conn) => sum + conn.strength, 0);
      
      conceptScores.set(key, {
        concept: key,
        frequency: node.frequency,
        connectionCount: connections.length,
        connectionScore,
        // Combined score weights both frequency and connections
        score: (node.frequency * 0.4) + (connectionScore * 0.6),
        relatedConcepts: connections.map(c => c.concept)
      });
    }
    
    // Sort and limit
    return Array.from(conceptScores.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }
}

module.exports = ConceptGraph; 