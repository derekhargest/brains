/**
 * Common utilities for all test modules
 */

const { v4: uuidv4 } = require('uuid');
const { connectVectorStore } = require('../../storage/vectorStore');
const MemoryService = require('../../services/memoryService');
const PatternLearner = require('../../patterns/patternLearner');
const InsightGenerator = require('../../patterns/insightGenerator');
const VisualizationService = require('../../services/visualizationService');
const colors = require('./colors');

// Configuration
const TEST_COLLECTION_PREFIX = 'test_';

// Test memory samples
const testMemories = [
  {
    content: "Morning standup with the team. Sarah mentioned issues with the database performance. Need to investigate query optimization.",
    timestamp: "2024-03-01T09:00:00Z",
    tags: ["meeting", "technical", "performance"]
  },
  {
    content: "Lunch with Tom from the ML team. Fascinating discussion about transformer architectures and their application in our context.",
    timestamp: "2024-03-01T12:30:00Z",
    tags: ["lunch", "technical", "ML", "NLP"]
  },
  {
    content: "Afternoon debugging session with Sarah. Found that the database indexing was misconfigured, causing the performance issues from this morning.",
    timestamp: "2024-03-01T15:00:00Z",
    tags: ["technical", "debugging", "performance", "database"]
  },
  {
    content: "Weekly team meeting. Everyone shared progress on their modules. The NLP pipeline is ahead of schedule but the visualization component is delayed.",
    timestamp: "2024-03-02T10:00:00Z",
    tags: ["meeting", "team", "status update"]
  },
  {
    content: "Morning coffee with Sarah. Discussed the solution to yesterday's database issue and planned the implementation for today.",
    timestamp: "2024-03-02T08:30:00Z",
    tags: ["coffee", "planning", "database"]
  }
];

// Search queries for testing
const searchQueries = [
  { text: "database performance issues", expectedMinResults: 2 },
  { text: "meeting with team", expectedMinResults: 2 },
  { text: "Sarah coffee", expectedMinResults: 1 }
];

// Utility function for sleeping
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Helper functions
function printMemoryDetails(memory) {
  if (!memory) {
    console.log('  [Memory not found]');
    return;
  }
  
  console.log('Memory Details:');
  console.log(`ID: ${memory.id}`);
  console.log(`Content: ${memory.content.substring(0, 80)}${memory.content.length > 80 ? '...' : ''}`);
  console.log(`Tags: ${memory.tags ? memory.tags.join(', ') : 'none'}`);
  console.log(`Timestamp: ${memory.timestamp}`);
}

// Print a JavaScript object
function printObject(obj, title) {
  const lines = [];
  if (title) lines.push(title);
  
  // Simple JSON formatting with indentation
  const formatted = JSON.stringify(obj, null, 2)
    .replace(/[{]/g, '')
    .replace(/[}]/g, '')
    .split('\n');
  
  lines.push(...formatted);
  
  lines.forEach(line => console.log(line));
}

// Setup the test environment
async function setupTestEnvironment() {
  const testCollectionName = `${TEST_COLLECTION_PREFIX}${Date.now()}`;
  
  try {
    // Connect to vector database
    console.log(`Connecting to Qdrant at http://localhost:6333...`);
    const vectorStore = await connectVectorStore();
    
    // Create test collection
    try {
      console.log(`Created collection: ${testCollectionName}`);
      await vectorStore.createCollection(testCollectionName, {
        vectors: { size: 384, distance: "Cosine" }
      });
    } catch (error) {
      console.log(`Collection ${testCollectionName} already exists`);
    }
    
    // Initialize memory service with this collection
    const memoryService = new MemoryService(vectorStore, testCollectionName);
    
    // Add a custom embedding function to the memory service
    memoryService.getEmbedding = async (text) => {
      // Simple test embedding function that returns a 384-dim vector
      return Array(384).fill(0).map(() => Math.random() * 2 - 1);
    };
    
    // Initialize pattern learner (not service)
    const patternLearner = new PatternLearner();
    await patternLearner.initialize();
    
    // Initialize insight generator
    const insightGenerator = new InsightGenerator();
    
    // Initialize visualization service
    const visualizationService = new VisualizationService();
    
    console.log(`✅ Memory service successfully initialized with Qdrant`);
    
    return {
      testCollectionName,
      vectorStore,
      memoryService,
      patternLearner,
      insightGenerator,
      visualizationService
    };
  } catch (error) {
    console.error(`Failed to set up test environment: ${error.message}`);
    throw error;
  }
}

// Simple test utilities for pretty printing test results
function printSuccess(message) {
  console.log(`${colors.green}✓ ${message}${colors.reset}`);
}

function printError(message) {
  console.log(`${colors.red}✗ ${message}${colors.reset}`);
}

function printInfo(message) {
  console.log(`${colors.yellow}ℹ ${message}${colors.reset}`);
}

// Custom test utilities for creating suites
const describe = {
  suites: {},
  currentSuite: null
};

// Register a test suite
function registerSuite(name, fn) {
  if (!describe.suites[name]) {
    describe.suites[name] = [];
  }
  describe.currentSuite = name;
  fn();
  describe.currentSuite = null;
}

// Register a test within a suite
function registerTest(name, fn) {
  if (!describe.currentSuite) {
    throw new Error('Test must be defined within a suite');
  }
  describe.suites[describe.currentSuite].push({ name, fn });
}

module.exports = {
  printSuccess,
  printError,
  printInfo,
  describe: registerSuite,
  test: registerTest,
  testMemories,
  searchQueries,
  sleep,
  printMemoryDetails,
  printObject,
  setupTestEnvironment
}; 