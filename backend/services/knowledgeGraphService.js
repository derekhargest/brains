/**
 * Knowledge Graph Service
 * Manages relationships between entities and memories
 */
import OpenAI from 'openai';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
import { MemoryService } from './memoryService.js';
import { QdrantVectorStore } from '../vectorStore/qdrantStore.js';
import { KnowledgeGraph } from './knowledgeGraph.js';

dotenv.config();

export class KnowledgeGraphService {
  constructor() {
    this.graph = null;
    this.initialized = false;
    this.memoryService = null;
    this.nodes = new Map();
    this.edges = new Map();
    console.log('KnowledgeGraphService constructor complete');
    console.log('- nodes map type:', typeof this.nodes);
    console.log('- nodes is Map:', this.nodes instanceof Map);
  }
  
  /**
   * Initialize the knowledge graph service
   */
  async initialize() {
    this.graph = new KnowledgeGraph();
    return this.graph.initialize();
  }
  
  /**
   * Add a node to the knowledge graph
   * @param {Object} data - Node data
   * @returns {boolean} Success indicator
   */
  async addNode(data) {
    try {
      await this.graph.createNode(data);
      return true;
    } catch (error) {
      console.error('Error adding node to knowledge graph:', error);
      return false;
    }
  }
  
  /**
   * Add a relationship between nodes
   * @param {string} fromId - Source node ID
   * @param {string} toId - Target node ID
   * @param {string} type - Relationship type
   * @returns {boolean} Success indicator
   */
  async addRelationship(fromId, toId, type) {
    try {
      await this.graph.createRelationship(fromId, toId, type);
      return true;
    } catch (error) {
      console.error('Error adding relationship to knowledge graph:', error);
      return false;
    }
  }
  
  /**
   * Find nodes related to a concept
   * @param {string} concept - Concept to find related nodes for
   * @returns {Array} Related nodes
   */
  async findRelatedNodes(concept) {
    try {
      return await this.graph.findRelatedConcepts(concept);
    } catch (error) {
      console.error('Error finding related nodes:', error);
      return [];
    }
  }
  
  /**
   * Integrate patterns into the knowledge graph
   * @param {Array} patterns - Patterns to integrate
   * @param {string} sourceId - ID of the source (e.g., memory ID)
   * @returns {boolean} Success indicator
   */
  async integratePatterns(patterns, sourceId) {
    try {
      for (const pattern of patterns) {
        const node = await this.graph.createNode({
          type: 'Pattern',
          properties: {
            patternType: pattern.type,
            content: pattern.content,
            confidence: pattern.confidence,
            discovered: new Date().toISOString()
          }
        });

        if (sourceId) {
          await this.graph.createRelationship(node.id, sourceId, 'DERIVED_FROM');
        }
      }
      return true;
    } catch (error) {
      console.error('Error integrating patterns:', error);
      return false;
    }
  }
  
  /**
   * Store insights from reflective learning
   * @param {Array} insights - Insights to store
   * @returns {boolean} Success indicator
   */
  async storeInsights(insights) {
    try {
      await this.graph.storeInsights(insights);
      return true;
    } catch (error) {
      console.error('Error storing insights:', error);
      return false;
    }
  }
  
  /**
   * Get a node from the knowledge graph
   * @param {string} id - Node ID
   * @returns {Object} - Node
   */
  getNode(id) {
    return this.nodes.get(id);
  }
  
  /**
   * Add an edge between nodes
   * @param {string} sourceId - Source node ID
   * @param {string} targetId - Target node ID
   * @param {Object} properties - Edge properties
   * @returns {Object} - Added edge
   */
  addEdge(sourceId, targetId, properties = {}) {
    const edgeId = `${sourceId}::${targetId}`;
    
    if (!this.nodes.has(sourceId)) {
      throw new Error(`Source node ${sourceId} not found`);
    }
    
    if (!this.nodes.has(targetId)) {
      throw new Error(`Target node ${targetId} not found`);
    }
    
    const edge = {
      id: edgeId,
      source: sourceId,
      target: targetId,
      type: properties.type || 'related',
      weight: properties.weight || 1.0,
      createdAt: properties.createdAt || new Date().toISOString(),
      ...properties
    };
    
    this.edges.set(edgeId, edge);
    return edge;
  }
  
  /**
   * Get an edge from the knowledge graph
   * @param {string} sourceId - Source node ID
   * @param {string} targetId - Target node ID
   * @returns {Object} - Edge
   */
  getEdge(sourceId, targetId) {
    const edgeId = `${sourceId}::${targetId}`;
    return this.edges.get(edgeId);
  }
  
  /**
   * Get all edges connected to a node
   * @param {string} nodeId - Node ID
   * @returns {Array} - Array of edges
   */
  getNodeEdges(nodeId) {
    const edges = [];
    
    for (const edge of this.edges.values()) {
      if (edge.source === nodeId || edge.target === nodeId) {
        edges.push(edge);
      }
    }
    
    return edges;
  }
  
  /**
   * Create a knowledge graph from memories
   * @param {Object} options - Options for graph creation
   * @returns {Object} - Created knowledge graph
   */
  async createGraphFromMemories(options = {}) {
    if (!this.initialized) {
      await this.initialize();
    }
    
    try {
      // Clear existing graph if requested
      if (options.clearExisting) {
        this.nodes.clear();
        this.edges.clear();
      }
      
      // Get memories
      const memories = await this.memoryService.searchMemories("", {
        limit: options.limit || 100,
        ...options
      });
      
      // Create nodes for memories
      const memoryNodes = memories.map(memory => {
        return this.addNode({
          id: `memory_${memory.id}`,
          type: 'memory',
          content: memory.content,
          metadata: memory.metadata || {},
          createdAt: memory.timestamp || new Date().toISOString()
        });
      });
      
      // Create nodes for entities and topics
      const entityNodes = new Map();
      const topicNodes = new Map();
      
      memories.forEach(memory => {
        // Process entities
        if (memory.metadata && memory.metadata.entities) {
          memory.metadata.entities.forEach(entity => {
            if (!entityNodes.has(entity)) {
              const node = this.addNode({
                id: `entity_${entity.replace(/\s+/g, '_')}`,
                type: 'entity',
                name: entity,
                createdAt: new Date().toISOString()
              });
              entityNodes.set(entity, node);
            }
            
            // Connect memory to entity
            this.addEdge(
              `memory_${memory.id}`,
              entityNodes.get(entity).id,
              { type: 'mentions', weight: 1.0 }
            );
          });
        }
        
        // Process topics
        if (memory.metadata && memory.metadata.topic) {
          const topic = memory.metadata.topic;
          
          if (!topicNodes.has(topic)) {
            const node = this.addNode({
              id: `topic_${topic.replace(/\s+/g, '_')}`,
              type: 'topic',
              name: topic,
              createdAt: new Date().toISOString()
            });
            topicNodes.set(topic, node);
          }
          
          // Connect memory to topic
          this.addEdge(
            `memory_${memory.id}`,
            topicNodes.get(topic).id,
            { type: 'about', weight: 1.0 }
          );
        }
      });
      
      // Connect similar memories
      if (options.connectSimilarMemories) {
        for (let i = 0; i < memoryNodes.length; i++) {
          const memory = memories[i];
          
          // Find similar memories
          const similarMemories = await this.memoryService.findSimilarMemories(memory, {
            limit: options.similarityLimit || 3,
            minScore: options.minSimilarityScore || 0.7
          });
          
          // Connect to similar memories
          similarMemories.forEach(similarMemory => {
            if (similarMemory.id !== memory.id) {
              try {
                this.addEdge(
                  `memory_${memory.id}`,
                  `memory_${similarMemory.id}`,
                  {
                    type: 'similar',
                    weight: similarMemory.score || 0.5
                  }
                );
              } catch (error) {
                // Edge might already exist or nodes might not exist
                console.warn(`Could not create edge between memories: ${error.message}`);
              }
            }
          });
        }
      }
      
      // Connect co-occurring entities
      if (options.connectCooccurringEntities) {
        memories.forEach(memory => {
          if (memory.metadata && memory.metadata.entities && memory.metadata.entities.length > 1) {
            const entities = memory.metadata.entities;
            
            // Connect co-occurring entities
            for (let i = 0; i < entities.length; i++) {
              for (let j = i + 1; j < entities.length; j++) {
                const entity1 = entities[i];
                const entity2 = entities[j];
                
                if (entityNodes.has(entity1) && entityNodes.has(entity2)) {
                  try {
                    // Check if edge already exists
                    const existingEdge = this.getEdge(
                      entityNodes.get(entity1).id,
                      entityNodes.get(entity2).id
                    );
                    
                    if (existingEdge) {
                      // Increment weight
                      existingEdge.weight += 1;
                      this.edges.set(existingEdge.id, existingEdge);
                    } else {
                      // Create new edge
                      this.addEdge(
                        entityNodes.get(entity1).id,
                        entityNodes.get(entity2).id,
                        { type: 'cooccurs', weight: 1.0 }
                      );
                    }
                  } catch (error) {
                    console.warn(`Could not create edge between entities: ${error.message}`);
                  }
                }
              }
            }
          }
        });
      }
      
      return {
        nodes: Array.from(this.nodes.values()),
        edges: Array.from(this.edges.values()),
        stats: {
          nodeCount: this.nodes.size,
          edgeCount: this.edges.size,
          memoryCount: memoryNodes.length,
          entityCount: entityNodes.size,
          topicCount: topicNodes.size
        }
      };
    } catch (error) {
      console.error('Error creating knowledge graph from memories:', error);
      throw error;
    }
  }
  
  /**
   * Export the knowledge graph
   * @returns {Object} - Exported knowledge graph
   */
  exportGraph() {
    return {
      nodes: Array.from(this.nodes.values()),
      edges: Array.from(this.edges.values())
    };
  }
  
  /**
   * Find paths between nodes
   * @param {string} startId - Start node ID
   * @param {string} endId - End node ID
   * @param {Object} options - Options for path finding
   * @returns {Array} - Array of paths
   */
  findPaths(startId, endId, options = {}) {
    const maxDepth = options.maxDepth || 3;
    const paths = [];
    
    const visited = new Set();
    const currentPath = [];
    
    const dfs = (currentId, depth) => {
      if (depth > maxDepth) return;
      
      if (currentId === endId) {
        paths.push([...currentPath, currentId]);
        return;
      }
      
      if (visited.has(currentId)) return;
      
      visited.add(currentId);
      currentPath.push(currentId);
      
      // Get all connected nodes
      const edges = this.getNodeEdges(currentId);
      
      for (const edge of edges) {
        const nextId = edge.source === currentId ? edge.target : edge.source;
        dfs(nextId, depth + 1);
      }
      
      visited.delete(currentId);
      currentPath.pop();
    };
    
    dfs(startId, 0);
    
    return paths;
  }
}

export default KnowledgeGraphService; 