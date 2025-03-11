import express from 'express';
const router = express.Router();
import { generateDemoScenario } from '../scripts/demoGenerator.js';

router.post('/reset', async (req, res) => {
  await memoryService.clearAll();
  res.json({ success: true });
});

router.post('/init', async (req, res) => {
  const memories = await generateDemoScenario();
  res.json({ memories });
});

router.post('/learn-cycle', async (req, res) => {
  await learningService.processRecentInteractions();
  const metrics = await learningService.getLearningMetrics();
  res.json(metrics);
});

export default router; 