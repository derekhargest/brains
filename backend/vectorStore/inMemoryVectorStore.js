/**
 * In-memory vector store implementation
 * Used as a fallback when Qdrant is unavailable
 */

export class InMemoryVectorStore {
  constructor() {
    this.vectors = [];
    this.initialized = false;
    this.collections = {};
  }

  async initialize() {
    // Set up default collections
    this.collections = {
      'memories': {
        vectors: [],
        config: { dimensions: 384 }
      },
      'memory_core': {
        vectors: [],
        config: { dimensions: 384 }
      },
      'memory_temporal': {
        vectors: [],
        config: { dimensions: 384 }
      }
    };
    
    this.initialized = true;
    console.log('InMemoryVectorStore initialized');
    return true;
  }

  async createCollection(collectionName, config = {}) {
    if (!this.collections[collectionName]) {
      this.collections[collectionName] = {
        vectors: [],
        config: { 
          dimensions: config.vectors?.size || 384,
          distance: config.vectors?.distance || 'Cosine'
        }
      };
      console.log(`Created in-memory collection: ${collectionName}`);
    }
    return true;
  }

  async upsert(collectionName, vectors) {
    if (!this.collections[collectionName]) {
      await this.createCollection(collectionName);
    }
    
    const collection = this.collections[collectionName];
    
    // Handle both single vector and array of vectors
    const vectorsArray = Array.isArray(vectors) ? vectors : [vectors];
    
    for (const item of vectorsArray) {
      // Check if vector already exists by ID
      const existingIndex = collection.vectors.findIndex(v => v.id === item.id);
      
      if (existingIndex >= 0) {
        // Update existing vector
        collection.vectors[existingIndex] = item;
      } else {
        // Add new vector
        collection.vectors.push(item);
      }
    }
    
    return { status: 'ok', count: vectorsArray.length };
  }

  async search(collectionName, queryVector, options = {}) {
    const collection = this.collections[collectionName];
    if (!collection) return { status: 'error', results: [] };
    
    const limit = options.limit || 10;
    const scoreThreshold = options.scoreThreshold || 0.0;
    
    // Compute cosine similarity for all vectors
    const results = collection.vectors.map(item => {
      const similarity = this.cosineSimilarity(queryVector, item.vector);
      return {
        id: item.id,
        payload: item.payload,
        score: similarity
      };
    });
    
    // Sort by similarity (descending) and apply threshold
    return results
      .filter(item => item.score > scoreThreshold)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  async delete(collectionName, ids) {
    const collection = this.collections[collectionName];
    if (!collection) return { status: 'error', message: 'Collection not found' };
    
    const idsArray = Array.isArray(ids) ? ids : [ids];
    
    // Filter out the vectors with the specified IDs
    const initialCount = collection.vectors.length;
    collection.vectors = collection.vectors.filter(item => !idsArray.includes(item.id));
    const deletedCount = initialCount - collection.vectors.length;
    
    return { status: 'ok', deleted: deletedCount };
  }

  async listCollections() {
    return Object.keys(this.collections).map(name => ({
      name,
      ...this.collections[name].config
    }));
  }

  // Helper method to compute cosine similarity
  cosineSimilarity(vecA, vecB) {
    if (!vecA || !vecB || vecA.length !== vecB.length) {
      return 0;
    }
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }
    
    if (normA === 0 || normB === 0) {
      return 0;
    }
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }
}

export default InMemoryVectorStore; 