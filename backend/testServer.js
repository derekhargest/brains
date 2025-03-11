// Test server script that runs the server with enhanced logging
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { 
  checkQdrantAvailability,
  storeMemory,
  getMemory 
} from './vectorStore.js';  // Single source of truth

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Redirect logs to file
const logStream = fs.createWriteStream(path.join(logsDir, `server-${Date.now()}.log`), { flags: 'a' });

// Set environment variable to enable verbose logging
const env = { ...process.env, VERBOSE_LOGGING: 'true', NODE_ENV: 'development' };

console.log('🧠 Starting Brains!!! server in test mode...');
console.log('📝 Verbose logging enabled');

// Start the server process
const serverProcess = spawn('node', ['server.js'], { 
  env,
  cwd: path.join(__dirname, '..'),
  stdio: ['inherit', 'pipe', 'pipe']
});

// Pipe the output to both console and log file
serverProcess.stdout.pipe(process.stdout);
serverProcess.stderr.pipe(process.stderr);
serverProcess.stdout.pipe(logStream);
serverProcess.stderr.pipe(logStream);

// Listen for server process events
serverProcess.on('error', (error) => {
  console.error(`❌ Server process error: ${error.message}`);
});

serverProcess.on('exit', (code) => {
  console.log(`🛑 Server process exited with code ${code}`);
  logStream.end();
});

// Run some basic tests once the server is up
let serverReady = false;
serverProcess.stdout.on('data', (data) => {
  const output = data.toString();
  
  // Check if server is ready
  if (output.includes('Server running') && !serverReady) {
    serverReady = true;
    console.log('🚀 Server is ready! Waiting 2 seconds before running tests...');
    
    // Add a small delay to ensure the server is fully initialized
    setTimeout(() => {
      runBasicTests();
    }, 2000);
  }
});

async function runBasicTests() {
  console.log('🧪 Running basic feature tests...');
  
  try {
    // Test 1: Check server is responding - use a more explicit path
    const healthUrl = 'http://localhost:3001/api/health';
    console.log(`Testing health endpoint: ${healthUrl}`);
    const response = await fetch(healthUrl);
    
    if (response.ok) {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        console.log('✅ API Health check successful:', data);
      } else {
        const text = await response.text();
        console.error('❌ API Health check returned non-JSON response:', 
          text.substring(0, 100) + (text.length > 100 ? '...' : ''));
      }
    } else {
      console.error('❌ API Health check failed with status:', response.status);
      const text = await response.text();
      console.error('Response:', text.substring(0, 100) + (text.length > 100 ? '...' : ''));
    }
    
    // Test 2: Check vector store connection with better error handling
    const qdrantUrl = 'http://localhost:3001/api/system/qdrant-status';
    console.log(`Testing Qdrant status endpoint: ${qdrantUrl}`);
    const qdrantResponse = await fetch(qdrantUrl);
    
    if (qdrantResponse.ok) {
      const contentType = qdrantResponse.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const qdrantStatus = await qdrantResponse.json();
        console.log('✅ Qdrant status:', qdrantStatus.status);
        if (qdrantStatus.status !== 'connected') {
          console.log('⏩ Skipping memory tests - Qdrant not connected');
          return;
        }
      } else {
        const text = await qdrantResponse.text();
        console.error('❌ Qdrant check returned non-JSON response:', 
          text.substring(0, 100) + (text.length > 100 ? '...' : ''));
      }
    } else {
      console.error('❌ Qdrant check failed with status:', qdrantResponse.status);
      const text = await qdrantResponse.text();
      console.error('Response:', text.substring(0, 100) + (text.length > 100 ? '...' : ''));
    }
    
    // Only proceed with memory tests if health checks passed
    if (response.ok && qdrantResponse.ok) {
      // Test 3: Try to store a basic memory
      const storeResponse = await fetch('http://localhost:3001/api/memory/store', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: 'Test memory created during server startup',
          type: 'test',
          metadata: { source: 'system-test', timestamp: new Date().toISOString() }
        })
      });
      
      if (storeResponse.ok) {
        const result = await storeResponse.json();
        console.log(`✅ Memory storage test successful. Memory ID: ${result.id}`);
        
        // Test 4: Try to retrieve the memory we just stored
        const retrieveResponse = await fetch(`http://localhost:3001/api/memory/${result.id}`);
        if (retrieveResponse.ok) {
          console.log('✅ Memory retrieval test successful');
        } else {
          console.error('❌ Memory retrieval test failed:', await retrieveResponse.text());
        }
        
      } else {
        console.error('❌ Memory storage test failed:', await storeResponse.text());
      }
    }
    
    console.log('🧪 Basic tests completed');
    
  } catch (error) {
    console.error('❌ Error running tests:', error.message);
  }
} 