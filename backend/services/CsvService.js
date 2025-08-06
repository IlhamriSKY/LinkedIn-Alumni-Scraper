/**
 * CSV Service - Handle CSV export and data formatting
 * Manages result exports and file operations
 */

import { createObjectCsvWriter } from 'csv-writer';
import csvParser from 'csv-parser';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class CsvService {
  constructor() {
    this.resultsDir = path.join(__dirname, '../../../results');
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
          .pipe(csvParser({ headers: false }))
          .on('data', (row) => {
            // Handle CSV with or without headers
            const name = row[0] || row.name || Object.values(row)[0];
            if (name && name.trim()) {
              names.push(name.trim());
            }
          })
          .on('end', () => {
            console.log(`Loaded ${names.length} search names`);
            resolve(names);
          })
          .on('error', (error) => {
            reject(error);
          });
      });

    } catch (error) {
      console.error('Failed to load search names:', error);
      throw error;
    }
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

      // Generate filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const filename = customFilename || `linkedin_alumni_${timestamp}.csv`;
      const filepath = path.join(this.resultsDir, filename);

      // Define CSV headers based on data structure
      const headers = this.generateHeaders(results[0]);

      // Create CSV writer
      const writer = createObjectCsvWriter({
        path: filepath,
        header: headers,
        encoding: process.env.CSV_ENCODING || 'utf8'
      });

      // Clean and format data
      const cleanedResults = results.map(result => this.cleanResultData(result));

      // Write to CSV
      await writer.writeRecords(cleanedResults);

      console.log(`CSV exported successfully: ${filename}`);
      console.log(`Total records: ${cleanedResults.length}`);

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
    const defaultHeaders = [
      { id: 'name', title: 'Name' },
      { id: 'position', title: 'Position' },
      { id: 'company', title: 'Company' },
      { id: 'location', title: 'Location' },
      { id: 'education', title: 'Education' },
      { id: 'profileUrl', title: 'Profile URL' },
      { id: 'searchKeyword', title: 'Search Keyword' },
      { id: 'scrapedAt', title: 'Scraped At' }
    ];

    // If sample data has additional fields, include them
    if (sampleData) {
      const existingIds = defaultHeaders.map(h => h.id);
      
      Object.keys(sampleData).forEach(key => {
        if (!existingIds.includes(key) && key !== 'error') {
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
    const cleaned = { ...result };

    // Clean text fields
    Object.keys(cleaned).forEach(key => {
      if (typeof cleaned[key] === 'string') {
        // Remove extra whitespace and newlines
        cleaned[key] = cleaned[key]
          .replace(/\s+/g, ' ')
          .replace(/[\r\n]/g, ' ')
          .trim();
        
        // Handle CSV delimiter conflicts
        const delimiter = process.env.CSV_DELIMITER || ',';
        if (cleaned[key].includes(delimiter)) {
          cleaned[key] = `"${cleaned[key].replace(/"/g, '""')}"`;
        }
      }
    });

    // Ensure required fields exist
    const requiredFields = ['name', 'position', 'company', 'location', 'education', 'scrapedAt'];
    requiredFields.forEach(field => {
      if (!cleaned[field]) {
        cleaned[field] = 'N/A';
      }
    });

    // Format date
    if (cleaned.scrapedAt) {
      try {
        const date = new Date(cleaned.scrapedAt);
        cleaned.scrapedAt = date.toLocaleString();
      } catch (e) {
        // Keep original if parsing fails
      }
    }

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
      console.log(`File deleted: ${filename}`);

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
        console.log(`Names file not found: ${filename}, using default names`);
        return this.getDefaultNames();
      }

      const names = [];
      
      return new Promise((resolve, reject) => {
        fs.createReadStream(filepath)
          .pipe(csvParser())
          .on('data', (row) => {
            // Try different column names
            const name = row.name || row.Name || row.fullName || row['Full Name'] || Object.values(row)[0];
            if (name && name.trim()) {
              names.push(name.trim());
            }
          })
          .on('end', () => {
            console.log(`Loaded ${names.length} names from ${filename}`);
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
      const sampleNames = this.getDefaultNames().map(name => ({ name }));
      const filename = 'search_names_sample.csv';
      const filepath = path.join(__dirname, '../../data', filename);

      const writer = createObjectCsvWriter({
        path: filepath,
        header: [{ id: 'name', title: 'Name' }]
      });

      await writer.writeRecords(sampleNames);
      console.log(`Sample names file created: ${filename}`);

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
      console.error('Failed to get file stats:', error);
      throw error;
    }
  }
}

export default CsvService;
