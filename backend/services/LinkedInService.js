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
   * Check if already logged in by examining current page without navigation
   */
  async checkLoginStatus() {
    try {
      const page = await this.browserService.getPage();
      this.currentPage = page;
      
      console.log('Checking login status without navigation...');
      
      // Get current URL without navigation
      const currentUrl = page.url();
      console.log('Current URL:', currentUrl);
      
      // If already on LinkedIn feed, likely logged in
      if (currentUrl.includes('/feed')) {
        console.log('Already on LinkedIn feed - logged in');
        this.isLoggedIn = true;
        return { success: true, message: 'Already logged in to LinkedIn', alreadyLoggedIn: true };
      }
      
      // If on LinkedIn profile page, definitely logged in
      if (currentUrl.includes('/in/') && currentUrl.includes('linkedin.com')) {
        console.log('On LinkedIn profile page - logged in');
        this.isLoggedIn = true;
        return { success: true, message: 'Already logged in to LinkedIn', alreadyLoggedIn: true };
      }
      
      // If on any LinkedIn page that's not login, check for logged-in elements
      if (currentUrl.includes('linkedin.com') && !currentUrl.includes('/login')) {
        try {
          // Check for navigation elements that only appear when logged in
          await page.waitForSelector('.global-nav, .scaffold-layout__nav, .feed-nav', { timeout: 3000 });
          console.log('Found logged-in navigation elements - logged in');
          this.isLoggedIn = true;
          return { success: true, message: 'Already logged in to LinkedIn', alreadyLoggedIn: true };
        } catch (e) {
          // Navigation elements not found, might not be logged in
          console.log('No logged-in navigation elements found');
        }
      }
      
      // If on LinkedIn login page, definitely not logged in
      if (currentUrl.includes('/login') || currentUrl.includes('/challenge') || currentUrl.includes('/uas/login')) {
        console.log('On login page - not logged in');
        this.isLoggedIn = false;
        return { success: false, message: 'Not logged in', requiresLogin: true };
      }
      
      // If not on LinkedIn at all, assume not logged in
      if (!currentUrl.includes('linkedin.com')) {
        console.log('Not on LinkedIn - assuming not logged in');
        this.isLoggedIn = false;
        return { success: false, message: 'Not on LinkedIn', requiresLogin: true };
      }
      
      // Default to not logged in if unclear (but don't navigate)
      console.log('Login status unclear - defaulting to not logged in');
      this.isLoggedIn = false;
      return { success: false, message: 'Login status unclear', requiresLogin: true };
      
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

      console.log(`🚀 Navigating to ${universityName} alumni page: ${universityUrl}`);
      
      const page = this.currentPage;
      
      // Use more flexible navigation with longer timeout
      try {
        console.log('📍 Starting navigation...');
        await page.goto(universityUrl, { 
          waitUntil: 'domcontentloaded', // Less strict than networkidle0
          timeout: 60000 // Increased timeout to 60 seconds
        });
        console.log('✅ Initial navigation completed');
      } catch (navError) {
        console.log('⚠️ Initial navigation failed, trying alternative approach...');
        
        // Alternative approach: Navigate step by step
        try {
          // First go to main LinkedIn
          await page.goto('https://www.linkedin.com', { 
            waitUntil: 'domcontentloaded',
            timeout: 30000 
          });
          await this.randomDelay(2000, 3000);
          
          // Then navigate to university page
          await page.goto(universityUrl, { 
            waitUntil: 'domcontentloaded',
            timeout: 45000 
          });
          console.log('✅ Alternative navigation completed');
        } catch (altError) {
          throw new Error(`Navigation failed after retry: ${altError.message}`);
        }
      }

      // Wait for the page to stabilize
      console.log('⏳ Waiting for page to stabilize...');
      await this.randomDelay(3000, 5000);

      // Check if we successfully reached the university page
      const currentUrl = page.url();
      console.log('🌐 Current URL after navigation:', currentUrl);

      if (currentUrl.includes('linkedin.com/school') || currentUrl.includes('/people/')) {
        console.log(`✅ Successfully navigated to ${universityName} alumni page`);
        
        // Additional verification: Try to find alumni search elements
        try {
          await page.waitForSelector('#people-search-keywords', { timeout: 10000 });
          console.log('🔍 Alumni search box found - page is ready for scraping');
          return { success: true, message: `Successfully opened ${universityName} alumni page and search is ready` };
        } catch (searchError) {
          console.log('⚠️ Alumni search box not found, but university page loaded');
          return { success: true, message: `Opened ${universityName} alumni page (search box may take time to load)` };
        }
      } else {
        // Check if we're redirected to a login or access issue
        if (currentUrl.includes('linkedin.com/login')) {
          throw new Error('Redirected to login page - session may have expired');
        } else if (currentUrl.includes('linkedin.com/404') || currentUrl.includes('not-found')) {
          throw new Error('University page not found - check if URL is correct');
        } else {
          throw new Error(`Navigation ended on unexpected page: ${currentUrl}`);
        }
      }

    } catch (error) {
      console.error('❌ Failed to navigate to university alumni:', error.message);
      
      // Try alternative method: Search for university
      console.log('🔄 Attempting alternative navigation method...');
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
      console.log(`🔍 Searching for ${universityName} using LinkedIn search...`);
      const page = this.currentPage;
      
      // Go to LinkedIn main page first
      await page.goto('https://www.linkedin.com', { 
        waitUntil: 'domcontentloaded',
        timeout: 30000 
      });
      await this.randomDelay(2000, 3000);
      
      // Find and use the global search box
      const searchBox = await page.waitForSelector('input[placeholder*="Search"]', { timeout: 10000 });
      await searchBox.click();
      await searchBox.type(universityName);
      await page.keyboard.press('Enter');
      
      // Wait for search results
      await this.randomDelay(3000, 5000);
      
      // Look for university in search results and click on it
      const universityLink = await page.$('a[href*="/school/"][href*="unika-soegijapranata"]');
      if (universityLink) {
        await universityLink.click();
        await this.randomDelay(3000, 5000);
        
        // Navigate to people/alumni tab
        const peopleTab = await page.$('a[href*="/people/"]');
        if (peopleTab) {
          await peopleTab.click();
          await this.randomDelay(2000, 4000);
          
          const currentUrl = page.url();
          if (currentUrl.includes('/school/') && currentUrl.includes('/people/')) {
            console.log('✅ Successfully found university through search');
            return { success: true, message: `Found ${universityName} alumni page via search` };
          }
        }
      }
      
      throw new Error('Could not find university through search');
    } catch (error) {
      console.error('Alternative search method failed:', error);
      return { success: false, message: error.message };
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

      console.log('🔄 Navigating back to university alumni page for next search...');
      
      // Clear any existing search and navigate back to clean alumni page
      const result = await this.navigateToUniversityAlumni();
      
      if (result.success) {
        console.log('✅ Successfully navigated back to alumni page for next search');
        
        // Small delay to ensure page is ready
        await this.randomDelay(2000, 3000);
        
        return { success: true, message: 'Ready for next alumni search' };
      } else {
        throw new Error(result.message || 'Failed to navigate back to alumni page');
      }

    } catch (error) {
      console.error('❌ Error navigating back to alumni page:', error);
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
      
      // Make sure we're on the university alumni page
      const currentUrl = page.url();
      console.log(`🎓 ALUMNI SEARCH - Current URL: ${currentUrl}`);
      console.log(`🔍 ALUMNI SEARCH - Searching for: ${searchName} on university alumni page`);
      
      if (!currentUrl.includes('/school/') || !currentUrl.includes('/people/')) {
        throw new Error(`Not on university alumni page. Current URL: ${currentUrl}`);
      }
      
      console.log('✅ ALUMNI SEARCH - Confirmed on university alumni page, proceeding with alumni-specific search...');

      // Find and use the alumni search input
      const searchInput = await page.waitForSelector('#people-search-keywords', { timeout: 10000 });
      
      // Clear existing search
      await searchInput.click({ clickCount: 3 });
      await page.keyboard.press('Backspace');
      await this.randomDelay(500, 1000);
      
      // Type search term with human-like behavior
      await this.typeWithHumanLikeDelay(page, searchName);
      await this.randomDelay(1000, 2000);
      
      // Press Enter to search
      await page.keyboard.press('Enter');
      await this.randomDelay(3000, 5000);
      
      // Wait for search results to load
      try {
        await page.waitForSelector('.org-people-profile-card', { timeout: 15000 });
      } catch (e) {
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

      // Extract alumni profiles from the page
      const alumniProfiles = await page.evaluate((searchTerm) => {
        const profileCards = document.querySelectorAll('.org-people-profile-card');
        const profiles = [];
        
        profileCards.forEach((card, index) => {
          if (index >= 5) return; // Limit to first 5 results
          
          try {
            // Extract basic info from card
            const nameElement = card.querySelector('.artdeco-entity-lockup__title .lt-line-clamp');
            const subtitleElement = card.querySelector('.artdeco-entity-lockup__subtitle .lt-line-clamp');
            const imageElement = card.querySelector('.evi-image');
            const profileLink = card.querySelector('a[href*="/in/"]');
            
            const name = nameElement?.textContent?.trim() || 'LinkedIn Member';
            const subtitle = subtitleElement?.textContent?.trim() || '';
            const profileUrl = profileLink?.href || '';
            const imageUrl = imageElement?.src || '';
            
            // Skip if no profile URL (private profiles)
            if (!profileUrl || name === 'LinkedIn Member') {
              return;
            }
            
            profiles.push({
              name: name,
              subtitle: subtitle,
              profileUrl: profileUrl,
              imageUrl: imageUrl,
              searchKeyword: searchTerm,
              found: true,
              cardIndex: index
            });
          } catch (error) {
            console.log('Error extracting profile from card:', error);
          }
        });
        
        return profiles;
      }, searchName);

      if (alumniProfiles.length > 0) {
        // Get the first (best match) profile
        const bestMatch = alumniProfiles[0];
        console.log(`✅ ALUMNI SEARCH - Found alumni profile: ${bestMatch.name}`);
        console.log(`🔗 ALUMNI SEARCH - Profile URL: ${bestMatch.profileUrl}`);
        
        // Get detailed profile information by visiting the profile page
        console.log(`📋 ALUMNI SEARCH - Getting detailed profile information...`);
        const detailedProfile = await this.getDetailedProfileInfo(bestMatch.profileUrl, bestMatch);
        
        const result = {
          ...detailedProfile,
          searchKeyword: searchName,
          found: true,
          scrapedAt: new Date().toISOString()
        };
        
        console.log(`✅ ALUMNI SEARCH - Profile extraction completed for: ${result.name}`);
        console.log(`📊 ALUMNI SEARCH - Final result: ${result.position} at ${result.company} | ${result.location}`);
        
        return result;
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
  async searchAndExtract(searchName) {
    try {
      if (!this.isLoggedIn || !this.currentPage) {
        throw new Error('Not logged in or page not available');
      }

      console.log(`Searching for: ${searchName}`);
      
      // Use alumni search instead of global search
      const profileData = await this.searchAlumniOnUniversityPage(searchName);

      if (profileData && profileData.found) {
        console.log(`✅ Found alumni profile: ${profileData.name} - ${profileData.position} at ${profileData.company}`);
        return profileData;
      } else {
        console.log(`❌ No alumni profile found for: ${searchName}`);
        return profileData; // Return the "not found" result
      }

    } catch (error) {
      console.error(`Error searching for ${searchName}:`, error);
      return {
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
        universityName: process.env.UNIVERSITY_NAME || 'Unknown University',
        scrapedAt: new Date().toISOString()
      };
    }
  }

  /**
   * Get detailed profile information by visiting individual profile page
   */
  async getDetailedProfileInfo(profileUrl, basicInfo = {}) {
    try {
      console.log(`📋 PROFILE DETAILS - Getting detailed profile from: ${profileUrl}`);

      const page = this.currentPage;
      
      // Navigate to profile page
      console.log('🌐 PROFILE DETAILS - Navigating to profile page...');
      await page.goto(profileUrl, { 
        waitUntil: 'domcontentloaded', 
        timeout: 30000 
      });
      
      await this.randomDelay(3000, 5000);

      console.log('⚡ PROFILE DETAILS - Extracting detailed information from profile page...');

      // Extract detailed information from profile page
      const profileData = await page.evaluate(() => {
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
          console.log('📊 Extracting profile data from page...');

          // Extract name - try multiple selectors
          const nameSelectors = [
            '.text-heading-xlarge',
            '.pv-text-details__left-panel h1',
            '.pv-top-card__title',
            'h1.text-heading-xlarge'
          ];
          
          for (const selector of nameSelectors) {
            const nameElement = document.querySelector(selector);
            if (nameElement?.textContent?.trim()) {
              data.name = nameElement.textContent.trim();
              break;
            }
          }
          console.log('👤 Name extracted:', data.name);

          // Extract headline/bio - try multiple selectors
          const bioSelectors = [
            '.text-body-medium.break-words[data-generated-suggestion-target]',
            '.pv-text-details__left-panel .text-body-medium',
            '.pv-top-card--list-bullet .pv-entity__caption',
            '.pv-top-card__headline'
          ];
          
          for (const selector of bioSelectors) {
            const bioElement = document.querySelector(selector);
            if (bioElement?.textContent?.trim()) {
              data.bio = bioElement.textContent.trim();
              break;
            }
          }
          console.log('💼 Bio/Headline extracted:', data.bio);

          // Extract location - try multiple selectors
          const locationSelectors = [
            '.text-body-small.inline.t-black--light.break-words',
            '.pv-text-details__left-panel .text-body-small',
            '.pv-top-card--list-bullet .pv-top-card__location'
          ];
          
          for (const selector of locationSelectors) {
            const locationElement = document.querySelector(selector);
            if (locationElement?.textContent?.trim()) {
              data.location = locationElement.textContent.trim();
              break;
            }
          }
          console.log('📍 Location extracted:', data.location);

          // Extract current position from experience section
          const experienceSection = document.querySelector('#experience');
          if (experienceSection) {
            console.log('🏢 Extracting experience data...');
            const experienceItems = experienceSection.querySelectorAll('.pvs-list__item--line-separated');
            
            experienceItems.forEach((item, index) => {
              if (index >= 5) return; // Limit to first 5 experiences
              
              try {
                const positionElement = item.querySelector('.mr1.hoverable-link-text.t-bold span[aria-hidden="true"]');
                const companyElement = item.querySelector('.t-14.t-normal span[aria-hidden="true"]');
                const durationElement = item.querySelector('.t-14.t-normal.t-black--light .pvs-entity__caption-wrapper span[aria-hidden="true"]');
                const locationElement = item.querySelector('.t-14.t-normal.t-black--light span[aria-hidden="true"]:last-child');

                const position = positionElement?.textContent?.trim() || '';
                const company = companyElement?.textContent?.trim() || '';
                const duration = durationElement?.textContent?.trim() || '';
                const location = locationElement?.textContent?.trim() || '';

                if (position) {
                  data.experience.push({
                    position: position,
                    company: company,
                    duration: duration,
                    location: location
                  });
                  
                  // Set current position as main position
                  if (index === 0) {
                    data.position = position;
                    data.company = company.split(' · ')[0]; // Remove employment type
                  }
                }
                console.log(`💼 Experience ${index + 1}: ${position} at ${company}`);
              } catch (expError) {
                console.log('Error extracting experience item:', expError);
              }
            });
          } else {
            console.log('❌ No experience section found');
          }

          // Extract education
          const educationSection = document.querySelector('#education');
          if (educationSection) {
            console.log('🎓 Extracting education data...');
            const educationItems = educationSection.querySelectorAll('.pvs-list__item--line-separated');
            
            educationItems.forEach((item, index) => {
              if (index >= 3) return; // Limit to first 3 education entries
              
              try {
                const schoolElement = item.querySelector('.mr1.hoverable-link-text.t-bold span[aria-hidden="true"]');
                const degreeElement = item.querySelector('.t-14.t-normal span[aria-hidden="true"]');
                const durationElement = item.querySelector('.t-14.t-normal.t-black--light .pvs-entity__caption-wrapper span[aria-hidden="true"]');

                const school = schoolElement?.textContent?.trim() || '';
                const degree = degreeElement?.textContent?.trim() || '';
                const duration = durationElement?.textContent?.trim() || '';

                if (school) {
                  data.education.push({
                    school: school,
                    degree: degree,
                    duration: duration
                  });
                }
                console.log(`🎓 Education ${index + 1}: ${degree} at ${school}`);
              } catch (eduError) {
                console.log('Error extracting education item:', eduError);
              }
            });
          } else {
            console.log('❌ No education section found');
          }

        } catch (error) {
          console.log('❌ Error extracting profile data:', error);
        }

        console.log('✅ Profile data extraction completed');
        return data;
      });

      // Merge with basic info and ensure all fields are present
      const result = {
        name: profileData.name || basicInfo.name || '',
        position: profileData.position || basicInfo.subtitle || '',
        company: profileData.company || '',
        location: profileData.location || '',
        bio: profileData.bio || '',
        experience: profileData.experience || [],
        education: profileData.education || [],
        profileUrl: profileData.profileUrl || profileUrl,
        
        // Additional fields for CSV export
        experienceText: profileData.experience.map(exp => 
          `${exp.position} at ${exp.company} (${exp.duration})`
        ).join('; '),
        educationText: profileData.education.map(edu => 
          `${edu.degree} at ${edu.school} (${edu.duration})`
        ).join('; '),
        
        // University info
        universityName: process.env.UNIVERSITY_NAME || 'Unknown University'
      };

      console.log(`✅ PROFILE DETAILS - Detailed profile extracted for: ${result.name}`);
      console.log(`📋 Position: ${result.position} at ${result.company}`);
      console.log(`📍 Location: ${result.location}`);
      console.log(`💼 Experience entries: ${result.experience.length}`);
      console.log(`🎓 Education entries: ${result.education.length}`);
      
      return result;

    } catch (error) {
      console.error('❌ PROFILE DETAILS - Error getting detailed profile:', error);
      
      // Return basic info with error indication
      return {
        name: basicInfo.name || '',
        position: basicInfo.subtitle || 'Error retrieving',
        company: 'Error',
        location: 'Error',
        bio: 'Error retrieving profile details',
        experience: [],
        education: [],
        experienceText: '',
        educationText: '',
        profileUrl: profileUrl,
        universityName: process.env.UNIVERSITY_NAME || 'Unknown University',
        error: error.message
      };
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
   * Navigate to user's own profile after scraping is complete
   */
  async navigateToMyProfile() {
    try {
      if (!this.isLoggedIn || !this.currentPage) {
        throw new Error('Not logged in or page not available');
      }

      console.log('🏠 Navigating to user profile after scraping completion...');
      const page = this.currentPage;
      
      // Navigate to the user's profile (LinkedIn "me" page)
      await page.goto('https://www.linkedin.com/in/me/', { 
        waitUntil: 'domcontentloaded', 
        timeout: 30000 
      });
      
      await this.randomDelay(2000, 4000);
      
      // Check if we successfully navigated to profile
      const currentUrl = page.url();
      if (currentUrl.includes('/in/') && !currentUrl.includes('/school/')) {
        console.log('✅ Successfully navigated to user profile');
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

      console.log('🏠 Navigating to LinkedIn feed...');
      const page = this.currentPage;
      
      // Navigate to LinkedIn feed
      await page.goto('https://www.linkedin.com/feed/', { 
        waitUntil: 'domcontentloaded', 
        timeout: 30000 
      });
      
      await this.randomDelay(2000, 4000);
      
      // Check if we successfully navigated to feed
      const currentUrl = page.url();
      if (currentUrl.includes('/feed')) {
        console.log('✅ Successfully navigated to LinkedIn feed');
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
