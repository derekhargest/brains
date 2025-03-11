import axios from 'axios';

/**
 * Qdrant Vector Database client for backend
 */
export class QdrantVectorStore {
  constructor(config) {
    this.baseUrl = config.baseUrl || 'http://localhost:6333';
    this.collectionName = config.collectionName;
    this.vectorSize = config.vectorSize || 1536; // OpenAI's ada-002 embedding size
    this.httpClient = axios.create({ baseURL: this.baseUrl });
  }

  async initialize() {
    try {
      // First check if collection exists and get its configuration
      const collectionInfo = await this.getCollectionInfo();
      
      if (!collectionInfo) {
        console.log(`Collection ${this.collectionName} does not exist, creating...`);
        await this.createCollection();
      } else {
        // Validate vector size
        const configuredSize = collectionInfo.config?.params?.vectors?.size;
        if (configuredSize !== this.vectorSize) {
          throw new Error(`Vector size mismatch: Collection ${this.collectionName} has size ${configuredSize}, but we expected ${this.vectorSize}`);
        }
        console.log(`Using existing collection ${this.collectionName} with vector size ${this.vectorSize}`);
      }
      
      return true;
    } catch (error) {
      console.error('Failed to initialize vector store:', error);
      throw error;
    }
  }

  async getCollectionInfo() {
    try {
      const response = await this.httpClient.get(`/collections/${this.collectionName}`);
      return response.data.result;
    } catch (error) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  async createCollection() {
    try {
      await this.httpClient.put(`/collections/${this.collectionName}`, {
        vectors: {
          size: this.vectorSize,
          distance: 'Cosine'
        }
      });
      console.log(`Created collection ${this.collectionName} with vector size ${this.vectorSize}`);
      return true;
    } catch (error) {
      console.error(`Failed to create collection ${this.collectionName}:`, error);
      throw error;
    }
  }

  async upsert(points) {
    try {
      // Validate points format
      if (!Array.isArray(points)) {
        points = [points];
      }

      // Validate each point
      points.forEach(point => {
        if (!point.id || !point.vector || !Array.isArray(point.vector)) {
          throw new Error(`Invalid point format: ${JSON.stringify(point)}`);
        }
        if (point.vector.length !== this.vectorSize) {
          throw new Error(`Vector size mismatch: Expected ${this.vectorSize}, got ${point.vector.length}`);
        }
      });

      const response = await this.httpClient.put(`/collections/${this.collectionName}/points`, {
        points
      });

      return response.data.result;
    } catch (error) {
      console.error('Failed to upsert points:', error);
      if (error.response?.data) {
        console.error('Qdrant error details:', error.response.data);
      }
      throw error;
    }
  }

  async search(vector, limit = 10, filter = null) {
    try {
      if (!Array.isArray(vector) || vector.length !== this.vectorSize) {
        throw new Error(`Invalid vector format or size. Expected array of ${this.vectorSize} dimensions`);
      }

      const searchParams = {
        vector,
        limit,
        with_payload: true,
        with_vector: false
      };

      if (filter) {
        searchParams.filter = filter;
      }

      const response = await this.httpClient.post(
        `/collections/${this.collectionName}/points/search`,
        searchParams
      );

      return response.data.result;
    } catch (error) {
      console.error('Search failed:', error);
      throw error;
    }
  }

  async delete(pointIds) {
    try {
      if (!Array.isArray(pointIds)) {
        pointIds = [pointIds];
      }

      const response = await this.httpClient.post(
        `/collections/${this.collectionName}/points/delete`,
        { points: pointIds }
      );

      return response.data.result;
    } catch (error) {
      console.error('Delete failed:', error);
      throw error;
    }
  }

  async getPoint(id) {
    try {
      const response = await this.httpClient.post(
        `/collections/${this.collectionName}/points`,
        {
          ids: [id],
          with_payload: true,
          with_vector: true
        }
      );

      if (!response.data.result || response.data.result.length === 0) {
        return null;
      }

      return response.data.result[0];
    } catch (error) {
      console.error('Get point failed:', error);
      throw error;
    }
  }
}

export default QdrantVectorStore; 