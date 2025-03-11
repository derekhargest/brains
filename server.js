import express from 'express';
import path from 'path';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { createServer } from 'http';
import { Server } from 'socket.io';
import {
  storeMemory,
  searchByTimePattern,
  advancedSearch,
  checkQdrantAvailability,
  initializeCollections,
  synchronizeCollections,
  checkCollectionsHealth,
  optimizedSearch
} from './backend/vectorStore.js';
import { getAllPages, getPage, savePage, deletePage, createSlug } from './backend/wiki.js';
import OpenAI from 'openai';
import fs from 'fs';
import crypto from 'crypto';
import { PatternService } from './backend/services/patternService.js';
import cron from 'node-cron';
import temporalRoutes from './backend/routes/temporalRoutes.js';
import systemRoutes from './backend/routes/systemRoutes.js';
import memoryRoutes from './backend/api/routes/memoryRoutes.js';
import patternRoutes from './backend/api/routes/patternRoutes.js';
import preferenceRoutes from './backend/api/routes/preferenceRoutes.js';
import uploadRoutes from './backend/api/routes/uploadRoutes.js';
import testRoutes from './backend/routes/testRoutes.js';
import { findAvailablePort } from './backend/utils/portFinder.js';
import { MemoryService } from './backend/services/memoryService.js';
import { QdrantVectorStore } from './backend/vectorStore/qdrantStore.js';
import entityRoutes from './backend/routes/entityRoutes.js';
import { EntityService } from './backend/services/entityService.js';
import { PreferenceService } from './backend/services/preferenceService.js';
import { EnrichmentService } from './backend/services/enrichmentService.js';
import analysisRoutes from './backend/api/routes/analysisRoutes.js';
import graphRoutes from './backend/api/routes/graphRoutes.js';
import { KnowledgeGraphService } from './backend/services/knowledgeGraphService.js';
import { TemporalService } from './backend/services/temporalService.js';
import { NotificationService } from './backend/services/notificationService.js';
import { InsightService } from './backend/services/insightService.js';
import { LearningService } from './backend/services/learningService.js';
import demoRoutes from './backend/routes/demoRoutes.js';
import { registerDirectRoutes } from './backend/registerDirectRoutes.js';
import healthRoutes from './backend/api/routes/healthRoutes.js';
import logger from './backend/utils/logger.js';

// Create __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Test endpoint
app.get('/api/test-health', (req, res) => {
  res.json({ status: 'API working', timestamp: new Date().toISOString() });
});

// KEEP ONLY ESSENTIAL ROUTES
app.use('/api/memories', memoryRoutes);
app.use('/api/test', testRoutes);

// Remove all other routes:
// app.use('/api/temporal', temporalRoutes);
// app.use('/api/system', systemRoutes);
// app.use('/api/entities', entityRoutes);
// app.use('/api/analysis', analysisRoutes);
// app.use('/api/graph', graphRoutes);
// app.use('/api/demo', demoRoutes);

// Add this right after your other API routes and before the static files middleware
app.get('/api/health', async (req, res) => {
  try {
    // Check Qdrant availability
    const qdrantAvailable = await checkQdrantAvailability();
    
    res.json({ 
      status: 'ok', 
      message: 'Brains!!! server is running', 
      storageMode: qdrantAvailable ? 'qdrant' : 'in-memory-fallback',
      timestamp: new Date().toISOString() 
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// Then your static files middleware
app.use(express.static(path.join(__dirname, 'frontend')));

// SPA catch-all
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

// Add test route before any middleware
app.get('/ping', (req, res) => res.send('pong'));

// Add after your Express app initialization
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Add route logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

let serverStarted = false;
let server = null; // Single declaration

// Initialize Qdrant collections before starting the server
console.log('Starting Brains!!! server initialization...');
initializeCollections()
  .then(() => console.log('Collections initialized'))
  .catch(err => console.error('Collection init error:', err));

// Create a function to run example code after initialization
async function runExampleCode() {
  console.log("Running example code...");
  
  // When preparing a response to Derek
  const userQuestion = "Do I have any plans next week?";
  try {
    // Only search if collections are initialized
    const collectionsHealth = await checkCollectionsHealth();
    if (collectionsHealth.overall) {
      const memories = await advancedSearch(userQuestion, { limit: 5 });
      console.log('Retrieved memories:', memories);
      // Use these memories to inform the AI's response
    } else {
      console.log('Collections not healthy, skipping memory search');
    }
  } catch (error) {
    console.error('Error searching memories:', error);
    // Continue without memories
  }

  // Store preferences - add try/catch block
  try {
    await storeMemory({
      id: crypto.randomUUID(),  // Use UUID directly instead of string
      content: "Derek prefers dark mode on all applications",
      metadata: {
        type: "preference",
        category: "ui",
        importance: 0.6
      },
      timestamp: new Date().toISOString()
    });
    console.log("Preference stored successfully");
  } catch (error) {
    console.error("Error storing preference:", error);
  }
  
  console.log("Example code completed");
}

// Modify your startServerIfNotStarted function to call the example code after server start
function startServerIfNotStarted(withWarning = false) {
  if (serverStarted) return;
  
  const BASE_PORT = 3002;
  const PORT = process.env.PORT || BASE_PORT;
  if (!server) {
    server = httpServer.listen(PORT, '0.0.0.0', () => {
      if (withWarning) {
        console.log(`Server running on http://0.0.0.0:${PORT} (WARNING: Vector database initialization failed)`);
      } else {
        console.log(`Server running on http://0.0.0.0:${PORT}`);
      }
      serverStarted = true;
      
      // Run example code after server starts
      setTimeout(() => {
        runExampleCode().catch(err => {
          console.error("Error running example code:", err);
        });
      }, 2000); // Wait 2 seconds to ensure everything is initialized
    });
  }
}

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);
  
  socket.on('chat message', async (data) => {
    try {
      console.log('Received message:', data.message);
      
      // Process with AI Brain
      const aiResponse = await processWithAI(data.message, data.history);
      
      // Send response back to client
      socket.emit('ai response', aiResponse);
    } catch (error) {
      console.error('Error processing message:', error);
      socket.emit('ai response', 'Sorry, I encountered an error processing your request.');
    }
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// AI processing function
async function processWithAI(message, history = []) {
  // First search for relevant memories
  const relevantMemories = await advancedSearch(message, { limit: 3 });
  
  let memoryContext = '';
  if (relevantMemories && relevantMemories.length > 0) {
    memoryContext = "Relevant memories:\n" + relevantMemories
      .map(mem => `- ${mem.content} (${new Date(mem.timestamp).toLocaleDateString()})`)
      .join("\n");
  }
  
  try {
    // Use OpenAI for response generation
    if (process.env.OPENAI_API_KEY) {
      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          { 
            role: "system", 
            content: `You are an AI assistant with access to the user's stored memories. 
                     Be helpful, concise, and friendly.
                     ${memoryContext}` 
          },
          ...history, // Include chat history
          { role: "user", content: message }
        ],
        max_tokens: 500
      });
      
      return response.choices[0].message.content;
    } else {
      // Fallback if OpenAI is not configured
      return generateFallbackResponse(message, relevantMemories);
    }
  } catch (error) {
    console.error('AI processing error:', error);
    return "I'm having trouble connecting to my thinking system. Could you try again in a moment?";
  }
}

// Fallback response generator
function generateFallbackResponse(message, relevantMemories) {
  const responses = [
    "Based on what I know, ",
    "I remember that ",
    "According to my memory, ",
    "I recall that ",
    "From what I've stored, "
  ];
  
  const prefix = responses[Math.floor(Math.random() * responses.length)];
  
  if (relevantMemories && relevantMemories.length > 0) {
    // Use the most relevant memory
    return prefix + relevantMemories[0].content;
  } else {
    return "I don't have any specific memories about that, but I'm happy to help if you provide more details.";
  }
}

// API routes
app.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }
    
    console.log('Received chat request:', message);
    
    // Temporary simple response for testing
    // In a real implementation, you would call your AI service here
    const aiResponse = await generateAIResponse(message);
    
    res.json({
      success: true,
      response: aiResponse
    });
  } catch (error) {
    console.error('Error in chat endpoint:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process chat message'
    });
  }
});

// Add this helper function
async function generateAIResponse(message) {
  // This is a placeholder for your actual AI response generation
  // For now, return a simple response that shows we're not just echoing
  
  const responses = [
    "I understand you're saying something about " + message.split(' ').slice(0, 3).join(' ') + "...",
    "That's an interesting point about " + message.split(' ').slice(-3).join(' '),
    "I'm processing your request related to " + message.split(' ').slice(1, 4).join(' '),
    "Let me think about what you said regarding " + message.split(' ').slice(2, 5).join(' '),
    "I'm analyzing your input on " + message.split(' ').slice(0, 4).join(' ')
  ];
  
  // Return a random response from the list
  return responses[Math.floor(Math.random() * responses.length)];
  
  // When you implement your real AI integration, replace this with your actual API call
  // For example:
  // const result = await openaiClient.createChatCompletion({
  //   model: "gpt-3.5-turbo",
  //   messages: [{ role: "user", content: message }]
  // });
  // return result.choices[0].message.content;
}

app.post('/api/extract-memories', async (req, res) => {
  const { messages } = req.body;
  
  try {
    const extractedMemories = [];
    
    // Process each user message
    for (const message of messages) {
      if (message.role === 'user') {
        const memory = {
          id: `memory_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
          content: message.content,
          metadata: {
            type: "chat",
            source: "user-message",
            importance: 0.7
          },
          timestamp: message.timestamp || new Date().toISOString()
        };
        
        try {
          // Store in vector database
          const result = await storeMemory(memory);
          if (result.success) {
            extractedMemories.push(memory);
          }
        } catch (error) {
          console.error(`Failed to store memory: ${error.message}`);
          // Continue with other messages
        }
      }
    }
    
    res.json({
      success: true,
      memories: extractedMemories,
      count: extractedMemories.length
    });
  } catch (error) {
    console.error('Error extracting memories:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Add vector-based memory endpoints
app.post('/api/memories', async (req, res) => {
  try {
    const memory = {
      id: `memory_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      content: req.body.content,
      metadata: req.body.metadata || {},
      timestamp: new Date().toISOString(),
      source: req.body.source || 'api'
    };
    
    const result = await storeMemory(memory);
    res.json(result);
  } catch (error) {
    console.error('Error storing memory:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.get('/api/memories/search', async (req, res) => {
  try {
    const { query, limit } = req.query;
    const memories = await searchMemories(query, parseInt(limit) || 5);
    res.json({
      success: true,
      memories,
      count: memories.length
    });
  } catch (error) {
    console.error('Error searching memories:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Add this new endpoint to server.js
app.get('/api/statistics', async (req, res) => {
  try {
    // For in-memory fallback
    let memoryStats = {
      totalMemories: 0,
      bySource: {},
      byType: {},
      importanceDistribution: {
        high: 0,    // 0.8-1.0
        medium: 0,  // 0.4-0.7
        low: 0      // 0-0.3
      },
      recentMemories: [],
      oldestMemory: null,
      newestMemory: null
    };
    
    // Get all memories (for in-memory mode)
    const allMemories = await searchMemories("", 999);
    
    if (allMemories.length > 0) {
      memoryStats.totalMemories = allMemories.length;
      
      // Process each memory for statistics
      allMemories.forEach(memory => {
        // Count by source
        const source = memory.metadata?.source || 'unknown';
        memoryStats.bySource[source] = (memoryStats.bySource[source] || 0) + 1;
        
        // Count by type
        const type = memory.metadata?.type || 'unknown';
        memoryStats.byType[type] = (memoryStats.byType[type] || 0) + 1;
        
        // Count by importance
        const importance = memory.metadata?.importance || 0;
        if (importance >= 0.8) memoryStats.importanceDistribution.high++;
        else if (importance >= 0.4) memoryStats.importanceDistribution.medium++;
        else memoryStats.importanceDistribution.low++;
        
        // Track oldest/newest
        const timestamp = new Date(memory.timestamp || Date.now());
        if (!memoryStats.oldestMemory || timestamp < new Date(memoryStats.oldestMemory.timestamp)) {
          memoryStats.oldestMemory = memory;
        }
        if (!memoryStats.newestMemory || timestamp > new Date(memoryStats.newestMemory.timestamp)) {
          memoryStats.newestMemory = memory;
        }
      });
      
      // Get recent memories (top 5)
      memoryStats.recentMemories = allMemories
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 5);
    }
    
    res.json({
      success: true,
      statistics: memoryStats
    });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Wiki API routes
app.get('/api/wiki', (req, res) => {
  const pages = getAllPages();
  res.json({
    success: true,
    pages
  });
});

app.get('/api/wiki/:slug', (req, res) => {
  const { slug } = req.params;
  const page = getPage(slug);
  
  if (!page) {
    res.status(404).json({
      success: false,
      error: 'Page not found'
    });
    return;
  }
  
  res.json({
    success: true,
    page
  });
});

app.post('/api/wiki', (req, res) => {
  console.log('Wiki save request body:', req.body);
  const { title, content } = req.body;
  
  if (!title || !content) {
    console.log('Missing title or content in request');
    res.status(400).json({
      success: false,
      error: 'Title and content are required'
    });
    return;
  }
  
  const slug = req.body.slug || createSlug(title);
  console.log(`Attempting to save page with slug: ${slug}`);
  const result = savePage(slug, title, content);
  console.log('Save result:', result);
  
  res.json(result);
});

app.delete('/api/wiki/:slug', (req, res) => {
  const { slug } = req.params;
  const result = deletePage(slug);
  
  res.status(result.success ? 200 : 400).json(result);
});

// Set port and start server
const PORT = process.env.PORT || 3001;

const MAX_RETRIES = 3;
let retryCount = 0;

function startServerWithRetry() {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🧠 Brains!!! server running on port ${PORT}`);
    console.log(`   Mode: ${process.env.NODE_ENV || 'development'}`);
    console.log(`   Qdrant URL: ${process.env.QDRANT_URL || 'http://localhost:6333'}`);
    serverStarted = true;
    
    // Run example code after server starts
    setTimeout(() => {
      runExampleCode().catch(err => {
        console.error("Error running example code:", err);
      });
    }, 2000); // Wait 2 seconds to ensure everything is initialized
  }).on('error', (err) => {
    if (retryCount < MAX_RETRIES) {
      console.log(`Retry ${retryCount + 1}/${MAX_RETRIES}`);
      retryCount++;
      setTimeout(startServerWithRetry, 1000);
    } else {
      console.error('Failed to start after retries:', err);
      process.exit(1);
    }
  });
}

// Replace existing startServer call with:
startServerWithRetry();

// Add proper shutdown handling
process.on('SIGINT', () => {
  console.log('Shutting down server gracefully...');
  httpServer.close(() => {
    console.log('Server shut down');
    process.exit(0);
  });
});

// Add after your server initialization
// Set up collection synchronization every hour
const SYNC_INTERVAL = 60 * 60 * 1000; // 1 hour in milliseconds
setInterval(() => {
  console.log('Running scheduled collection synchronization');
  synchronizeCollections()
    .then(result => console.log('Synchronization completed'))
    .catch(error => console.error('Synchronization error:', error));
}, SYNC_INTERVAL);

// Add these routes to your Express app

// Endpoint for temporal pattern search
app.get('/api/memories/temporal-patterns', async (req, res) => {
  try {
    const { pattern, limit = 10 } = req.query;
    
    if (!pattern) {
      return res.status(400).json({
        success: false,
        error: 'Pattern parameter is required'
      });
    }
    
    const results = await searchByTimePattern(pattern, parseInt(limit));
    
    res.json({
      success: true,
      results
    });
  } catch (error) {
    console.error('Error searching by time pattern:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Endpoint for advanced search
app.post('/api/memories/search', async (req, res) => {
  try {
    const { query, filters, limit = 10, collection } = req.body;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Query parameter is required'
      });
    }
    
    const results = await advancedSearch(query, {
      filters,
      limit: parseInt(limit),
      collection
    });
    
    res.json({
      success: true,
      results
    });
  } catch (error) {
    console.error('Error performing advanced search:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Add this route to your Express app
app.get('/api/system/health', async (req, res) => {
  try {
    const collectionsHealth = await checkCollectionsHealth();
    
    res.json({
      success: true,
      status: collectionsHealth.overall ? 'healthy' : 'degraded',
      components: {
        server: 'healthy',
        vectorDatabase: collectionsHealth.overall ? 'healthy' : 'degraded',
        collections: collectionsHealth.collections
      }
    });
  } catch (error) {
    console.error('Error checking system health:', error);
    res.status(500).json({
      success: false,
      status: 'error',
      error: error.message
    });
  }
});

/**
 * Initialize all required services
 */
async function initializeServices() {
  try {
    console.log('Initializing core services...');
    
    // 1. First initialize vector store
    const vectorStore = new QdrantVectorStore({
      baseUrl: process.env.QDRANT_URL || 'http://localhost:6333',
      collectionName: 'memories',
      vectorSize: 384
    });
    
    // 2. Initialize vector store before anything else
    await vectorStore.initialize();
    console.log('Vector store initialized');

    // 3. Initialize other services sequentially
    const services = {
      memoryService: new MemoryService(vectorStore),
      patternService: new PatternService(),
      entityService: new EntityService(),
      preferenceService: new PreferenceService(),
      enrichmentService: new EnrichmentService(),
      knowledgeGraphService: new KnowledgeGraphService(),
      temporalService: new TemporalService(),
      notificationService: new NotificationService(),
      insightService: new InsightService(),
      learningService: new LearningService()
    };

    // 4. Initialize each service with error handling
    for (const [name, service] of Object.entries(services)) {
      try {
        await service.initialize();
        console.log(`✅ ${name} initialized`);
      } catch (error) {
        console.error(`❌ Failed to initialize ${name}:`, error);
      }
    }

    return services;
  } catch (error) {
    console.error('Critical service initialization failed:', error);
    process.exit(1);
  }
}

// Make sure this function is defined before startServer is called
async function startServer() {
  console.log('Starting server initialization...');
  const BASE_PORT = 3002;
  const PORT = process.env.PORT || BASE_PORT;

  try {
    console.log('Initializing services...');
    const services = await initializeServices();
    
    app.locals.services = services;

    // Avoid trying to use port 4000 directly, rely on findAvailablePort instead
    server = app.listen(PORT, () => {
      console.log(`✅ Server running at http://localhost:${PORT}`);
      serverStarted = true;

      // Set up WebSocket
      const io = new Server(server, {
        cors: {
          origin: "*",
          methods: ["GET", "POST"]
        }
      });

      io.on('connection', (socket) => {
        console.log('Client connected to WebSocket');
        
        socket.on('disconnect', () => {
          console.log('Client disconnected from WebSocket');
        });
        
        socket.on('error', (error) => {
          console.error('WebSocket error:', error);
        });
      });
      
      console.log(`✅ WebSocket server initialized on port ${PORT}`);
    });

    // Register direct routes for debugging
    registerDirectRoutes(app);
  } catch (error) {
    console.error('Fatal startup error:', error);
  }
}

// Start the server
startServer();

// Add to your existing routes
app.get('/api/patterns/temporal', async (req, res) => {
  try {
    // Get last 30 days of memories
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const memories = await advancedSearch('*', {
      filters: {
        'timestamp': {
          gte: thirtyDaysAgo.toISOString()
        }
      },
      limit: 1000
    });

    const patterns = await patternService.detectTemporalPatterns(memories);
    
    res.json({
      success: true,
      patterns
    });
  } catch (error) {
    console.error('Error detecting temporal patterns:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze temporal patterns'
    });
  }
});

// Add to server initialization
function startScheduledJobs() {
  // Daily pattern analysis at 2AM
  cron.schedule('0 2 * * *', async () => {
    console.log('Running daily pattern analysis...');
    await analyzeDailyPatterns();
  });
  
  // Weekly analysis on Sundays at 3AM
  cron.schedule('0 3 * * 0', async () => {
    console.log('Running weekly pattern analysis...');
    await analyzeWeeklyPatterns();
  });
}

async function analyzeDailyPatterns() {
  const memories = await advancedSearch('*', {
    filters: {
      'timestamp': {
        gte: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      }
    }
  });
  
  const patterns = await patternService.detectTemporalPatterns(memories);
  await storePatternInsights(patterns);
}

// Add above other routes
app.get('/api/test', (req, res) => {
  res.json({ status: 'API working', timestamp: new Date() });
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
  process.exit(1);
});

// Add this route to your express app in server.js
app.get('/graph', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/graph.html'));
});

// Add this direct route to server.js
app.get('/api/server-info', (req, res) => {
  res.json({
    timestamp: new Date().toISOString(),
    routes: {
      test: app._router.stack.some(r => r.route && r.route.path === '/api/test/ping'),
      graph: app._router.stack.some(r => r.route && r.route.path === '/api/graph')
    },
    services: app.locals.services ? Object.keys(app.locals.services) : []
  });
});

// Add these direct routes to server.js for diagnosing the issue

// Route to check services
app.get('/services-check', (req, res) => {
  const services = req.app.locals.services || {};
  const knowledgeGraph = services.knowledgeGraphService || {};
  
  res.json({
    servicesAvailable: Object.keys(services),
    knowledgeGraph: {
      available: !!knowledgeGraph,
      initialized: knowledgeGraph.initialized || false,
      nodeCount: knowledgeGraph.nodes?.size || 0,
      edgeCount: knowledgeGraph.edges?.size || 0
    }
  });
});

// Direct route to test node creation
app.post('/direct-node-test', (req, res) => {
  try {
    const { knowledgeGraphService } = req.app.locals.services || {};
    
    if (!knowledgeGraphService) {
      return res.status(500).json({
        success: false,
        error: 'Knowledge graph service not available'
      });
    }
    
    // Try to add a node directly
    const testNode = knowledgeGraphService.addNode('TEST', 'Test Node ' + Date.now(), { test: true });
    
    res.json({
      success: !!testNode,
      node: testNode,
      nodeCount: knowledgeGraphService.nodes?.size || 0
    });
  } catch (error) {
    console.error('Direct node test error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create node: ' + error.message,
      stack: error.stack
    });
  }
});

// Add this test route
app.post('/mini-test', (req, res) => {
  try {
    const { miniGraphService } = req.app.locals.services || {};
    
    if (!miniGraphService) {
      return res.status(500).json({
        success: false,
        error: 'Mini graph service not available'
      });
    }
    
    // Try adding a test node
    const personNode = miniGraphService.addNode('PERSON', 'Test Person', { test: true });
    const placeNode = miniGraphService.addNode('PLACE', 'Test Place', { test: true });
    
    // Try adding an edge
    const edge = miniGraphService.addEdge(personNode, placeNode, 'VISITED');
    
    // Get stats
    const stats = miniGraphService.getStats();
    
    res.json({
      success: true,
      stats,
      personNode,
      placeNode,
      edge
    });
  } catch (error) {
    console.error('Mini test error:', error);
    res.status(500).json({
      success: false,
      error: 'Mini test failed: ' + error.message
    });
  }
});

// Daily at 2AM
cron.schedule('0 2 * * *', async () => {
  await memoryService.consolidateMemories();
  console.log('Memory consolidation completed');
});

cron.schedule('0 3 * * *', async () => {
  const result = await memoryService.runAdaptiveRetention();
  console.log(`Memory optimization: Updated ${result.updated}, Deleted ${result.deleted}`);
});

cron.schedule('0 4 * * *', async () => {
  await insightService.generateCrossMemoryInsights();
  console.log('Cross-memory insights updated');
});

// Add learning interval
cron.schedule('*/15 * * * *', async () => {
  await services.learningService.processRecentInteractions();
  console.log('Proactive learning cycle completed');
});

// Then register the routes (add this code to your server.js where you set up routes)
app.use('/api/health', healthRoutes);
app.use('/api/system', systemRoutes);
app.use('/api/memory', memoryRoutes);

// Static files should come AFTER API routes
app.use(express.static('public'));

// Add logging middleware for all requests
app.use((req, res, next) => {
  logger.info('HTTP', `${req.method} ${req.url}`);
  next();
});