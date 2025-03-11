/**
 * Visual utilities for test output
 */

// Create a simple spinner/logger implementation that doesn't rely on ora
class SimpleSpinner {
  constructor(options = {}) {
    this.text = options.text || '';
    this.isSpinning = false;
  }

  start(text) {
    if (text) this.text = text;
    console.log(`⏳ ${this.text}...`);
    this.isSpinning = true;
    return this;
  }

  stop() {
    this.isSpinning = false;
    return this;
  }

  succeed(text) {
    this.isSpinning = false;
    console.log(`✅ ${text || this.text}`);
    return this;
  }

  fail(text) {
    this.isSpinning = false;
    console.log(`❌ ${text || this.text}`);
    return this;
  }

  info(text) {
    console.log(`ℹ️ ${text || this.text}`);
    return this;
  }

  warn(text) {
    console.log(`⚠️ ${text || this.text}`);
    return this;
  }
}

// Basic terminal formatting
const format = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  italic: '\x1b[3m',
  underline: '\x1b[4m',
  
  // Colors
  black: '\x1b[30m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  
  // Backgrounds
  bgBlack: '\x1b[40m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
  bgMagenta: '\x1b[45m',
  bgCyan: '\x1b[46m',
  bgWhite: '\x1b[47m'
};

class TestVisualizer {
  constructor() {
    this.spinner = new SimpleSpinner();
    this.results = [];
    this.errors = [];
  }

  // Display a header banner
  showHeader(text) {
    const line = '='.repeat(80);
    console.log('\n' + line);
    console.log(`${format.bold}${format.bgBlue}${format.white} ${text} ${format.reset}`);
    console.log(line + '\n');
    return this;
  }

  // Display a section header
  showSection(text) {
    console.log(`\n${format.bold}${format.cyan}${text}${format.reset}`);
    console.log('-'.repeat(60));
    return this;
  }

  // Display a set of metrics in a formatted way
  showMetrics(metrics, title = 'Metrics') {
    console.log(`\n${format.bold}${title}${format.reset}`);
    console.log('-'.repeat(40));
    
    Object.entries(metrics).forEach(([key, value]) => {
      console.log(`${format.dim}${key}:${format.reset} ${value}`);
    });
    
    console.log();
    return this;
  }

  // Show progress bar
  showProgress(current, total, title = 'Progress') {
    const percentage = Math.round((current / total) * 100);
    const width = 30;
    const completedWidth = Math.round((width * current) / total);
    const remainingWidth = width - completedWidth;
    
    const bar = '█'.repeat(completedWidth) + '░'.repeat(remainingWidth);
    
    console.log(`${title} ${bar} ${percentage}% (${current}/${total})`);
    return this;
  }

  // Spinner methods
  startSpinner(text) {
    this.spinner.start(text);
    return this;
  }

  updateSpinner(text) {
    if (this.spinner.isSpinning) {
      console.log(`⏳ ${text}...`);
      this.spinner.text = text;
    } else {
      this.startSpinner(text);
    }
    return this;
  }

  stopSpinner(success = true) {
    if (success) {
      this.spinner.succeed();
    } else {
      this.spinner.fail();
    }
    return this;
  }

  startTest(name) {
    console.log(`\n${'-'.repeat(80)}`);
    console.log(`🧪 RUNNING TEST: ${name}`);
    console.log(`${'-'.repeat(80)}`);
    this.spinner.start(`Running test: ${name}`);
    return this;
  }

  logStep(step) {
    console.log(`  → ${step}`);
    return this;
  }

  succeed(message) {
    this.spinner.succeed(message);
    this.results.push({ success: true, message });
    return this;
  }

  fail(message, error) {
    this.spinner.fail(message);
    this.errors.push({ message, error });
    this.results.push({ success: false, message, error: error?.message || String(error) });
    return this;
  }

  info(message) {
    this.spinner.info(message);
    return this;
  }

  warn(message) {
    this.spinner.warn(message);
    return this;
  }

  table(data, columns) {
    if (!data || data.length === 0) {
      console.log('  [No data to display]');
      return this;
    }

    // Simple table formatting
    if (!columns) {
      columns = Object.keys(data[0]);
    }

    const rows = [columns, ...data.map(item => columns.map(col => item[col] || ''))];
    
    // Calculate column widths
    const colWidths = columns.map((col, i) => {
      return Math.max(
        col.length,
        ...data.map(row => String(row[col] || '').length)
      );
    });

    // Header row
    console.log('  ' + columns.map((col, i) => col.padEnd(colWidths[i] + 2)).join(''));
    console.log('  ' + colWidths.map(w => '-'.repeat(w + 2)).join(''));

    // Data rows
    data.forEach(row => {
      console.log('  ' + columns.map((col, i) => 
        String(row[col] || '').padEnd(colWidths[i] + 2)
      ).join(''));
    });

    return this;
  }

  renderResults() {
    console.log(`\n${'-'.repeat(80)}`);
    console.log('📊 TEST SUMMARY');
    console.log(`${'-'.repeat(80)}`);
    
    const total = this.results.length;
    const passed = this.results.filter(r => r.success).length;
    const failed = total - passed;
    
    console.log(`Total tests: ${total}`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);
    
    if (failed > 0) {
      console.log(`\n❌ FAILURES:`);
      this.errors.forEach((error, i) => {
        console.log(`  ${i+1}. ${error.message}`);
        if (error.error) {
          console.log(`     ${error.error}`);
        }
      });
    }
    
    return failed === 0;
  }
}

// Export a singleton instance
const visualizer = new TestVisualizer();
module.exports = visualizer; 