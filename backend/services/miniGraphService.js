/**
 * Simplified Knowledge Graph Service
 */
export class MiniGraphService {
  constructor() {
    this.nodes = new Map();
    this.edges = new Map();
    this.initialized = true;
    console.log('MiniGraphService constructor complete');
  }
  
  addNode(type, name, properties = {}) {
    console.log(`Adding node: ${type}:${name}`);
    
    if (!type || !name) {
      throw new Error('Missing type or name');
    }
    
    const key = `${type}:${name}`.toLowerCase();
    const node = {
      id: properties.id || `node-${Date.now()}`,
      type,
      name,
      properties
    };
    
    this.nodes.set(key, node);
    return node;
  }
  
  addEdge(fromNode, toNode, relationship, properties = {}) {
    console.log(`Adding edge: ${fromNode?.name} -> ${toNode?.name}`);
    
    if (!fromNode || !toNode || !relationship) {
      throw new Error('Missing fromNode, toNode, or relationship');
    }
    
    const fromKey = `${fromNode.type}:${fromNode.name}`.toLowerCase();
    const toKey = `${toNode.type}:${toNode.name}`.toLowerCase();
    
    if (!this.nodes.has(fromKey) || !this.nodes.has(toKey)) {
      throw new Error('Nodes do not exist');
    }
    
    const key = `${fromKey}--${relationship}-->${toKey}`;
    const edge = {
      id: properties.id || `edge-${Date.now()}`,
      from: fromKey,
      to: toKey,
      relationship,
      properties
    };
    
    this.edges.set(key, edge);
    return edge;
  }
  
  getStats() {
    return {
      nodeCount: this.nodes.size,
      edgeCount: this.edges.size
    };
  }
} 