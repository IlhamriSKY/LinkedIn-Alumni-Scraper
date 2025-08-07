/**
 * Browser Service
 * 
 * Manages Puppeteer browser instances with human-like behavior patterns.
 * Handles browser lifecycle, page management, and anti-detection measures.
 */
import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs-extra';
import {
  fileURLToPath
} from 'url';
import logger from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
class BrowserService {
  constructor() {
    this.browser = null;
    this.page = null;
    this.userDataDir = path.join(__dirname, '../browser-data');
  }
  /**
   * Launch browser instance with blank page
   */
  async launch() {
    await this.clearBrowserDataDirectory();
    await this.initialize();
    await this.closeFirstTab();
    const page = await this.getPage();
    try {
      await page.goto('https://www.linkedin.com', {
        waitUntil: 'networkidle2',
        timeout: 30000
      });
      // Browser ready - suppressed log for clean output
    } catch (error) {
      // Failed to load LinkedIn, using blank page - suppressed log
      await page.goto('about:blank');
    }
  }
  /**
   * Get current page or create new one
   */
  async getPage() {
    if (!this.browser) {
      throw new Error('Browser not initialized. Call launch() first.');
    }
    if (!this.page || this.page.isClosed()) {
      const pages = await this.browser.pages();
      if (pages.length > 0) {
        this.page = pages[0]; // Use the first available page
        // Using existing page - suppressed log
      } else {
        this.page = await this.browser.newPage();
        // Created new page - suppressed log
      }
      await this.configurePage();
      await this.setupPageEventListeners();
    }
    return this.page;
  }
  /**
   * Initialize browser with anti-detection settings
   */
  async initialize() {
    try {
      await fs.ensureDir(this.userDataDir);
      const launchOptions = {
        headless: process.env.HEADLESS_MODE === 'true',
        userDataDir: this.userDataDir,
        args: [
          '--no-first-run',
          '--no-default-browser-check',
          '--disable-background-timer-throttling',
          '--disable-renderer-backgrounding',
          '--disable-backgrounding-occluded-windows'
        ],
        defaultViewport: null, // Use actual browser viewport
        ignoreHTTPSErrors: true,
        slowMo: 0
      };
      if (process.env.CHROME_EXECUTABLE_PATH) {
        launchOptions.executablePath = process.env.CHROME_EXECUTABLE_PATH;
      }
      // Launching browser with anti-detection - suppressed log
      this.browser = await puppeteer.launch(launchOptions);
      this.browser.on('disconnected', () => {
        // Browser disconnected - suppressed log
        this.browser = null;
        this.page = null;
        if (this.onBrowserClosed) {
          this.onBrowserClosed();
        }
      });
      // Browser initialized successfully - suppressed log
      return this.browser;
    } catch (error) {
      logger.error('Failed to initialize browser:', {
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }
  /**
   * Configure page with minimal settings like normal Chrome
   */
  async configurePage() {
    if (!this.page) return;
    try {
      // Page configured with minimal settings - suppressed log
    } catch (error) {
      console.error('Failed to configure page:', error);
    }
  }
  /**
   * Setup real-time page event listeners for monitoring without refresh
   */
  async setupPageEventListeners() {
    if (!this.page) return;
    try {
      this.page.on('load', () => {
        // Page loaded event - suppressed log
        if (this.onPageChange) {
          this.onPageChange('load');
        }
      });
      this.page.on('domcontentloaded', () => {
        // DOM content loaded - suppressed log
        if (this.onPageChange) {
          this.onPageChange('domcontentloaded');
        }
      });
      this.page.on('framenavigated', (frame) => {
        if (frame === this.page.mainFrame()) {
          // Frame navigated - suppressed log for clean output
          if (this.onPageChange) {
            this.onPageChange('framenavigated', frame.url());
          }
        }
      });
      this.page.on('response', (response) => {
        if (response.url().includes('linkedin.com') && response.status() === 200) {
          // Important LinkedIn response - suppressed log for clean output
          if (this.onPageChange) {
            this.onPageChange('response', response.url());
          }
        }
      });
      // Page event listeners setup - suppressed log for clean output
    } catch (error) {
      console.error('Failed to setup page event listeners:', error);
    }
  }
  /**
   * Set callback for page change events
   */
  setPageChangeCallback(callback) {
    this.onPageChange = callback;
  }
  /**
   * Navigate to a specific URL
   */
  async navigateToUrl(url, options = {}) {
    try {
      if (!this.page) {
        throw new Error('Browser not initialized');
      }
      // Navigating to URL - suppressed log
      await this.page.goto(url, {
        waitUntil: options.waitUntil || 'domcontentloaded',
        timeout: options.timeout || 30000
      });
      // Successfully navigated - suppressed log
      return this.page;
    } catch (error) {
      console.error(`Failed to navigate to ${url}:`, error);
      throw error;
    }
  }
  /**
   * Human-like typing simulation
   */
  async typeHumanLike(selector, text, options = {}) {
    try {
      const element = await this.page.waitForSelector(selector, {
        timeout: 10000
      });
      await element.click({
        clickCount: 3
      });
      for (const char of text) {
        await element.type(char, {
          delay: Math.random() * (200 - 50) + 50 // 50-200ms delay
        });
      }
      await this.randomDelay(500, 1500);
    } catch (error) {
      console.error(`Failed to type in ${selector}:`, error);
      throw error;
    }
  }
  /**
   * Human-like clicking
   */
  async clickHumanLike(selector, options = {}) {
    try {
      const element = await this.page.waitForSelector(selector, {
        visible: true,
        timeout: 10000
      });
      const box = await element.boundingBox();
      if (box) {
        await this.page.mouse.move(
          box.x + box.width / 2 + (Math.random() - 0.5) * 10,
          box.y + box.height / 2 + (Math.random() - 0.5) * 10
        );
      }
      await this.randomDelay(200, 800);
      await element.click({
        delay: Math.random() * 100 + 50
      });
      await this.randomDelay(1000, 2500);
    } catch (error) {
      console.error(`Failed to click ${selector}:`, error);
      throw error;
    }
  }
  /**
   * Random delay for human-like behavior
   */
  async randomDelay(min = 1000, max = 3000) {
    const delay = Math.random() * (max - min) + min;
    await new Promise(resolve => setTimeout(resolve, delay));
  }
  /**
   * Take screenshot for debugging
   */
  async takeScreenshot(filename) {
    try {
      if (!this.page) return null;
      const screenshotPath = path.join(__dirname, '../../data/screenshots', filename);
      await fs.ensureDir(path.dirname(screenshotPath));
      await this.page.screenshot({
        path: screenshotPath,
        fullPage: true
      });
      // Screenshot saved - suppressed log
      return screenshotPath;
    } catch (error) {
      console.error('Failed to take screenshot:', error);
      return null;
    }
  }
  /**
   * Get current page info with detailed title and URL
   */
  async getPageInfo() {
    if (!this.page) return null;
    try {
      const info = await this.page.evaluate(() => {
        return {
          title: document.title || 'Untitled',
          url: window.location.href,
          ready: document.readyState === 'complete',
          hostname: window.location.hostname,
          pathname: window.location.pathname
        };
      });
      return {
        ...info,
        isLinkedIn: info.hostname.includes('linkedin.com'),
        readyState: await this.page.evaluate(() => document.readyState)
      };
    } catch (error) {
      // console.error('Failed to get page info:', error);
      return {
        url: this.page?.url() || 'about:blank',
        title: 'Error loading page',
        ready: false,
        isLinkedIn: false,
        hostname: '',
        pathname: ''
      };
    }
  }
  /**
   * Check if browser is still active
   */
  isActive() {
    return this.browser && this.browser.isConnected();
  }
  /**
   * Close browser gracefully
   */
  async close() {
    try {
      if (this.page && !this.page.isClosed()) {
        await this.page.close();
        this.page = null;
      }
      if (this.browser && this.browser.isConnected()) {
        await this.browser.close();
        this.browser = null;
      }
      // Browser closed successfully - suppressed log
    } catch (error) {
      console.error('Error closing browser:', error);
    }
  }
  /**
   * Get browser status
   */
  getStatus() {
    return {
      browserOpen: this.isActive(),
      pageReady: this.page && !this.page.isClosed(),
      userDataDir: this.userDataDir
    };
  }
  /**
   * Set callback for browser closed event
   */
  onBrowserClosed(callback) {
    this.onBrowserClosed = callback;
  }
  /**
   * Clear browser data directory (hapus semua data browser)
   */
  async clearBrowserDataDirectory() {
    try {
      if (await fs.pathExists(this.userDataDir)) {
        // Clearing browser data directory - suppressed log
        await fs.remove(this.userDataDir);
        // Browser data directory cleared - suppressed log
      } else {
        // Browser data directory does not exist - suppressed log
      }
      await fs.ensureDir(this.userDataDir);
    } catch (error) {
      console.error('Failed to clear browser data directory:', error);
      await fs.ensureDir(this.userDataDir);
    }
  }
  /**
   * Clear browser data and reset
   */
  async clearBrowserData() {
    try {
      if (this.page) {
        const client = await this.page.target().createCDPSession();
        await client.send('Network.clearBrowserCookies');
        await client.send('Network.clearBrowserCache');
        await client.send('Storage.clearDataForOrigin', {
          origin: 'https://www.linkedin.com',
          storageTypes: 'all'
        });
        // Browser data cleared successfully - suppressed log
      }
    } catch (error) {
      console.error('Failed to clear browser data:', error);
    }
  }
  /**
   * Close the first browser tab automatically (immediately)
   */
  async closeFirstTab() {
    try {
      if (!this.browser) {
        console.log('Browser not initialized, cannot close first tab');
        return;
      }
      const pages = await this.browser.pages();
      console.log(`Total tabs found: ${pages.length}`);
      if (pages.length > 1) {
        const firstPage = pages[0];
        const url = firstPage.url();
        console.log(`First tab URL: ${url}`);
        if (url === 'about:blank' || url === '' || url === 'chrome://newtab/' || url.startsWith('chrome://')) {
          await firstPage.close();
          console.log('First tab closed immediately');
          if (this.page === firstPage) {
            const remainingPages = await this.browser.pages();
            this.page = remainingPages[0] || null;
            console.log('Updated page reference after closing first tab');
          }
        } else {
          console.log('First tab is not about:blank, keeping it:', url);
        }
      } else {
        console.log('Only one tab exists, keeping it open');
      }
    } catch (error) {
      console.error('Failed to close first tab:', error);
    }
  }
  /**
   * Check if browser is active and connected
   */
  isActive() {
    return !!(this.browser && this.browser.isConnected());
  }
}
export default BrowserService;