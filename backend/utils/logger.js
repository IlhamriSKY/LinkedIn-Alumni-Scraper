/**
 * Enhanced Logger Utility with File Logging
 * Only logs errors to files and console, eliminates access logs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class Logger {
  constructor() {
    this.logsDir = path.join(__dirname, '../logs');
    this.ensureLogsDirectory();
  }

  ensureLogsDirectory() {
    if (!fs.existsSync(this.logsDir)) {
      fs.mkdirSync(this.logsDir, { recursive: true });
    }
  }

  formatLogMessage(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const logData = data ? ` | Data: ${JSON.stringify(data)}` : '';
    return `[${timestamp}] [${level}] ${message}${logData}`;
  }

  writeToFile(filename, message) {
    try {
      const logFile = path.join(this.logsDir, filename);
      fs.appendFileSync(logFile, message + '\n');
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }

  /**
   * Log error messages - saves to file and console
   */
  error(message, data = null) {
    const logMessage = this.formatLogMessage('ERROR', message, data);
    console.error('\x1b[31m%s\x1b[0m', logMessage); // Red color for errors
    
    // Save to daily error log file
    const today = new Date().toISOString().split('T')[0];
    this.writeToFile(`error-${today}.log`, logMessage);
  }

  /**
   * Log warning messages - console only
   */
  warn(message, data = null) {
    const logMessage = this.formatLogMessage('WARN', message, data);
    console.warn('\x1b[33m%s\x1b[0m', logMessage); // Yellow color for warnings
  }

  /**
   * Log info messages - console only, very minimal output
   */
  info(message, data = null) {
    // Only show critical info messages (server start/stop, major errors)
    const criticalKeywords = ['server started', 'backend started', 'server stopped', 'shutting down', 'failed to start'];
    const isCritical = criticalKeywords.some(keyword => message.toLowerCase().includes(keyword));
    
    if (isCritical) {
      const logMessage = this.formatLogMessage('INFO', message, data);
      console.log('\x1b[36m%s\x1b[0m', logMessage); // Cyan color for info
    }
    // All other info messages are suppressed from console
  }

  /**
   * Log debug messages - only in development mode
   */
  debug(message, data = null) {
    if (process.env.NODE_ENV === 'development' && process.env.DEBUG_MODE === 'true') {
      const logMessage = this.formatLogMessage('DEBUG', message, data);
      console.log('\x1b[90m%s\x1b[0m', logMessage); // Gray color for debug
    }
  }

  /**
   * Log scraping activities - console only, formatted
   */
  scraping(message, data = null) {
    const logMessage = this.formatLogMessage('SCRAPING', message, data);
    console.log('\x1b[32m%s\x1b[0m', logMessage); // Green color for scraping
  }

  /**
   * Clean old log files (keep last 7 days)
   */
  cleanOldLogs() {
    try {
      const files = fs.readdirSync(this.logsDir);
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      files.forEach(file => {
        const filePath = path.join(this.logsDir, file);
        const stats = fs.statSync(filePath);
        
        if (stats.mtime < sevenDaysAgo && file.endsWith('.log')) {
          fs.unlinkSync(filePath);
          console.log(`Cleaned old log file: ${file}`);
        }
      });
    } catch (error) {
      console.error('Failed to clean old logs:', error);
    }
  }

  /**
   * Get logs directory path
   */
  getLogsDir() {
    return this.logsDir;
  }
}

// Create singleton instance
const logger = new Logger();

// Clean old logs on startup
logger.cleanOldLogs();

export default logger;
