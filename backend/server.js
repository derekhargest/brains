import express from "express";
import cors from "cors";
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { ChatMemoryExtractor } from './tools/extractChatMemories.js';
import { MemoryService } from './services/memoryService.js';
import { PatternService } from './services/patternService.js';
import { QdrantVectorStore } from './vectorStore/qdrantStore.js';
import { findAvailablePort } from './utils/portFinder.js';
import { qdrantClient } from './vectorStore.js';
import { 
  checkQdrantAvailability,
  initializeCollections,
  advancedSearch 
} from './vectorStore.js';
import memoryRoutes from "./api/routes/memoryRoutes.js";
import patternRoutes from "./api/routes/patternRoutes.js";
import preferenceRoutes from "./api/routes/preferenceRoutes.js";
import testRoutes from './routes/testRoutes.js';
import uploadRoutes from './api/routes/uploadRoutes.js';

// Create __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

// Middleware
app.use(express.json());
app.use(cors({
  origin: 'http://localhost:3000', // Your frontend URL
  methods: ['GET', 'POST', 'PUT', 'DELETE'], 
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Initialize services
const memoryExtractor = new ChatMemoryExtractor();

// Initialize pattern service
const patternService = new PatternService();

// Health check route
app.get("/", (req, res) => {
  res.send("🚀 Derek-Brain API is running!");
});

// API Routes - use proper router modules
app.use('/api/memories', require('./api/routes/memoryRoutes'));
app.use('/api/upload', require('./api/routes/uploadRoutes'));
app.use("/api/patterns", patternRoutes);
app.use("/api/preferences", preferenceRoutes);
app.use('/api/tests', testRoutes);
console.log('Registered upload routes:');
console.log('- POST /api/upload/json (multipart form)');
console.log('- POST /api/upload/direct (JSON)');
console.log('- GET /api/upload/test (test endpoint)');

app.get('/api/insights', async (req, res) => {
  // For now, return sample insights
  // In a real implementation, this would analyze the vector store
  res.json(sampleInsights);
});

app.post('/api/extract-chat', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ error: "Text is required" });
    }
    
    const extractedMemories = await memoryExtractor.extractMemories(text);
    
    // Add extracted memories to our storage
    const addedMemories = [];
    for (const memory of extractedMemories) {
      try {
        const added = await app.locals.services.memoryService.storeMemory(memory);
        addedMemories.push(added);
      } catch (err) {
        console.error(`Error adding extracted memory: ${err.message}`);
      }
    }
    
    res.json({ 
      success: true, 
      memories: addedMemories,
      count: addedMemories.length
    });
  } catch (error) {
    console.error('Error extracting memories from chat:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to extract memories from chat' 
    });
  }
});

// POST /api/memories/search - Search for memories
app.post('/api/memories/search', async (req, res) => {
  try {
    const memoryService = app.locals.services.memoryService;
    if (!memoryService) {
      return res.status(503).json({ error: 'Memory service not initialized' });
    }
    
    const { text, limit } = req.body;
    if (!text) {
      return res.status(400).json({ error: "Search text is required" });
    }
    
    // Pass the text as string, findSimilarMemories will convert it
    const results = await memoryService.findSimilarMemories(text, { limit });
    res.json(results);
  } catch (error) {
    console.error('Error searching memories:', error);
    res.status(500).json({ error: error.message });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send({ error: "Something went wrong!" });
});

// Start server
async function startServer() {
  try {
    // First initialize all services
    const services = await initializeServices();
    app.locals.services = services;
    console.log('✅ All services initialized');
    
    // Then start listening for requests
    const PORT = process.env.PORT || await findAvailablePort(3001);
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Remove the other initialization calls and just call startServer
startServer();

export default app;

async function initializeServices() {
  try {
    // First instantiate and initialize the vector store
    const vectorStore = new QdrantVectorStore({
      baseUrl: process.env.QDRANT_URL || 'http://localhost:6333',
      collectionName: 'memories',
      vectorSize: 384
    });
    
    // Initialize the vector store first
    await vectorStore.initialize();
    console.log('✅ Vector store initialized successfully');
    
    // Then pass the initialized vector store to the memory service
    const memoryService = new MemoryService(vectorStore);
    await memoryService.initialize();
    console.log('✅ Memory service initialized successfully');
    
    // Initialize pattern service
    const patternService = new PatternService();
    await patternService.initialize();
    console.log('✅ Pattern service initialized');
    
    return { vectorStore, memoryService, patternService };
  } catch (error) {
    console.error('Error initializing services:', error);
    throw error;
  }
}

// Enhanced QdrantVectorStore with createCollection method
class EnhancedQdrantVectorStore extends QdrantVectorStore {
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
  
  // Add other required methods for MemoryService
  async upsert(collectionName, data) {
    try {
      await this.httpClient.put(`/collections/${collectionName}/points`, data);
      return true;
    } catch (error) {
      console.error(`Error upserting to collection ${collectionName}:`, error);
      throw error;
    }
  }
  
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
  
  async scroll(collectionName, options) {
    try {
      const response = await this.httpClient.post(`/collections/${collectionName}/points/scroll`, {
        limit: options.limit || 1000,
        with_payload: options.with_payload !== false,
        with_vectors: options.with_vectors || false,
        filter: options.filter || undefined
      });
      return {
        points: response.data.result.points
      };
    } catch (error) {
      console.error(`Error scrolling collection ${collectionName}:`, error);
      throw error;
    }
  }
}

// Integrate the enhanced store
app.locals.services = {};

// Initialize all services
initializeServices()
  .then(services => {
    app.locals.services = services;
    console.log('All services initialized successfully');
  })
  .catch(error => {
    console.error('Failed to initialize services:', error);
  });

// API routes
app.get('/api/memories', async (req, res) => {
  try {
    if (!app.locals.services.memoryService) {
      return res.status(503).json({ error: 'Memory service not initialized' });
    }
    
    const memories = await app.locals.services.memoryService.getAllMemories();
    res.json(memories);
  } catch (error) {
    console.error('Error fetching memories:', error);
    res.status(500).json({ error: error.message });
  }
});

// More routes... 

// Fallback routes for compatibility
app.get('/get-preferences', async (req, res) => {
  try {
    // If services are not initialized, return empty array
    if (!app.locals.services || !app.locals.services.preferenceService) {
      console.warn('Preference service not yet initialized for /get-preferences');
      return res.json([]);
    }
    
    // Delegate to the actual service
    const preferences = await app.locals.services.preferenceService.getAllPreferences();
    res.json(preferences || []);
  } catch (error) {
    console.error('Error in /get-preferences:', error.message);
    res.json([]); // Return empty array instead of error
  }
});

app.post('/set-preference', async (req, res) => {
  try {
    const { key, value } = req.body;
    if (!key || !value) {
      return res.status(400).json({ error: "Key and value are required" });
    }
    
    const result = await app.locals.services.preferenceService.setPreference(key, value);
    res.json(result);
  } catch (error) {
    console.error('Error setting preference:', error);
    res.status(500).json({ error: error.message });
  }
});