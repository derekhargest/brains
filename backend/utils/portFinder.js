import net from 'net';

/**
 * Check if a specific port is available
 * @param {number} port The port to check
 * @returns {Promise<boolean>} True if port is available, false otherwise
 */
function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    
    server.once('error', (err) => {
      server.close();
      if (err.code === 'EADDRINUSE') {
        resolve(false);
      } else {
        // Some other error occurred
        console.error(`Error checking port ${port}:`, err);
        resolve(false);
      }
    });
    
    server.once('listening', () => {
      server.close();
      resolve(true);
    });
    
    server.listen(port);
  });
}

/**
 * Find an available port starting from the provided port
 * @param {number} startPort The port to start checking from
 * @param {number} endPort The maximum port to check
 * @returns {Promise<number>} Available port number
 */
export async function findAvailablePort(startPort = 3000, endPort = 3999) {
  for (let port = startPort; port <= endPort; port++) {
    try {
      // Check if port is in use
      const available = await isPortAvailable(port);
      if (available) {
        return port;
      }
    } catch (error) {
      console.error(`Error checking port ${port}:`, error);
    }
  }
  
  throw new Error(`No available ports found between ${startPort} and ${endPort}`);
}

export default { findAvailablePort }; 