// Convert from CommonJS to ES Modules
import express from 'express';

const router = express.Router();

// Test endpoint to verify API is working
router.get('/ping', (req, res) => {
  res.json({ message: 'pong', timestamp: Date.now() });
});

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// Add any other test routes here

export default router; 