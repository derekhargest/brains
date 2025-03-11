import express from 'express';
import { PreferenceService } from '../../services/preferenceService.js';

const router = express.Router();
const preferenceService = new PreferenceService();

// Get user preferences
router.get('/', async (req, res) => {
  try {
    const preferences = await preferenceService.getUserPreferences();
    res.json({ 
      success: true, 
      preferences 
    });
  } catch (error) {
    console.error('Error fetching preferences:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve preferences'
    });
  }
});

// Update user preferences
router.post('/', async (req, res) => {
  try {
    const { preferences } = req.body;
    
    if (!preferences) {
      return res.status(400).json({
        success: false,
        error: 'Preferences data is required'
      });
    }
    
    const result = await preferenceService.updateUserPreferences(preferences);
    
    res.json({
      success: true,
      preferences: result
    });
  } catch (error) {
    console.error('Error updating preferences:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update preferences'
    });
  }
});

export default router; 