/**
 * LinkedIn Alumni Scraper - Node.js Backend
 * Express + Socket.IO + REST API + Puppeteer Implementation
 */

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Import services
import BrowserService from './services/BrowserService.js';
import LinkedInService from './services/LinkedInService.js';
import CsvService from './services/CsvService.js';

// Load environment variables
dotenv.config();

// Get configuration from environment variables with dynamic frontend URL
const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || 'localhost';
const NODE_ENV = process.env.NODE_ENV || 'development';

// Dynamic frontend URL based on environment
const FRONTEND_DEV_URL = process.env.FRONTEND_DEV_URL || 'http://localhost:5173';
const FRONTEND_PROD_URL = process.env.FRONTEND_PROD_URL || 'http://localhost:3000';
const FRONTEND_URL = NODE_ENV === 'development' ? FRONTEND_DEV_URL : FRONTEND_PROD_URL;

// Backend URL for responses
const BACKEND_URL = `http://${HOST}:${PORT}`;

// ES Module setup
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Express app
const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: [FRONTEND_DEV_URL, FRONTEND_PROD_URL, FRONTEND_URL],
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Initialize services
const browserService = new BrowserService();
const linkedInService = new LinkedInService(browserService);
const csvService = new CsvService();

// Set up browser disconnect callback
browserService.onBrowserClosed(() => {
  console.log('Browser was closed externally');
  appState.browserOpen = false;
  appState.loggedIn = false;
  appState.currentPage = '';
  appState.status = 'browser-closed';
  
  // Broadcast state update
  io.emit('stateUpdate', appState);
  io.emit('browserUpdate', { 
    status: 'closed', 
    message: 'Browser was closed externally' 
  });
});

// Periodic status check to ensure accuracy with enhanced real-time monitoring
setInterval(async () => {
  const actualBrowserStatus = browserService.isActive();
  if (appState.browserOpen !== actualBrowserStatus) {
    console.log(`Browser status mismatch detected. Updating from ${appState.browserOpen} to ${actualBrowserStatus}`);
    appState.browserOpen = actualBrowserStatus;
    if (!actualBrowserStatus) {
      appState.loggedIn = false;
      appState.currentPage = '';
      appState.status = 'browser-closed';
    }
    // Broadcast corrected state via socket
    io.emit('stateUpdate', appState);
    io.emit('browserUpdate', { 
      status: actualBrowserStatus ? 'open' : 'closed',
      message: 'Browser status synchronized',
      browserOpen: actualBrowserStatus,
      isActive: actualBrowserStatus,
      timestamp: new Date().toISOString()
    });
  }

  // Enhanced page info update with tab monitoring
  if (actualBrowserStatus) {
    try {
      const pageInfo = await browserService.getPageInfo();
      if (pageInfo && pageInfo.url !== appState.currentPage) {
        const previousPage = appState.currentPage;
        appState.currentPage = pageInfo.url;
        
        // Emit enhanced page update with full info via socket
        io.emit('pageUpdate', {
          url: pageInfo.url,
          title: pageInfo.title,
          hostname: pageInfo.hostname,
          pathname: pageInfo.pathname,
          isLinkedIn: pageInfo.isLinkedIn,
          ready: pageInfo.ready,
          currentPage: pageInfo.url,
          previousPage: previousPage,
          tabChange: true,
          timestamp: new Date().toISOString()
        });
        
        console.log('Page updated:', pageInfo.url, pageInfo.title);
      }

      // Check for tab count changes and emit via socket
      if (browserService.browser) {
        const pages = await browserService.browser.pages();
        const tabCount = pages.length;
        
        // Emit tab count update via socket for real-time monitoring
        io.emit('tabUpdate', {
          tabCount: tabCount,
          timestamp: new Date().toISOString(),
          currentUrl: pageInfo?.url || 'unknown'
        });
      }
    } catch (error) {
      // Silently handle page info errors but log for debugging
      console.debug('Page info check error:', error.message);
    }
  }
}, 3000); // Check every 3 seconds for more responsive updates

// Simple console logger
const logger = {
  info: (...args) => console.log('[INFO]', ...args),
  error: (...args) => console.error('[ERROR]', ...args),
  warn: (...args) => console.warn('[WARN]', ...args),
  debug: (...args) => console.log('[DEBUG]', ...args)
};

// Application state
let appState = {
  browserOpen: false,
  loggedIn: false,
  scrapingActive: false,
  status: 'idle',
  message: 'Ready to start',
  progress: 0,
  currentProfile: { name: '', position: '', company: '', location: '' },
  totalProfiles: 0,
  scrapedCount: 0,
  results: [],
  error: null,
  // Enhanced tracking fields
  notFoundCount: 0,
  progressPercent: 0,
  lastScrapedName: '',
  lastScrapedIndex: -1,
  currentPage: ''
};

// Update state function - now broadcasts via Socket.IO + keeps for REST API
const updateState = (updates = {}) => {
  appState = { ...appState, ...updates };
  logger.info('State updated', { updates });
  // Broadcast to all connected clients
  io.emit('stateUpdate', appState);
};

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(compression());
app.use(cors({
  origin: [FRONTEND_DEV_URL, FRONTEND_PROD_URL, FRONTEND_URL],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// HTTP logging
app.use(morgan('combined'));

// Socket.IO connection handling
io.on('connection', (socket) => {
  logger.info('Client connected', { socketId: socket.id });
  
  // Send current state to new client
  socket.emit('stateUpdate', appState);
  
  // Handle client actions via Socket.IO
  socket.on('openBrowser', async () => {
    try {
      logger.info('Opening browser via Socket.IO');
      updateState({ 
        status: 'opening-browser', 
        message: 'Opening browser...',
        error: null 
      });

      await browserService.launch();
      
      updateState({
        browserOpen: true,
        status: 'ready',
        message: 'Browser opened successfully'
      });

    } catch (error) {
      logger.error('Failed to open browser', { error: error.message });
      updateState({
        status: 'error',
        message: `Failed to open browser: ${error.message}`,
        error: error.message
      });
    }
  });

  socket.on('login', async () => {
    try {
      if (!appState.browserOpen) {
        throw new Error('Browser is not open. Please open browser first.');
      }

      logger.info('Logging in to LinkedIn via Socket.IO');
      updateState({
        status: 'logging-in',
        message: 'Logging in to LinkedIn...',
        error: null
      });

      const success = await linkedInService.login();
      
      if (success) {
        updateState({
          loggedIn: true,
          status: 'authenticated',
          message: 'Successfully logged in to LinkedIn'
        });
      } else {
        throw new Error('Login failed - please check credentials');
      }

    } catch (error) {
      logger.error('Failed to login', { error: error.message });
      updateState({
        status: 'error',
        message: `Login failed: ${error.message}`,
        error: error.message
      });
    }
  });

  socket.on('startScraping', async () => {
    try {
      if (!appState.loggedIn) {
        throw new Error('Not logged in. Please login first.');
      }

      if (appState.scrapingActive) {
        throw new Error('Scraping is already active.');
      }

      logger.info('Starting scraping via Socket.IO');
      
      // Load search names
      const searchNames = await csvService.loadSearchNames();
      
      updateState({
        scrapingActive: true,
        status: 'scraping',
        message: 'Starting scraping process...',
        totalProfiles: searchNames.length,
        progress: 0,
        scrapedCount: 0,
        results: [],
        error: null
      });

      // Start scraping in background
      scrapeProfiles(searchNames);

    } catch (error) {
      logger.error('Failed to start scraping', { error: error.message });
      updateState({
        scrapingActive: false,
        status: 'error',
        message: `Failed to start scraping: ${error.message}`,
        error: error.message
      });
    }
  });

  socket.on('stopScraping', async () => {
    try {
      logger.info('Stopping scraping via Socket.IO');
      
      updateState({
        scrapingActive: false,
        status: 'stopped',
        message: 'Scraping stopped by user'
      });

    } catch (error) {
      logger.error('Failed to stop scraping', { error: error.message });
      updateState({
        status: 'error',
        message: `Failed to stop scraping: ${error.message}`,
        error: error.message
      });
    }
  });

  socket.on('disconnect', () => {
    logger.info('Client disconnected', { socketId: socket.id });
  });
});

// Serve static files in production
if (NODE_ENV === 'production' || process.env.SERVE_FRONTEND === 'true') {
  const frontendDistPath = path.join(__dirname, '..', 'frontend', 'dist');
  
  console.log('Serving frontend static files from:', frontendDistPath);
  
  // Serve static files
  app.use(express.static(frontendDistPath));
  
  // Serve index.html for all non-API routes (SPA fallback)
  app.get('*', (req, res, next) => {
    // Skip API routes
    if (req.path.startsWith('/api/')) {
      return next();
    }
    
    res.sendFile(path.join(frontendDistPath, 'index.html'));
  });
}

// API Routes (REST API for external access)

// Get browser status with detailed tab information
app.get('/api/browser/status', async (req, res) => {
  try {
    const isActive = browserService.isActive();
    let tabInfo = null;
    let pageInfo = null;

    if (isActive) {
      try {
        // Get current page info
        pageInfo = await browserService.getPageInfo();
        
        // Get tab information
        if (browserService.browser) {
          const pages = await browserService.browser.pages();
          tabInfo = {
            count: pages.length,
            tabs: await Promise.all(pages.map(async (page, index) => {
              try {
                return {
                  index: index,
                  url: page.url() || 'about:blank',
                  title: await page.title() || 'Untitled',
                  isCurrentTab: page === browserService.page
                };
              } catch (e) {
                return {
                  index: index,
                  url: 'Error loading',
                  title: 'Error',
                  isCurrentTab: false
                };
              }
            }))
          };
        }
      } catch (error) {
        console.warn('Error getting detailed browser status:', error.message);
      }
    }

    const status = {
      success: true,
      data: {
        is_open: isActive,
        is_alive: isActive,
        current_url: pageInfo?.url || appState.currentPage || null,
        current_title: pageInfo?.title || null,
        status: isActive ? 'Browser is active' : 'Browser is closed',
        tabs: tabInfo,
        page_info: pageInfo,
        logged_in: appState.loggedIn,
        timestamp: new Date().toISOString()
      }
    };

    res.json(status);

  } catch (error) {
    logger.error('Failed to get browser status', { error: error.message });
    res.status(500).json({
      success: false,
      data: {
        is_open: false,
        is_alive: false,
        current_url: null,
        status: `Error checking browser status: ${error.message}`
      },
      error: error.message
    });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '2.0.0',
    services: {
      browser: appState.browserOpen,
      linkedin: appState.loggedIn,
      scraping: appState.scrapingActive
    }
  });
});

// Get search names count
app.get('/api/search-names-count', async (req, res) => {
  try {
    const searchNames = await csvService.loadSearchNames();
    res.json({ 
      success: true, 
      count: searchNames.length,
      message: `Found ${searchNames.length} names in search_names.csv`
    });
  } catch (error) {
    logger.error('Failed to load search names count', { error: error.message });
    res.status(500).json({ 
      success: false, 
      count: 0,
      message: error.message 
    });
  }
});

// Check login status manually
app.get('/api/login/check', async (req, res) => {
  try {
    if (!appState.browserOpen) {
      throw new Error('Browser is not open. Please open browser first.');
    }

    logger.info('Manual login status check via API');
    const loginCheck = await linkedInService.checkLoginStatus();
    
    // Update app state based on check result
    if (loginCheck.success && loginCheck.alreadyLoggedIn) {
      updateState({
        loggedIn: true,
        status: 'authenticated',
        message: 'Already logged in to LinkedIn'
      });
    } else {
      updateState({
        loggedIn: false,
        status: 'ready',
        message: 'Not logged in to LinkedIn'
      });
    }

    res.json({ 
      success: true, 
      loggedIn: loginCheck.success && loginCheck.alreadyLoggedIn,
      message: loginCheck.message,
      state: appState
    });

  } catch (error) {
    logger.error('Failed to check login status', { error: error.message });
    res.status(500).json({ 
      success: false, 
      loggedIn: false,
      message: error.message 
    });
  }
});

// Get current state
app.get('/api/state', (req, res) => {
  res.json(appState);
});

// Get frontend configuration
app.get('/api/config', (req, res) => {
  res.json({
    apiBaseUrl: `http://localhost:${PORT}`,
    socketUrl: `http://localhost:${PORT}`,
    universityName: process.env.UNIVERSITY_NAME || 'Your University',
    toastDuration: parseInt(process.env.TOAST_DURATION) || 5000,
    enableAutoRefresh: process.env.ENABLE_AUTO_REFRESH === 'true',
    enableToastNotifications: process.env.ENABLE_TOAST_NOTIFICATIONS !== 'false',
    environment: NODE_ENV,
    version: '3.0.0'
  });
});

// Open browser
app.post('/api/browser/open', async (req, res) => {
  try {
    logger.info('Opening browser via API');
    updateState({ 
      status: 'opening-browser', 
      message: 'Opening browser...',
      error: null 
    });

    await browserService.launch();
    
    updateState({
      browserOpen: true,
      status: 'ready',
      message: 'Browser opened successfully'
    });

    // After browser is open, automatically check login status
    try {
      logger.info('Auto-checking login status after browser open...');
      const loginCheck = await linkedInService.checkLoginStatus();
      
      if (loginCheck.success && loginCheck.alreadyLoggedIn) {
        updateState({
          loggedIn: true,
          status: 'authenticated',
          message: 'Browser opened - Already logged in to LinkedIn'
        });
        
        // Emit login update to frontend
        io.emit('loginUpdate', { 
          success: true, 
          message: 'Already logged in to LinkedIn',
          alreadyLoggedIn: true 
        });
      } else {
        updateState({
          loggedIn: false,
          message: 'Browser opened - Please login to LinkedIn'
        });
        
        // Emit login update to frontend
        io.emit('loginUpdate', { 
          success: false, 
          message: 'Not logged in - Please login to LinkedIn',
          alreadyLoggedIn: false 
        });
      }

      // Get and emit initial page info
      const pageInfo = await browserService.getPageInfo();
      if (pageInfo) {
        appState.currentPage = pageInfo.url;
        io.emit('pageUpdate', {
          url: pageInfo.url,
          title: pageInfo.title,
          hostname: pageInfo.hostname,
          pathname: pageInfo.pathname,
          isLinkedIn: pageInfo.isLinkedIn,
          ready: pageInfo.ready,
          currentPage: pageInfo.url
        });
      }
    } catch (autoCheckError) {
      logger.warn('Auto login check failed:', autoCheckError.message);
      // Don't fail the browser open if login check fails
    }

    res.json({ 
      success: true, 
      message: 'Browser opened successfully',
      state: appState
    });

  } catch (error) {
    logger.error('Failed to open browser', { error: error.message });
    updateState({
      status: 'error',
      message: `Failed to open browser: ${error.message}`,
      error: error.message
    });

    res.status(500).json({ 
      success: false, 
      message: error.message,
      state: appState
    });
  }
});

// Login to LinkedIn
app.post('/api/login', async (req, res) => {
  try {
    if (!appState.browserOpen) {
      throw new Error('Browser is not open. Please open browser first.');
    }

    logger.info('Checking login status and logging in to LinkedIn via API');
    updateState({
      status: 'checking-login',
      message: 'Checking if already logged in...',
      error: null
    });

    // First check if already logged in
    const loginCheck = await linkedInService.checkLoginStatus();
    
    if (loginCheck.success && loginCheck.alreadyLoggedIn) {
      // Already logged in
      updateState({
        loggedIn: true,
        status: 'authenticated',
        message: 'Already logged in to LinkedIn - Feed ready'
      });

      res.json({ 
        success: true, 
        message: 'Already logged in to LinkedIn - Feed ready',
        alreadyLoggedIn: true,
        state: appState
      });
      return;
    }

    // Need to login
    updateState({
      status: 'logging-in',
      message: 'Not logged in - Starting login process...',
      error: null
    });

    const result = await linkedInService.login();
    
    if (result.success) {
      updateState({
        loggedIn: true,
        status: 'authenticated',
        message: 'Successfully logged in to LinkedIn - Feed ready'
      });

      res.json({ 
        success: true, 
        message: 'Successfully logged in to LinkedIn - Feed ready',
        alreadyLoggedIn: false,
        state: appState
      });
    } else {
      throw new Error(result.message || 'Login failed - please check credentials');
    }

  } catch (error) {
    logger.error('Failed to login', { error: error.message });
    updateState({
      loggedIn: false,
      status: 'error',
      message: `Login failed: ${error.message}`,
      error: error.message
    });

    res.status(500).json({ 
      success: false, 
      message: error.message,
      state: appState
    });
  }
});

// Navigate to university alumni page
app.post('/api/navigate-university', async (req, res) => {
  try {
    // First check if browser is open
    if (!appState.browserOpen) {
      throw new Error('Browser is not open. Please open browser first.');
    }

    // Check current login status before navigation
    logger.info('Checking login status before navigation...');
    const loginCheck = await linkedInService.checkLoginStatus();
    
    if (!loginCheck.success || !loginCheck.alreadyLoggedIn) {
      throw new Error('Not logged in. Please login first.');
    }

    // Update state to reflect current login status
    updateState({
      loggedIn: true,
      status: 'navigating',
      message: 'Navigating to university alumni page...',
      error: null
    });

    // Emit login update to frontend
    io.emit('loginUpdate', { 
      success: true, 
      message: 'Login confirmed for navigation',
      alreadyLoggedIn: true 
    });

    logger.info('Navigating to university alumni page via API');
    const result = await linkedInService.navigateToUniversityAlumni();
    
    if (result.success) {
      updateState({
        status: 'ready-to-scrape',
        message: result.message || 'Ready to start scraping university alumni'
      });

      res.json({ 
        success: true, 
        message: result.message || 'Successfully navigated to university alumni page',
        state: appState
      });
    } else {
      throw new Error(result.message || 'Failed to navigate to university page');
    }

  } catch (error) {
    logger.error('Failed to navigate to university', { error: error.message });
    updateState({
      status: 'error',
      message: `Navigation failed: ${error.message}`,
      error: error.message
    });

    res.status(500).json({ 
      success: false, 
      message: error.message,
      state: appState
    });
  }
});

// Start scraping
app.post('/api/scrape/start', async (req, res) => {
  try {
    if (!appState.loggedIn) {
      throw new Error('Not logged in. Please login first.');
    }

    if (appState.scrapingActive) {
      throw new Error('Scraping is already active.');
    }

    logger.info('Starting scraping via API');
    
    // Load search names
    const searchNames = await csvService.loadSearchNames();
    
    // Determine starting point for resume capability
    let startIndex = 0;
    if (appState.lastScrapedIndex >= 0 && appState.lastScrapedIndex < searchNames.length - 1) {
      startIndex = appState.lastScrapedIndex + 1;
      logger.info(`Resuming scraping from index ${startIndex} (${searchNames[startIndex]})`);
    } else {
      logger.info('Starting fresh scraping session');
      // Reset counters for fresh start
      appState.scrapedCount = 0;
      appState.notFoundCount = 0;
      appState.results = [];
    }
    
    updateState({
      scrapingActive: true,
      status: 'scraping',
      message: startIndex > 0 ? `Resuming scraping from: ${searchNames[startIndex]}` : 'Starting scraping process...',
      totalProfiles: searchNames.length,
      progress: Math.round((startIndex / searchNames.length) * 100),
      progressPercent: (startIndex / searchNames.length) * 100,
      error: null
    });

    // Start scraping in background
    scrapeProfiles(searchNames, startIndex);

    res.json({ 
      success: true, 
      message: startIndex > 0 ? `Resuming scraping from: ${searchNames[startIndex]}` : 'Scraping started successfully',
      totalProfiles: searchNames.length,
      resuming: startIndex > 0,
      startIndex: startIndex,
      state: appState
    });

  } catch (error) {
    logger.error('Failed to start scraping', { error: error.message });
    updateState({
      scrapingActive: false,
      status: 'error',
      message: `Failed to start scraping: ${error.message}`,
      error: error.message
    });

    res.status(500).json({ 
      success: false, 
      message: error.message,
      state: appState
    });
  }
});

// Stop scraping
app.post('/api/scrape/stop', async (req, res) => {
  try {
    logger.info('Stopping scraping via API');
    
    updateState({
      scrapingActive: false,
      status: 'stopped',
      message: 'Scraping stopped by user'
    });

    res.json({ 
      success: true, 
      message: 'Scraping stopped successfully',
      state: appState
    });

  } catch (error) {
    logger.error('Failed to stop scraping', { error: error.message });
    res.status(500).json({ 
      success: false, 
      message: error.message,
      state: appState
    });
  }
});

// Pause scraping
app.post('/api/scrape/pause', async (req, res) => {
  try {
    logger.info('Pausing scraping via API');
    
    updateState({
      scrapingActive: false,
      status: 'paused',
      message: `Scraping paused. Last processed: ${appState.lastScrapedName || 'None'}`
    });

    res.json({ 
      success: true, 
      message: 'Scraping paused successfully',
      lastProcessed: appState.lastScrapedName,
      canResume: true,
      state: appState
    });

  } catch (error) {
    logger.error('Failed to pause scraping', { error: error.message });
    res.status(500).json({ 
      success: false, 
      message: error.message,
      state: appState
    });
  }
});

// Reset scraping session
app.post('/api/scrape/reset', async (req, res) => {
  try {
    logger.info('Resetting scraping session via API');
    
    updateState({
      scrapingActive: false,
      status: 'idle',
      message: 'Scraping session reset',
      progress: 0,
      progressPercent: 0,
      scrapedCount: 0,
      notFoundCount: 0,
      lastScrapedName: '',
      lastScrapedIndex: -1,
      results: []
    });

    res.json({ 
      success: true, 
      message: 'Scraping session reset successfully',
      state: appState
    });

  } catch (error) {
    logger.error('Failed to reset scraping session', { error: error.message });
    res.status(500).json({ 
      success: false, 
      message: error.message,
      state: appState
    });
  }
});

// Export results
app.get('/api/results/export', async (req, res) => {
  try {
    const csvPath = await csvService.exportResults(appState.results);
    
    logger.info('Exporting results via API', { 
      resultCount: appState.results.length,
      csvPath 
    });

    res.download(csvPath, `linkedin_alumni_${new Date().toISOString().split('T')[0]}.csv`);

  } catch (error) {
    logger.error('Failed to export results', { error: error.message });
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// Download results (alternative endpoint)
app.get('/api/download/results', async (req, res) => {
  try {
    const csvPath = await csvService.exportResults(appState.results);
    
    logger.info('Downloading results via API', { 
      resultCount: appState.results.length,
      csvPath 
    });

    res.download(csvPath, `linkedin_alumni_${new Date().toISOString().split('T')[0]}.csv`);

  } catch (error) {
    logger.error('Failed to download results', { error: error.message });
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// Get current state
app.get('/api/state', (req, res) => {
  res.json(appState);
});

// Core scraping function
async function scrapeProfiles(searchNames, startIndex = 0) {
  try {
    logger.info('Starting profile scraping', { 
      totalNames: searchNames.length, 
      startIndex,
      resuming: startIndex > 0 
    });
    
    for (let i = startIndex; i < searchNames.length && appState.scrapingActive; i++) {
      const name = searchNames[i];
      
      try {
        logger.info('Processing profile', { name, index: i + 1, total: searchNames.length });
        
        const progressPercent = (i / searchNames.length) * 100;
        
        updateState({
          currentProfile: { name, position: '', company: '', location: '' },
          message: `Searching for: ${name} (${i + 1}/${searchNames.length})`,
          progress: Math.round(progressPercent),
          progressPercent: progressPercent,
          lastScrapedName: name,
          lastScrapedIndex: i
        });

        // Search and extract profile data
        const profileData = await linkedInService.searchAndExtract(name);
        
        if (profileData && profileData.name) {
          // Profile found
          appState.results.push(profileData);
          appState.scrapedCount++;
          
          const resultData = {
            name: profileData.name,
            found: true,
            position: profileData.position,
            company: profileData.company,
            location: profileData.location,
            timestamp: new Date().toISOString()
          };
          
          updateState({
            currentProfile: profileData,
            message: `Found: ${profileData.name} - ${profileData.position} at ${profileData.company}`,
            results: [...appState.results],
            scrapedCount: appState.scrapedCount
          });

          // Emit result to frontend
          io.emit('scrapingResult', resultData);

          logger.info('Profile found and added', { 
            name: profileData.name,
            totalResults: appState.results.length 
          });
        } else {
          // Profile not found
          appState.notFoundCount++;
          
          const resultData = {
            name: name,
            found: false,
            position: null,
            company: null,
            location: null,
            timestamp: new Date().toISOString()
          };
          
          updateState({
            message: `No profile found for: ${name}`,
            notFoundCount: appState.notFoundCount
          });

          // Emit result to frontend
          io.emit('scrapingResult', resultData);
          
          logger.info('Profile not found', { name });
        }

        // Random delay between searches
        const delay = Math.random() * 3000 + 2000; // 2-5 seconds
        await new Promise(resolve => setTimeout(resolve, delay));

      } catch (error) {
        logger.error('Error processing profile', { 
          name, 
          error: error.message 
        });
        
        // Count as not found if error occurs
        appState.notFoundCount++;
        
        const resultData = {
          name: name,
          found: false,
          position: null,
          company: null,
          location: null,
          error: error.message,
          timestamp: new Date().toISOString()
        };
        
        updateState({
          message: `Error processing ${name}: ${error.message}`,
          notFoundCount: appState.notFoundCount
        });

        // Emit error result to frontend
        io.emit('scrapingResult', resultData);
      }
    }

    // Scraping completed
    if (appState.scrapingActive) {
      logger.info('Scraping completed', { 
        totalProcessed: searchNames.length,
        resultsFound: appState.results.length,
        scrapedCount: appState.scrapedCount,
        notFoundCount: appState.notFoundCount
      });

      // Auto-export results
      if (appState.results.length > 0) {
        const csvPath = await csvService.exportResults(appState.results);
        logger.info('Results auto-exported', { csvPath });
      }

      updateState({
        scrapingActive: false,
        status: 'completed',
        message: `Scraping completed! Found ${appState.scrapedCount} profiles, ${appState.notFoundCount} not found.`,
        progress: 100,
        progressPercent: 100
      });
    }

  } catch (error) {
    logger.error('Scraping process error', { error: error.message });
    
    updateState({
      scrapingActive: false,
      status: 'error',
      message: `Scraping error: ${error.message}`,
      error: error.message
    });
  }
}

// Error handling middleware
app.use((error, req, res, next) => {
  logger.error('Express error', { 
    error: error.message, 
    stack: error.stack,
    url: req.url,
    method: req.method
  });

  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// 404 handler
app.use((req, res) => {
  logger.warn('Route not found', { 
    url: req.url, 
    method: req.method 
  });

  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Shutting down gracefully...');
  
  try {
    if (browserService.browser) {
      await browserService.close();
      logger.info('Browser closed');
    }
    
    server.close(() => {
      logger.info('Server closed');
      process.exit(0);
    });
  } catch (error) {
    logger.error('Error during shutdown', { error: error.message });
    process.exit(1);
  }
});

// Start server
server.listen(PORT, HOST, () => {
  console.log(`Backend started on ${BACKEND_URL}`);
  
  if (NODE_ENV === 'development') {
    console.log(`Frontend URL: ${FRONTEND_DEV_URL} (dev server)`);
  } else {
    console.log(`Frontend URL: ${FRONTEND_PROD_URL} (production)`);
  }
  
  console.log(`Environment: ${NODE_ENV}`);
});
