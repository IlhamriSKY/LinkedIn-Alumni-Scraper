/**
 * CSV Service
 * 
 * Handles CSV file operations for LinkedIn alumni scraper including
 * data export, file management, and result formatting.
 */
import {
  createObjectCsvWriter
} from 'csv-writer';
import csvParser from 'csv-parser';
import fs from 'fs-extra';
import path from 'path';
import {
  fileURLToPath
} from 'url';
import logger from '../utils/logger.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
class CsvService {
  constructor() {
    this.resultsDir = path.join(__dirname, '../results');
    this.currentSessionFile = null;
    this.currentWriter = null;
    this.headerWritten = false;
    this.ensureDirectories();
  }
  /**
   * Load search names from CSV file
   */
  async loadSearchNames() {
    try {
      const searchNamesPath = path.join(__dirname, '../../search_names.csv');
      if (!await fs.pathExists(searchNamesPath)) {
        throw new Error('Search names file not found. Please create search_names.csv');
      }
      const names = [];
      return new Promise((resolve, reject) => {
        fs.createReadStream(searchNamesPath)
          .pipe(csvParser({
            headers: false
          }))
          .on('data', (row) => {
            const name = row[0] || row.name || Object.values(row)[0];
            if (name && name.trim()) {
              names.push(name.trim());
            }
          })
          .on('end', () => {
            logger.info('Search names loaded', {
              count: names.length
            });
            // console.log(`Loaded ${names.length} search names`); // Suppressed for clean output
            resolve(names);
          })
          .on('error', (error) => {
            reject(error);
          });
      });
    } catch (error) {
      logger.error('Failed to load search names:', {
        error: error.message,
        filePath: this.searchNamesFile
      });
      throw error;
    }
  }
  /**
   * Initialize real-time CSV session
   */
  async initializeRealTimeSession() {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const filename = `linkedin_alumni_realtime_${timestamp}.csv`;
      this.currentSessionFile = path.join(this.resultsDir, filename);
      this.headerWritten = false;
      this.currentWriter = null;
      // console.log(`Real-time CSV session initialized: ${filename}`); // Suppressed for clean output
      logger.info('CSV session initialized', {
        filename
      });
      return filename;
    } catch (error) {
      console.error('Failed to initialize real-time session:', error);
      throw error;
    }
  }
  /**
   * Append single result to CSV file in real-time
   */
  async appendResultRealTime(result) {
    try {
      console.log('CSV SERVICE DEBUG - Received result:', JSON.stringify(result, null, 2));

      if (!this.currentSessionFile) {
        await this.initializeRealTimeSession();
        console.log('CSV SERVICE DEBUG - Initialized new session file:', this.currentSessionFile);
      }

      const cleanedResult = this.cleanResultData(result);
      console.log('CSV SERVICE DEBUG - Cleaned result:', JSON.stringify(cleanedResult, null, 2));

      if (!this.headerWritten) {
        const headers = this.generateHeaders(cleanedResult);
        console.log('CSV SERVICE DEBUG - Generated headers:', headers);

        this.currentWriter = createObjectCsvWriter({
          path: this.currentSessionFile,
          header: headers,
          encoding: process.env.CSV_ENCODING || 'utf8',
          append: false // First write creates file
        });

        await this.currentWriter.writeRecords([cleanedResult]);
        this.headerWritten = true;

        console.log(`CSV SERVICE DEBUG - Header written and first record added to: ${this.currentSessionFile}`);
        logger.debug('CSV record added', {
          name: result.name,
          headerWritten: true
        });
      } else {
        this.currentWriter = createObjectCsvWriter({
          path: this.currentSessionFile,
          header: this.generateHeaders(cleanedResult),
          encoding: process.env.CSV_ENCODING || 'utf8',
          append: true // Append to existing file
        });

        await this.currentWriter.writeRecords([cleanedResult]);
        console.log(`CSV SERVICE DEBUG - Record appended to: ${this.currentSessionFile}`);
        logger.debug('CSV record appended', {
          name: result.name
        });
      }

      return this.currentSessionFile;
    } catch (error) {
      console.error('CSV SERVICE DEBUG - Error:', error.message);
      logger.error('Failed to append result in real-time:', {
        error: error.message,
        fileName: this.currentSessionFile
      });
      throw error;
    }
  }
  /**
   * Finalize real-time session
   */
  finalizeRealTimeSession() {
    if (this.currentSessionFile) {
      // Only log in development mode
      if (process.env.NODE_ENV === 'development') {
        logger.debug('CSV session finalized', {
          filename: path.basename(this.currentSessionFile)
        });
      }
      const finalFile = this.currentSessionFile;
      this.currentSessionFile = null;
      this.currentWriter = null;
      this.headerWritten = false;
      return finalFile;
    }
    return null;
  }
  /**
   * Ensure required directories exist
   */
  async ensureDirectories() {
    try {
      await fs.ensureDir(this.resultsDir);
    } catch (error) {
      console.error('Failed to create directories:', error);
    }
  }
  /**
   * Export results to CSV file
   */
  async exportResults(results, customFilename = null) {
    try {
      if (!results || results.length === 0) {
        throw new Error('No results to export');
      }
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const filename = customFilename || `linkedin_alumni_${timestamp}.csv`;
      const filepath = path.join(this.resultsDir, filename);
      const headers = this.generateHeaders(results[0]);
      const writer = createObjectCsvWriter({
        path: filepath,
        header: headers,
        encoding: process.env.CSV_ENCODING || 'utf8'
      });
      const cleanedResults = results.map(result => this.cleanResultData(result));
      await writer.writeRecords(cleanedResults);
      logger.info('CSV exported successfully', {
        filename,
        recordCount: cleanedResults.length
      });
      // console.log(`CSV exported successfully: ${filename}`); // Suppressed for clean output
      // console.log(`Total records: ${cleanedResults.length}`); // Suppressed for clean output
      return filename;
    } catch (error) {
      console.error('CSV export failed:', error);
      throw error;
    }
  }
  /**
   * Generate CSV headers from sample data
   */
  generateHeaders(sampleData) {
    const defaultHeaders = [{
        id: 'name',
        title: 'Name'
      },
      {
        id: 'position',
        title: 'Position'
      },
      {
        id: 'company',
        title: 'Company'
      },
      {
        id: 'location',
        title: 'Location'
      },
      {
        id: 'bio',
        title: 'Bio'
      },
      {
        id: 'experienceText',
        title: 'Experience'
      },
      {
        id: 'educationText',
        title: 'Education'
      },
      {
        id: 'universityName',
        title: 'University'
      },
      {
        id: 'profileUrl',
        title: 'Profile URL'
      },
      {
        id: 'searchKeyword',
        title: 'Search Keyword'
      },
      {
        id: 'found',
        title: 'Found'
      },
      {
        id: 'scrapedAt',
        title: 'Scraped At'
      }
    ];
    if (sampleData) {
      const existingIds = defaultHeaders.map(h => h.id);
      Object.keys(sampleData).forEach(key => {
        if (!existingIds.includes(key) && key !== 'error' && key !== 'experience' && key !== 'education') {
          defaultHeaders.push({
            id: key,
            title: this.capitalizeTitle(key)
          });
        }
      });
    }
    return defaultHeaders;
  }
  /**
   * Clean and format result data for CSV
   */
  cleanResultData(result) {
    const cleaned = {
      ...result
    };
    Object.keys(cleaned).forEach(key => {
      if (typeof cleaned[key] === 'string') {
        cleaned[key] = cleaned[key]
          .replace(/\s+/g, ' ')
          .replace(/[\r\n]/g, ' ')
          .trim();
        const delimiter = process.env.CSV_DELIMITER || ',';
        if (cleaned[key].includes(delimiter)) {
          cleaned[key] = `"${cleaned[key].replace(/"/g, '""')}"`;
        }
      }
    });
    const requiredFields = ['name', 'position', 'company', 'location', 'bio', 'experienceText', 'educationText', 'universityName', 'found', 'scrapedAt'];
    requiredFields.forEach(field => {
      if (cleaned[field] === undefined || cleaned[field] === null) {
        if (field === 'found') {
          cleaned[field] = false;
        } else {
          cleaned[field] = 'N/A';
        }
      }
    });
    if (typeof cleaned.found === 'boolean') {
      cleaned.found = cleaned.found ? 'Yes' : 'No';
    }
    if (cleaned.scrapedAt) {
      try {
        const date = new Date(cleaned.scrapedAt);
        cleaned.scrapedAt = date.toLocaleString();
      } catch (e) {}
    }
    delete cleaned.experience;
    delete cleaned.education;
    return cleaned;
  }
  /**
   * Read existing CSV file
   */
  async readCsvFile(filename) {
    try {
      const filepath = path.join(this.resultsDir, filename);
      if (!await fs.pathExists(filepath)) {
        throw new Error(`File not found: ${filename}`);
      }
      const results = [];
      return new Promise((resolve, reject) => {
        fs.createReadStream(filepath)
          .pipe(csvParser())
          .on('data', (data) => results.push(data))
          .on('end', () => resolve(results))
          .on('error', (error) => reject(error));
      });
    } catch (error) {
      console.error('Failed to read CSV file:', error);
      throw error;
    }
  }
  /**
   * Get list of exported CSV files
   */
  async getExportedFiles() {
    try {
      const files = await fs.readdir(this.resultsDir);
      const csvFiles = files
        .filter(file => file.endsWith('.csv'))
        .map(async (file) => {
          const filepath = path.join(this.resultsDir, file);
          const stats = await fs.stat(filepath);
          return {
            filename: file,
            size: stats.size,
            created: stats.birthtime,
            modified: stats.mtime
          };
        });
      return await Promise.all(csvFiles);
    } catch (error) {
      console.error('Failed to get exported files:', error);
      throw error;
    }
  }
  /**
   * Delete CSV file
   */
  async deleteFile(filename) {
    try {
      const filepath = path.join(this.resultsDir, filename);
      if (!await fs.pathExists(filepath)) {
        throw new Error(`File not found: ${filename}`);
      }
      await fs.remove(filepath);
      // console.log(`File deleted: ${filename}`); // Suppressed for clean output  
      logger.info('File deleted', {
        filename
      });
    } catch (error) {
      console.error('Failed to delete file:', error);
      throw error;
    }
  }
  /**
   * Load names from CSV file for searching
   */
  async loadNamesFromCsv(filename = 'search_names.csv') {
    try {
      const filepath = path.join(__dirname, '../../data', filename);
      if (!await fs.pathExists(filepath)) {
        // console.log(`Names file not found: ${filename}, using default names`); // Suppressed for clean output
        logger.warn('Names file not found, using defaults', {
          filename
        });
        return this.getDefaultNames();
      }
      const names = [];
      return new Promise((resolve, reject) => {
        fs.createReadStream(filepath)
          .pipe(csvParser())
          .on('data', (row) => {
            const name = row.name || row.Name || row.fullName || row['Full Name'] || Object.values(row)[0];
            if (name && name.trim()) {
              names.push(name.trim());
            }
          })
          .on('end', () => {
            // console.log(`Loaded ${names.length} names from ${filename}`); // Suppressed for clean output
            logger.debug('Names loaded from file', {
              filename,
              count: names.length
            });
            resolve(names.length > 0 ? names : this.getDefaultNames());
          })
          .on('error', (error) => {
            console.error('Error reading names file:', error);
            resolve(this.getDefaultNames());
          });
      });
    } catch (error) {
      console.error('Failed to load names from CSV:', error);
      return this.getDefaultNames();
    }
  }
  /**
   * Get default search names if no CSV file is found
   */
  getDefaultNames() {
    return [
      'Ahmad Rizki',
      'Siti Nurhaliza',
      'Budi Santoso',
      'Rina Permata',
      'Dedi Setiawan',
      'Maya Sari',
      'Andi Pratama',
      'Dewi Lestari',
      'Fajar Nugroho',
      'Indira Kusuma'
    ];
  }
  /**
   * Create sample names CSV file
   */
  async createSampleNamesFile() {
    try {
      const sampleNames = this.getDefaultNames().map(name => ({
        name
      }));
      const filename = 'search_names_sample.csv';
      const filepath = path.join(__dirname, '../../data', filename);
      const writer = createObjectCsvWriter({
        path: filepath,
        header: [{
          id: 'name',
          title: 'Name'
        }]
      });
      await writer.writeRecords(sampleNames);
      // console.log(`Sample names file created: ${filename}`); // Suppressed for clean output
      logger.info('Sample names file created', {
        filename
      });
      return filename;
    } catch (error) {
      console.error('Failed to create sample names file:', error);
      throw error;
    }
  }
  /**
   * Capitalize title for headers
   */
  capitalizeTitle(str) {
    return str
      .replace(/([A-Z])/g, ' $1') // Add space before capital letters
      .replace(/^./, char => char.toUpperCase()) // Capitalize first letter
      .trim();
  }
  /**
   * Get file statistics
   */
  async getFileStats(filename) {
    try {
      const filepath = path.join(this.resultsDir, filename);
      if (!await fs.pathExists(filepath)) {
        throw new Error(`File not found: ${filename}`);
      }
      const stats = await fs.stat(filepath);
      const records = await this.readCsvFile(filename);
      return {
        filename,
        size: stats.size,
        records: records.length,
        created: stats.birthtime,
        modified: stats.mtime
      };
    } catch (error) {
      logger.error('Failed to get file stats', {
        error: error.message,
        filename
      });
      throw error;
    }
  }
}
export default CsvService;
