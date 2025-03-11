const { EnhancedMemorySystem } = require('../index');

describe('Memory System Tests', () => {
  let mockEmbedding;
  
  before(() => {
    // Create mock embedding
    mockEmbedding = new Array(1536).fill(0.1);
    
    // Mock the OpenAI calls
    sinon.stub(EnhancedMemorySystem, 'generateEmbedding').resolves(mockEmbedding);
  });

  after(() => {
    sinon.restore();
  });

  beforeEach(() => {
    sinon.resetHistory();
  });

  it('should process a simple memory', async () => {
    const memory = {
      content: "Testing the memory system",
      context: { type: "test" }
    };

    const result = await EnhancedMemorySystem.processMemory(
      memory.content,
      memory.context
    );

    expect(result).to.be.an('object');
    expect(result).to.have.property('memoryId');
    expect(result).to.have.property('analysis');
    expect(result.analysis).to.have.property('context');
  });

  it('should validate memory content', async () => {
    const invalidMemory = {
      content: "",
      context: { type: "test" }
    };

    await expect(
      EnhancedMemorySystem.processMemory(invalidMemory.content, invalidMemory.context)
    ).to.be.rejectedWith('Content cannot be empty');
  });

  it('should generate embeddings correctly', async () => {
    const text = "Test content";
    const embedding = await EnhancedMemorySystem.generateEmbedding(text);
    
    expect(embedding).to.be.an('array');
    expect(embedding).to.have.lengthOf(1536);
  });

  it('should handle memory context', async () => {
    const memory = {
      content: "Test with context",
      context: { 
        type: "test",
        importance: "high",
        category: "work"
      }
    };

    const result = await EnhancedMemorySystem.processMemory(
      memory.content,
      memory.context
    );

    expect(result).to.have.property('analysis');
    expect(result.analysis).to.have.property('context');
    expect(result.analysis.context).to.deep.include(memory.context);
  });

  it('should include basic analysis properties', async () => {
    const memory = {
      content: "Test content for analysis",
      context: { type: "test" }
    };

    const result = await EnhancedMemorySystem.processMemory(
      memory.content,
      memory.context
    );

    expect(result.analysis).to.include.all.keys([
      'context',
      'patterns',
      'categories',
      'importance',
      'entities',
      'sentiment',
      'topics',
      'timestamp'
    ]);
  });
}); 