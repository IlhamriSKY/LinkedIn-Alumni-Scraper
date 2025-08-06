/**
 * LinkedIn Alumni Scraper Service
 * 
 * Handles LinkedIn authentication, navigation, and alumni profile extraction.
 * Designed specifically for university alumni directory scraping with
 * human-like behavior patterns to avoid detection.
 */
class LinkedInService {
  constructor(browserService) {
    this.browserService = browserService;
    this.isLoggedIn = false;
    this.currentPage = null;
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
   * Uses DELAY_MIN and DELAY_MAX from environment variables
   */
  async randomConfigurableDelay() {
    const delayMin = parseInt(process.env.DELAY_MIN) || 2000;
    const delayMax = parseInt(process.env.DELAY_MAX) || 5000;
    const randomDelay = Math.floor(Math.random() * (delayMax - delayMin + 1)) + delayMin;
    
    console.log(`[DELAY] Waiting ${randomDelay}ms (min: ${delayMin}ms, max: ${delayMax}ms)`);
    await this.delay(randomDelay);
    return randomDelay;
  }

  /**
   * Step-specific delay for different operations
   */
  async stepDelay(step = 'default') {
    const delayMin = parseInt(process.env.DELAY_MIN) || 2000;
    const delayMax = parseInt(process.env.DELAY_MAX) || 5000;
    
    const stepDelays = {
      'search': parseInt(process.env.STEP_DELAY_SEARCH) || Math.floor(Math.random() * (3000 - 1500 + 1)) + 1500,
      'navigation': parseInt(process.env.STEP_DELAY_NAVIGATION) || Math.floor(Math.random() * (2000 - 1000 + 1)) + 1000,
      'profile': parseInt(process.env.STEP_DELAY_PROFILE) || Math.floor(Math.random() * (4000 - 2000 + 1)) + 2000,
      'typing': parseInt(process.env.STEP_DELAY_TYPING) || Math.floor(Math.random() * (800 - 200 + 1)) + 200,
      'click': parseInt(process.env.STEP_DELAY_CLICK) || Math.floor(Math.random() * (1500 - 500 + 1)) + 500,
      'default': Math.floor(Math.random() * (delayMax - delayMin + 1)) + delayMin
    };
    
    let delayTime = stepDelays[step] !== undefined ? stepDelays[step] : stepDelays['default'];
    
    // Add randomness to configured delays (±20%)
    if (step !== 'default' && process.env[`STEP_DELAY_${step.toUpperCase()}`]) {
      const variance = delayTime * 0.2;
      delayTime = delayTime + (Math.random() * variance * 2 - variance);
      delayTime = Math.max(500, Math.floor(delayTime)); // Minimum 500ms
    }
    
    console.log(`[STEP DELAY] ${step}: ${delayTime}ms`);
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
      await page.keyboard.type(char, { delay });
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
          await page.mouse.move(x, y, { steps: Math.floor(Math.random() * 3) + 2 });
          await this.randomDelay(50, 150);
        }
      }
    } catch (error) {
      console.log('Could not move mouse to element:', error.message);
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
      console.log('Checking login status without navigation...');
      const currentUrl = page.url();
      console.log('Current URL:', currentUrl);
      if (currentUrl.includes('/feed')) {
        console.log('Already on LinkedIn feed - logged in');
        this.isLoggedIn = true;
        return { success: true, message: 'Already logged in to LinkedIn', alreadyLoggedIn: true };
      }
      if (currentUrl.includes('/in/') && currentUrl.includes('linkedin.com')) {
        console.log('On LinkedIn profile page - logged in');
        this.isLoggedIn = true;
        return { success: true, message: 'Already logged in to LinkedIn', alreadyLoggedIn: true };
      }
      if (currentUrl.includes('linkedin.com') && !currentUrl.includes('/login')) {
        try {
          await page.waitForSelector('.global-nav, .scaffold-layout__nav, .feed-nav', { timeout: 3000 });
          console.log('Found logged-in navigation elements - logged in');
          this.isLoggedIn = true;
          return { success: true, message: 'Already logged in to LinkedIn', alreadyLoggedIn: true };
        } catch (e) {
          console.log('No logged-in navigation elements found');
        }
      }
      if (currentUrl.includes('/login') || currentUrl.includes('/challenge') || currentUrl.includes('/uas/login')) {
        console.log('On login page - not logged in');
        this.isLoggedIn = false;
        return { success: false, message: 'Not logged in', requiresLogin: true };
      }
      if (!currentUrl.includes('linkedin.com')) {
        console.log('Not on LinkedIn - assuming not logged in');
        this.isLoggedIn = false;
        return { success: false, message: 'Not on LinkedIn', requiresLogin: true };
      }
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
      console.log('Navigating to LinkedIn login page...');
      await page.goto('https://www.linkedin.com/login', { 
        waitUntil: 'networkidle2',
        timeout: 60000 
      });
      await page.waitForSelector('#username', { timeout: 20000 });
      await page.waitForSelector('#password', { timeout: 20000 });
      console.log('Typing email with human-like behavior...');
      await this.moveMouseToElement(page, '#username');
      await page.click('#username');
      await this.randomDelay(200, 500);
      await page.keyboard.down('Control');
      await page.keyboard.press('KeyA');
      await page.keyboard.up('Control');
      await page.keyboard.press('Backspace');
      await this.randomDelay(200, 500);
      await this.typeWithHumanLikeDelay(page, email);
      console.log('Typing password...');
      await this.moveMouseToElement(page, '#password');
      await page.click('#password');
      await this.randomDelay(200, 500);
      await page.keyboard.down('Control');
      await page.keyboard.press('KeyA');
      await page.keyboard.up('Control');
      await page.keyboard.press('Backspace');
      await this.randomDelay(200, 500);
      await this.typeWithHumanLikeDelay(page, password);
      await this.randomDelay(1000, 2000);
      console.log('Clicking login button...');
      await this.moveMouseToElement(page, 'button[type="submit"]');
      await page.click('button[type="submit"]');
      await this.randomDelay(3000, 5000);
      const currentUrl = page.url();
      console.log('Current URL after login:', currentUrl);
      let loginSuccess = false;
      if (currentUrl.includes('/feed') || currentUrl.includes('/in/')) {
        loginSuccess = true;
        console.log('Login detected via URL');
      }
      if (!loginSuccess) {
        try {
          await page.waitForSelector('.global-nav', { timeout: 5000 });
          loginSuccess = true;
          console.log('Login detected via navigation elements');
        } catch (e) {
        }
      }
      if (!loginSuccess && !currentUrl.includes('/login')) {
        loginSuccess = true;
        console.log('Login detected via redirect');
      }
      if (!loginSuccess) {
        try {
          await page.waitForSelector('.feed-container, .scaffold-layout', { timeout: 5000 });
          loginSuccess = true;
          console.log('Login detected via feed elements');
        } catch (e) {
        }
      }
      if (loginSuccess) {
        this.isLoggedIn = true;
        console.log('Successfully logged in to LinkedIn');
        await this.ensureFeedAccess();
        return { success: true, message: 'Login successful' };
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
      console.log('Checking if already logged in...');
      const loginCheck = await this.checkLoginStatus();
      if (loginCheck.success && loginCheck.alreadyLoggedIn) {
        console.log('Already logged in - skipping login process');
        this.isLoggedIn = true;
        return true;
      }
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
      if (!currentUrl.includes('/feed')) {
        console.log('Navigating to LinkedIn feed...');
        await this.currentPage.goto('https://www.linkedin.com/feed/', { 
          waitUntil: 'domcontentloaded',
          timeout: 30000 
        });
        await this.randomDelay(2000, 4000);
      }
      console.log('Waiting for feed to load...');
      try {
        await this.currentPage.waitForSelector('.scaffold-layout, .feed-container', { timeout: 10000 });
        console.log('Feed loaded successfully');
      } catch (error) {
        console.log('Feed elements not found, but proceeding...');
      }
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
      console.log(`Navigating to ${universityName} alumni page: ${universityUrl}`);
      const page = this.currentPage;
      try {
        console.log('Starting navigation...');
        await page.goto(universityUrl, { 
          waitUntil: 'domcontentloaded', // Less strict than networkidle0
          timeout: 60000 // Increased timeout to 60 seconds
        });
        console.log('Initial navigation completed');
      } catch (navError) {
        console.log('Initial navigation failed, trying alternative approach...');
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
          console.log('Alternative navigation completed');
        } catch (altError) {
          throw new Error(`Navigation failed after retry: ${altError.message}`);
        }
      }
      console.log('Waiting for page to stabilize...');
      await this.randomDelay(3000, 5000);
      const currentUrl = page.url();
      console.log('Current URL after navigation:', currentUrl);
      if (currentUrl.includes('linkedin.com/school') || currentUrl.includes('/people/')) {
        console.log(`Successfully navigated to ${universityName} alumni page`);
        try {
          await page.waitForSelector('#people-search-keywords', { timeout: 10000 });
          console.log('Alumni search box found - page is ready for scraping');
          return { success: true, message: `Successfully opened ${universityName} alumni page and search is ready` };
        } catch (searchError) {
          console.log('Alumni search box not found, but university page loaded');
          return { success: true, message: `Opened ${universityName} alumni page (search box may take time to load)` };
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
      console.log('Attempting alternative navigation method...');
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
      const searchBox = await page.waitForSelector('input[placeholder*="Search"]', { timeout: 10000 });
      await searchBox.click();
      await searchBox.type(universityName);
      await page.keyboard.press('Enter');
      await this.randomDelay(3000, 5000);
      const universityLink = await page.$('a[href*="/school/"][href*="unika-soegijapranata"]');
      if (universityLink) {
        await universityLink.click();
        await this.randomDelay(3000, 5000);
        const peopleTab = await page.$('a[href*="/people/"]');
        if (peopleTab) {
          await peopleTab.click();
          await this.randomDelay(2000, 4000);
          const currentUrl = page.url();
          if (currentUrl.includes('/school/') && currentUrl.includes('/people/')) {
            console.log('Successfully found university through search');
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
      console.log('Navigating back to university alumni page for next search...');
      const result = await this.navigateToUniversityAlumni();
      if (result.success) {
        console.log('Successfully navigated back to alumni page for next search');
        await this.randomDelay(2000, 3000);
        return { success: true, message: 'Ready for next alumni search' };
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
      
      console.log('ALUMNI SEARCH - Confirmed on university alumni page, proceeding with alumni-specific search...');
      
      // Step 1: Wait before interacting with search input
      await this.stepDelay('search');
      
      const searchInput = await page.waitForSelector('#people-search-keywords', { timeout: 10000 });
      await searchInput.click({ clickCount: 3 });
      await page.keyboard.press('Backspace');
      
      // Step 2: Typing delay
      await this.stepDelay('typing');
      await this.typeWithHumanLikeDelay(page, searchName);
      
      // Step 3: Before pressing enter
      await this.stepDelay('click');
      await page.keyboard.press('Enter');
      
      // Step 4: Wait for search results to load
      await this.stepDelay('search');
      
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
      const alumniProfiles = await page.evaluate((searchTerm) => {
        console.log('Evaluating alumni profiles from DOM...');
        const profileCards = document.querySelectorAll('.org-people-profile-card');
        console.log(`Found ${profileCards.length} profile cards`);
        const profiles = [];
        
        profileCards.forEach((card, index) => {
          if (index >= 5) return; // Limit to first 5 results
          try {
            console.log(`Processing card ${index + 1}...`);
            
            // Get name from the title link
            const nameElement = card.querySelector('.artdeco-entity-lockup__title a .lt-line-clamp');
            const name = nameElement?.textContent?.trim() || 'LinkedIn Member';
            console.log(`Card ${index + 1} name: ${name}`);
            
            // Get profile URL from the title link
            const profileLink = card.querySelector('.artdeco-entity-lockup__title a[href*="/in/"]');
            const profileUrl = profileLink?.href || '';
            
            // Clean the profile URL (remove query parameters)
            const cleanUrl = profileUrl.split('?')[0];
            console.log(`Card ${index + 1} profile URL: ${cleanUrl}`);
            
            // Get subtitle/position
            const subtitleElement = card.querySelector('.artdeco-entity-lockup__subtitle .lt-line-clamp');
            const subtitle = subtitleElement?.textContent?.trim() || '';
            console.log(`Card ${index + 1} subtitle: ${subtitle}`);
            
            // Get image URL
            const imageElement = card.querySelector('.evi-image');
            const imageUrl = imageElement?.src || '';
            
            // Get connection degree
            const degreeElement = card.querySelector('.artdeco-entity-lockup__degree');
            const connectionDegree = degreeElement?.textContent?.trim() || '';
            
            // Skip if no profile URL or if it's just a LinkedIn Member placeholder
            if (!cleanUrl || name === 'LinkedIn Member' || cleanUrl.includes('miniProfileUrn')) {
              console.log(`Skipping card ${index + 1}: invalid profile URL or placeholder`);
              return;
            }
            
            console.log(`Adding valid profile: ${name} with URL: ${cleanUrl}`);
            profiles.push({
              name: name,
              subtitle: subtitle,
              profileUrl: cleanUrl,
              imageUrl: imageUrl,
              connectionDegree: connectionDegree,
              searchKeyword: searchTerm,
              found: true,
              cardIndex: index
            });
          } catch (error) {
            console.log(`Error extracting profile from card ${index}:`, error);
          }
        });
        
        console.log(`Successfully extracted ${profiles.length} valid profiles`);
        return profiles;
      }, searchName);
      if (alumniProfiles.length > 0) {
        console.log(`ALUMNI SEARCH - Found ${alumniProfiles.length} alumni profiles`);
        
        // Emit found profiles first
        this.socketIo.emit('linkedinUpdate', {
          type: 'search_progress',
          data: {
            searchName: searchName,
            foundCount: alumniProfiles.length,
            status: `Found ${alumniProfiles.length} profiles, extracting details...`,
            profiles: alumniProfiles
          }
        });

        // Process each profile to get detailed information
        const detailedProfiles = [];
        for (let i = 0; i < alumniProfiles.length; i++) {
          const profile = alumniProfiles[i];
          console.log(`\n=== Processing profile ${i + 1}/${alumniProfiles.length}: ${profile.name} ===`);
          
          // Emit processing status
          this.socketIo.emit('linkedinUpdate', {
            type: 'profile_processing',
            data: {
              currentProfile: i + 1,
              totalProfiles: alumniProfiles.length,
              profileName: profile.name,
              status: `Extracting details for ${profile.name}...`
            }
          });

          // Step delay before processing each profile
          await this.stepDelay('profile');

          try {
            console.log(`ALUMNI SEARCH - Getting detailed info for: ${profile.name}`);
            console.log(`ALUMNI SEARCH - Profile URL: ${profile.profileUrl}`);
            
            // Get detailed profile information
            const detailedProfile = await this.getDetailedProfileInfo(profile.profileUrl, profile);
            
            if (detailedProfile) {
              const result = {
                ...detailedProfile,
                searchKeyword: searchName,
                found: true,
                scrapedAt: new Date().toISOString(),
                profileIndex: i + 1
              };
              
              detailedProfiles.push(result);
              console.log(`ALUMNI SEARCH - Profile extraction completed for: ${result.name}`);
              console.log(`ALUMNI SEARCH - Details: ${result.position} at ${result.company} | ${result.location}`);
              
              // Emit individual profile completion
              this.socketIo.emit('linkedinUpdate', {
                type: 'profile_complete',
                data: {
                  profile: result,
                  profileIndex: i + 1,
                  totalProfiles: alumniProfiles.length
                }
              });
            } else {
              // Add profile with basic info if detailed extraction failed
              const basicResult = {
                ...profile,
                position: 'Details not available',
                company: 'N/A',
                bio: '',
                experience: [],
                education: [],
                searchKeyword: searchName,
                found: true,
                detailsExtracted: false,
                scrapedAt: new Date().toISOString(),
                profileIndex: i + 1
              };
              
              detailedProfiles.push(basicResult);
              console.log(`ALUMNI SEARCH - Basic info only for: ${profile.name}`);
            }
            
            // Add delay between profiles to avoid rate limiting
            if (i < alumniProfiles.length - 1) {
              console.log('Waiting before processing next profile...');
              await this.delay(3000);
            }
            
          } catch (error) {
            console.error(`Error processing profile ${profile.name}:`, error.message);
            
            // Add profile with error status
            const errorResult = {
              ...profile,
              position: 'Error extracting details',
              company: 'Error',
              location: 'Error',
              bio: '',
              experience: [],
              education: [],
              searchKeyword: searchName,
              found: true,
              error: error.message,
              detailsExtracted: false,
              scrapedAt: new Date().toISOString(),
              profileIndex: i + 1
            };
            
            detailedProfiles.push(errorResult);
            
            this.socketIo.emit('linkedinUpdate', {
              type: 'profile_error',
              data: {
                profile: errorResult,
                profileIndex: i + 1,
                totalProfiles: alumniProfiles.length,
                error: error.message
              }
            });
          }
        }

        console.log(`\n=== ALUMNI SEARCH COMPLETED ===`);
        console.log(`Successfully processed ${detailedProfiles.length} profiles for: ${searchName}`);
        
        // Return all detailed profiles
        return detailedProfiles;
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
      
      console.log('PROFILE DETAILS - Navigating to profile page...');
      // Ensure clean URL (remove any query parameters that might interfere)
      const cleanUrl = profileUrl.split('?')[0];
      console.log(`PROFILE DETAILS - Clean URL: ${cleanUrl}`);
      
      // Navigate to profile with extended timeout and wait for network to be idle
      console.log('PROFILE DETAILS - Starting navigation...');
      await page.goto(cleanUrl, { 
        waitUntil: ['networkidle0', 'domcontentloaded'], 
        timeout: 60000 
      });
      
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
        await page.waitForSelector('.pv-text-details__left-panel, .text-heading-xlarge, .pv-top-card, h1', { timeout: 15000 });
        console.log('PROFILE DETAILS - Profile elements detected');
      } catch (waitError) {
        console.log('PROFILE DETAILS - Profile elements not found, proceeding anyway...');
        console.log('PROFILE DETAILS - Wait error:', waitError.message);
      }
      
      // Step 3: Content extraction delay
      await this.stepDelay('default');
      
      console.log('PROFILE DETAILS - Extracting detailed information from profile page...');
      const profileData = await page.evaluate(() => {
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
          console.log('Extracting name...');
          const nameSelectors = [
            'h1.text-heading-xlarge.inline.t-24.v-align-middle.break-words',
            '.text-heading-xlarge',
            '.pv-text-details__left-panel h1',
            '.pv-top-card__title',
            'h1[data-generated-suggestion-target]',
            '.pv-top-card--list li:first-child',
            'h1.break-words',
            'h1'
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
            '.text-body-medium.break-words[data-generated-suggestion-target]',
            '.pv-text-details__left-panel .text-body-medium',
            '.pv-top-card__headline .break-words',
            '.pv-top-card--list-bullet .pv-entity__caption',
            '.pv-top-card__headline',
            '.text-body-medium.break-words',
            '.text-body-medium'
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
            '.text-body-small.inline.t-black--light.break-words',
            '.pv-text-details__left-panel .text-body-small',
            '.pv-top-card--list .pv-top-card__location',
            '.text-body-small.break-words',
            '.text-body-small'
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
          console.log('Looking for experience section...');
          const experienceSection = document.querySelector('#experience, section[data-section="experience"], .experience-section');
          if (experienceSection) {
            console.log('Experience section found, extracting data...');
            const experienceItems = experienceSection.parentElement.querySelectorAll('.pvs-list__item--line-separated, .pvs-entity');
            console.log(`Found ${experienceItems.length} experience items`);
            
            experienceItems.forEach((item, index) => {
              if (index >= 5) return; // Limit to first 5 experiences
              
              try {
                // Try multiple selectors for position
                const positionSelectors = [
                  '.mr1.hoverable-link-text.t-bold span[aria-hidden="true"]',
                  '.mr1 .hoverable-link-text span[aria-hidden="true"]',
                  '.pvs-entity__summary-title span[aria-hidden="true"]',
                  '.t-bold span[aria-hidden="true"]'
                ];
                
                let position = '';
                for (const selector of positionSelectors) {
                  const element = item.querySelector(selector);
                  if (element?.textContent?.trim()) {
                    position = element.textContent.trim();
                    break;
                  }
                }
                
                // Try multiple selectors for company
                const companySelectors = [
                  '.t-14.t-normal span[aria-hidden="true"]',
                  '.pvs-entity__subtitle span[aria-hidden="true"]',
                  '.pv-entity__secondary-title'
                ];
                
                let company = '';
                for (const selector of companySelectors) {
                  const element = item.querySelector(selector);
                  if (element?.textContent?.trim()) {
                    company = element.textContent.trim();
                    break;
                  }
                }
                
                // Extract duration
                const durationElement = item.querySelector('.t-14.t-normal.t-black--light .pvs-entity__caption-wrapper span[aria-hidden="true"], .pvs-entity__dates span[aria-hidden="true"]');
                const duration = durationElement?.textContent?.trim() || '';
                
                if (position) {
                  data.experience.push({
                    position: position,
                    company: company,
                    duration: duration,
                    location: ''
                  });
                  
                  // Set current position from first experience
                  if (index === 0) {
                    data.position = position;
                    data.company = company.split(' · ')[0]; // Remove employment type
                  }
                  
                  console.log(`Experience ${index + 1}: ${position} at ${company} (${duration})`);
                }
              } catch (expError) {
                console.log(`Error extracting experience item ${index}:`, expError);
              }
            });
          } else {
            console.log('Experience section (#experience) not found');
          }
          
          // Extract education with improved selectors
          console.log('Looking for education section...');
          const educationSection = document.querySelector('#education');
          if (educationSection) {
            console.log('Education section found, extracting data...');
            const educationItems = educationSection.parentElement.querySelectorAll('.pvs-list__item--line-separated, .pvs-entity');
            console.log(`Found ${educationItems.length} education items`);
            
            educationItems.forEach((item, index) => {
              if (index >= 3) return; // Limit to first 3 education entries
              
              try {
                // Extract school name
                const schoolSelectors = [
                  '.mr1.hoverable-link-text.t-bold span[aria-hidden="true"]',
                  '.pvs-entity__summary-title span[aria-hidden="true"]',
                  '.t-bold span[aria-hidden="true"]'
                ];
                
                let school = '';
                for (const selector of schoolSelectors) {
                  const element = item.querySelector(selector);
                  if (element?.textContent?.trim()) {
                    school = element.textContent.trim();
                    break;
                  }
                }
                
                // Extract degree
                const degreeSelectors = [
                  '.t-14.t-normal span[aria-hidden="true"]',
                  '.pvs-entity__subtitle span[aria-hidden="true"]'
                ];
                
                let degree = '';
                for (const selector of degreeSelectors) {
                  const element = item.querySelector(selector);
                  if (element?.textContent?.trim()) {
                    degree = element.textContent.trim();
                    break;
                  }
                }
                
                // Extract duration
                const durationElement = item.querySelector('.t-14.t-normal.t-black--light .pvs-entity__caption-wrapper span[aria-hidden="true"], .pvs-entity__dates span[aria-hidden="true"]');
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
            console.log('Education section (#education) not found');
          }
          
        } catch (error) {
          console.log('Error during profile data extraction:', error);
        }
        
        console.log('Profile data extraction completed');
        console.log('Final data:', JSON.stringify(data, null, 2));
        return data;
      });
      
      // Merge extracted data with basic info
      const result = {
        name: profileData.name || basicInfo.name || '',
        position: profileData.position || basicInfo.subtitle || '',
        company: profileData.company || '',
        location: profileData.location || '',
        bio: profileData.bio || '',
        experience: profileData.experience || [],
        education: profileData.education || [],
        profileUrl: profileData.profileUrl || profileUrl,
        experienceText: profileData.experience.map(exp => 
          `${exp.position} at ${exp.company} (${exp.duration})`
        ).join('; '),
        educationText: profileData.education.map(edu => 
          `${edu.degree} at ${edu.school} (${edu.duration})`
        ).join('; '),
        universityName: process.env.UNIVERSITY_NAME || 'Universitas Indonesia'
      };
      
      console.log(`PROFILE DETAILS - Detailed profile extracted for: ${result.name}`);
      console.log(`Position: ${result.position} at ${result.company}`);
      console.log(`Location: ${result.location}`);
      console.log(`Bio: ${result.bio.substring(0, 100)}...`);
      console.log(`Experience entries: ${result.experience.length}`);
      console.log(`Education entries: ${result.education.length}`);
      
      return result;
      
    } catch (error) {
      console.error('PROFILE DETAILS - Error getting detailed profile:', error);
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
        universityName: process.env.UNIVERSITY_NAME || 'Universitas Indonesia',
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
      console.log('Navigating to user profile after scraping completion...');
      const page = this.currentPage;
      await page.goto('https://www.linkedin.com/in/me/', { 
        waitUntil: 'domcontentloaded', 
        timeout: 30000 
      });
      await this.randomDelay(2000, 4000);
      const currentUrl = page.url();
      if (currentUrl.includes('/in/') && !currentUrl.includes('/school/')) {
        console.log('Successfully navigated to user profile');
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
      console.log('Navigating to LinkedIn feed...');
      const page = this.currentPage;
      await page.goto('https://www.linkedin.com/feed/', { 
        waitUntil: 'domcontentloaded', 
        timeout: 30000 
      });
      await this.randomDelay(2000, 4000);
      const currentUrl = page.url();
      if (currentUrl.includes('/feed')) {
        console.log('Successfully navigated to LinkedIn feed');
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
