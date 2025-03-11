import express from 'express';
import logger from '../../utils/logger.js';
import { checkQdrantAvailability } from '../../vectorStore.js';

const router = express.Router();

// Health check endpoint
router.get('/health', (req, res) => {
  logger.info('System', 'Health check requested');
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// Qdrant status check
router.get('/qdrant-status', async (req, res) => {
  try {
    logger.info('System', 'Qdrant status check requested');
    
    const status = await checkQdrantAvailability();
    
    res.json({
      status: status ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('System', 'Error checking Qdrant status', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// System info endpoint
router.get('/info', (req, res) => {
  logger.info('System', 'System info requested');
  
  const info = {
    version: process.env.npm_package_version || '1.0.0',
    nodeVersion: process.version,
    platform: process.platform,
    uptime: process.uptime(),
    memoryUsage: process.memoryUsage(),
    timestamp: new Date().toISOString()
  };
  
  res.json(info);
});

export default router; 