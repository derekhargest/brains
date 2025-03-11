import express from 'express';
import { checkCollectionsHealth } from '../vectorStore.js';

const router = express.Router();

router.get('/health', async (req, res) => {
  try {
    const health = await checkCollectionsHealth();
    res.json(health);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to check system health',
      message: error.message
    });
  }
});

export default router; 