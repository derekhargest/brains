const axios = require('axios');
const fs = require('fs').promises;

async function bulkUpload(filePath) {
  try {
    console.log(`Reading memories from ${filePath}...`);
    const fileContent = await fs.readFile(filePath, 'utf8');
    const data = JSON.parse(fileContent);
    
    if (!data.memories || !Array.isArray(data.memories)) {
      throw new Error('Invalid format: Expected memories array in the JSON');
    }
    
    console.log(`Found ${data.memories.length} memories to upload`);
    
    // Upload in batches for better performance
    const batchSize = 10;
    let processed = 0;
    
    for (let i = 0; i < data.memories.length; i += batchSize) {
      const batch = data.memories.slice(i, i + batchSize);
      console.log(`Uploading batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(data.memories.length/batchSize)}`);
      
      // Upload each memory individually
      for (const memory of batch) {
        try {
          await axios.post('http://localhost:3001/api/memories', memory);
          processed++;
          process.stdout.write(`.`); // Progress indicator
        } catch (err) {
          console.error(`\nError uploading memory: ${err.message}`);
        }
      }
      
      // Small delay to prevent overloading
      await new Promise(r => setTimeout(r, 200));
    }
    
    console.log(`\nDone! Successfully uploaded ${processed} out of ${data.memories.length} memories.`);
  } catch (error) {
    console.error('Error during bulk upload:', error.message);
  }
}

// Usage
const filePath = process.argv[2];
if (!filePath) {
  console.error('Please provide a file path to the memories JSON file');
  process.exit(1);
}

bulkUpload(filePath); 