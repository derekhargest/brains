import express from 'express';
import logger from '../../utils/logger.js';

const router = express.Router();

// Basic health check endpoint
router.get('/', (req, res) => {
  logger.info('Health', 'Health check requested');
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

export default router; 