/**
 * Text embedding service
 */
import OpenAI from 'openai';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

export class EmbeddingService {
  constructor(options = {}) {
    this.model = options.model || 'text-embedding-3-small';
    
    // Initialize OpenAI client if API key is available
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      });
    } else {
      console.warn('No OpenAI API key found. Using dummy embeddings.');
    }

    this.initialized = false;
    this.useLocalModel = options.useLocalModel || false;
    this.localModelUrl = options.localModelUrl || 'http://localhost:8080/embeddings';
  }

  async initialize() {
    this.initialized = true;
    return true;
  }

  async getEmbedding(text) {
    if (!text) {
      console.warn('Empty text provided for embedding');
      return new Array(384).fill(0);
    }

    try {
      if (this.useLocalModel) {
        return this.getLocalEmbedding(text);
      } 
      
      if (this.openai) {
        const result = await this.openai.embeddings.create({
          model: this.model,
          input: text.substring(0, 8191), // Limit to OpenAI's context window
          encoding_format: 'float'
        });
        
        return result.data[0].embedding;
      }
      
      // Fallback to dummy embedding if no OpenAI API key
      return this.getDummyEmbedding(text);
    } catch (error) {
      console.error('Error generating embedding:', error);
      // Fallback to dummy embedding on error
      return this.getDummyEmbedding(text);
    }
  }

  async getLocalEmbedding(text) {
    try {
      const response = await axios.post(this.localModelUrl, {
        text: text
      });
      
      return response.data.embedding;
    } catch (error) {
      console.error('Error getting local embedding:', error);
      return this.getDummyEmbedding(text);
    }
  }

  // Generate a deterministic "dummy" embedding for testing or when OpenAI API is unavailable
  getDummyEmbedding(text) {
    const seed = text.length > 0 ? text.charCodeAt(0) * text.length : 0;
    const vectorSize = 384;
    const embedding = new Array(vectorSize).fill(0);
    
    for (let i = 0; i < vectorSize; i++) {
      // Generate a pseudo-random value between -1 and 1
      embedding[i] = Math.sin(seed * (i + 1)) / 2;
    }
    
    // Normalize the vector
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    return embedding.map(val => val / magnitude);
  }
}

export default EmbeddingService; 