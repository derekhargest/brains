import { jest } from '@jest/globals';
import { BrainCore } from '../backend/api/brainCore.js';
import { 
  mockMemories, 
  mockPatterns, 
  mockConcepts, 
  isValidMemory,
  isValidPattern,
  isValidConcept,
  generateTestMemory,
  generateMockEmbedding
} from './helpers/brainCoreTestHelpers.js';
import { QdrantVectorStore } from '../backend/api/qdrantVectorStore.js';

// Set environment to test
process.env.NODE_ENV = 'test';

describe('BrainCore API', () => {
  let brainCore;

  beforeAll(async () => {
    // Mock vector store close for testing
    QdrantVectorStore.prototype.close = jest.fn().mockResolvedValue(true);
    
    // Initialize BrainCore instance for testing
    brainCore = new BrainCore();
    await brainCore.initialize();
    
    // Ensure services are initialized
    expect(brainCore.memoryService).toBeDefined();
    expect(brainCore.patternService).toBeDefined();
    expect(brainCore.knowledgeGraphService).toBeDefined();
  });

  describe('Initialization', () => {
    test('should initialize all required services', async () => {
      const newBrainCore = new BrainCore();
      await newBrainCore.initialize();
      
      expect(newBrainCore.memoryService).toBeDefined();
      expect(newBrainCore.patternService).toBeDefined();
      expect(newBrainCore.knowledgeGraphService).toBeDefined();
    });
  });

  describe('Memory Operations', () => {
    test('should store memory and return a valid ID', async () => {
      const memoryId = await brainCore.storeMemory(mockMemories[0]);
      expect(typeof memoryId).toBe('string');
      expect(memoryId).toMatch(/^[a-f0-9-]{36}$/);
    });

    test('should retrieve a stored memory by ID', async () => {
      const testMemory = generateTestMemory();
      const memoryId = await brainCore.storeMemory(testMemory.content, testMemory.metadata);
      
      const retrievedMemory = await brainCore.retrieveMemory(memoryId);
      
      expect(retrievedMemory).toBeDefined();
      expect(isValidMemory(retrievedMemory)).toBe(true);
      expect(retrievedMemory.content).toBe(testMemory.content);
      expect(retrievedMemory.metadata).toMatchObject(testMemory.metadata);
    });

    test('should search memories with a query and return relevant results', async () => {
      // Store multiple memories first
      for (const memory of mockMemories) {
        await brainCore.storeMemory(memory.content, memory.metadata);
      }
      
      // Search for memories related to a specific term
      const searchResults = await brainCore.searchMemories('science');
      
      expect(Array.isArray(searchResults)).toBe(true);
      expect(searchResults.length).toBeGreaterThan(0);
      
      // Verify each result is a valid memory
      searchResults.forEach(result => {
        expect(isValidMemory(result)).toBe(true);
      });
    });
  });

  describe('Pattern Detection', () => {
    test('should detect patterns in content', async () => {
      const content = 'Learning programming involves pattern recognition and problem-solving skills. Practice regularly improves these skills.';
      
      const patterns = await brainCore.detectPatterns(content);
      
      expect(Array.isArray(patterns)).toBe(true);
      expect(patterns.length).toBeGreaterThan(0);
      
      // Verify each detected pattern is valid
      patterns.forEach(pattern => {
        expect(isValidPattern(pattern)).toBe(true);
      });
    });

    test('should generate insights based on stored patterns', async () => {
      // First store some memories to ensure patterns are generated
      for (const memory of mockMemories) {
        await brainCore.storeMemory(memory.content, memory.metadata);
      }
      
      const insights = await brainCore.getInsights();
      
      expect(Array.isArray(insights)).toBe(true);
      
      // If insights are found, verify they are valid patterns
      if (insights.length > 0) {
        insights.forEach(insight => {
          expect(isValidPattern(insight)).toBe(true);
        });
      }
    });
  });

  describe('Knowledge Graph Operations', () => {
    test('should add a concept to the knowledge graph', async () => {
      const conceptData = {
        type: 'concept',
        name: 'Machine Learning',
        properties: {
          domain: 'computer science',
          complexity: 'high',
          relatedConcepts: ['AI', 'neural networks', 'algorithms']
        }
      };
      
      const result = await brainCore.addToKnowledgeGraph(conceptData);
      
      expect(result).toBe(true);
    });

    test('should find related concepts in the knowledge graph', async () => {
      // First add some concepts to ensure we have data
      for (const concept of mockConcepts) {
        await brainCore.addToKnowledgeGraph(concept);
      }
      
      const relatedConcepts = await brainCore.findRelatedConcepts('learning');
      
      expect(Array.isArray(relatedConcepts)).toBe(true);
      
      // If related concepts are found, verify they are valid
      if (relatedConcepts.length > 0) {
        relatedConcepts.forEach(concept => {
          expect(isValidConcept(concept)).toBe(true);
        });
      }
    });
  });

  describe('Integration Tests', () => {
    test('should process patterns when storing memory', async () => {
      // Mock the processMemoryPatterns method to verify it's called
      const originalMethod = brainCore.processMemoryPatterns;
      brainCore.processMemoryPatterns = jest.fn();
      
      const testMemory = generateTestMemory();
      await brainCore.storeMemory(testMemory.content, testMemory.metadata);
      
      expect(brainCore.processMemoryPatterns).toHaveBeenCalled();
      
      // Restore original method
      brainCore.processMemoryPatterns = originalMethod;
    });

    test('should update knowledge graph when new patterns are detected', async () => {
      // Mock the knowledgeGraphService.addRelationship method
      const originalMethod = brainCore.knowledgeGraphService.addRelationship;
      brainCore.knowledgeGraphService.addRelationship = jest.fn().mockResolvedValue(true);
      
      const content = 'Machine learning algorithms improve with more training data. Neural networks are a subset of machine learning models.';
      
      await brainCore.detectPatterns(content);
      
      // Check if knowledge graph was updated through pattern processing
      expect(brainCore.knowledgeGraphService.addRelationship).toHaveBeenCalled();
      
      // Restore original method
      brainCore.knowledgeGraphService.addRelationship = originalMethod;
    });
  });

  describe('Error Handling', () => {
    test('should gracefully handle invalid memory retrieval', async () => {
      await expect(brainCore.retrieveMemory('non-existent-id')).resolves.toBeNull();
    });

    test('should handle errors in pattern detection', async () => {
      // Mock the patternService.detectPatterns method to throw an error
      const originalMethod = brainCore.patternService.detectPatterns;
      brainCore.patternService.detectPatterns = jest.fn().mockRejectedValue(new Error('Pattern detection failed'));
      
      // Should not throw but return an empty array
      await expect(brainCore.detectPatterns('test content')).resolves.toEqual([]);
      
      // Restore original method
      brainCore.patternService.detectPatterns = originalMethod;
    });
  });

  describe('Core Functionality', () => {
    test('should handle memory lifecycle', async () => {
      const memory = await brainCore.storeMemory(mockMemories[0]);
      const retrieved = await brainCore.retrieveMemory(memory.id);
      await brainCore.deleteMemory(memory.id);
      
      expect(retrieved).toMatchObject(memory);
      await expect(brainCore.retrieveMemory(memory.id)).resolves.toBeNull();
    });

    test('should detect patterns in stored content', async () => {
      const patterns = await brainCore.detectPatterns("Repeated test pattern");
      expect(patterns).toEqual(expect.arrayContaining([
        expect.objectContaining({type: 'scientific'})
      ]));
    });
  });

  test('should close connections properly', async () => {
    await brainCore.memoryService.vectorStore.close();
    expect(QdrantVectorStore.prototype.close).toHaveBeenCalled();
  });

  afterAll(async () => {
    // Cleanup all services
    await brainCore.memoryService?.cleanup();
    await brainCore.knowledgeGraphService?.cleanup();
    
    // Clear any remaining mocks
    jest.restoreAllMocks();
    
    // Force event loop to process
    await new Promise(resolve => setImmediate(resolve));
  });
}); 