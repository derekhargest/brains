describe('ReflectiveLearning', () => {
  const mockKG = { 
    storeInsights: jest.fn(),
    findRelatedConcepts: jest.fn().mockResolvedValue([{ id: 'c1' }])
  };
  const mockMeta = { updateStrategies: jest.fn() };
  const learner = new ReflectiveLearning(mockKG, {}, mockMeta);

  test('should generate improvement plans from reflections', async () => {
    const plan = await learner.performDeepReflection();
    
    expect(plan).toHaveProperty('strategyAdjustments');
    expect(plan).toHaveProperty('curiosityParameters');
    expect(mockKG.storeInsights).toHaveBeenCalled();
  });

  test('should detect effective learning patterns', async () => {
    const analyzer = new LearningPatternAnalyzer();
    const patterns = await analyzer.analyze({
      learningHistory: {
        successfulLearningEpisodes: [{
          strategy: 'depth-first',
          context: 'mathematics',
          results: { newConnections: 12 }
        }]
      }
    });
    
    expect(patterns).toContainObject({
      type: 'effective_pattern',
      strategy: 'depth-first'
    });
  });
}); 