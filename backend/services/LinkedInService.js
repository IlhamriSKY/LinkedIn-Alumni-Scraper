/**
 * LinkedIn Alumni Scraper Service
 * 
 * Handles LinkedIn authentication, navigation, and alumni profile extraction.
 * Designed specifically for university alumni directory scraping with
 * human-like behavior patterns to avoid detection.
 */
import logger from '../utils/logger.js';

/**
 * Helper function to get CSS selectors from environment variables
 */
const getSelector = (key, fallback = '') => {
  return process.env[key] || fallback;
};

/**
 * Helper function to get multiple selectors as array
 */
const getSelectors = (key, fallback = []) => {
  const selectors = process.env[key];
  if (!selectors) return fallback;
  return selectors.split(',').map(s => s.trim());
};

/**
 * Helper function to get timeout values
 */
const getTimeout = (key, fallback = 10000) => {
  return parseInt(process.env[key]) || fallback;
};

class LinkedInService {
  constructor(browserService, socketIo = null) {
    this.browserService = browserService;
    this.socketIo = socketIo;
    this.isLoggedIn = false;
    this.currentPage = null;
  }
  /**
   * Safely emit socket event (handles case when socketIo is not available)
   */
  emitSocketUpdate(eventType, data) {
    try {
      if (this.socketIo && typeof this.socketIo.emit === 'function') {
        this.socketIo.emit('linkedinUpdate', {
          type: eventType,
          data: data
        });
      } else {
        // Socket not available, log instead
        console.log(`SOCKET EVENT [${eventType}]:`, JSON.stringify(data, null, 2));
      }
    } catch (error) {
      console.error('Error emitting socket event:', error);
    }
  }

  /**
   * Generate random delay for human-like behavior
   * @param {number} min - Minimum delay in milliseconds
   * @param {number} max - Maximum delay in milliseconds
   * @returns {Promise<void>}
   */
  async randomDelay(min = 500, max = 1500) {
    const delay = Math.random() * (max - min) + min;
    return new Promise(resolve => setTimeout(resolve, delay));
  }

  /**
   * Simple delay function
   * @param {number} ms - Milliseconds to delay
   * @returns {Promise<void>}
   */
  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Configurable delay based on .env settings
   * Uses DEFAULT_DELAY_MIN and DEFAULT_DELAY_MAX from environment variables
   */
  async randomConfigurableDelay() {
    const delayMin = parseInt(process.env.DEFAULT_DELAY_MIN) || 2000;
    const delayMax = parseInt(process.env.DEFAULT_DELAY_MAX) || 5000;
    const randomDelay = Math.floor(Math.random() * (delayMax - delayMin + 1)) + delayMin;

    // Delay info suppressed for clean output
    logger.debug(`DELAY: Waiting ${randomDelay}ms (min: ${delayMin}ms, max: ${delayMax}ms)`);
    await this.delay(randomDelay);
    return randomDelay;
  }

  /**
   * Step-specific delay for different operations
   */
  async stepDelay(step = 'default') {
    const delayMin = parseInt(process.env.DEFAULT_DELAY_MIN) || 2000;
    const delayMax = parseInt(process.env.DEFAULT_DELAY_MAX) || 5000;

    const stepDelays = {
      'search': parseInt(process.env.DELAY_SEARCH) || Math.floor(Math.random() * (3000 - 1500 + 1)) + 1500,
      'navigation': parseInt(process.env.DELAY_NAVIGATION) || Math.floor(Math.random() * (2000 - 1000 + 1)) + 1000,
      'profile': parseInt(process.env.DELAY_PROFILE) || Math.floor(Math.random() * (4000 - 2000 + 1)) + 2000,
      'typing': parseInt(process.env.DELAY_TYPING) || Math.floor(Math.random() * (800 - 200 + 1)) + 200,
      'click': parseInt(process.env.DELAY_CLICK) || Math.floor(Math.random() * (1500 - 500 + 1)) + 500,
      'default': Math.floor(Math.random() * (delayMax - delayMin + 1)) + delayMin
    };

    let delayTime = stepDelays[step] !== undefined ? stepDelays[step] : stepDelays['default'];

    // Add randomness to configured delays (±20%)
    if (step !== 'default' && process.env[`DELAY_${step.toUpperCase()}`]) {
      const variance = delayTime * 0.2;
      delayTime = delayTime + (Math.random() * variance * 2 - variance);
      delayTime = Math.max(500, Math.floor(delayTime)); // Minimum 500ms
    }

    // Step delay info suppressed for clean output
    logger.debug(`STEP DELAY ${step}: ${delayTime}ms`);
    await this.delay(delayTime);
    return delayTime;
  }

  /**
   * Simulate human typing with realistic patterns and delays
   * @param {Page} page - Puppeteer page instance
   * @param {string} text - Text to type
   * @returns {Promise<void>}
   */
  async typeWithHumanLikeDelay(page, text) {
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      let delay;
      if (char === ' ') {
        delay = Math.random() * (80 - 30) + 30;
      } else if (char.match(/[A-Z]/)) {
        delay = Math.random() * (70 - 40) + 40;
      } else if (char.match(/[0-9]/)) {
        delay = Math.random() * (60 - 30) + 30;
      } else if (char.match(/[!@#$%^&*()]/)) {
        delay = Math.random() * (100 - 60) + 60;
      } else {
        delay = Math.random() * (50 - 20) + 20;
      }
      if (Math.random() < 0.05) {
        await this.randomDelay(150, 400);
      }
      await page.keyboard.type(char, {
        delay
      });
      if (Math.random() < 0.15) {
        await this.randomDelay(10, 50);
      }
    }
  }
  /**
   * Move mouse to element with human-like behavior
   * @param {Page} page - Puppeteer page instance
   * @param {string} selector - CSS selector for target element
   * @returns {Promise<void>}
   */
  async moveMouseToElement(page, selector) {
    try {
      const element = await page.$(selector);
      if (element) {
        const box = await element.boundingBox();
        if (box) {
          const x = box.x + box.width * (0.3 + Math.random() * 0.4);
          const y = box.y + box.height * (0.3 + Math.random() * 0.4);
          await page.mouse.move(x, y, {
            steps: Math.floor(Math.random() * 3) + 2
          });
          await this.randomDelay(50, 150);
        }
      }
    } catch (error) {
      // Mouse movement error suppressed for clean output
      logger.debug('Could not move mouse to element', {
        error: error.message
      });
    }
  }
  /**
   * Check if already logged in by examining current page without navigation
   */
  /**
   * Check current LinkedIn login status without navigation
   * @returns {Promise<Object>} Login status result with success flag and message
   */
  async checkLoginStatus() {
    try {
      const page = await this.browserService.getPage();
      this.currentPage = page;
      // Checking login status suppressed for clean output
      logger.debug('Checking login status without navigation');
      const currentUrl = page.url();
      // Current URL suppressed for clean output
      logger.debug('Current URL', {
        url: currentUrl
      });
      if (currentUrl.includes('/feed')) {
        // Already on LinkedIn feed - suppressed log
        logger.debug('Already on LinkedIn feed - logged in');
        this.isLoggedIn = true;
        return {
          success: true,
          message: 'Already logged in to LinkedIn',
          alreadyLoggedIn: true
        };
      }
      if (currentUrl.includes('/in/') && currentUrl.includes('linkedin.com')) {
        // On LinkedIn profile page - suppressed log  
        logger.debug('On LinkedIn profile page - logged in');
        this.isLoggedIn = true;
        return {
          success: true,
          message: 'Already logged in to LinkedIn',
          alreadyLoggedIn: true
        };
      }
      if (currentUrl.includes('linkedin.com') && !currentUrl.includes('/login')) {
        try {
          await page.waitForSelector(getSelector('GLOBAL_NAV_SELECTOR', '.global-nav, .scaffold-layout__nav, .feed-nav'), {
            timeout: 3000
          });
          // Found logged-in navigation elements - suppressed log
          logger.debug('Found logged-in navigation elements - logged in');
          this.isLoggedIn = true;
          return {
            success: true,
            message: 'Already logged in to LinkedIn',
            alreadyLoggedIn: true
          };
        } catch (e) {
          // No logged-in navigation elements - suppressed log
          logger.debug('No logged-in navigation elements found');
        }
      }
      if (currentUrl.includes('/login') || currentUrl.includes('/challenge') || currentUrl.includes('/uas/login')) {
        // On login page - suppressed log
        logger.debug('On login page - not logged in');
        this.isLoggedIn = false;
        return {
          success: false,
          message: 'Not logged in',
          requiresLogin: true
        };
      }
      if (!currentUrl.includes('linkedin.com')) {
        // Not on LinkedIn - suppressed log
        logger.debug('Not on LinkedIn - assuming not logged in');
        this.isLoggedIn = false;
        return {
          success: false,
          message: 'Not on LinkedIn',
          requiresLogin: true
        };
      }
      // Login status unclear - suppressed log
      logger.debug('Login status unclear - defaulting to not logged in');
      this.isLoggedIn = false;
      return {
        success: false,
        message: 'Login status unclear',
        requiresLogin: true
      };
    } catch (error) {
      console.error('Error checking login status:', error);
      this.isLoggedIn = false;
      return {
        success: false,
        message: `Error checking login: ${error.message}`,
        requiresLogin: true
      };
    }
  }
  /**
   * Login to LinkedIn using credentials from environment
   * Implements human-like typing to avoid bot detection
   */
  /**
   * Login to LinkedIn using environment credentials
   * @returns {Promise<Object>} Login result with success flag and message
   */
  async login() {
    try {
      const page = await this.browserService.getPage();
      this.currentPage = page;
      this.currentPage = page;
      const email = process.env.LINKEDIN_EMAIL;
      const password = process.env.LINKEDIN_PASSWORD;
      if (!email || !password) {
        throw new Error('LinkedIn credentials not found in environment variables');
      }
      // Navigating to login page - suppressed log
      logger.debug('Navigating to LinkedIn login page');
      await page.goto('https://www.linkedin.com/login', {
        waitUntil: 'networkidle2',
        timeout: 60000
      });
      await page.waitForSelector(getSelector('LOGIN_USERNAME_SELECTOR', '#username'), {
        timeout: getTimeout('LOGIN_TIMEOUT', 20000)
      });
      await page.waitForSelector(getSelector('LOGIN_PASSWORD_SELECTOR', '#password'), {
        timeout: getTimeout('LOGIN_TIMEOUT', 20000)
      });
      // Typing email - suppressed log
      logger.debug('Typing email with human-like behavior');
      await this.moveMouseToElement(page, getSelector('LOGIN_USERNAME_SELECTOR', '#username'));
      await page.click(getSelector('LOGIN_USERNAME_SELECTOR', '#username'));
      await this.randomDelay(200, 500);
      await page.keyboard.down('Control');
      await page.keyboard.press('KeyA');
      await page.keyboard.up('Control');
      await page.keyboard.press('Backspace');
      await this.randomDelay(200, 500);
      await this.typeWithHumanLikeDelay(page, email);
      // Typing password - suppressed log
      logger.debug('Typing password');
      await this.moveMouseToElement(page, getSelector('LOGIN_PASSWORD_SELECTOR', '#password'));
      await page.click(getSelector('LOGIN_PASSWORD_SELECTOR', '#password'));
      await this.randomDelay(200, 500);
      await page.keyboard.down('Control');
      await page.keyboard.press('KeyA');
      await page.keyboard.up('Control');
      await page.keyboard.press('Backspace');
      await this.randomDelay(200, 500);
      await this.typeWithHumanLikeDelay(page, password);
      await this.randomDelay(1000, 2000);
      // Clicking login button - suppressed log
      logger.debug('Clicking login button');
      await this.moveMouseToElement(page, getSelector('LOGIN_SUBMIT_SELECTOR', 'button[type="submit"]'));
      await page.click(getSelector('LOGIN_SUBMIT_SELECTOR', 'button[type="submit"]'));
      await this.randomDelay(3000, 5000);
      const currentUrl = page.url();
      // Current URL after login - suppressed log
      logger.debug('Current URL after login', {
        url: currentUrl
      });
      let loginSuccess = false;
      if (currentUrl.includes('/feed') || currentUrl.includes('/in/')) {
        loginSuccess = true;
        // Login detected via URL - suppressed log
        logger.debug('Login detected via URL');
      }
      if (!loginSuccess) {
        try {
          await page.waitForSelector(getSelector('MAIN_NAV_SELECTOR', '.global-nav'), {
            timeout: 5000
          });
          loginSuccess = true;
          // Login detected via navigation elements - suppressed log
          logger.debug('Login detected via navigation elements');
        } catch (e) {}
      }
      if (!loginSuccess && !currentUrl.includes('/login')) {
        loginSuccess = true;
        // Login detected via redirect - suppressed log
        logger.debug('Login detected via redirect');
      }
      if (!loginSuccess) {
        try {
          await page.waitForSelector(getSelector('FEED_CONTAINER_SELECTOR', '.feed-container, .scaffold-layout'), {
            timeout: 5000
          });
          loginSuccess = true;
          // Login detected via feed elements - suppressed log
          logger.debug('Login detected via feed elements');
        } catch (e) {}
      }
      if (loginSuccess) {
        this.isLoggedIn = true;
        // Successfully logged in - suppressed log
        logger.info('Successfully logged in to LinkedIn');
        await this.ensureFeedAccess();
        return {
          success: true,
          message: 'Login successful'
        };
      } else {
        if (currentUrl.includes('/challenge')) {
          return {
            success: false,
            message: 'LinkedIn requires verification. Please complete it manually.',
            requiresManualAction: true
          };
        }
        throw new Error('Login status unclear. Please check the browser manually.');
      }
    } catch (error) {
      logger.error('Login process failed:', {
        error: error.message,
        stack: error.stack
      });
      return {
        success: false,
        message: `Login failed: ${error.message}`
      };
    }
  }
  /**
   * Ensure we have proper access to LinkedIn feed before proceeding
   * First check if already logged in, then login if needed
   */
  async ensureFeedAccess() {
    try {
      if (!this.currentPage) {
        throw new Error('No active page found');
      }
      // Checking if already logged in - suppressed log
      logger.debug('Checking if already logged in');
      const loginCheck = await this.checkLoginStatus();
      if (loginCheck.success && loginCheck.alreadyLoggedIn) {
        // Already logged in - suppressed log
        logger.debug('Already logged in - skipping login process');
        this.isLoggedIn = true;
        return true;
      }
      if (loginCheck.requiresLogin) {
        // Not logged in - suppressed log
        logger.debug('Not logged in - performing login');
        const loginResult = await this.login();
        if (!loginResult.success) {
          throw new Error(`Login failed: ${loginResult.message}`);
        }
        this.isLoggedIn = true;
      }
      const currentUrl = this.currentPage.url();
      // Current URL after login - suppressed log  
      logger.debug('Current URL after login process', {
        url: currentUrl
      });
      if (!currentUrl.includes('/feed')) {
        // Navigating to feed - suppressed log
        logger.debug('Navigating to LinkedIn feed');
        await this.currentPage.goto('https://www.linkedin.com/feed/', {
          waitUntil: 'domcontentloaded',
          timeout: 30000
        });
        await this.randomDelay(2000, 4000);
      }
      // Waiting for feed to load - suppressed log
      logger.debug('Waiting for feed to load');
      try {
        await this.currentPage.waitForSelector(getSelector('SCAFFOLD_LAYOUT_SELECTOR', '.scaffold-layout, .feed-container'), {
          timeout: 10000
        });
        // Feed loaded successfully - suppressed log
        logger.debug('Feed loaded successfully');
      } catch (error) {
        // Feed elements not found - suppressed log
        logger.debug('Feed elements not found, but proceeding');
      }
      await this.randomDelay(2000, 3000);
      // Feed access confirmed - suppressed log
      logger.debug('Feed access confirmed - ready for university navigation');
      return true;
    } catch (error) {
      console.error('Error ensuring feed access:', error);
      return false;
    }
  }
  /**
   * Navigate to university alumni page - now separate from login
   */
  /**
   * Navigate to university alumni page from LinkedIn feed
   * @returns {Promise<Object>} Navigation result with success flag and message
   */
  async navigateToUniversityAlumni() {
    try {
      if (!this.isLoggedIn) {
        throw new Error('Must be logged in before navigating to university page');
      }
      const universityUrl = process.env.UNIVERSITY_LINKEDIN_URL;
      const universityName = process.env.UNIVERSITY_NAME;
      if (!universityUrl) {
        throw new Error('University LinkedIn URL not found in environment variables');
      }
      // Navigating to university - suppressed log
      logger.debug('Navigating to university alumni page', {
        universityName,
        universityUrl
      });
      const page = this.currentPage;
      try {
        // Starting navigation - suppressed log
        logger.debug('Starting navigation');
        await page.goto(universityUrl, {
          waitUntil: 'domcontentloaded', // Less strict than networkidle0
          timeout: 60000 // Increased timeout to 60 seconds
        });
        // Initial navigation completed - suppressed log
        // Initial navigation completed - suppressed log
        logger.debug('Initial navigation completed');
      } catch (navError) {
        // Initial navigation failed, trying alternative approach... - suppressed log
        // Initial navigation failed - suppressed log
        logger.debug('Initial navigation failed, trying alternative approach');
        try {
          await page.goto('https://www.linkedin.com', {
            waitUntil: 'domcontentloaded',
            timeout: 30000
          });
          await this.randomDelay(2000, 3000);
          await page.goto(universityUrl, {
            waitUntil: 'domcontentloaded',
            timeout: 45000
          });
          // Alternative navigation completed - suppressed log
          logger.debug('Alternative navigation completed');
        } catch (altError) {
          throw new Error(`Navigation failed after retry: ${altError.message}`);
        }
      }
      // Waiting for page to stabilize... - suppressed log
      logger.debug('Waiting for page to stabilize...');
      await this.randomDelay(3000, 5000);
      const currentUrl = page.url();
      console.log('Current URL after navigation:', currentUrl);
      if (currentUrl.includes('linkedin.com/school') || currentUrl.includes('/people/')) {
        console.log(`Successfully navigated to ${universityName} alumni page`);
        try {
          await page.waitForSelector(getSelector('PEOPLE_SEARCH_SELECTOR', '#people-search-keywords'), {
            timeout: getTimeout('SEARCH_TIMEOUT', 10000)
          });
          // Alumni search box found - page is ready for scraping - suppressed log
          logger.debug('Alumni search box found - page is ready for scraping');
          return {
            success: true,
            message: `Successfully opened ${universityName} alumni page and search is ready`
          };
        } catch (searchError) {
          // Alumni search box not found, but university page loaded - suppressed log
          logger.debug('Alumni search box not found, but university page loaded');
          return {
            success: true,
            message: `Opened ${universityName} alumni page (search box may take time to load)`
          };
        }
      } else {
        if (currentUrl.includes('linkedin.com/login')) {
          throw new Error('Redirected to login page - session may have expired');
        } else if (currentUrl.includes('linkedin.com/404') || currentUrl.includes('not-found')) {
          throw new Error('University page not found - check if URL is correct');
        } else {
          throw new Error(`Navigation ended on unexpected page: ${currentUrl}`);
        }
      }
    } catch (error) {
      console.error('Failed to navigate to university alumni:', error.message);
      // Attempting alternative navigation method... - suppressed log
      logger.debug('Attempting alternative navigation method...');
      try {
        const alternativeResult = await this.searchForUniversityAlternative(universityName);
        if (alternativeResult.success) {
          return alternativeResult;
        }
      } catch (altError) {
        console.error('Alternative navigation also failed:', altError.message);
      }
      throw error;
    }
  }
  /**
   * Alternative method to find university page using LinkedIn search
   */
  async searchForUniversityAlternative(universityName) {
    try {
      console.log(`Searching for ${universityName} using LinkedIn search...`);
      const page = this.currentPage;
      await page.goto('https://www.linkedin.com', {
        waitUntil: 'domcontentloaded',
        timeout: 30000
      });
      await this.randomDelay(2000, 3000);
      const searchBox = await page.waitForSelector(getSelector('MAIN_SEARCH_SELECTOR', 'input[placeholder*="Search"]'), {
        timeout: getTimeout('SEARCH_TIMEOUT', 10000)
      });
      await searchBox.click();
      await searchBox.type(universityName);
      await page.keyboard.press('Enter');
      await this.randomDelay(3000, 5000);
      const universityLink = await page.$(getSelector('UNIVERSITY_LINK_SELECTOR', 'a[href*="/school/"][href*="unika-soegijapranata"]'));
      if (universityLink) {
        await universityLink.click();
        await this.randomDelay(3000, 5000);
        const peopleTab = await page.$(getSelector('PEOPLE_TAB_SELECTOR', 'a[href*="/people/"]'));
        if (peopleTab) {
          await peopleTab.click();
          await this.randomDelay(2000, 4000);
          const currentUrl = page.url();
          if (currentUrl.includes('/school/') && currentUrl.includes('/people/')) {
            // Successfully found university through search - suppressed log
            logger.debug('Successfully found university through search');
            return {
              success: true,
              message: `Found ${universityName} alumni page via search`
            };
          }
        }
      }
      throw new Error('Could not find university through search');
    } catch (error) {
      console.error('Alternative search method failed:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }
  /**
   * Navigate back to university alumni page for next search iteration
   */
  async navigateBackToAlumniPage() {
    try {
      const page = this.currentPage;
      if (!page) {
        throw new Error('Browser page not available');
      }
      // Navigating back to university alumni page for next search... - suppressed log
      logger.debug('Navigating back to university alumni page for next search...');
      const result = await this.navigateToUniversityAlumni();
      if (result.success) {
        // Successfully navigated back to alumni page for next search - suppressed log
        logger.debug('Successfully navigated back to alumni page for next search');
        await this.randomDelay(2000, 3000);
        return {
          success: true,
          message: 'Ready for next alumni search'
        };
      } else {
        throw new Error(result.message || 'Failed to navigate back to alumni page');
      }
    } catch (error) {
      console.error('Error navigating back to alumni page:', error);
      return {
        success: false,
        message: `Failed to navigate back to alumni page: ${error.message}`
      };
    }
  }
  /**
   * Search for alumni using university alumni search (not global search)
   */
  async searchAlumniOnUniversityPage(searchName) {
    try {
      if (!this.isLoggedIn || !this.currentPage) {
        throw new Error('Not logged in or page not available');
      }

      const page = this.currentPage;
      const currentUrl = page.url();
      console.log(`ALUMNI SEARCH - Current URL: ${currentUrl}`);
      console.log(`ALUMNI SEARCH - Searching for: ${searchName} on university alumni page`);

      if (!currentUrl.includes('/school/') || !currentUrl.includes('/people/')) {
        throw new Error(`Not on university alumni page. Current URL: ${currentUrl}`);
      }

      logger.debug('ALUMNI SEARCH - Confirmed on university alumni page, proceeding with alumni-specific search...');

      await this.stepDelay('search');

      const searchInput = await page.waitForSelector(getSelector('PEOPLE_SEARCH_SELECTOR', '#people-search-keywords'), {
        timeout: getTimeout('SEARCH_TIMEOUT', 10000)
      });
      await searchInput.click({
        clickCount: 3
      });
      await page.keyboard.press('Backspace');

      await this.stepDelay('typing');
      await this.typeWithHumanLikeDelay(page, searchName);

      await this.stepDelay('click');
      await page.keyboard.press('Enter');

      await this.stepDelay('search');

      // Retry wait for results up to MAX_RETRIES times
      let retries = 0;
      const maxRetries = parseInt(process.env.MAX_RETRIES) || 3;
      let found = false;
      while (retries < maxRetries) {
        try {
          await page.waitForSelector(getSelector('PROFILE_CARDS_PRIMARY', '.org-people-profile-card') + ', ' + getSelector('PROFILE_CARDS_FALLBACK2', '.artdeco-entity-lockup'), {
            timeout: getTimeout('ELEMENT_WAIT_TIMEOUT', 15000)
          });
          found = true;
          break;
        } catch (e) {
          retries++;
          console.log(`Retry ${retries}: Alumni profiles not yet loaded, waiting...`);
          await this.stepDelay('search');
        }
      }

      if (!found) {
        console.log('No alumni profiles found for:', searchName);
        return {
          name: searchName,
          position: 'Not found',
          company: 'N/A',
          location: 'N/A',
          bio: '',
          experience: [],
          education: [],
          profileUrl: '',
          searchKeyword: searchName,
          found: false,
          scrapedAt: new Date().toISOString()
        };
      }

      const alumniProfiles = await page.evaluate((searchTerm, selectors) => {
        console.log('=== EVALUATING ALUMNI PROFILES FROM DOM ===');

        // Try multiple selectors for profile cards using env variables
        let profileCards = document.querySelectorAll(selectors.PROFILE_CARDS_PRIMARY);
        if (profileCards.length === 0) {
          console.log('No primary profile cards found, trying fallback1...');
          profileCards = document.querySelectorAll(selectors.PROFILE_CARDS_FALLBACK1);
        }
        if (profileCards.length === 0) {
          console.log('No fallback1 profile cards found, trying fallback2...');
          profileCards = document.querySelectorAll(selectors.PROFILE_CARDS_FALLBACK2);
        }

        console.log(`Found ${profileCards.length} profile cards`);
        const profiles = [];

        profileCards.forEach((card, index) => {
          if (index >= 5) return; // Limit to first 5 results
          try {
            console.log(`\n=== Processing card ${index + 1} ===`);

            // Debug: Log the card structure for the first card
            if (index === 0) {
              console.log('First card HTML:', card.outerHTML.substring(0, 300) + '...');
            }

            // Get name - try multiple selectors from env
            let nameElement = card.querySelector(selectors.CARD_NAME_PRIMARY);
            if (!nameElement) {
              nameElement = card.querySelector(selectors.CARD_NAME_FALLBACK1);
            }
            if (!nameElement) {
              nameElement = card.querySelector(selectors.CARD_NAME_FALLBACK2);
            }

            let name = 'LinkedIn Member';
            let profileUrl = '';

            if (nameElement) {
              // Get name from aria-label first, then from text content
              if (nameElement.getAttribute('aria-label')) {
                const ariaLabel = nameElement.getAttribute('aria-label');
                const match = ariaLabel.match(/View (.+?)['']?s profile/);
                if (match) {
                  name = match[1];
                }
              } else {
                const nameText = nameElement.textContent || nameElement.innerText;
                if (nameText && nameText.trim()) {
                  name = nameText.trim();
                }
              }

              // Get profile URL
              profileUrl = nameElement.href || nameElement.getAttribute('href') || '';
            }

            // Get subtitle/position - try multiple selectors
            let subtitle = '';
            let bio = '';

            // First try to get position/title
            let subtitleElement = card.querySelector(selectors.CARD_SUBTITLE_PRIMARY);
            if (!subtitleElement) {
              subtitleElement = card.querySelector(selectors.CARD_SUBTITLE_FALLBACK1);
            }
            if (!subtitleElement) {
              subtitleElement = card.querySelector(selectors.CARD_SUBTITLE_FALLBACK2);
            }
            if (subtitleElement) {
              subtitle = subtitleElement.textContent?.trim() || '';
            }

            // Try to get bio/description from multiple possible locations
            const bioSelectors = [
              selectors.CARD_BIO_PRIMARY,
              selectors.CARD_BIO_FALLBACK1,
              selectors.CARD_BIO_FALLBACK2,
              selectors.CARD_BIO_FALLBACK3,
              selectors.CARD_BIO_FALLBACK4,
              selectors.CARD_BIO_FALLBACK5
            ];

            for (const selector of bioSelectors) {
              const bioElement = card.querySelector(selector);
              if (bioElement && bioElement.textContent?.trim() &&
                bioElement.textContent.trim() !== subtitle &&
                bioElement.textContent.trim().length > subtitle.length) {
                bio = bioElement.textContent.trim();
                break;
              }
            }

            console.log(`Card ${index + 1} - Name: ${name}`);
            console.log(`Card ${index + 1} - Position: ${subtitle}`);
            console.log(`Card ${index + 1} - Bio: ${bio}`);
            console.log(`Card ${index + 1} - URL: ${profileUrl}`);

            // Clean the profile URL (remove query parameters but keep the base)
            if (profileUrl) {
              try {
                const url = new URL(profileUrl, 'https://www.linkedin.com');
                profileUrl = url.origin + url.pathname;
              } catch (e) {
                // If URL parsing fails, just remove query string manually
                profileUrl = profileUrl.split('?')[0];
              }
            }

            // Skip if no profile URL or if it's just a placeholder
            if (!profileUrl || !profileUrl.includes('/in/') || name === 'LinkedIn Member') {
              console.log(`Skipping card ${index + 1}: invalid profile data`);
              return;
            }

            console.log(`Card ${index + 1} - Cleaned URL: ${profileUrl}`);
            console.log(`✅ Adding valid profile: ${name}`);

            profiles.push({
              name: name,
              position: subtitle,
              bio: bio,
              subtitle: subtitle,
              profileUrl: profileUrl,
              searchKeyword: searchTerm,
              found: true,
              cardIndex: index
            });

          } catch (error) {
            console.log(`Error extracting profile from card ${index}:`, error.message);
          }
        });

        console.log(`=== EXTRACTION COMPLETE: ${profiles.length} valid profiles ===`);
        return profiles;
      }, searchName, {
        PROFILE_CARDS_PRIMARY: getSelector('PROFILE_CARDS_PRIMARY', '.org-people-profile-card'),
        PROFILE_CARDS_FALLBACK1: getSelector('PROFILE_CARDS_FALLBACK1', '[data-control-name="people_profile_card"]'),
        PROFILE_CARDS_FALLBACK2: getSelector('PROFILE_CARDS_FALLBACK2', '.artdeco-entity-lockup'),
        CARD_NAME_PRIMARY: getSelector('CARD_NAME_PRIMARY', '.artdeco-entity-lockup__title a'),
        CARD_NAME_FALLBACK1: getSelector('CARD_NAME_FALLBACK1', 'a[aria-label*="View"]'),
        CARD_NAME_FALLBACK2: getSelector('CARD_NAME_FALLBACK2', 'a[href*="/in/"]'),
        CARD_SUBTITLE_PRIMARY: getSelector('CARD_SUBTITLE_PRIMARY', '.artdeco-entity-lockup__subtitle'),
        CARD_SUBTITLE_FALLBACK1: getSelector('CARD_SUBTITLE_FALLBACK1', '.t-14.t-black--light'),
        CARD_SUBTITLE_FALLBACK2: getSelector('CARD_SUBTITLE_FALLBACK2', '.artdeco-entity-lockup__caption'),
        CARD_BIO_SELECTORS: getSelectors('CARD_BIO_SELECTORS', ['.artdeco-entity-lockup__content', '.t-12.t-black--light', '.entity-result__summary'])
      });

      if (alumniProfiles.length > 0) {
        console.log(`ALUMNI SEARCH - Found ${alumniProfiles.length} alumni profiles`);

        this.emitSocketUpdate('search_progress', {
          searchName: searchName,
          foundCount: alumniProfiles.length,
          status: `Found ${alumniProfiles.length} profiles, extracting first profile...`,
          profiles: alumniProfiles
        });

        try {
          const firstProfile = alumniProfiles[0];
          console.log(`Opening first profile: ${firstProfile.name} - ${firstProfile.profileUrl}`);

          await this.stepDelay('profile');

          const detailed = await this.getDetailedProfileInfo(firstProfile.profileUrl, firstProfile);

          this.emitSocketUpdate('profile_auto_open', {
            profile: detailed,
            profileIndex: 1,
            status: `Auto-opened and extracted first profile: ${detailed.name}`
          });

          return [detailed];
        } catch (error) {
          console.error(`Failed to open first profile:`, error.message);

          // Create fallback profile data with what we have from alumni page
          const fallbackProfile = {
            ...alumniProfiles[0],
            position: alumniProfiles[0].position || alumniProfiles[0].subtitle || 'Error extracting details',
            company: alumniProfiles[0].company || 'Error',
            location: alumniProfiles[0].location || 'Error',
            bio: alumniProfiles[0].bio || '',
            experience: [],
            education: [],
            experienceText: '',
            educationText: '',
            universityName: process.env.UNIVERSITY_NAME || 'University',
            found: true,
            detailsExtracted: false,
            extractionMethod: 'alumni_page_fallback',
            error: error.message,
            scrapedAt: new Date().toISOString(),
            profileIndex: 1
          };

          console.log(`Created fallback profile for CSV: ${fallbackProfile.name} - ${fallbackProfile.position}`);
          console.log(`Fallback bio: ${fallbackProfile.bio}`);
          return [fallbackProfile];
        }
      } else {
        console.log(`No alumni found for: ${searchName}`);
        return {
          name: searchName,
          position: 'Not found',
          company: 'N/A',
          location: 'N/A',
          bio: '',
          experience: [],
          education: [],
          profileUrl: '',
          searchKeyword: searchName,
          found: false,
          scrapedAt: new Date().toISOString()
        };
      }
    } catch (error) {
      console.error(`Error searching alumni for ${searchName}:`, error);
      return {
        name: searchName,
        position: 'Error',
        company: 'Error',
        location: 'Error',
        bio: '',
        experience: [],
        education: [],
        profileUrl: '',
        searchKeyword: searchName,
        error: error.message,
        found: false,
        scrapedAt: new Date().toISOString()
      };
    }
  }

  /**
   * Search for a person and extract their profile data using alumni search
   */
  /**
   * Search and extract alumni profile data
   * @param {string} searchName - Name to search for in alumni directory
   * @returns {Promise<Object>} Search result with profile data or error
   */
  async searchAndExtract(searchName) {
    try {
      if (!this.isLoggedIn || !this.currentPage) {
        throw new Error('Not logged in or page not available');
      }
      console.log(`Starting search and extraction for: ${searchName}`);

      const profileResults = await this.searchAlumniOnUniversityPage(searchName);

      // Check if we got results (could be array or single object)
      if (Array.isArray(profileResults)) {
        if (profileResults.length > 0) {
          console.log(`Found ${profileResults.length} alumni profiles for: ${searchName}`);
          profileResults.forEach((profile, index) => {
            console.log(`Profile ${index + 1}: ${profile.name} - ${profile.position} at ${profile.company}`);
          });
          return profileResults;
        } else {
          console.log(`No alumni profiles found for: ${searchName}`);
          return [{
            name: searchName,
            position: 'Not found',
            company: 'N/A',
            location: 'N/A',
            bio: '',
            experience: [],
            education: [],
            experienceText: '',
            educationText: '',
            profileUrl: '',
            searchKeyword: searchName,
            found: false,
            universityName: process.env.UNIVERSITY_NAME || 'Universitas Indonesia',
            scrapedAt: new Date().toISOString()
          }];
        }
      } else {
        // Handle backward compatibility for single object response
        if (profileResults && profileResults.found) {
          console.log(`Found alumni profile: ${profileResults.name} - ${profileResults.position} at ${profileResults.company}`);
          return [profileResults]; // Wrap in array for consistency
        } else {
          console.log(`No alumni profile found for: ${searchName}`);
          return [profileResults]; // Return the "not found" result wrapped in array
        }
      }
    } catch (error) {
      console.error(`Error searching for ${searchName}:`, error);
      return [{
        name: searchName,
        position: 'Error',
        company: 'Error',
        location: 'Error',
        bio: 'Error occurred during search',
        experience: [],
        education: [],
        experienceText: '',
        educationText: '',
        profileUrl: '',
        searchKeyword: searchName,
        error: error.message,
        found: false,
        universityName: process.env.UNIVERSITY_NAME || 'Universitas Indonesia',
        scrapedAt: new Date().toISOString()
      }];
    }
  }
  /**
   * Get detailed profile information by visiting individual profile page
   */
  async getDetailedProfileInfo(profileUrl, basicInfo = {}) {
    try {
      console.log(`PROFILE DETAILS - Getting detailed profile from: ${profileUrl}`);
      const page = this.currentPage;

      // Step 1: Navigation delay
      await this.stepDelay('navigation');

      // PROFILE DETAILS - Navigating to profile page...
      console.log('PROFILE DETAILS - Navigating to profile page...');
      // Ensure clean URL (remove any query parameters that might interfere)
      const cleanUrl = profileUrl.split('?')[0];
      console.log(`PROFILE DETAILS - Clean URL: ${cleanUrl}`);

      // Navigate to profile with multiple retry strategies
      console.log('PROFILE DETAILS - Starting navigation...');
      let navigationSuccess = false;
      let retryCount = 0;
      const maxRetries = parseInt(process.env.MAX_RETRIES) || 3;
      
      while (!navigationSuccess && retryCount < maxRetries) {
        try {
          console.log(`PROFILE DETAILS - Navigation attempt ${retryCount + 1}/${maxRetries}`);          if (retryCount === 0) {
            // First attempt: Normal navigation with networkidle
            await page.goto(cleanUrl, {
              waitUntil: ['networkidle2', 'domcontentloaded'],
              timeout: 30000
            });
          } else if (retryCount === 1) {
            // Second attempt: Just domcontentloaded
            await page.goto(cleanUrl, {
              waitUntil: 'domcontentloaded',
              timeout: 20000
            });
          } else {
            // Final attempt: Load only
            await page.goto(cleanUrl, {
              waitUntil: 'load',
              timeout: getTimeout('PROFILE_LOAD_TIMEOUT', 15000)
            });
          }

          navigationSuccess = true;
          console.log(`PROFILE DETAILS - Navigation successful on attempt ${retryCount + 1}`);
        } catch (navError) {
          retryCount++;
          console.log(`PROFILE DETAILS - Navigation attempt ${retryCount} failed: ${navError.message}`);

          if (retryCount >= maxRetries) {
            // If all navigation attempts fail, try to extract from basic info
            console.log('PROFILE DETAILS - All navigation attempts failed, using basic info');
            return this.createProfileFromBasicInfo(basicInfo, profileUrl);
          }

          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }

      console.log('PROFILE DETAILS - Page loaded, checking URL...');
      const currentUrl = page.url();
      console.log(`PROFILE DETAILS - Current URL after navigation: ${currentUrl}`);

      // Verify we're actually on a profile page
      if (!currentUrl.includes('/in/') || currentUrl.includes('linkedin.com/school/')) {
        throw new Error(`Navigation failed - not on profile page. Current URL: ${currentUrl}`);
      }

      // Step 2: Profile loading delay
      await this.stepDelay('profile');

      // Wait for main profile elements to be present
      console.log('PROFILE DETAILS - Waiting for profile elements...');
      try {
        await page.waitForSelector(getSelector('PROFILE_WAIT_SELECTOR', '.pv-text-details__left-panel, .text-heading-xlarge, .pv-top-card, h1'), {
          timeout: 15000
        });
        console.log('PROFILE DETAILS - Profile elements detected');
      } catch (waitError) {
        console.log('PROFILE DETAILS - Profile elements not found, proceeding anyway...');
        console.log('PROFILE DETAILS - Wait error:', waitError.message);
      }

      // Step 3: Content extraction delay
      await this.stepDelay('default');

      console.log('PROFILE DETAILS - Extracting detailed information from profile page...');

      // Get profile page selectors from environment
      const profileSelectors = {
        // Name selectors
        NAME_PRIMARY: this.getSelector('PROFILE_NAME_PRIMARY'),
        NAME_FALLBACK1: this.getSelector('PROFILE_NAME_FALLBACK1'),
        NAME_FALLBACK2: this.getSelector('PROFILE_NAME_FALLBACK2'),
        NAME_FALLBACK3: this.getSelector('PROFILE_NAME_FALLBACK3'),
        NAME_FALLBACK4: this.getSelector('PROFILE_NAME_FALLBACK4'),
        NAME_FALLBACK5: this.getSelector('PROFILE_NAME_FALLBACK5'),
        NAME_FALLBACK6: this.getSelector('PROFILE_NAME_FALLBACK6'),
        NAME_FALLBACK7: this.getSelector('PROFILE_NAME_FALLBACK7'),
        NAME_FALLBACK8: this.getSelector('PROFILE_NAME_FALLBACK8'),

        // Bio selectors
        BIO_PRIMARY: this.getSelector('PROFILE_BIO_PRIMARY'),
        BIO_FALLBACK1: this.getSelector('PROFILE_BIO_FALLBACK1'),
        BIO_FALLBACK2: this.getSelector('PROFILE_BIO_FALLBACK2'),
        BIO_FALLBACK3: this.getSelector('PROFILE_BIO_FALLBACK3'),
        BIO_FALLBACK4: this.getSelector('PROFILE_BIO_FALLBACK4'),
        BIO_FALLBACK5: this.getSelector('PROFILE_BIO_FALLBACK5'),
        BIO_FALLBACK6: this.getSelector('PROFILE_BIO_FALLBACK6'),

        // Location selectors
        LOCATION_PRIMARY: this.getSelector('PROFILE_LOCATION_PRIMARY'),
        LOCATION_FALLBACK1: this.getSelector('PROFILE_LOCATION_FALLBACK1'),
        LOCATION_FALLBACK2: this.getSelector('PROFILE_LOCATION_FALLBACK2'),
        LOCATION_FALLBACK3: this.getSelector('PROFILE_LOCATION_FALLBACK3'),

        // Experience selectors
        EXPERIENCE_SECTION: this.getSelector('PROFILE_EXPERIENCE_SECTION'),
        EXPERIENCE_ITEMS: this.getSelector('PROFILE_EXPERIENCE_ITEMS'),
        EXPERIENCE_POSITION_PRIMARY: this.getSelector('PROFILE_EXPERIENCE_POSITION_PRIMARY'),
        EXPERIENCE_POSITION_FALLBACK1: this.getSelector('PROFILE_EXPERIENCE_POSITION_FALLBACK1'),
        EXPERIENCE_POSITION_FALLBACK2: this.getSelector('PROFILE_EXPERIENCE_POSITION_FALLBACK2'),
        EXPERIENCE_POSITION_FALLBACK3: this.getSelector('PROFILE_EXPERIENCE_POSITION_FALLBACK3'),
        EXPERIENCE_POSITION_FALLBACK4: this.getSelector('PROFILE_EXPERIENCE_POSITION_FALLBACK4'),
        EXPERIENCE_COMPANY_PRIMARY: this.getSelector('PROFILE_EXPERIENCE_COMPANY_PRIMARY'),
        EXPERIENCE_COMPANY_FALLBACK1: this.getSelector('PROFILE_EXPERIENCE_COMPANY_FALLBACK1'),
        EXPERIENCE_COMPANY_FALLBACK2: this.getSelector('PROFILE_EXPERIENCE_COMPANY_FALLBACK2'),
        EXPERIENCE_DURATION: this.getSelector('PROFILE_EXPERIENCE_DURATION'),

        // Education selectors
        EDUCATION_SECTION: this.getSelector('PROFILE_EDUCATION_SECTION'),
        EDUCATION_ITEMS: this.getSelector('PROFILE_EDUCATION_ITEMS'),
        EDUCATION_SCHOOL_PRIMARY: this.getSelector('PROFILE_EDUCATION_SCHOOL_PRIMARY'),
        EDUCATION_SCHOOL_FALLBACK1: this.getSelector('PROFILE_EDUCATION_SCHOOL_FALLBACK1'),
        EDUCATION_SCHOOL_FALLBACK2: this.getSelector('PROFILE_EDUCATION_SCHOOL_FALLBACK2'),
        EDUCATION_SCHOOL_FALLBACK3: this.getSelector('PROFILE_EDUCATION_SCHOOL_FALLBACK3'),
        EDUCATION_DEGREE_PRIMARY: this.getSelector('PROFILE_EDUCATION_DEGREE_PRIMARY'),
        EDUCATION_DEGREE_FALLBACK1: this.getSelector('PROFILE_EDUCATION_DEGREE_FALLBACK1'),
        EDUCATION_DURATION: this.getSelector('PROFILE_EDUCATION_DURATION')
      };

      const profileData = await page.evaluate((selectors) => {
        console.log('Starting profile data extraction...');
        const data = {
          name: '',
          position: '',
          company: '',
          location: '',
          bio: '',
          experience: [],
          education: [],
          profileUrl: window.location.href
        };

        try {
          // Extract name with multiple fallback selectors
          // Extracting name... - browser context
          console.log('Extracting name...');
          const nameSelectors = [
            selectors.NAME_PRIMARY,
            selectors.NAME_FALLBACK1,
            selectors.NAME_FALLBACK2,
            selectors.NAME_FALLBACK3,
            selectors.NAME_FALLBACK4,
            selectors.NAME_FALLBACK5,
            selectors.NAME_FALLBACK6,
            selectors.NAME_FALLBACK7,
            selectors.NAME_FALLBACK8
          ];

          for (const selector of nameSelectors) {
            const nameElement = document.querySelector(selector);
            if (nameElement?.textContent?.trim()) {
              data.name = nameElement.textContent.trim();
              console.log(`Name found with selector "${selector}": ${data.name}`);
              break;
            }
          }

          // Extract bio/headline  
          console.log('Extracting bio/headline...');
          const bioSelectors = [
            selectors.BIO_PRIMARY,
            selectors.BIO_FALLBACK1,
            selectors.BIO_FALLBACK2,
            selectors.BIO_FALLBACK3,
            selectors.BIO_FALLBACK4,
            selectors.BIO_FALLBACK5,
            selectors.BIO_FALLBACK6
          ];

          for (const selector of bioSelectors) {
            const bioElement = document.querySelector(selector);
            if (bioElement?.textContent?.trim()) {
              data.bio = bioElement.textContent.trim();
              console.log(`Bio found with selector "${selector}": ${data.bio}`);
              break;
            }
          }

          // Extract location
          console.log('Extracting location...');
          const locationSelectors = [
            selectors.LOCATION_PRIMARY,
            selectors.LOCATION_FALLBACK1,
            selectors.LOCATION_FALLBACK2,
            selectors.LOCATION_FALLBACK3
          ];

          for (const selector of locationSelectors) {
            const locationElement = document.querySelector(selector);
            if (locationElement?.textContent?.trim()) {
              data.location = locationElement.textContent.trim();
              console.log(`Location found with selector "${selector}": ${data.location}`);
              break;
            }
          }

          // Extract experience with improved selectors
          // Looking for experience section... - browser context
          console.log('Looking for experience section...');
          const experienceSection = document.querySelector(selectors.EXPERIENCE_SECTION);
          if (experienceSection) {
            // Experience section found, extracting data... - browser context
            console.log('Experience section found, extracting data...');
            const experienceItems = experienceSection.parentElement.querySelectorAll(selectors.EXPERIENCE_ITEMS);
            console.log(`Found ${experienceItems.length} experience items`);

            experienceItems.forEach((item, index) => {
              if (index >= 5) return; // Limit to first 5 experiences

              try {
                // Try multiple selectors for position - updated for new layout
                const positionSelectors = [
                  selectors.EXPERIENCE_POSITION_PRIMARY,
                  selectors.EXPERIENCE_POSITION_FALLBACK1,
                  selectors.EXPERIENCE_POSITION_FALLBACK2,
                  selectors.EXPERIENCE_POSITION_FALLBACK3,
                  selectors.EXPERIENCE_POSITION_FALLBACK4
                ];

                let position = '';
                for (const selector of positionSelectors) {
                  const element = item.querySelector(selector);
                  if (element?.textContent?.trim()) {
                    position = element.textContent.trim();
                    break;
                  }
                }

                // Try multiple selectors for company - updated for new layout
                const companySelectors = [
                  selectors.EXPERIENCE_COMPANY_PRIMARY,
                  selectors.EXPERIENCE_COMPANY_FALLBACK1,
                  selectors.EXPERIENCE_COMPANY_FALLBACK2
                ];

                let company = '';
                for (const selector of companySelectors) {
                  const element = item.querySelector(selector);
                  if (element?.textContent?.trim()) {
                    company = element.textContent.trim().split('·')[0].trim(); // Remove employment type
                    break;
                  }
                }

                // Extract duration - updated for new layout
                const durationElement = item.querySelector(selectors.EXPERIENCE_DURATION);
                const duration = durationElement?.textContent?.trim() || '';

                if (position || company) {
                  data.experience.push({
                    position: position,
                    company: company,
                    duration: duration,
                    location: ''
                  });

                  // Set current position from first experience
                  if (index === 0) {
                    data.position = position;
                    data.company = company.split(' � ')[0]; // Remove employment type
                  }

                  console.log(`Experience ${index + 1}: ${position} at ${company} (${duration})`);
                }
              } catch (expError) {
                console.log(`Error extracting experience item ${index}:`, expError);
              }
            });
          } else {
            // Experience section (#experience) not found - browser context
            console.log('Experience section (#experience) not found');
          }

          // Extract education with improved selectors
          // Looking for education section... - browser context
          console.log('Looking for education section...');
          const educationSection = document.querySelector(selectors.EDUCATION_SECTION);
          if (educationSection) {
            // Education section found, extracting data... - browser context
            console.log('Education section found, extracting data...');
            const educationItems = educationSection.parentElement.querySelectorAll(selectors.EDUCATION_ITEMS);
            console.log(`Found ${educationItems.length} education items`);

            educationItems.forEach((item, index) => {
              if (index >= 3) return; // Limit to first 3 education entries

              try {
                // Extract school name - updated for new layout
                const schoolSelectors = [
                  selectors.EDUCATION_SCHOOL_PRIMARY,
                  selectors.EDUCATION_SCHOOL_FALLBACK1,
                  selectors.EDUCATION_SCHOOL_FALLBACK2,
                  selectors.EDUCATION_SCHOOL_FALLBACK3
                ];

                let school = '';
                for (const selector of schoolSelectors) {
                  const element = item.querySelector(selector);
                  if (element?.textContent?.trim()) {
                    school = element.textContent.trim();
                    break;
                  }
                }

                // Extract degree - updated for new layout
                const degreeSelectors = [
                  selectors.EDUCATION_DEGREE_PRIMARY,
                  selectors.EDUCATION_DEGREE_FALLBACK1
                ];

                let degree = '';
                for (const selector of degreeSelectors) {
                  const element = item.querySelector(selector);
                  if (element?.textContent?.trim()) {
                    degree = element.textContent.trim();
                    break;
                  }
                }

                // Extract duration - updated for new layout
                const durationElement = item.querySelector(selectors.EDUCATION_DURATION);
                const duration = durationElement?.textContent?.trim() || '';

                if (school) {
                  data.education.push({
                    school: school,
                    degree: degree,
                    duration: duration
                  });

                  console.log(`Education ${index + 1}: ${degree} at ${school} (${duration})`);
                }
              } catch (eduError) {
                console.log(`Error extracting education item ${index}:`, eduError);
              }
            });
          } else {
            // Education section (#education) not found - browser context
            console.log('Education section (#education) not found');
          }

        } catch (error) {
          console.log('Error during profile data extraction:', error);
        }

        // Profile data extraction completed - browser context
        console.log('Profile data extraction completed');
        console.log('Final data:', JSON.stringify(data, null, 2));
        return data;
      }, profileSelectors);

      // Merge extracted data with basic info
      const result = {
        name: profileData.name || basicInfo.name || '',
        position: profileData.position || basicInfo.position || basicInfo.subtitle || '',
        company: profileData.company || basicInfo.company || '',
        location: profileData.location || basicInfo.location || '',
        bio: profileData.bio || basicInfo.bio || '',
        experience: profileData.experience || [],
        education: profileData.education || [],
        profileUrl: profileData.profileUrl || profileUrl,
        experienceText: profileData.experience.map(exp =>
          `${exp.position} at ${exp.company} (${exp.duration})`
        ).join('; '),
        educationText: profileData.education.map(edu =>
          `${edu.degree} at ${edu.school} (${edu.duration})`
        ).join('; '),
        universityName: process.env.UNIVERSITY_NAME || 'Universitas Indonesia',
        searchKeyword: basicInfo.searchKeyword || '',
        found: true,
        detailsExtracted: true,
        scrapedAt: new Date().toISOString()
      };

      console.log(`PROFILE DETAILS - Detailed profile extracted for: ${result.name}`);
      console.log(`Position: ${result.position}`);
      console.log(`Company: ${result.company}`);
      console.log(`Location: ${result.location}`);
      console.log(`Bio: ${result.bio}`);
      console.log(`Experience entries: ${result.experience.length}`);
      console.log(`Education entries: ${result.education.length}`);
      console.log(`Profile URL: ${result.profileUrl}`);
      console.log(`University: ${result.universityName}`);

      return result;

    } catch (error) {
      logger.error('PROFILE DETAILS - Error getting detailed profile:', {
        error: error.message,
        profileUrl
      });
      return {
        name: basicInfo.name || '',
        position: basicInfo.position || basicInfo.subtitle || 'Error retrieving',
        company: basicInfo.company || 'Error',
        location: basicInfo.location || 'Error',
        bio: basicInfo.bio || 'Error retrieving profile details',
        experience: [],
        education: [],
        experienceText: '',
        educationText: '',
        profileUrl: profileUrl,
        universityName: process.env.UNIVERSITY_NAME || 'Universitas Indonesia',
        searchKeyword: basicInfo.searchKeyword || '',
        found: true,
        detailsExtracted: false,
        scrapedAt: new Date().toISOString(),
        error: error.message
      };
    }
  }

  /**
   * Create profile data from basic info when navigation fails
   * This ensures we still save what we found on the alumni page
   */
  createProfileFromBasicInfo(basicInfo, profileUrl) {
    console.log('PROFILE DETAILS - Creating profile from basic info due to navigation failure');

    const profileData = {
      name: basicInfo.name || 'Unknown',
      position: basicInfo.position || basicInfo.subtitle || 'N/A',
      company: basicInfo.company || 'N/A',
      location: basicInfo.location || 'N/A',
      bio: basicInfo.bio || '',
      experience: [],
      education: [],
      experienceText: '',
      educationText: '',
      profileUrl: profileUrl,
      searchKeyword: basicInfo.searchKeyword || '',
      universityName: process.env.UNIVERSITY_NAME || 'University',
      found: true,
      detailsExtracted: false,
      extractionMethod: 'basic_info_fallback',
      scrapedAt: new Date().toISOString(),
      error: 'Navigation timeout - using basic info from alumni page'
    };

    console.log(`PROFILE DETAILS - Fallback profile created: ${profileData.name} - ${profileData.position}`);
    console.log(`PROFILE DETAILS - Fallback bio: ${profileData.bio}`);
    return profileData;
  }
  /**
   * Type with human-like delays
   */
  async typeWithDelay(page, selector, text) {
    const element = await page.waitForSelector(selector);
    for (const char of text) {
      await element.type(char, {
        delay: Math.random() * (150 - 50) + 50 // 50-150ms delay
      });
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
   * Navigate to user's own profile after scraping is complete
   */
  async navigateToMyProfile() {
    try {
      if (!this.isLoggedIn || !this.currentPage) {
        throw new Error('Not logged in or page not available');
      }
      // Navigating to user profile after scraping completion... - suppressed log
      logger.debug('Navigating to user profile after scraping completion...');
      const page = this.currentPage;
      await page.goto('https://www.linkedin.com/in/me/', {
        waitUntil: 'domcontentloaded',
        timeout: 30000
      });
      await this.randomDelay(2000, 4000);
      const currentUrl = page.url();
      if (currentUrl.includes('/in/') && !currentUrl.includes('/school/')) {
        // Successfully navigated to user profile - suppressed log
        logger.debug('Successfully navigated to user profile');
        return {
          success: true,
          message: 'Successfully navigated to your profile',
          profileUrl: currentUrl
        };
      } else {
        throw new Error('Failed to navigate to profile page');
      }
    } catch (error) {
      console.error('Error navigating to user profile:', error);
      return {
        success: false,
        message: `Failed to navigate to profile: ${error.message}`
      };
    }
  }
  /**
   * Navigate back to LinkedIn feed
   */
  async navigateToFeed() {
    try {
      if (!this.isLoggedIn || !this.currentPage) {
        throw new Error('Not logged in or page not available');
      }
      // Navigating to LinkedIn feed... - suppressed log
      logger.debug('Navigating to LinkedIn feed...');
      const page = this.currentPage;
      await page.goto('https://www.linkedin.com/feed/', {
        waitUntil: 'domcontentloaded',
        timeout: 30000
      });
      await this.randomDelay(2000, 4000);
      const currentUrl = page.url();
      if (currentUrl.includes('/feed')) {
        // Successfully navigated to LinkedIn feed - suppressed log
        logger.debug('Successfully navigated to LinkedIn feed');
        return {
          success: true,
          message: 'Successfully navigated to LinkedIn feed',
          feedUrl: currentUrl
        };
      } else {
        throw new Error('Failed to navigate to feed page');
      }
    } catch (error) {
      console.error('Error navigating to feed:', error);
      return {
        success: false,
        message: `Failed to navigate to feed: ${error.message}`
      };
    }
  }
  /**
   * Check if currently logged in
   */
  isAuthenticated() {
    return this.isLoggedIn;
  }
  /**
   * Reset login status
   */
  logout() {
    this.isLoggedIn = false;
    this.currentPage = null;
  }
}
export default LinkedInService;
