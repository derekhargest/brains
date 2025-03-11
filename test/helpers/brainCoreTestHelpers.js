// Add mock pattern service implementation
export const mockPatternService = {
  learnFromMemory: jest.fn().mockResolvedValue(true),
  generateInsights: jest.fn().mockResolvedValue([
    { type: 'scientific', confidence: 0.95 }
  ])
};

export const mockVectorStore = {
  initialize: jest.fn(),
  storeMemory: jest.fn().mockImplementation(async (memory) => ({
    id: uuidv4(),
    ...memory
  })),
  close: jest.fn()
};

// Enhanced mock services
export const mockQdrantClient = {
  initialize: jest.fn(),
  upsert: jest.fn().mockResolvedValue(true),
  search: jest.fn().mockResolvedValue([]),
  close: jest.fn(),
  retrieve: jest.fn().mockImplementation(id => 
    mockMemories.find(m => m.id === id) || null
  )
};

// Mock timer functions
jest.useFakeTimers();

// Add timeout cleanup
afterEach(() => {
  jest.useRealTimers();
}); 