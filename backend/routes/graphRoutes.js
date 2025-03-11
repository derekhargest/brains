router.get('/insights', async (req, res) => {
  const insights = await insightService.generateCrossMemoryInsights();
  res.json({ insights });
});

router.get('/connections/:memoryId', async (req, res) => {
  const connections = await knowledgeGraphService.findCrossConnections(
    req.params.memoryId,
    req.query.depth || 2
  );
  res.json({ connections });
}); 