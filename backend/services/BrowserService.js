/**
 * Browser Service - Simple Puppeteer Browser Management
 * Mimics normal Chrome browser behavior
 */

import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs-extra';
import { fileURLToPath } from 'url';

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
    // Clear browser-data sebelum menjalankan browser pertama kali
    await this.clearBrowserDataDirectory();
    
    await this.initialize();
    
    // Close the first tab immediately after browser initialization
    await this.closeFirstTab();
    
    // Open LinkedIn homepage directly like normal user
    const page = await this.getPage();
    
    try {
      await page.goto('https://www.linkedin.com', {
        waitUntil: 'networkidle2',
        timeout: 30000
      });
      console.log('Browser opened with LinkedIn homepage - ready like normal user');
    } catch (error) {
      console.log('Failed to load LinkedIn, using blank page');
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
      // Try to use existing pages first
      const pages = await this.browser.pages();
      if (pages.length > 0) {
        this.page = pages[0]; // Use the first available page
        console.log('Using existing page');
      } else {
        this.page = await this.browser.newPage();
        console.log('Created new page');
      }
      
      // Configure page for normal Chrome behavior
      await this.configurePage();
    }

    return this.page;
  }

  /**
   * Initialize browser with anti-detection settings
   */
  async initialize() {
    try {
      // Ensure user data directory exists
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

      // Use custom Chrome path if specified
      if (process.env.CHROME_EXECUTABLE_PATH) {
        launchOptions.executablePath = process.env.CHROME_EXECUTABLE_PATH;
      }

      console.log('Launching browser with anti-detection...');
      this.browser = await puppeteer.launch(launchOptions);

      // Add event listener for browser disconnect
      this.browser.on('disconnected', () => {
        console.log('Browser disconnected');
        this.browser = null;
        this.page = null;
        // Emit event to notify status change
        if (this.onBrowserClosed) {
          this.onBrowserClosed();
        }
      });

      // Don't create a new page yet - browser already has a default tab
      console.log('Browser initialized successfully with default tab');
      return this.browser;

    } catch (error) {
      console.error('Failed to initialize browser:', error);
      throw error;
    }
  }

  /**
   * Configure page with minimal settings like normal Chrome
   */
  async configurePage() {
    if (!this.page) return;

    try {
      // Minimal configuration - act like normal Chrome browser
      // No special headers, no user agent override, no viewport forcing
      
      console.log('Page configured with minimal settings like normal Chrome');

    } catch (error) {
      console.error('Failed to configure page:', error);
    }
  }

  /**
   * Navigate to a specific URL
   */
  async navigateToUrl(url, options = {}) {
    try {
      if (!this.page) {
        throw new Error('Browser not initialized');
      }

      console.log(`Navigating to: ${url}`);
      
      await this.page.goto(url, {
        waitUntil: options.waitUntil || 'domcontentloaded',
        timeout: options.timeout || 30000
      });

      console.log(`Successfully navigated to: ${url}`);
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
      const element = await this.page.waitForSelector(selector, { timeout: 10000 });
      
      // Clear existing text
      await element.click({ clickCount: 3 });
      
      // Type with human-like delays
      for (const char of text) {
        await element.type(char, {
          delay: Math.random() * (200 - 50) + 50 // 50-200ms delay
        });
      }

      // Random pause after typing
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

      // Move mouse to element (human-like behavior)
      const box = await element.boundingBox();
      if (box) {
        await this.page.mouse.move(
          box.x + box.width / 2 + (Math.random() - 0.5) * 10,
          box.y + box.height / 2 + (Math.random() - 0.5) * 10
        );
      }

      // Small delay before click
      await this.randomDelay(200, 800);

      // Click with human-like timing
      await element.click({ delay: Math.random() * 100 + 50 });

      // Random pause after click
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

      console.log(`Screenshot saved: ${screenshotPath}`);
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
      console.error('Failed to get page info:', error);
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

      console.log('Browser closed successfully');

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
        console.log('Clearing browser data directory:', this.userDataDir);
        await fs.remove(this.userDataDir);
        console.log('✅ Browser data directory cleared successfully');
      } else {
        console.log('Browser data directory does not exist, creating fresh...');
      }
      
      // Ensure directory exists for new session
      await fs.ensureDir(this.userDataDir);
      
    } catch (error) {
      console.error('Failed to clear browser data directory:', error);
      // If we can't clear, still ensure directory exists
      await fs.ensureDir(this.userDataDir);
    }
  }

  /**
   * Clear browser data and reset
   */
  async clearBrowserData() {
    try {
      if (this.page) {
        // Clear cookies and storage
        const client = await this.page.target().createCDPSession();
        await client.send('Network.clearBrowserCookies');
        await client.send('Network.clearBrowserCache');
        await client.send('Storage.clearDataForOrigin', {
          origin: 'https://www.linkedin.com',
          storageTypes: 'all'
        });
        
        console.log('Browser data cleared successfully');
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
        // Close the first tab (usually about:blank)
        const firstPage = pages[0];
        
        // Check if it's the default about:blank tab
        const url = firstPage.url();
        console.log(`First tab URL: ${url}`);
        
        if (url === 'about:blank' || url === '' || url === 'chrome://newtab/' || url.startsWith('chrome://')) {
          await firstPage.close();
          console.log('✅ First tab closed immediately');
          
          // Update our page reference if we closed the current page
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
