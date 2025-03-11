import { jest } from '@jest/globals';
import { describe, test, expect } from '../../backend/test/testUtils.js';
import { MetaLearningController } from '../../backend/services/metaLearningController.js';

describe('MetaLearningController', () => {
  const mockCuriosityEngine = {
    updateExplorationPolicy: jest.fn()
  };

  const mockKnowledgeGraph = {
    storeInsights: jest.fn(),
    getKnowledgeSnapshot: jest.fn().mockResolvedValue({
      concepts: [],
      relationships: []
    }),
    updateInferencePolicy: jest.fn()
  };

  const mockMemoryService = {
    retrieveLearningHistory: jest.fn().mockResolvedValue({
      successfulLearningEpisodes: [],
      failedLearningAttempts: []
    }),
    retrieveErrorLogs: jest.fn().mockResolvedValue([]),
    updateRetentionPolicy: jest.fn()
  };

  test('OPTIMIZATION CYCLE: Should adjust curiosity parameters', async () => {
    const controller = new MetaLearningController(
      mockCuriosityEngine,
      mockKnowledgeGraph,
      mockMemoryService
    );

    const metrics = {
      getSystemMetrics: jest.fn().mockReturnValue({
        successfulExplorations: 5,
        totalExplorations: 20,
        newConcepts: 10,
        totalConcepts: 100
      })
    };

    const improvements = await controller.analyzeLearningDynamics(metrics);
    
    expect(improvements).toBeDefined();
    expect(improvements.length).toBeGreaterThan(0);
    expect(improvements[0]).toHaveProperty('system', 'curiosity');
  });

  test('BIAS DETECTION: Should identify exploration bias adjustment', async () => {
    const controller = new MetaLearningController(
      mockCuriosityEngine,
      mockKnowledgeGraph,
      mockMemoryService
    );

    const metrics = {
      getSystemMetrics: jest.fn().mockReturnValue({
        successfulExplorations: 5,
        totalExplorations: 20,
        newConcepts: 10,
        totalConcepts: 100
      })
    };

    const improvements = await controller.analyzeLearningDynamics(metrics);
    
    expect(improvements).toBeDefined();
    
    // Check if there's an exploration bias adjustment
    const hasBiasAdjustment = improvements.some(
      imp => imp.parameter === 'explorationBias' && imp.adjustment < 0
    );
    
    expect(hasBiasAdjustment).toBe(true);
  });
}); 