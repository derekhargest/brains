describe('EnhancedCuriosityEngine Meta-Learning', () => {
  const mockMeta = { getOptimizations: jest.fn() };
  const engine = new EnhancedCuriosityEngine({}, {}, mockMeta);

  test('should adapt exploration policies from meta-learning', async () => {
    mockMeta.getOptimizations.mockResolvedValue([
      { parameter: 'depthFirstBias', adjustment: +0.2 },
      { parameter: 'riskTolerance', adjustment: -0.1 }
    ]);
    
    await engine._adaptFromMetaLearning();
    
    expect(engine.explorationPolicies.depthFirstBias).toBe(0.8);
    expect(engine.explorationPolicies.riskTolerance).toBe(0.6);
  });
}); 