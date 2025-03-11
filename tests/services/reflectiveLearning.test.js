import { jest } from '@jest/globals';
import { describe, test, expect } from '../../backend/test/testUtils.js';
import { ReflectiveLearning } from '../../backend/services/reflectiveLearning.js';

describe('ReflectiveLearning', () => {
  const mockKG = { 
    storeInsights: jest.fn(),
    findRelatedConcepts: jest.fn().mockResolvedValue([{ id: 'c1' }]),
    getKnowledgeSnapshot: jest.fn().mockResolvedValue({
      concepts: [],
      relationships: []
    })
  };
  
  const mockMeta = { 
    updateStrategies: jest.fn(),
    getPerformanceMetrics: jest.fn().mockResolvedValue({
      curiosity: { score: 0.8 },
      memory: { accuracy: 0.9 }
    }),
    adjustCuriosity: jest.fn()
  };
  
  const mockMemory = { 
    retrieveLearningHistory: jest.fn().mockResolvedValue({
      successfulLearningEpisodes: [],
      failedLearningAttempts: []
    }),
    retrieveErrorLogs: jest.fn().mockResolvedValue([])
  };

  test('should initialize reflective learning system', async () => {
    const reflective = new ReflectiveLearning(mockKG, mockMemory, mockMeta);
    await reflective.initialize();
    expect(reflective.initialized).toBe(true);
  });

  test('should perform deep reflection', async () => {
    const reflective = new ReflectiveLearning(mockKG, mockMemory, mockMeta);
    await reflective.initialize();
    
    mockMemory.retrieveLearningHistory.mockResolvedValue({
      successfulLearningEpisodes: [],
      failedLearningAttempts: []
    });

    const plan = await reflective.performDeepReflection();
    expect(plan).toBeDefined();
    expect(mockKG.storeInsights).toHaveBeenCalled();
  });

  test('should detect effective learning patterns', async () => {
    const reflective = new ReflectiveLearning(mockKG, mockMemory, mockMeta);
    await reflective.initialize();

    mockMemory.retrieveLearningHistory.mockResolvedValue({
      successfulLearningEpisodes: [{
        strategy: 'depth-first',
        context: 'mathematics',
        results: { newConnections: 12 }
      }],
      failedLearningAttempts: []
    });

    const plan = await reflective.performDeepReflection();
    expect(plan).toBeDefined();
    expect(plan.strategyAdjustments).toBeDefined();
    expect(plan.strategyAdjustments.length).toBeGreaterThan(0);
  });
}); 