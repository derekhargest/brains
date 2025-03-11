const colors = require('./colors');

function logObject(obj, label = '', depth = 0) {
  const indent = '  '.repeat(depth);
  console.log(`${indent}${colors.blue}${label}${colors.reset}`);
  for (const [key, value] of Object.entries(obj)) {
    if (value && typeof value === 'object') {
      logObject(value, `${key}:`, depth + 1);
    } else {
      console.log(`${indent}  ${colors.dim}${key}:${colors.reset} ${value}`);
    }
  }
}

function logVector(vector, label = '') {
  console.log(`\n${colors.blue}${label}${colors.reset}`);
  console.log(`Dimensions: ${vector.length}`);
  console.log(`First 5 values: ${vector.slice(0, 5).map(v => v.toFixed(4)).join(', ')}...`);
  
  // Basic vector statistics
  const stats = {
    min: Math.min(...vector),
    max: Math.max(...vector),
    mean: vector.reduce((a, b) => a + b, 0) / vector.length,
    zeros: vector.filter(v => v === 0).length
  };
  
  logObject(stats, 'Vector Statistics:');
}

function logMemory(memory) {
  console.log('\n' + colors.bright + 'Memory Details:' + colors.reset);
  console.log(`ID: ${memory.id}`);
  console.log(`Content: ${memory.content.substring(0, 100)}${memory.content.length > 100 ? '...' : ''}`);
  console.log(`Tags: ${memory.tags?.join(', ') || 'none'}`);
  console.log(`Timestamp: ${memory.timestamp}`);
  if (memory.vector) {
    logVector(memory.vector, 'Memory Vector:');
  }
}

function logSearchResults(results, query) {
  console.log(`\n${colors.bright}Search Results for: "${query}"${colors.reset}`);
  console.log(`Found ${results.length} results\n`);
  
  results.forEach((result, i) => {
    console.log(`${colors.green}Result #${i + 1}${colors.reset} (similarity: ${result.similarity?.toFixed(4) || 'N/A'})`);
    console.log(`Content: ${result.content.substring(0, 100)}...`);
    console.log(`Tags: ${result.tags?.join(', ') || 'none'}`);
    console.log('');
  });
}

function logPerformance(label, startTime) {
  const duration = Date.now() - startTime;
  console.log(`${colors.dim}${label}: ${duration}ms${colors.reset}`);
  return duration;
}

function createProgressBar(total, label = '') {
  let current = 0;
  
  return {
    increment(amount = 1) {
      current = Math.min(current + amount, total);
      this.render();
    },
    render() {
      const percentage = Math.round((current / total) * 100);
      const filled = Math.round((current / total) * 20);
      const bar = '█'.repeat(filled) + '░'.repeat(20 - filled);
      process.stdout.write(`\r${label}${bar} ${percentage}% | ${current}/${total}`);
      if (current === total) console.log('');
    }
  };
}

module.exports = {
  logObject,
  logVector,
  logMemory,
  logSearchResults,
  logPerformance,
  createProgressBar
}; 