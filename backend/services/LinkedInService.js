/**
 * LinkedIn Service - LinkedIn-specific scraping logic
 * Handles login, search, and profile extraction
 */

class LinkedInService {
  constructor(browserService) {
    this.browserService = browserService;
    this.isLoggedIn = false;
    this.currentPage = null;
  }

  /**
   * Random delay function for human-like behavior (faster)
   */
  async randomDelay(min = 500, max = 1500) {
    const delay = Math.random() * (max - min) + min;
    return new Promise(resolve => setTimeout(resolve, delay));
  }

  /**
   * Type text with human-like behavior including random delays and realistic typing patterns
   */
  async typeWithHumanLikeDelay(page, text) {
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      
      // Vary typing speed based on character type (faster speeds)
      let delay;
      if (char === ' ') {
        delay = Math.random() * (80 - 30) + 30; // Space takes longer
      } else if (char.match(/[A-Z]/)) {
        delay = Math.random() * (70 - 40) + 40; // Capitals take longer
      } else if (char.match(/[0-9]/)) {
        delay = Math.random() * (60 - 30) + 30; // Numbers
      } else if (char.match(/[!@#$%^&*()]/)) {
        delay = Math.random() * (100 - 60) + 60; // Special characters take longer
      } else {
        delay = Math.random() * (50 - 20) + 20; // Regular characters
      }
      
      // Occasionally pause as if thinking (reduced frequency and duration)
      if (Math.random() < 0.05) { // 5% chance (reduced from 10%)
        await this.randomDelay(150, 400); // Shorter pause
      }
      
      await page.keyboard.type(char, { delay });
      
      // Random micro-pause between characters (reduced frequency)
      if (Math.random() < 0.15) { // 15% chance (reduced from 30%)
        await this.randomDelay(10, 50); // Shorter micro-pause
      }
    }
  }

  /**
   * Move mouse to element before clicking (human-like behavior)
   */
  async moveMouseToElement(page, selector) {
    try {
      const element = await page.$(selector);
      if (element) {
        const box = await element.boundingBox();
        if (box) {
          // Add some randomness to click position
          const x = box.x + box.width * (0.3 + Math.random() * 0.4);
          const y = box.y + box.height * (0.3 + Math.random() * 0.4);
          
          await page.mouse.move(x, y, { steps: Math.floor(Math.random() * 3) + 2 });
          await this.randomDelay(50, 150); // Faster mouse delay
        }
      }
    } catch (error) {
      console.log('Could not move mouse to element:', error.message);
    }
  }

  /**
   * Check if already logged in by visiting feed page
   */
  async checkLoginStatus() {
    try {
      const page = await this.browserService.getPage();
      this.currentPage = page;
      
      console.log('Checking login status by examining current page...');
      
      // First check current URL
      const currentUrl = page.url();
      console.log('Current URL:', currentUrl);
      
      // If already on LinkedIn feed, likely logged in
      if (currentUrl.includes('/feed')) {
        console.log('Already on LinkedIn feed - likely logged in');
        this.isLoggedIn = true;
        return { success: true, message: 'Already logged in to LinkedIn', alreadyLoggedIn: true };
      }
      
      // If on LinkedIn profile page, definitely logged in
      if (currentUrl.includes('/in/') && currentUrl.includes('linkedin.com')) {
        console.log('On LinkedIn profile page - logged in');
        this.isLoggedIn = true;
        return { success: true, message: 'Already logged in to LinkedIn', alreadyLoggedIn: true };
      }
      
      // Try to navigate to feed page to check login status
      console.log('Navigating to LinkedIn feed to check login...');
      try {
        await page.goto('https://www.linkedin.com/feed/', { 
          waitUntil: 'domcontentloaded',
          timeout: 30000 
        });
        
        // Wait a bit for page to load
        await this.randomDelay(2000, 3000);
        
        const newUrl = page.url();
        console.log('New URL after feed navigation:', newUrl);
        
        // If redirected to login page, not logged in
        if (newUrl.includes('/login') || newUrl.includes('/challenge') || newUrl.includes('/uas/login')) {
          console.log('Redirected to login page - not logged in');
          this.isLoggedIn = false;
          return { success: false, message: 'Not logged in', requiresLogin: true };
        }
        
        // If stayed on feed or LinkedIn domain without login redirect, assume logged in
        if (newUrl.includes('/feed') || (newUrl.includes('linkedin.com') && !newUrl.includes('/login'))) {
          console.log('Successfully accessed LinkedIn feed - logged in');
          this.isLoggedIn = true;
          return { success: true, message: 'Already logged in to LinkedIn', alreadyLoggedIn: true };
        }
        
        // Default to not logged in if unclear
        console.log('Login status unclear from URL check');
        this.isLoggedIn = false;
        return { success: false, message: 'Login status unclear', requiresLogin: true };
        
      } catch (navError) {
        console.log('Navigation to feed failed:', navError.message);
        // If navigation fails, assume not logged in
        this.isLoggedIn = false;
        return { success: false, message: 'Cannot access LinkedIn feed', requiresLogin: true };
      }
      
    } catch (error) {
      console.error('Error checking login status:', error);
      this.isLoggedIn = false;
      return { success: false, message: `Error checking login: ${error.message}`, requiresLogin: true };
    }
  }

  /**
   * Login to LinkedIn using credentials from environment
   * Implements human-like typing to avoid bot detection
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
      
      console.log('Navigating to LinkedIn login page...');
      await page.goto('https://www.linkedin.com/login', { 
        waitUntil: 'networkidle2',
        timeout: 60000 
      });
      
      // Wait for login form
      await page.waitForSelector('#username', { timeout: 20000 });
      await page.waitForSelector('#password', { timeout: 20000 });
      
      console.log('Typing email with human-like behavior...');
      // Move mouse to email field and click
      await this.moveMouseToElement(page, '#username');
      await page.click('#username');
      await this.randomDelay(200, 500);
      
      // Clear field first
      await page.keyboard.down('Control');
      await page.keyboard.press('KeyA');
      await page.keyboard.up('Control');
      await page.keyboard.press('Backspace');
      await this.randomDelay(200, 500);
      
      // Type email with human-like delay
      await this.typeWithHumanLikeDelay(page, email);
      
      console.log('Typing password...');
      // Move to password field
      await this.moveMouseToElement(page, '#password');
      await page.click('#password');
      await this.randomDelay(200, 500);
      
      // Clear field first
      await page.keyboard.down('Control');
      await page.keyboard.press('KeyA');
      await page.keyboard.up('Control');
      await page.keyboard.press('Backspace');
      await this.randomDelay(200, 500);
      
      // Type password with human-like delay
      await this.typeWithHumanLikeDelay(page, password);
      
      // Random delay before clicking login
      await this.randomDelay(1000, 2000);
      
      console.log('Clicking login button...');
      await this.moveMouseToElement(page, 'button[type="submit"]');
      await page.click('button[type="submit"]');
      
      // Wait for response without expecting navigation
      await this.randomDelay(3000, 5000);
      
      // Check current URL and page state
      const currentUrl = page.url();
      console.log('Current URL after login:', currentUrl);
      
      // Try to detect successful login
      let loginSuccess = false;
      
      // Method 1: Check URL
      if (currentUrl.includes('/feed') || currentUrl.includes('/in/')) {
        loginSuccess = true;
        console.log('Login detected via URL');
      }
      
      // Method 2: Check for navigation elements
      if (!loginSuccess) {
        try {
          await page.waitForSelector('.global-nav', { timeout: 5000 });
          loginSuccess = true;
          console.log('Login detected via navigation elements');
        } catch (e) {
          // Continue with other checks
        }
      }
      
      // Method 3: Check if we're still on login page
      if (!loginSuccess && !currentUrl.includes('/login')) {
        // If we're redirected somewhere that's not login, assume success
        loginSuccess = true;
        console.log('Login detected via redirect');
      }
      
      // Method 4: Check for feed elements
      if (!loginSuccess) {
        try {
          await page.waitForSelector('.feed-container, .scaffold-layout', { timeout: 5000 });
          loginSuccess = true;
          console.log('Login detected via feed elements');
        } catch (e) {
          // Continue
        }
      }
      
      if (loginSuccess) {
        this.isLoggedIn = true;
        console.log('Successfully logged in to LinkedIn');
        
        // Wait and ensure we're on the feed page before navigating to university
        await this.ensureFeedAccess();
        
        return { success: true, message: 'Login successful' };
      } else {
        // Check for challenges or errors
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
      console.error('Login process failed:', error);
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

      // First check if we're already logged in
      console.log('Checking if already logged in...');
      const loginCheck = await this.checkLoginStatus();
      
      if (loginCheck.success && loginCheck.alreadyLoggedIn) {
        console.log('Already logged in - skipping login process');
        this.isLoggedIn = true;
        return true;
      }
      
      // If not logged in, perform login
      if (loginCheck.requiresLogin) {
        console.log('Not logged in - performing login...');
        const loginResult = await this.login();
        if (!loginResult.success) {
          throw new Error(`Login failed: ${loginResult.message}`);
        }
        this.isLoggedIn = true;
      }

      const currentUrl = this.currentPage.url();
      console.log('Current URL after login process:', currentUrl);

      // If we're not on feed yet, navigate to it
      if (!currentUrl.includes('/feed')) {
        console.log('Navigating to LinkedIn feed...');
        await this.currentPage.goto('https://www.linkedin.com/feed/', { 
          waitUntil: 'domcontentloaded',
          timeout: 30000 
        });
        await this.randomDelay(2000, 4000);
      }

      // Wait for feed to load properly
      console.log('Waiting for feed to load...');
      try {
        await this.currentPage.waitForSelector('.scaffold-layout, .feed-container', { timeout: 10000 });
        console.log('Feed loaded successfully');
      } catch (error) {
        console.log('Feed elements not found, but proceeding...');
      }

      // Additional wait to ensure everything is loaded
      await this.randomDelay(2000, 3000);
      
      console.log('Feed access confirmed - ready for university navigation');
      return true;

    } catch (error) {
      console.error('Error ensuring feed access:', error);
      return false;
    }
  }

  /**
   * Navigate to university alumni page - now separate from login
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

      console.log(`Navigating to ${universityName} alumni page...`);
      
      const page = this.currentPage;
      
      // Navigate to university alumni page
      await page.goto(universityUrl, { 
        waitUntil: 'networkidle0',
        timeout: 30000 
      });

      // Wait for the page to load
      await this.randomDelay(2000, 4000);

      // Check if we successfully reached the university page
      const currentUrl = page.url();
      console.log('Current URL:', currentUrl);

      if (currentUrl.includes('linkedin.com/school') || currentUrl.includes('/people/')) {
        console.log(`Successfully navigated to ${universityName} alumni page`);
        return { success: true, message: `Opened ${universityName} alumni page` };
      } else {
        throw new Error('Failed to navigate to university alumni page');
      }

    } catch (error) {
      console.error('Failed to navigate to university alumni:', error);
      throw error;
    }
  }

  /**
   * Search for a profile by name
   */
  async searchProfile(page, searchName) {
    try {
      if (!this.isLoggedIn) {
        throw new Error('Not logged in to LinkedIn');
      }

      console.log(`Searching for profile: ${searchName}`);

      // Navigate to people search
      const searchUrl = `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(searchName)}`;
      await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });

      // Wait for search results
      await page.waitForTimeout(3000);

      // Try to find search results
      try {
        await page.waitForSelector('.search-results-container', { timeout: 10000 });
      } catch (e) {
        console.log('Search results container not found, trying alternative selector');
        await page.waitForSelector('[data-test-id="search-results"]', { timeout: 5000 });
      }

      // Extract profile information from search results
      const profileData = await page.evaluate((searchName) => {
        // Try different selectors for profile cards
        const profileCards = document.querySelectorAll('.search-result__wrapper, .entity-result, .search-result');
        
        if (profileCards.length === 0) {
          return null;
        }

        // Get the first result (most relevant)
        const firstCard = profileCards[0];
        
        // Extract information
        let name = searchName;
        let position = 'Alumni';
        let company = 'Unknown';
        let location = 'Indonesia';
        let profileUrl = '';

        // Try to extract name
        const nameElement = firstCard.querySelector('.entity-result__title-text a, .search-result__result-link, .actor-name');
        if (nameElement) {
          name = nameElement.textContent?.trim() || searchName;
          profileUrl = nameElement.href || '';
        }

        // Try to extract position/title
        const positionElement = firstCard.querySelector('.entity-result__primary-subtitle, .subline-level-1, .actor-occupation');
        if (positionElement) {
          position = positionElement.textContent?.trim() || 'Alumni';
        }

        // Try to extract company
        const companyElement = firstCard.querySelector('.entity-result__secondary-subtitle, .subline-level-2');
        if (companyElement) {
          company = companyElement.textContent?.trim() || 'Unknown';
        }

        // Try to extract location
        const locationElement = firstCard.querySelector('.entity-result__summary, .search-result__snippets');
        if (locationElement) {
          const locationText = locationElement.textContent;
          if (locationText && locationText.toLowerCase().includes('indonesia')) {
            location = 'Indonesia';
          }
        }

        return {
          name: name,
          position: position,
          company: company,
          location: location,
          education: process.env.UNIVERSITY_NAME || 'Universitas Telkom',
          profileUrl: profileUrl,
          searchKeyword: searchName,
          scrapedAt: new Date().toISOString()
        };

      }, searchName);

      if (profileData) {
        console.log(`Profile found for ${searchName}:`, profileData.name);
        return profileData;
      } else {
        console.log(`No profile found for ${searchName}`);
        // Return basic data even if not found
        return {
          name: searchName,
          position: 'Not found',
          company: 'N/A',
          location: 'N/A',
          education: process.env.UNIVERSITY_NAME || 'Universitas Telkom',
          profileUrl: '',
          searchKeyword: searchName,
          scrapedAt: new Date().toISOString()
        };
      }

    } catch (error) {
      console.error(`Error searching for ${searchName}:`, error);
      
      // Return error data
      return {
        name: searchName,
        position: 'Error',
        company: 'Error',
        location: 'Error',
        education: 'Error',
        profileUrl: '',
        searchKeyword: searchName,
        error: error.message,
        scrapedAt: new Date().toISOString()
      };
    }
  }

  /**
   * Search for a person and extract their profile data
   */
  async searchAndExtract(searchName) {
    try {
      if (!this.isLoggedIn || !this.currentPage) {
        throw new Error('Not logged in or page not available');
      }

      console.log(`Searching for: ${searchName}`);
      
      // Navigate to LinkedIn search
      const searchUrl = `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(searchName)}`;
      await this.currentPage.goto(searchUrl, { 
        waitUntil: 'networkidle0', 
        timeout: 30000 
      });

      // Wait for search results
      await this.currentPage.waitForSelector('.search-results-container', { timeout: 15000 });
      await this.randomDelay(2000, 4000);

      // Extract first profile from search results
      const profileData = await this.currentPage.evaluate(() => {
        const firstResult = document.querySelector('[data-row="1"]') || document.querySelector('.reusable-search__result-container');
        
        if (!firstResult) return null;

        // Extract profile data
        const nameElement = firstResult.querySelector('.entity-result__title-text a span[aria-hidden="true"]') ||
                           firstResult.querySelector('.actor-name') ||
                           firstResult.querySelector('[data-anonymize="person-name"]');
        
        const positionElement = firstResult.querySelector('.entity-result__primary-subtitle') ||
                               firstResult.querySelector('.subline-level-1') ||
                               firstResult.querySelector('[data-anonymize="title"]');
        
        const companyElement = firstResult.querySelector('.entity-result__secondary-subtitle') ||
                              firstResult.querySelector('.subline-level-2') ||
                              firstResult.querySelector('[data-anonymize="company"]');
        
        const locationElement = firstResult.querySelector('.entity-result__secondary-subtitle:last-of-type') ||
                               firstResult.querySelector('[data-anonymize="location"]');

        const profileLinkElement = firstResult.querySelector('.entity-result__title-text a') ||
                                  firstResult.querySelector('a[data-anonymize="person-name"]');

        return {
          name: nameElement?.textContent?.trim() || '',
          position: positionElement?.textContent?.trim() || '',
          company: companyElement?.textContent?.trim() || '',
          location: locationElement?.textContent?.trim() || '',
          profileUrl: profileLinkElement?.href || '',
          searchKeyword: arguments[0] || '',
          scrapedAt: new Date().toISOString()
        };
      }, searchName);

      if (profileData && profileData.name) {
        console.log(`Found profile: ${profileData.name} - ${profileData.position} at ${profileData.company}`);
        return profileData;
      } else {
        console.log(`❌ No profile found for: ${searchName}`);
        return null;
      }

    } catch (error) {
      console.error(`Error searching for ${searchName}:`, error);
      return {
        name: '',
        position: '',
        company: '',
        location: '',
        profileUrl: '',
        searchKeyword: searchName,
        error: error.message,
        scrapedAt: new Date().toISOString()
      };
    }
  }

  /**
   * Get detailed profile information (if visiting individual profile)
   */
  async getDetailedProfile(page, profileUrl) {
    try {
      console.log(`Getting detailed profile from: ${profileUrl}`);

      await page.goto(profileUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(3000);

      const profileData = await page.evaluate(() => {
        // Extract detailed information from profile page
        const name = document.querySelector('.text-heading-xlarge')?.textContent?.trim() || '';
        const headline = document.querySelector('.text-body-medium')?.textContent?.trim() || '';
        const location = document.querySelector('.text-body-small.inline.t-black--light')?.textContent?.trim() || '';
        
        // Extract experience
        const experienceSection = document.querySelector('#experience');
        let currentPosition = '';
        let currentCompany = '';
        
        if (experienceSection) {
          const firstExperience = experienceSection.querySelector('.pvs-entity');
          if (firstExperience) {
            currentPosition = firstExperience.querySelector('.mr1.t-bold')?.textContent?.trim() || '';
            currentCompany = firstExperience.querySelector('.t-14.t-normal')?.textContent?.trim() || '';
          }
        }

        return {
          name,
          headline,
          position: currentPosition || headline,
          company: currentCompany,
          location,
          profileUrl: window.location.href
        };
      });

      return profileData;

    } catch (error) {
      console.error('Error getting detailed profile:', error);
      throw error;
    }
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
