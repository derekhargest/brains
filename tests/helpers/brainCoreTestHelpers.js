/**
 * Test helpers and mock data for BrainCore tests
 */

export const mockMemories = [
  {
    id: 'mem1',
    content: 'The sky is blue because of light scattering.',
    metadata: {
      importance: 0.8,
      tags: ['science', 'observation'],
      source: 'physics_textbook',
      timestamp: new Date().toISOString()
    }
  },
  {
    id: 'mem2',
    content: 'Regular exercise improves cognitive function.',
    metadata: {
      importance: 0.9,
      tags: ['health', 'cognition'],
      source: 'research_paper',
      timestamp: new Date().toISOString()
    }
  },
  {
    id: 'mem3',
    content: 'JavaScript promises resolve asynchronously.',
    metadata: {
      importance: 0.7,
      tags: ['programming', 'javascript'],
      source: 'code_documentation',
      timestamp: new Date().toISOString()
    }
  }
];

export const mockPatterns = [
  {
    id: 'pat1',
    type: 'correlation',
    content: 'Exercise frequency correlates with memory performance',
    confidence: 0.85
  },
  {
    id: 'pat2',
    type: 'causation',
    content: 'Light wavelength determines perceived color',
    confidence: 0.92
  },
  {
    id: 'pat3',
    type: 'sequence',
    content: 'Promise chain execution order is predictable',
    confidence: 0.88
  }
];

export const mockConcepts = [
  {
    id: 'con1',
    type: 'principle',
    name: 'Rayleigh Scattering',
    properties: {
      domain: 'physics',
      complexity: 'medium',
      relatedConcepts: ['light', 'atmosphere', 'wavelength']
    }
  },
  {
    id: 'con2',
    type: 'mechanism',
    name: 'Neuroplasticity',
    properties: {
      domain: 'neuroscience',
      complexity: 'high',
      relatedConcepts: ['brain', 'learning', 'adaptation']
    }
  }
];

/**
 * Helper to validate memory object structure
 */
export function validateMemoryStructure(memory) {
  expect(memory).toHaveProperty('id');
  expect(memory).toHaveProperty('content');
  expect(memory).toHaveProperty('metadata');
  expect(memory.metadata).toHaveProperty('timestamp');
  expect(typeof memory.content).toBe('string');
  expect(typeof memory.metadata).toBe('object');
}

/**
 * Helper to validate pattern object structure
 */
export function validatePatternStructure(pattern) {
  expect(pattern).toHaveProperty('type');
  expect(pattern).toHaveProperty('content');
  expect(pattern).toHaveProperty('confidence');
  expect(typeof pattern.type).toBe('string');
  expect(typeof pattern.content).toBe('string');
  expect(typeof pattern.confidence).toBe('number');
  expect(pattern.confidence).toBeGreaterThan(0);
  expect(pattern.confidence).toBeLessThanOrEqual(1);
}

/**
 * Helper to validate concept object structure
 */
export function validateConceptStructure(concept) {
  expect(concept).toHaveProperty('type');
  expect(concept).toHaveProperty('name');
  expect(concept).toHaveProperty('properties');
  expect(typeof concept.type).toBe('string');
  expect(typeof concept.name).toBe('string');
  expect(typeof concept.properties).toBe('object');
}

/**
 * Helper to wait for async operations
 */
export function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Helper to generate random test data
 */
export function generateTestMemory(seed = Date.now()) {
  const topics = ['science', 'history', 'technology', 'art', 'literature'];
  const randomIdx = seed % topics.length;
  
  return {
    content: `Test memory about ${topics[randomIdx]} generated at ${new Date(seed).toISOString()}`,
    metadata: {
      importance: (seed % 10) / 10,
      tags: [topics[randomIdx]],
      source: 'test_generation',
      timestamp: new Date(seed).toISOString()
    }
  };
}

/**
 * Generates a mock embedding of specified size for testing
 * @param {string} text - The text to generate embedding for
 * @param {number} size - The dimension of the embedding vector (default: 384)
 * @returns {number[]} A deterministic embedding based on the input text
 */
export function generateMockEmbedding(text, size = 384) {
  // Create a deterministic but varied embedding based on the input text
  const seed = text.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const embedding = [];
  
  for (let i = 0; i < size; i++) {
    // Generate a value between -0.1 and 0.1 based on the character code sum and position
    const value = Math.sin((seed + i) / 100) * 0.1;
    embedding.push(parseFloat(value.toFixed(6)));
  }
  
  // Normalize the embedding to have unit length (common for embeddings)
  const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
  return embedding.map(val => parseFloat((val / magnitude).toFixed(6)));
}

/**
 * Creates a mock for the memory service's generateEmbedding method
 * @param {number} size - The dimension of the embedding to generate
 * @returns {Function} A mock function that returns a Promise resolving to a mock embedding
 */
export function mockGenerateEmbedding(size = 384) {
  return jest.fn().mockImplementation((text) => {
    return Promise.resolve(generateMockEmbedding(text, size));
  });
}

// Validation functions
export function isValidMemory(memory) {
  return (
    memory &&
    typeof memory.content === 'string' &&
    memory.metadata &&
    typeof memory.metadata === 'object'
  );
}

export function isValidPattern(pattern) {
  return (
    pattern &&
    typeof pattern.type === 'string' &&
    typeof pattern.content === 'string' &&
    typeof pattern.confidence === 'number' &&
    pattern.confidence >= 0 &&
    pattern.confidence <= 1
  );
}

export function isValidConcept(concept) {
  return (
    concept &&
    typeof concept.type === 'string' &&
    typeof concept.name === 'string' &&
    concept.properties &&
    typeof concept.properties === 'object'
  );
} 