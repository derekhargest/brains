const request = require('supertest');
const express = require('express');
const fs = require('fs');
const path = require('path');
const uploadRouter = require('../uploadRoutes');

// Test router setup
const setupTestRouter = () => {
  const app = express();
  app.use(express.json());
  app.locals.services = {
    memoryService: {
      storeMemory: async (memory) => {
        // Mock implementation
        return { ...memory, id: 'test-id' };
      }
    }
  };
  app.use('/api/upload', uploadRouter);
  return app;
};

describe('Upload Routes', () => {
  let app;
  
  beforeEach(() => {
    // Create a test directory if it doesn't exist
    const uploadDir = path.join(__dirname, '../../../../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    app = setupTestRouter();
  });
  
  test('POST /json returns 400 if no file provided', async () => {
    const response = await request(app)
      .post('/api/upload/json')
      .expect(400);
    
    expect(response.body.error).toBe('No file provided');
  });
  
  test('POST /json returns 400 for invalid JSON', async () => {
    const response = await request(app)
      .post('/api/upload/json')
      .attach('jsonFile', Buffer.from('{ invalid json'), 'test.json')
      .expect(400);
    
    expect(response.body.error).toBe('Invalid JSON format');
  });
  
  test('POST /json processes memories array correctly', async () => {
    const testData = {
      memories: [
        { content: 'Test memory 1' },
        { content: 'Test memory 2' }
      ]
    };
    
    const response = await request(app)
      .post('/api/upload/json')
      .attach('jsonFile', Buffer.from(JSON.stringify(testData)), 'test.json')
      .expect(200);
    
    expect(response.body.success).toBe(true);
    expect(response.body.results.imported).toBe(2);
    expect(response.body.results.total).toBe(2);
  });
  
  test('POST /json handles generic JSON uploads', async () => {
    const testData = { test: 'value' }; // Not a memories array
    
    const response = await request(app)
      .post('/api/upload/json')
      .attach('jsonFile', Buffer.from(JSON.stringify(testData)), 'test.json')
      .expect(200);
    
    expect(response.body.success).toBe(true);
    expect(response.body.filename).toBeDefined();
  });
}); 