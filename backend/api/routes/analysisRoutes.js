// Create a new route file for analysis endpoints
import express from 'express';
import { analyzeText } from '../controllers/analysisController.js';

const router = express.Router();

// POST endpoint to analyze text
router.post('/', analyzeText);

export default router; 