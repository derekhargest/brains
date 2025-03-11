import express from 'express';

const router = express.Router();

// Simple test route
router.get('/ping', (req, res) => {
  res.json({ message: 'pong', timestamp: new Date().toISOString() });
});

export default router; 