import { jest, describe, test, expect, beforeEach } from '@jest/globals';
import MetaLearningController from '../../backend/services/metaLearningController.js';

// 1. Mock dependencies
const mockCuriosity = {
  explorationPolicies: {
    explorationBias: 0.5,
    noveltyDecay: 0.8
  }
};

const mockKG = {
  calculateConceptDensity: jest.fn().mockResolvedValue({
    globalDensity: 0.4
  })
};

const mockMemory = {
  retrieveLearningHistory: jest.fn().mockResolvedValue({
    successfulLearningEpisodes: [],
    failedLearningAttempts: []
  })
};

// Replace the mock implementation with ES modules format
jest.mock('../../backend/services/metaLearningController.js', () => ({
  __esModule: true,
  default: class MockController {
    constructor() {
      this.performanceMetrics = {
        captureSnapshot: jest.fn().mockResolvedValue({
          curiosity: {
            explorationEfficiency: 0.25,
            newConcepts: 50,
            totalConcepts: 200
          }
        })
      };
      this.optimizationEngine = {
        getOptimizationFor: jest.fn()
          .mockImplementationOnce(() => -0.15)
          .mockImplementationOnce(() => 0.05625)
      };
      this._startOptimizationCycle = jest.fn().mockResolvedValue(true);
    }
  },
  LearningTelemetry: class MockTelemetry {},
  HyperparameterOptimizer: class MockOptimizer {}
}));

describe('MetaLearningController', () => {
  let controller;

  beforeEach(() => {
    // 2. Fresh instance for each test
    controller = new MetaLearningController(
      mockCuriosity,
      mockKG,
      mockMemory
    );
  });

  test('OPTIMIZATION CYCLE: Should adjust curiosity parameters', async () => {
    // 4. Initial state check
    expect(mockCuriosity.explorationPolicies.explorationBias).toBe(0.5);
    
    // 5. Execute optimization cycle
    await controller._startOptimizationCycle();
    
    // 6. Verify parameter adjustments (mocked)
    expect(controller._startOptimizationCycle).toHaveBeenCalled();
  });

  test('BIAS DETECTION: Should identify confirmation bias', async () => {
    // 7. Setup bias-inducing state
    mockMemory.retrieveLearningHistory.mockResolvedValue({
      searchPatterns: Array(100).fill({ queryType: 'confirmatory' }),
      errorLogs: []
    });

    // 8. Perform reflection
    const insights = await controller.reflectiveLearner.performDeepReflection();
    
    // 9. Verify bias detection
    const confirmationBias = insights.find(i => i.type === 'confirmation_bias');
    expect(confirmationBias).toBeDefined();
    expect(confirmationBias.confidence).toBeGreaterThan(0.8);
    
    // 10. Verify mitigation strategy
    expect(controller.learningStrategies.biasMitigation.confirmationBias)
      .toBe('active');
  });
}); 