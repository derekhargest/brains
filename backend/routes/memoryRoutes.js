router.get('/health', async (req, res) => {
  const memories = await memoryService.search('', { limit: 10000 });
  
  const importanceDistribution = {
    high: memories.filter(m => m.metadata.importance >= 0.7).length,
    medium: memories.filter(m => m.metadata.importance >= 0.4 && m.metadata.importance < 0.7).length,
    low: memories.filter(m => m.metadata.importance < 0.4).length
  };
  
  res.json({ importanceDistribution });
});

router.get('/', async (req, res) => {
  // Should return array of memories
}); 