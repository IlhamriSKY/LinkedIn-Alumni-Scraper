import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class SettingsService {
  constructor() {
    this.settings = null;
    this.settingsPath = path.join(__dirname, '../settings.json');
  }

  async loadSettings() {
    try {
      const settingsData = await fs.readFile(this.settingsPath, 'utf8');
      this.settings = JSON.parse(settingsData);
      return this.settings;
    } catch (error) {
      console.error('Error loading settings.json:', error.message);
      
      // Return default settings if file doesn't exist or is invalid
      this.settings = {
        datatable: {
          defaultVisibleColumns: [
            "name", "found", "position", "company", 
            "location", "bio", "scrapedAt", "actions"
          ],
          sensor: {
            enableCompanySensor: true,
            enableBioSensor: true,
            enableLocationSensor: true,
            sensorChar: "●",
            defaultSensorMode: true
          },
          pagination: {
            defaultPageSize: 10,
            pageSizeOptions: [5, 10, 20, 30, 40, 50]
          },
          export: {
            includeHeaders: true,
            dateFormat: "DD_MM_YY-HH_MM_S",
            filenameTemplate: "linkedin_alumni_{type}_{date}_{uniqtime}.csv"
          }
        },
        ui: {
          theme: "system",
          compactMode: false,
          showTooltips: true
        },
        scraping: {
          defaultDelay: 2000,
          maxRetries: 3,
          timeout: 30000
        }
      };
      
      return this.settings;
    }
  }

  async saveSettings(newSettings) {
    try {
      this.settings = { ...this.settings, ...newSettings };
      await fs.writeFile(this.settingsPath, JSON.stringify(this.settings, null, 2), 'utf8');
      return this.settings;
    } catch (error) {
      console.error('Error saving settings.json:', error.message);
      throw error;
    }
  }

  getSettings() {
    return this.settings;
  }

  getDatatableSettings() {
    return this.settings?.datatable || {};
  }

  getUISettings() {
    return this.settings?.ui || {};
  }

  getScrapingSettings() {
    return this.settings?.scraping || {};
  }

  async updateDatatableSettings(datatableSettings) {
    try {
      if (!this.settings) {
        await this.loadSettings();
      }
      
      this.settings.datatable = { ...this.settings.datatable, ...datatableSettings };
      await this.saveSettings(this.settings);
      return this.settings.datatable;
    } catch (error) {
      console.error('Error updating datatable settings:', error.message);
      throw error;
    }
  }

  async resetToDefaults() {
    try {
      const defaultSettings = {
        datatable: {
          defaultVisibleColumns: [
            "name", "found", "position", "company", 
            "location", "bio", "scrapedAt", "actions"
          ],
          sensor: {
            enableCompanySensor: true,
            enableBioSensor: true,
            enableLocationSensor: true,
            sensorChar: "●",
            defaultSensorMode: true
          },
          pagination: {
            defaultPageSize: 10,
            pageSizeOptions: [5, 10, 20, 30, 40, 50]
          },
          export: {
            includeHeaders: true,
            dateFormat: "DD_MM_YY-HH_MM_S",
            filenameTemplate: "linkedin_alumni_{type}_{date}_{uniqtime}.csv"
          }
        },
        ui: {
          theme: "system",
          compactMode: false,
          showTooltips: true
        },
        scraping: {
          defaultDelay: 2000,
          maxRetries: 3,
          timeout: 30000
        }
      };

      await this.saveSettings(defaultSettings);
      return this.settings;
    } catch (error) {
      console.error('Error resetting settings to defaults:', error.message);
      throw error;
    }
  }
}

// Create singleton instance
const settingsService = new SettingsService();

export default settingsService;
