// Enhanced logging utility
const verbose = process.env.VERBOSE_LOGGING === 'true';

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  underscore: '\x1b[4m',
  blink: '\x1b[5m',
  reverse: '\x1b[7m',
  hidden: '\x1b[8m',
  
  fg: {
    black: '\x1b[30m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    crimson: '\x1b[38m'
  },
  bg: {
    black: '\x1b[40m',
    red: '\x1b[41m',
    green: '\x1b[42m',
    yellow: '\x1b[43m',
    blue: '\x1b[44m',
    magenta: '\x1b[45m',
    cyan: '\x1b[46m',
    white: '\x1b[47m',
    crimson: '\x1b[48m'
  }
};

function formatMessage(level, system, message) {
  const timestamp = new Date().toISOString();
  let color;
  let prefix;
  
  switch (level) {
    case 'error':
      color = colors.fg.red;
      prefix = 'ERROR';
      break;
    case 'warn':
      color = colors.fg.yellow;
      prefix = 'WARN ';
      break;
    case 'info':
      color = colors.fg.green;
      prefix = 'INFO ';
      break;
    case 'debug':
      color = colors.fg.cyan;
      prefix = 'DEBUG';
      break;
    default:
      color = colors.reset;
      prefix = 'LOG  ';
  }
  
  return `${color}[${timestamp}] ${prefix} [${system}]${colors.reset} ${message}`;
}

const logger = {
  error: (system, message, error) => {
    console.error(formatMessage('error', system, message));
    if (error) {
      console.error(`${colors.fg.red}${error.stack || error}${colors.reset}`);
    }
  },
  
  warn: (system, message) => {
    console.warn(formatMessage('warn', system, message));
  },
  
  info: (system, message) => {
    console.info(formatMessage('info', system, message));
  },
  
  debug: (system, message, data) => {
    if (verbose) {
      console.debug(formatMessage('debug', system, message));
      if (data !== undefined) {
        console.debug(data);
      }
    }
  },
  
  verbose: (system, message, data) => {
    if (verbose) {
      console.log(formatMessage('debug', system, `${colors.dim}${message}${colors.reset}`));
      if (data !== undefined) {
        console.log(colors.dim, data, colors.reset);
      }
    }
  }
};

export default logger; 