import express from 'express';
import { analyzeTemporalPatterns } from '../controllers/temporalController.js';
import { validateTemporalQuery } from '../middleware/validators.js';

const router = express.Router();

router.get('/patterns', (req, res) => {
  res.json({
    weekly: [],
    daily: [],
    intervals: {},
    durations: {}
  });
});

router.get('/patterns', validateTemporalQuery, analyzeTemporalPatterns);

export default router; 