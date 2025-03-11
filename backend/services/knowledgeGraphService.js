/**
 * Knowledge Graph Service
 * Manages relationships between entities and memories
 */
import OpenAI from 'openai';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';

dotenv.config();

export class KnowledgeGraphService {
  constructor(options = {}) {
    this.options = options;
    this.initialized = false;
    
    // Initialize maps for storing graph data
    this.nodes = new Map();
    this.edges = new Map();
    
    // Set up OpenAI if API key exists
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      });
    }
    
    // Define relationship types
    this.relationshipTypes = [
      'KNOWS', 'WORKS_AT', 'LOCATED_IN', 'MEMBER_OF', 
      'PART_OF', 'RELATED_TO', 'MENTIONED_WITH', 'HAPPENED_AT',
      'MENTIONED_IN' // Make sure this is included
    ];
    
    console.log('KnowledgeGraphService constructor complete');
    console.log('- nodes map type:', typeof this.nodes);
    console.log('- nodes is Map:', this.nodes instanceof Map);
  }
  
  async initialize() {
    if (this.initialized) return true;
    
    try {
      // Additional initialization can go here
      
      this.initialized = true;
      console.log('KnowledgeGraphService initialized successfully');
      console.log('- nodes:', this.nodes);
      console.log('- edges:', this.edges);
      return true;
    } catch (error) {
      console.error('Error initializing KnowledgeGraphService:', error);
      return false;
    }
  }
  
  /**
   * Add a node to the knowledge graph
   */
  addNode(type, name, properties = {}) {
    console.log(`Adding node: type=${type}, name=${name}`);
    
    // Validation
    if (!type || !name) {
      console.error('Cannot add node: missing type or name');
      return null;
    }
    
    const id = properties.id || `${type.toLowerCase()}-${uuidv4()}`;
    const nodeKey = `${type}:${name}`.toLowerCase();
    
    // Check if node already exists
    if (!this.nodes.has(nodeKey)) {
      // Create the node object
      const node = {
        id,
        type,
        name,
        properties,
        createdAt: new Date().toISOString()
      };
      
      // Add to the map
      this.nodes.set(nodeKey, node);
      console.log(`Created new node: ${nodeKey}`);
    } else {
      console.log(`Node already exists: ${nodeKey}`);
    }
    
    return this.nodes.get(nodeKey);
  }
  
  /**
   * Add a relationship between two nodes
   */
  addEdge(fromNode, toNode, relationship, properties = {}) {
    console.log(`Adding edge: ${fromNode?.name || 'unknown'} --[${relationship}]--> ${toNode?.name || 'unknown'}`);
    
    // Validation
    if (!fromNode || !toNode || !relationship) {
      console.error('Cannot add edge: missing fromNode, toNode, or relationship');
      return null;
    }
    
    // Get the keys for the nodes
    const fromKey = `${fromNode.type}:${fromNode.name}`.toLowerCase();
    const toKey = `${toNode.type}:${toNode.name}`.toLowerCase();
    
    // Check if the nodes exist
    if (!this.nodes.has(fromKey)) {
      console.error(`Cannot add edge: fromNode ${fromKey} does not exist`);
      return null;
    }
    
    if (!this.nodes.has(toKey)) {
      console.error(`Cannot add edge: toNode ${toKey} does not exist`);
      return null;
    }
    
    // Create a unique ID for the edge
    const edgeId = properties.id || `${relationship.toLowerCase()}-${uuidv4()}`;
    
    // Create a unique key for the edge
    const edgeKey = `${fromKey}--${relationship}-->${toKey}`;
    
    // Check if the edge already exists
    if (!this.edges.has(edgeKey)) {
      // Create the edge object
      const edge = {
        id: edgeId,
        from: fromKey,
        to: toKey,
        relationship,
        properties,
        weight: properties.weight || 1,
        createdAt: new Date().toISOString()
      };
      
      // Add to the map
      this.edges.set(edgeKey, edge);
      console.log(`Created new edge: ${edgeKey}`);
    } else {
      // Update the weight of the existing edge
      const existingEdge = this.edges.get(edgeKey);
      existingEdge.weight += properties.weight || 0.1;
      console.log(`Updated existing edge: ${edgeKey}, new weight: ${existingEdge.weight}`);
    }
    
    return this.edges.get(edgeKey);
  }
  
  /**
   * Process memory and extract relationship connections to add to graph
   */
  async processMemory(memory) {
    console.log("Processing memory for knowledge graph:", JSON.stringify(memory, null, 2));
    
    if (!memory || !memory.content || !memory.entities) {
      console.warn('Cannot process memory: missing content or entities', memory);
      return { nodes: [], edges: [] };
    }
    
    try {
      const addedNodes = [];
      const addedEdges = [];
      
      // Add memory as a node
      const memoryNode = this.addNode('MEMORY', memory.id, {
        id: memory.id,
        content: memory.content,
        timestamp: memory.timestamp
      });
      addedNodes.push(memoryNode);
      
      // Add entity nodes and connect to memory
      if (memory.entities) {
        // Process people
        for (const person of memory.entities.people || []) {
          const personNode = this.addNode('PERSON', person);
          addedNodes.push(personNode);
          
          // Connect person to memory
          const edge = this.addEdge(
            personNode, 
            memoryNode, 
            'MENTIONED_IN', 
            { memoryId: memory.id }
          );
          addedEdges.push(edge);
        }
        
        // Process places
        for (const place of memory.entities.places || []) {
          const placeNode = this.addNode('PLACE', place);
          addedNodes.push(placeNode);
          
          // Connect place to memory
          const edge = this.addEdge(
            placeNode, 
            memoryNode, 
            'MENTIONED_IN', 
            { memoryId: memory.id }
          );
          addedEdges.push(edge);
          
          // Connect memory to place (happened at)
          const happenedAtEdge = this.addEdge(
            memoryNode,
            placeNode,
            'HAPPENED_AT'
          );
          addedEdges.push(happenedAtEdge);
        }
        
        // Process organizations
        for (const org of memory.entities.organizations || []) {
          const orgNode = this.addNode('ORGANIZATION', org);
          addedNodes.push(orgNode);
          
          // Connect org to memory
          const edge = this.addEdge(
            orgNode, 
            memoryNode, 
            'MENTIONED_IN', 
            { memoryId: memory.id }
          );
          addedEdges.push(edge);
        }
        
        // Connect people to organizations and places if they appear in same memory
        if (memory.entities.people.length > 0 && memory.entities.organizations.length > 0) {
          // Infer relationships like WORKS_AT
          await this.inferRelationships(memory, addedEdges);
        }
        
        // Connect entities that co-occur
        await this.connectCoOccurringEntities(memory, addedEdges);
      }
      
      // Log what was added
      console.log(`Added ${addedNodes.length} nodes and ${addedEdges.length} edges to the knowledge graph`);
      return { nodes: addedNodes, edges: addedEdges };
    } catch (error) {
      console.error('Error processing memory for knowledge graph:', error);
      return { nodes: [], edges: [] };
    }
  }
  
  /**
   * Infer relationships between entities using AI
   */
  async inferRelationships(memory, addedEdges) {
    if (!this.openai) return;
    
    try {
      // Only proceed if we have multiple entity types
      const hasMultipleEntityTypes = 
        (memory.entities.people.length > 0 && memory.entities.organizations.length > 0) ||
        (memory.entities.people.length > 0 && memory.entities.places.length > 0);
      
      if (!hasMultipleEntityTypes) return;
      
      const prompt = `
Text: "${memory.content}"

Based on the text above, identify relationships between the entities mentioned:
- People: ${memory.entities.people.join(', ')}
- Organizations: ${memory.entities.organizations.join(', ')}
- Places: ${memory.entities.places.join(', ')}

Return a JSON object with detected relationships in this format:
{
  "relationships": [
    {
      "from": "entity name",
      "to": "entity name",
      "type": "RELATIONSHIP_TYPE" (one of: KNOWS, WORKS_AT, LOCATED_IN, MEMBER_OF, PART_OF)
    }
  ]
}

Only include relationships that are directly stated or strongly implied in the text.
      `;
      
      const response = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: "You are an AI that extracts entity relationships from text." },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" }
      });
      
      const result = JSON.parse(response.choices[0].message.content);
      
      if (result.relationships && Array.isArray(result.relationships)) {
        for (const rel of result.relationships) {
          const fromNode = this.getNodeByName(rel.from);
          const toNode = this.getNodeByName(rel.to);
          
          if (fromNode && toNode) {
            const edge = this.addEdge(fromNode, toNode, rel.type);
            if (edge) addedEdges.push(edge);
          }
        }
      }
    } catch (error) {
      console.error('Error inferring relationships:', error);
    }
  }
  
  /**
   * Connect entities that co-occur in the same memory
   */
  async connectCoOccurringEntities(memory, addedEdges) {
    try {
      // Connect people who are mentioned together
      const people = memory.entities.people || [];
      for (let i = 0; i < people.length; i++) {
        for (let j = i + 1; j < people.length; j++) {
          const person1 = this.getNodeByName(people[i], 'PERSON');
          const person2 = this.getNodeByName(people[j], 'PERSON');
          
          if (person1 && person2) {
            // Create or strengthen relationship
            const existingEdge = this.getEdge(person1, person2, 'MENTIONED_WITH');
            
            if (existingEdge) {
              // Strengthen existing relationship
              existingEdge.properties.occurrences = (existingEdge.properties.occurrences || 1) + 1;
              existingEdge.weight += 0.1; // Increase weight for co-occurrence
            } else {
              // Create new relationship
              const edge = this.addEdge(
                person1, 
                person2, 
                'MENTIONED_WITH', 
                { occurrences: 1, memoryIds: [memory.id] }
              );
              if (edge) addedEdges.push(edge);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error connecting co-occurring entities:', error);
    }
  }
  
  /**
   * Get a node by its name and type
   */
  getNodeByName(name, type = null) {
    if (!name) return null;
    
    // Try to find the exact node
    if (type) {
      const key = `${type}:${name}`.toLowerCase();
      return this.nodes.get(key);
    }
    
    // Try different node types if specific type not provided
    const possibleTypes = ['PERSON', 'ORGANIZATION', 'PLACE', 'CONCEPT'];
    for (const t of possibleTypes) {
      const key = `${t}:${name}`.toLowerCase();
      const node = this.nodes.get(key);
      if (node) return node;
    }
    
    return null;
  }
  
  /**
   * Get an edge between two nodes with specific relationship
   */
  getEdge(fromNode, toNode, relationship) {
    const fromKey = `${fromNode.type}:${fromNode.name}`.toLowerCase();
    const toKey = `${toNode.type}:${toNode.name}`.toLowerCase();
    const edgeKey = `${fromKey}|${relationship}|${toKey}`;
    
    return this.edges.get(edgeKey);
  }
  
  /**
   * Get nodes connected to a specific entity
   * @param {string} entityName - Name of the entity to find connections for
   * @param {number} depth - How many levels of connections to traverse
   * @returns {Object} - Connected nodes and edges
   */
  async getConnectedNodes(entityName, depth = 1) {
    const connectedNodes = new Set();
    const connectedEdges = new Set();
    const startNodes = [];
    
    // First find the node(s) by name (case insensitive)
    const lowerName = entityName.toLowerCase();
    
    for (const [nodeKey, node] of this.nodes.entries()) {
      if (nodeKey.toLowerCase().includes(`:${lowerName}`)) {
        startNodes.push(nodeKey);
        connectedNodes.add(nodeKey);
      }
    }
    
    if (startNodes.length === 0) {
      console.warn(`No nodes found with name: ${entityName}`);
      return { nodes: [], edges: [] };
    }
    
    // BFS to find connected nodes up to depth levels
    const queue = startNodes.map(nodeKey => ({ nodeKey, depth: 0 }));
    
    while (queue.length > 0) {
      const { nodeKey, depth: currentDepth } = queue.shift();
      
      // If we've reached max depth, don't explore further
      if (currentDepth >= depth) continue;
      
      // Find all edges connected to this node
      for (const [edgeKey, edge] of this.edges.entries()) {
        if (edge.from === nodeKey || edge.to === nodeKey) {
          // Add the edge
          connectedEdges.add(edgeKey);
          
          // Add the connected node
          const connectedNodeKey = edge.from === nodeKey ? edge.to : edge.from;
          
          if (!connectedNodes.has(connectedNodeKey)) {
            connectedNodes.add(connectedNodeKey);
            
            // Enqueue for further exploration if not at max depth
            if (currentDepth < depth - 1) {
              queue.push({ nodeKey: connectedNodeKey, depth: currentDepth + 1 });
            }
          }
        }
      }
    }
    
    // Convert node and edge keys to actual objects
    const nodes = Array.from(connectedNodes)
      .map(nodeKey => this.nodes.get(nodeKey))
      .filter(Boolean);
      
    const edges = Array.from(connectedEdges)
      .map(edgeKey => this.edges.get(edgeKey))
      .filter(Boolean);
    
    return { 
      nodes, 
      edges 
    };
  }
  
  /**
   * Search for nodes in the knowledge graph
   */
  searchNodes(query, nodeTypes = null, limit = 10) {
    const results = [];
    const lowerQuery = query.toLowerCase();
    
    for (const node of this.nodes.values()) {
      // Filter by type if specified
      if (nodeTypes && !nodeTypes.includes(node.type)) {
        continue;
      }
      
      // Simple substring match in name
      if (node.name.toLowerCase().includes(lowerQuery)) {
        results.push(node);
        
        if (results.length >= limit) {
          break;
        }
      }
    }
    
    return results;
  }
  
  /**
   * Get visualization data for the graph
   */
  getVisualizationData(centralNode = null, maxNodes = 20) {
    console.log(`Getting visualization data. Central node: ${centralNode}, Max nodes: ${maxNodes}`);
    console.log(`Current graph has ${this.nodes.size} nodes and ${this.edges.size} edges`);
    
    // If the graph is empty, return empty data
    if (this.nodes.size === 0) {
      console.warn('Graph is empty, no visualization data to return');
      return { nodes: [], edges: [] };
    }
    
    let nodesToInclude = [];
    let edgesToInclude = [];
    
    // If a central node is specified, get its connections
    if (centralNode) {
      const connections = this.getConnectedNodesFromName(centralNode, 2);
      if (connections.nodes.length > 0) {
        nodesToInclude = connections.nodes;
        edgesToInclude = connections.edges;
      }
    } 
    // Otherwise, get the most connected nodes
    else {
      // Count connections for each node
      const nodeConnections = {};
      for (const [nodeKey, node] of this.nodes.entries()) {
        nodeConnections[nodeKey] = 0;
      }
      
      for (const [edgeKey, edge] of this.edges.entries()) {
        if (nodeConnections[edge.from] !== undefined) {
          nodeConnections[edge.from] += 1;
        }
        if (nodeConnections[edge.to] !== undefined) {
          nodeConnections[edge.to] += 1;
        }
      }
      
      // Sort by number of connections and take the top nodes
      const sortedNodes = Object.entries(nodeConnections)
        .sort((a, b) => b[1] - a[1])
        .slice(0, maxNodes)
        .map(([key]) => this.nodes.get(key));
      
      nodesToInclude = sortedNodes;
      
      // Get all edges between these nodes
      for (const [edgeKey, edge] of this.edges.entries()) {
        const fromNode = sortedNodes.find(node => 
          `${node.type}:${node.name}`.toLowerCase() === edge.from
        );
        
        const toNode = sortedNodes.find(node => 
          `${node.type}:${node.name}`.toLowerCase() === edge.to
        );
        
        if (fromNode && toNode) {
          edgesToInclude.push(edge);
        }
      }
    }
    
    console.log(`Returning ${nodesToInclude.length} nodes and ${edgesToInclude.length} edges for visualization`);
    
    // Format for visualization
    return {
      nodes: nodesToInclude.map(node => ({
        id: node.id,
        label: node.name,
        type: node.type,
        properties: node.properties
      })),
      edges: edgesToInclude.map(edge => {
        const fromNode = this.nodes.get(edge.from);
        const toNode = this.nodes.get(edge.to);
        
        return {
          id: edge.id,
          from: fromNode.id,
          to: toNode.id,
          label: edge.relationship,
          weight: edge.weight
        };
      })
    };
  }
  
  /**
   * Helper method to get connected nodes by name
   */
  getConnectedNodesFromName(entityName, depth = 1) {
    // First try to find any node with this name
    const matchingNodes = [];
    const lowerName = entityName.toLowerCase();
    
    for (const [nodeKey, node] of this.nodes.entries()) {
      if (node.name.toLowerCase() === lowerName) {
        matchingNodes.push(nodeKey);
      }
    }
    
    if (matchingNodes.length === 0) {
      console.warn(`No nodes found with name: ${entityName}`);
      return { nodes: [], edges: [] };
    }
    
    // Use the first matching node to get connections
    return this.getConnectedNodes(matchingNodes[0], depth);
  }
  
  /**
   * Get statistics about the knowledge graph
   */
  getStatistics() {
    // Count node types
    const nodeTypeCounts = {};
    for (const node of this.nodes.values()) {
      nodeTypeCounts[node.type] = (nodeTypeCounts[node.type] || 0) + 1;
    }
    
    // Count relationship types
    const relationshipCounts = {};
    for (const edge of this.edges.values()) {
      relationshipCounts[edge.relationship] = (relationshipCounts[edge.relationship] || 0) + 1;
    }
    
    // Find most connected entities
    const nodeConnections = {};
    for (const node of this.nodes.values()) {
      const key = `${node.type}:${node.name}`.toLowerCase();
      nodeConnections[key] = 0;
    }
    
    for (const edge of this.edges.values()) {
      nodeConnections[edge.from] = (nodeConnections[edge.from] || 0) + 1;
      nodeConnections[edge.to] = (nodeConnections[edge.to] || 0) + 1;
    }
    
    // Sort to find most connected
    const mostConnected = Object.entries(nodeConnections)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([key, count]) => {
        const node = this.nodes.get(key);
        return {
          name: node.name,
          type: node.type,
          connections: count
        };
      });
    
    return {
      totalNodes: this.nodes.size,
      totalEdges: this.edges.size,
      nodeTypeCounts,
      relationshipCounts,
      mostConnected
    };
  }

  async findCrossConnections(memoryId, depth = 2) {
    const connections = new Map();
    
    async function traverse(nodeId, currentDepth) {
      if (currentDepth > depth) return;
      
      const relations = await this.getNodeRelations(nodeId);
      for (const { target, type } of relations) {
        const key = `${nodeId}-${target}`;
        if (!connections.has(key)) {
          connections.set(key, { source: nodeId, target, type });
          await traverse(target, currentDepth + 1);
        }
      }
    }
    
    await traverse(memoryId, 0);
    return Array.from(connections.values());
  }

  async analyzeCluster(memoryIds) {
    const clusterMemories = await Promise.all(
      memoryIds.map(id => this.getMemory(id))
    );
    
    return {
      commonEntities: this.findCommonEntities(clusterMemories),
      temporalPatterns: this.findTemporalPatterns(clusterMemories),
      semanticThemes: this.identifySemanticThemes(clusterMemories)
    };
  }
}

export default KnowledgeGraphService; 