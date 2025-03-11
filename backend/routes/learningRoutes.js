router.get('/metrics', async (req, res) => {
  const metrics = await learningService.getLearningMetrics();
  res.json(metrics);
});

router.get('/patterns', async (req, res) => {
  const patterns = await learningService.getLearnedPatterns();
  res.json(patterns);
}); 