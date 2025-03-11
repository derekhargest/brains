import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';

const router = express.Router();

// Configure multer for JSON file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads');
    // Ensure the directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'json-' + uniqueSuffix + ext);
  }
});

const upload = multer({ 
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/json' || file.originalname.endsWith('.json')) {
      cb(null, true);
    } else {
      cb(new Error('Only JSON files are allowed'));
    }
  }
});

// Route to handle JSON file uploads
router.post('/json', upload.single('jsonFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    // Read the uploaded file
    const filePath = req.file.path;
    const fileContents = fs.readFileSync(filePath, 'utf8');
    
    // Parse JSON to validate format
    let jsonData;
    try {
      jsonData = JSON.parse(fileContents);
    } catch (jsonError) {
      // Delete invalid file
      fs.unlinkSync(filePath);
      return res.status(400).json({ error: 'Invalid JSON format' });
    }
    
    // Process the JSON data as needed
    // For example, if it's memory data, import it into your memory service
    if (jsonData.memories && Array.isArray(jsonData.memories)) {
      const memoryService = req.app.locals.services.memoryService;
      if (memoryService) {
        // Process each memory
        const importResults = {
          total: jsonData.memories.length,
          imported: 0,
          failed: 0
        };
        
        for (const memory of jsonData.memories) {
          try {
            await memoryService.storeMemory(memory);
            importResults.imported++;
          } catch (error) {
            console.error('Error importing memory:', error);
            importResults.failed++;
          }
        }
        
        return res.json({
          success: true,
          message: `Successfully imported ${importResults.imported} of ${importResults.total} memories`,
          results: importResults
        });
      }
    }
    
    // Generic success response if no specific handling
    res.json({
      success: true,
      message: 'File uploaded successfully',
      filename: req.file.filename,
      size: req.file.size
    });
    
  } catch (error) {
    console.error('Error handling file upload:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update the direct JSON upload endpoint with proper memory processing
router.post('/direct', express.json({limit: '10mb'}), async (req, res) => {
  try {
    console.log('Direct upload received:', req.body.filename);
    const { filename, content } = req.body;
    
    if (!content || !filename) {
      return res.status(400).json({ error: 'Missing filename or content' });
    }
    
    // Process the JSON data based on its structure
    if (content.memories && Array.isArray(content.memories)) {
      console.log(`Processing ${content.memories.length} memories from direct upload`);
      const memoryService = req.app.locals.services.memoryService;
      if (memoryService) {
        // Process each memory
        const importResults = {
          total: content.memories.length,
          imported: 0,
          failed: 0
        };
        
        for (const memory of content.memories) {
          try {
            await memoryService.storeMemory(memory);
            importResults.imported++;
          } catch (error) {
            console.error('Error importing memory:', error);
            importResults.failed++;
          }
        }
        
        return res.json({
          success: true,
          message: `Successfully imported ${importResults.imported} of ${importResults.total} memories`,
          results: importResults
        });
      } else {
        console.warn('Memory service not available for import');
      }
    }
    
    // Save the uploaded JSON to a file for backup
    const uploadDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    const filePath = path.join(uploadDir, `direct-${Date.now()}-${filename}`);
    fs.writeFileSync(filePath, JSON.stringify(content, null, 2));
    
    // Generic success response if no specific handling
    res.json({
      success: true,
      message: 'Data processed successfully',
      filename: filename
    });
    
  } catch (error) {
    console.error('Error processing direct upload:', error);
    res.status(500).json({ error: error.message });
  }
});

// Add this simple GET endpoint for testing
router.get('/test', (req, res) => {
  res.json({ message: 'Upload route is working!' });
});

export default router; 