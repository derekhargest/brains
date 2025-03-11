/**
 * Simple file-based storage utility
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Ensure the data directory exists with better error handling
const DATA_DIR = path.join(__dirname, '../data');
try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    console.log(`Created data directory at ${DATA_DIR}`);
  }
} catch (error) {
  console.error(`CRITICAL: Could not create data directory: ${error.message}`);
}

export const fileStorage = {
  /**
   * Save data to a JSON file
   * @param {string} filename - Name of the file (without path)
   * @param {Object} data - Data to save
   */
  save: async (filename, data) => {
    const filePath = path.join(DATA_DIR, filename);
    
    try {
      await fs.promises.writeFile(
        filePath, 
        JSON.stringify(data, null, 2)
      );
      console.log(`Data saved to ${filename}`);
      return true;
    } catch (error) {
      console.error(`Failed to save data to ${filename}:`, error);
      return false;
    }
  },
  
  /**
   * Load data from a JSON file
   * @param {string} filename - Name of the file (without path)
   * @param {Object} defaultData - Default data if file doesn't exist
   * @returns {Object} - Loaded data
   */
  load: async (filename, defaultData = {}) => {
    const filePath = path.join(DATA_DIR, filename);
    
    try {
      if (!fs.existsSync(filePath)) {
        console.log(`File ${filename} doesn't exist, using default data`);
        return defaultData;
      }
      
      const data = await fs.promises.readFile(filePath, 'utf8');
      const parsed = JSON.parse(data);
      console.log(`Successfully loaded data from ${filename}`);
      return parsed;
    } catch (error) {
      console.error(`Failed to load data from ${filename}:`, error);
      console.log(`Using default data instead for ${filename}`);
      return defaultData;
    }
  }
};

export default fileStorage; 