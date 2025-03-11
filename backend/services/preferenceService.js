/**
 * Preference Service
 * Handles user preferences storage and retrieval
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import * as fsExtra from 'fs-extra';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export class PreferenceService {
  constructor(options = {}) {
    this.dataDir = options.dataDir || path.join(__dirname, '..', '..', 'data');
    this.preferencesFile = path.join(this.dataDir, 'preferences.json');
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return true;
    
    try {
      // Ensure data directory exists
      await fsExtra.ensureDir(this.dataDir);
      
      // Check if preferences file exists, create if not
      try {
        await fs.access(this.preferencesFile);
      } catch {
        // Default preferences
        const defaultPreferences = {
          theme: 'light',
          notifications: true,
          dataRetention: 90, // days
          privacySettings: {
            allowAnalytics: false,
            allowUsageData: true
          },
          displaySettings: {
            showTimestamps: true,
            compactView: false
          },
          lastUpdated: new Date().toISOString()
        };
        
        await fs.writeFile(
          this.preferencesFile, 
          JSON.stringify(defaultPreferences, null, 2)
        );
      }
      
      this.initialized = true;
      return true;
    } catch (error) {
      console.error('Error initializing preference service:', error);
      throw error;
    }
  }

  async getUserPreferences() {
    if (!this.initialized) {
      await this.initialize();
    }
    
    try {
      const data = await fs.readFile(this.preferencesFile, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error reading preferences:', error);
      throw error;
    }
  }

  async updateUserPreferences(preferences) {
    if (!this.initialized) {
      await this.initialize();
    }
    
    try {
      // Get current preferences
      const currentPreferences = await this.getUserPreferences();
      
      // Merge with new preferences
      const updatedPreferences = {
        ...currentPreferences,
        ...preferences,
        lastUpdated: new Date().toISOString()
      };
      
      // Save updated preferences
      await fs.writeFile(
        this.preferencesFile,
        JSON.stringify(updatedPreferences, null, 2)
      );
      
      return updatedPreferences;
    } catch (error) {
      console.error('Error updating preferences:', error);
      throw error;
    }
  }
}

export default PreferenceService; 