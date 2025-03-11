import express from 'express';
import { advancedSearch } from '../vectorStore.js';

const router = express.Router();

router.get('/related/:entity', async (req, res) => {
  const { entity } = req.params;
  
  const results = await advancedSearch(entity, {
    collection: 'memory_entities',
    limit: 10,
    filters: {
      'metadata.entityType': req.query.type
    }
  });

  res.json({
    entity,
    relatedMemories: results
  });
});

export default router; 