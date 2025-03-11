import express from 'express';
const router = express.Router();

router.get('/daily-patterns', async (req, res) => {
  const patterns = await temporalService.detectDailyPatterns();
  res.json(patterns);
});

router.get('/notifications', async (req, res) => {
  const notifications = await notificationService.getCurrentNotifications();
  res.json(notifications);
}); 