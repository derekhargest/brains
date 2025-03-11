import axios from 'axios';

/**
 * Qdrant Vector Database client for backend
 */
export class QdrantVectorStore {
  constructor(config = {}) {
    this.baseUrl = config.baseUrl || 'http://localhost:6333';
    this.collectionName = config.collectionName || 'memories';
    this.vectorSize = config.vectorSize || 384;
    this.httpClient = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    this.initialized = false;
  }

  // Same methods as the frontend version, but with Node.js error handling
  
  async initialize() {
    if (this.initialized) return true;
    
    try {
      // Check if collection exists
      const collections = await this.httpClient.get('/collections');
      const collectionExists = collections.data.result.collections.some(
        c => c.name === this.collectionName
      );

      if (!collectionExists) {
        // Create collection if it doesn't exist
        await this.httpClient.put(`/collections/${this.collectionName}`, {
          vectors: {
            size: this.vectorSize,
            distance: 'Cosine'
          }
        });
        console.log(`Created Qdrant collection: ${this.collectionName}`);
      } else {
        console.log(`Using existing Qdrant collection: ${this.collectionName}`);
      }

      this.initialized = true;
      return true;
    } catch (error) {
      console.error('Error initializing Qdrant connection:', error);
      throw error;
    }
  }

  /**
   * Create a collection in Qdrant
   * @param {string} collectionName - Name of the collection
   * @param {Object} options - Options for the collection
   */
  async createCollection(collectionName, options = {}) {
    try {
      // Check if collection exists
      const collections = await this.httpClient.get('/collections');
      const collectionExists = collections.data.result.collections.some(
        c => c.name === collectionName
      );

      if (!collectionExists) {
        // Create collection if it doesn't exist
        await this.httpClient.put(`/collections/${collectionName}`, {
          vectors: {
            size: options.vectors?.size || this.vectorSize,
            distance: options.vectors?.distance || 'Cosine'
          }
        });
        console.log(`Created Qdrant collection: ${collectionName}`);
      } else {
        console.log(`Using existing Qdrant collection: ${collectionName}`);
      }

      return true;
    } catch (error) {
      console.error(`Error creating collection ${collectionName}:`, error);
      throw error;
    }
  }

  /**
   * Upsert points into a collection
   * @param {string} collectionName - Name of the collection
   * @param {Object} data - Data containing points to upsert
   */
  async upsert(collectionName, data) {
    try {
      await this.httpClient.put(`/collections/${collectionName}/points`, data);
      return true;
    } catch (error) {
      console.error(`Error upserting to collection ${collectionName}:`, error);
      throw error;
    }
  }

  /**
   * Retrieve points by ID
   * @param {string} collectionName - Name of the collection
   * @param {Object} options - Options for retrieval
   */
  async retrieve(collectionName, options) {
    try {
      const response = await this.httpClient.post(`/collections/${collectionName}/points/retrieve`, {
        ids: options.ids,
        with_payload: options.with_payload
      });
      return {
        points: response.data.result
      };
    } catch (error) {
      console.error(`Error retrieving from collection ${collectionName}:`, error);
      throw error;
    }
  }

  /**
   * Scroll through all points in a collection
   * @param {string} collectionName - Name of the collection
   * @param {Object} options - Options for scrolling
   */
  async scroll(collectionName, options = {}) {
    try {
      const response = await this.httpClient.post(`/collections/${collectionName}/points/scroll`, {
        limit: options.limit || 1000,
        with_payload: options.with_payload !== false,
        with_vectors: options.with_vectors || false,
        filter: options.filter || undefined,
        offset: options.offset || undefined
      });
      return {
        points: response.data.result.points
      };
    } catch (error) {
      console.error(`Error scrolling collection ${collectionName}:`, error);
      throw error;
    }
  }

  /**
   * Search for similar vectors
   * @param {string} collectionName - Name of the collection
   * @param {Object} options - Search options
   */
  async search(collectionName, options) {
    try {
      if (!options.vector || !Array.isArray(options.vector)) {
        throw new Error('Search requires a valid vector array');
      }
      
      console.log(`Searching in collection '${collectionName}' with vector of length ${options.vector.length}`);
      
      const requestBody = {
        vector: options.vector,
        limit: options.limit || 10,
        with_payload: options.with_payload !== false,
        with_vectors: options.with_vectors || false
      };
      
      // Only add score_threshold if it's provided and not too high
      if (options.score_threshold && options.score_threshold < 0.99) {
        requestBody.score_threshold = options.score_threshold;
      }
      
      // Add filter if provided
      if (options.filter) {
        requestBody.filter = options.filter;
      }
      
      console.log(`Search request body: ${JSON.stringify({
        ...requestBody,
        vector: `[vector with ${requestBody.vector.length} dimensions]`
      }, null, 2)}`);
      
      const response = await this.httpClient.post(
        `/collections/${collectionName}/points/search`, 
        requestBody
      );
      
      // Log the raw response for debugging
      console.log(`Raw search response status: ${response.status}`);
      
      if (!response.data || !response.data.result) {
        console.warn(`Unexpected response format:`, response.data);
        return { points: [] };
      }
      
      const resultCount = response.data.result.length;
      console.log(`Search returned ${resultCount} results`);
      
      // If no results, log some sample vectors for debugging
      if (resultCount === 0) {
        console.log(`No results found. Checking if collection has data...`);
        try {
          const scrollResponse = await this.httpClient.post(
            `/collections/${collectionName}/points/scroll`, 
            { limit: 2, with_payload: true }
          );
          
          if (scrollResponse.data?.result?.points?.length > 0) {
            console.log(`Collection has data. Sample point:`, 
              JSON.stringify({
                id: scrollResponse.data.result.points[0].id,
                payload: scrollResponse.data.result.points[0].payload
              }, null, 2)
            );
          } else {
            console.log(`Collection appears to be empty`);
          }
        } catch (scrollError) {
          console.error(`Error checking collection data:`, scrollError.message);
        }
      }
      
      // Map results to expected format
      return {
        points: response.data.result.map(item => ({
          id: item.id,
          payload: item.payload || {},
          score: item.score
        }))
      };
    } catch (error) {
      console.error(`Error searching collection ${collectionName}:`, error);
      // Additional error logging
      if (error.response) {
        console.error(`API responded with status ${error.response.status}:`, 
          error.response.data || 'No response data');
      } else if (error.request) {
        console.error(`No response received:`, error.request);
      } else {
        console.error(`Error details:`, error.message);
      }
      throw error;
    }
  }

  /**
   * Delete points from a collection
   * @param {string} collectionName - Name of the collection
   * @param {Object} options - Delete options
   */
  async delete(collectionName, options) {
    try {
      await this.httpClient.post(`/collections/${collectionName}/points/delete`, {
        points: options.points,
        filter: options.filter
      });
      return true;
    } catch (error) {
      console.error(`Error deleting from collection ${collectionName}:`, error);
      throw error;
    }
  }
}

export default QdrantVectorStore; 