import { EnhancedMemorySystem } from '../index.js';

describe('Memory System Tests', () => {
  let mockEmbedding;
  
  beforeEach(() => {
    mockEmbedding = new Array(384).fill(0.1);
  });

  test('should store and retrieve memories', async () => {
    const memorySystem = new EnhancedMemorySystem();
    await memorySystem.initialize();

    const memory = {
      content: 'Test memory content',
      metadata: {
        importance: 0.8,
        source: 'test'
      }
    };

    const storedId = await memorySystem.storeMemory(memory);
    expect(storedId).toBeDefined();

    const retrieved = await memorySystem.getMemory(storedId);
    expect(retrieved.content).toBe(memory.content);
    expect(retrieved.metadata.importance).toBe(memory.metadata.importance);
  });

  test('should search memories effectively', async () => {
    const memorySystem = new EnhancedMemorySystem();
    await memorySystem.initialize();

    // Store multiple memories
    const memories = [
      { content: 'First test memory', metadata: { importance: 0.7 } },
      { content: 'Second test memory', metadata: { importance: 0.8 } },
      { content: 'Third test memory', metadata: { importance: 0.9 } }
    ];

    for (const memory of memories) {
      await memorySystem.storeMemory(memory);
    }

    const results = await memorySystem.searchMemories('test memory');
    expect(results.length).toBeGreaterThan(0);
  });
}); 