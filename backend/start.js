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
import BrowserService from './services/BrowserService.js';
import LinkedInService from './services/LinkedInService.js';
import CsvService from './services/CsvService.js';
dotenv.config();
const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || 'localhost';
const NODE_ENV = process.env.NODE_ENV || 'development';
const FRONTEND_DEV_URL = process.env.FRONTEND_DEV_URL || 'http://localhost:5173';
const FRONTEND_PROD_URL = process.env.FRONTEND_PROD_URL || 'http://localhost:3000';
const FRONTEND_URL = NODE_ENV === 'development' ? FRONTEND_DEV_URL : FRONTEND_PROD_URL;
const BACKEND_URL = `http://${HOST}:${PORT}`;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: [FRONTEND_DEV_URL, FRONTEND_PROD_URL, FRONTEND_URL],
    methods: ["GET", "POST"],
    credentials: true
  }
});
const browserService = new BrowserService();
const linkedInService = new LinkedInService(browserService);
const csvService = new CsvService();
browserService.onBrowserClosed(() => {
  console.log('Browser was closed externally');
  appState.browserOpen = false;
  appState.loggedIn = false;
  appState.currentPage = '';
  appState.status = 'browser-closed';
  io.emit('stateUpdate', appState);
  io.emit('browserUpdate', { 
    status: 'closed', 
    message: 'Browser was closed externally' 
  });
});
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
    io.emit('stateUpdate', appState);
    io.emit('browserUpdate', { 
      status: actualBrowserStatus ? 'open' : 'closed',
      message: 'Browser status synchronized',
      browserOpen: actualBrowserStatus,
      isActive: actualBrowserStatus,
      timestamp: new Date().toISOString()
    });
  }
  if (actualBrowserStatus) {
    try {
      const pageInfo = await browserService.getPageInfo();
      if (pageInfo) {
        const pageChanged = pageInfo.url !== appState.currentPage;
        const previousPage = appState.currentPage;
        appState.currentPage = pageInfo.url;
        io.emit('pageUpdate', {
          url: pageInfo.url,
          title: pageInfo.title,
          hostname: pageInfo.hostname,
          pathname: pageInfo.pathname,
          isLinkedIn: pageInfo.isLinkedIn,
          ready: pageInfo.ready,
          currentPage: pageInfo.url,
          previousPage: previousPage,
          tabChange: pageChanged,
          timestamp: new Date().toISOString(),
          realTimeUpdate: true
        });
        if (pageChanged) {
          console.log('Page changed:', pageInfo.url, pageInfo.title);
        }
      }
      if (browserService.browser) {
        const pages = await browserService.browser.pages();
        const tabCount = pages.length;
        io.emit('tabUpdate', {
          tabCount: tabCount,
          timestamp: new Date().toISOString(),
          currentUrl: pageInfo?.url || 'unknown',
          realTimeUpdate: true
        });
      }
    } catch (error) {
      console.debug('Page info check error:', error.message);
    }
  }
}, 3000); // Check every 3 seconds for more responsive updates
const logger = {
  info: (...args) => console.log('[INFO]', ...args),
  error: (...args) => console.error('[ERROR]', ...args),
  warn: (...args) => console.warn('[WARN]', ...args),
  debug: (...args) => console.log('[DEBUG]', ...args)
};
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
  foundCount: 0,
  results: [],
  error: null,
  notFoundCount: 0,
  progressPercent: 0,
  lastScrapedName: '',
  lastScrapedIndex: -1,
  currentPage: ''
};
const updateState = (updates = {}) => {
  appState = { ...appState, ...updates };
  logger.info('State updated', { updates });
  io.emit('stateUpdate', appState);
};
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
app.use(morgan('combined'));
io.on('connection', (socket) => {
  logger.info('Client connected', { socketId: socket.id });
  socket.emit('stateUpdate', appState);
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
      io.emit('loginStep', {
        step: 0,
        title: 'Checking current login status...',
        description: 'Verifying if already logged in'
      });
      const loginCheck = await linkedInService.checkLoginStatus();
      if (loginCheck.success && loginCheck.alreadyLoggedIn) {
        io.emit('loginStep', {
          step: 3,
          title: 'Already logged in!',
          description: 'LinkedIn session detected',
          completed: true
        });
        updateState({
          loggedIn: true,
          status: 'authenticated',
          message: 'Already logged in to LinkedIn'
        });
        io.emit('loginUpdate', { 
          success: true, 
          message: 'Already logged in to LinkedIn',
          alreadyLoggedIn: true 
        });
        return;
      }
      io.emit('loginStep', {
        step: 1,
        title: 'Navigating to login page...',
        description: 'Opening LinkedIn authentication'
      });
      io.emit('loginStep', {
        step: 2,
        title: 'Processing login...',
        description: 'Please complete login in browser'
      });
      const success = await linkedInService.login();
      if (success.success) {
        io.emit('loginStep', {
          step: 3,
          title: 'Login successful!',
          description: 'Successfully authenticated with LinkedIn',
          completed: true
        });
        updateState({
          loggedIn: true,
          status: 'authenticated',
          message: 'Successfully logged in to LinkedIn'
        });
        io.emit('loginUpdate', { 
          success: true, 
          message: 'Successfully logged in to LinkedIn',
          alreadyLoggedIn: false 
        });
      } else {
        throw new Error(success.message || 'Login failed - please check credentials');
      }
    } catch (error) {
      logger.error('Failed to login', { error: error.message });
      io.emit('loginStep', {
        step: -1,
        title: 'Login failed',
        description: error.message,
        error: true
      });
      updateState({
        loggedIn: false,
        status: 'error',
        message: `Login failed: ${error.message}`,
        error: error.message
      });
      io.emit('loginUpdate', { 
        success: false, 
        message: error.message,
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
if (NODE_ENV === 'production' || process.env.SERVE_FRONTEND === 'true') {
  const frontendDistPath = path.join(__dirname, '..', 'frontend', 'dist');
  console.log('Serving frontend static files from:', frontendDistPath);
  app.use(express.static(frontendDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) {
      return next();
    }
    res.sendFile(path.join(frontendDistPath, 'index.html'));
  });
}
app.get('/api/browser/status', async (req, res) => {
  try {
    const isActive = browserService.isActive();
    let tabInfo = null;
    let pageInfo = null;
    if (isActive) {
      try {
        pageInfo = await browserService.getPageInfo();
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
app.get('/api/login/check', async (req, res) => {
  try {
    if (!appState.browserOpen) {
      throw new Error('Browser is not open. Please open browser first.');
    }
    logger.info('Manual login status check via API (non-intrusive)');
    const loginCheck = await linkedInService.checkLoginStatus();
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
      nonIntrusive: true,
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
app.get('/api/state', (req, res) => {
  res.json(appState);
});
app.get('/api/config', (req, res) => {
  res.json({
    apiBaseUrl: `http://localhost:${PORT}`,
    socketUrl: `http://localhost:${PORT}`,
    universityName: process.env.UNIVERSITY_NAME || 'Universitas Indonesia',
    toastDuration: parseInt(process.env.TOAST_DURATION) || 5000,
    enableAutoRefresh: process.env.ENABLE_AUTO_REFRESH === 'true',
    enableToastNotifications: process.env.ENABLE_TOAST_NOTIFICATIONS !== 'false',
    environment: NODE_ENV,
    version: '3.0.0'
  });
});
app.get('/api/browser/info', async (req, res) => {
  try {
    const browserActive = browserService.isActive();
    let pageInfo = null;
    let tabCount = 0;
    if (browserActive) {
      try {
        pageInfo = await browserService.getPageInfo();
        if (browserService.browser) {
          const pages = await browserService.browser.pages();
          tabCount = pages.length;
        }
      } catch (error) {
        console.log('Error getting browser info:', error.message);
      }
    }
    res.json({
      success: true,
      browserActive: browserActive,
      pageInfo: pageInfo || {
        url: 'about:blank',
        title: 'No page loaded',
        hostname: '',
        pathname: '',
        isLinkedIn: false,
        ready: false
      },
      tabCount: tabCount,
      state: appState,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      browserActive: false,
      pageInfo: null,
      tabCount: 0
    });
  }
});
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
    try {
      logger.info('Auto-checking login status after browser open (non-intrusive)...');
      const loginCheck = await linkedInService.checkLoginStatus();
      if (loginCheck.success && loginCheck.alreadyLoggedIn) {
        updateState({
          loggedIn: true,
          status: 'authenticated',
          message: 'Browser opened - Already logged in to LinkedIn'
        });
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
        io.emit('loginUpdate', { 
          success: false, 
          message: 'Not logged in - Please login to LinkedIn',
          alreadyLoggedIn: false,
          showError: false // Don't show error toast for auto-check after browser open
        });
      }
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
      browserService.setPageChangeCallback((eventType, url) => {
        console.log(`Page event: ${eventType}${url ? ` - ${url}` : ''}`);
        setTimeout(async () => {
          try {
            const updatedPageInfo = await browserService.getPageInfo();
            if (updatedPageInfo) {
              appState.currentPage = updatedPageInfo.url;
              io.emit('pageUpdate', {
                url: updatedPageInfo.url,
                title: updatedPageInfo.title,
                hostname: updatedPageInfo.hostname,
                pathname: updatedPageInfo.pathname,
                isLinkedIn: updatedPageInfo.isLinkedIn,
                ready: updatedPageInfo.ready,
                currentPage: updatedPageInfo.url,
                eventType: eventType,
                instantUpdate: true,
                timestamp: new Date().toISOString()
              });
            }
          } catch (error) {
            console.log('Error in page change callback:', error.message);
          }
        }, 500); // Small delay to ensure page is ready
      });
    } catch (autoCheckError) {
      logger.warn('Auto login check failed (non-critical):', autoCheckError.message);
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
    io.emit('loginStep', {
      step: 0,
      title: 'Checking current login status...',
      description: 'Verifying if already logged in'
    });
    const loginCheck = await linkedInService.checkLoginStatus();
    if (loginCheck.success && loginCheck.alreadyLoggedIn) {
      io.emit('loginStep', {
        step: 3,
        title: 'Already logged in!',
        description: 'LinkedIn session detected',
        completed: true
      });
      updateState({
        loggedIn: true,
        status: 'authenticated',
        message: 'Already logged in to LinkedIn - Feed ready'
      });
      io.emit('loginUpdate', { 
        success: true, 
        message: 'Already logged in to LinkedIn - Feed ready',
        alreadyLoggedIn: true 
      });
      res.json({ 
        success: true, 
        message: 'Already logged in to LinkedIn - Feed ready',
        alreadyLoggedIn: true,
        state: appState
      });
      return;
    }
    io.emit('loginStep', {
      step: 1,
      title: 'Navigating to login page...',
      description: 'Opening LinkedIn authentication'
    });
    updateState({
      status: 'logging-in',
      message: 'Not logged in - Starting login process...',
      error: null
    });
    io.emit('loginStep', {
      step: 2,
      title: 'Processing login...',
      description: 'Please complete login in browser'
    });
    const result = await linkedInService.login();
    if (result.success) {
      io.emit('loginStep', {
        step: 3,
        title: 'Login successful!',
        description: 'Successfully authenticated with LinkedIn',
        completed: true
      });
      updateState({
        loggedIn: true,
        status: 'authenticated',
        message: 'Successfully logged in to LinkedIn - Feed ready'
      });
      io.emit('loginUpdate', { 
        success: true, 
        message: 'Successfully logged in to LinkedIn - Feed ready',
        alreadyLoggedIn: false 
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
    io.emit('loginStep', {
      step: -1,
      title: 'Login failed',
      description: error.message,
      error: true
    });
    updateState({
      loggedIn: false,
      status: 'error',
      message: `Login failed: ${error.message}`,
      error: error.message
    });
    io.emit('loginUpdate', { 
      success: false, 
      message: error.message,
      error: error.message 
    });
    res.status(500).json({ 
      success: false, 
      message: error.message,
      state: appState
    });
  }
});
app.post('/api/navigate-university', async (req, res) => {
  try {
    if (!appState.browserOpen) {
      throw new Error('Browser is not open. Please open browser first.');
    }
    logger.info('Checking login status before navigation...');
    const loginCheck = await linkedInService.checkLoginStatus();
    if (!loginCheck.success || !loginCheck.alreadyLoggedIn) {
      throw new Error('Not logged in. Please login first.');
    }
    updateState({
      loggedIn: true,
      status: 'navigating',
      message: 'Navigating to university alumni page...',
      error: null
    });
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
app.post('/api/scrape/start', async (req, res) => {
  try {
    if (!appState.loggedIn) {
      throw new Error('Not logged in. Please login first.');
    }
    if (appState.scrapingActive) {
      throw new Error('Scraping is already active.');
    }
    logger.info('Starting scraping via API');
    const searchNames = await csvService.loadSearchNames();
    const csvFilename = await csvService.initializeRealTimeSession();
    let startIndex = 0;
    if (appState.lastScrapedIndex >= 0 && appState.lastScrapedIndex < searchNames.length - 1) {
      startIndex = appState.lastScrapedIndex + 1;
      logger.info(`Resuming scraping from index ${startIndex} (${searchNames[startIndex]})`);
    } else {
      logger.info('Starting fresh scraping session');
      appState.scrapedCount = 0;
      appState.notFoundCount = 0;
      appState.results = [];
    }
    updateState({
      scrapingActive: true,
      status: 'scraping',
      message: startIndex > 0 ? `Resuming scraping from: ${searchNames[startIndex]}` : 'Starting scraping process with real-time CSV save...',
      totalProfiles: searchNames.length,
      progress: Math.round((startIndex / searchNames.length) * 100),
      progressPercent: (startIndex / searchNames.length) * 100,
      currentCsvFile: csvFilename,
      error: null
    });
    scrapeProfiles(searchNames, startIndex);
    res.json({ 
      success: true, 
      message: startIndex > 0 ? `Resuming scraping from: ${searchNames[startIndex]}` : 'Scraping started with real-time CSV save',
      totalProfiles: searchNames.length,
      resuming: startIndex > 0,
      startIndex: startIndex,
      csvFile: csvFilename,
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
app.post('/api/scrape/reset', async (req, res) => {
  try {
    logger.info('Resetting scraping session via API');
    const finalizedFile = csvService.finalizeRealTimeSession();
    if (finalizedFile) {
      logger.info('Finalized active real-time CSV session during reset', { file: finalizedFile });
    }
    updateState({
      scrapingActive: false,
      status: 'idle',
      message: 'Scraping session reset',
      progress: 0,
      progressPercent: 0,
      scrapedCount: 0,
      foundCount: 0,
      notFoundCount: 0,
      lastScrapedName: '',
      lastScrapedIndex: -1,
      currentCsvFile: null,
      finalCsvFile: null,
      results: []
    });
    res.json({ 
      success: true, 
      message: 'Scraping session reset successfully',
      finalizedFile: finalizedFile,
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
app.post('/api/navigate-profile', async (req, res) => {
  try {
    if (!appState.browserOpen) {
      throw new Error('Browser is not open. Please open browser first.');
    }
    if (!appState.loggedIn) {
      throw new Error('Not logged in. Please login first.');
    }
    logger.info('Navigating to user profile via API');
    updateState({
      status: 'navigating-profile',
      message: 'Navigating to your profile...',
      error: null
    });
    const result = await linkedInService.navigateToMyProfile();
    if (result.success) {
      updateState({
        status: 'ready',
        message: 'Successfully navigated to your profile'
      });
      res.json({ 
        success: true, 
        message: 'Successfully navigated to your profile',
        profileUrl: result.profileUrl,
        state: appState
      });
    } else {
      throw new Error(result.message || 'Failed to navigate to profile');
    }
  } catch (error) {
    logger.error('Failed to navigate to profile', { error: error.message });
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
app.post('/api/navigate-feed', async (req, res) => {
  try {
    if (!appState.browserOpen) {
      throw new Error('Browser is not open. Please open browser first.');
    }
    if (!appState.loggedIn) {
      throw new Error('Not logged in. Please login first.');
    }
    logger.info('Navigating to LinkedIn feed via API');
    updateState({
      status: 'navigating-feed',
      message: 'Navigating to LinkedIn feed...',
      error: null
    });
    const result = await linkedInService.navigateToFeed();
    if (result.success) {
      updateState({
        status: 'ready',
        message: 'Successfully navigated to LinkedIn feed'
      });
      res.json({ 
        success: true, 
        message: 'Successfully navigated to LinkedIn feed',
        feedUrl: result.feedUrl,
        state: appState
      });
    } else {
      throw new Error(result.message || 'Failed to navigate to feed');
    }
  } catch (error) {
    logger.error('Failed to navigate to feed', { error: error.message });
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
app.get('/api/csv/current', async (req, res) => {
  try {
    const csvFiles = await csvService.getExportedFiles();
    if (csvFiles.length === 0) {
      return res.json({
        success: true,
        data: [],
        message: 'No CSV files found',
        fileName: null
      });
    }
    const mostRecentFile = csvFiles.sort((a, b) => new Date(b.created) - new Date(a.created))[0];
    const csvData = await csvService.readCsvFile(mostRecentFile.filename);
    res.json({
      success: true,
      data: csvData,
      fileName: mostRecentFile.filename,
      fileStats: mostRecentFile,
      message: `Loaded ${csvData.length} records from ${mostRecentFile.filename}`
    });
  } catch (error) {
    logger.error('Failed to get current CSV data', { error: error.message });
    res.status(500).json({
      success: false,
      data: [],
      message: error.message,
      fileName: null
    });
  }
});
app.get('/api/csv/files', async (req, res) => {
  try {
    const csvFiles = await csvService.getExportedFiles();
    res.json({
      success: true,
      files: csvFiles,
      count: csvFiles.length,
      message: `Found ${csvFiles.length} CSV files`
    });
  } catch (error) {
    logger.error('Failed to get CSV files list', { error: error.message });
    res.status(500).json({
      success: false,
      files: [],
      count: 0,
      message: error.message
    });
  }
});
app.get('/api/csv/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const csvData = await csvService.readCsvFile(filename);
    const fileStats = await csvService.getFileStats(filename);
    res.json({
      success: true,
      data: csvData,
      fileName: filename,
      fileStats: fileStats,
      message: `Loaded ${csvData.length} records from ${filename}`
    });
  } catch (error) {
    logger.error('Failed to get CSV file data', { error: error.message, filename: req.params.filename });
    res.status(500).json({
      success: false,
      data: [],
      message: error.message,
      fileName: req.params.filename
    });
  }
});
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
async function scrapeProfiles(searchNames, startIndex = 0) {
  try {
    logger.info('Starting alumni profile scraping', { 
      totalNames: searchNames.length, 
      startIndex,
      resuming: startIndex > 0 
    });
    updateState({
      status: 'navigating-to-alumni',
      message: 'Navigating to university alumni page...'
    });
    try {
      logger.info('Navigating to university alumni page before scraping...');
      const navigationResult = await linkedInService.navigateToUniversityAlumni();
      if (!navigationResult.success) {
        throw new Error(navigationResult.message || 'Failed to navigate to university alumni page');
      }
      logger.info('Successfully navigated to university alumni page');
      updateState({
        status: 'scraping',
        message: 'Ready to start alumni search - Now on university alumni page'
      });
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (navError) {
      logger.error('Failed to navigate to university alumni page before scraping', { error: navError.message });
      updateState({
        scrapingActive: false,
        status: 'error',
        message: `Failed to navigate to university alumni page: ${navError.message}`,
        error: navError.message
      });
      return;
    }
    for (let i = startIndex; i < searchNames.length && appState.scrapingActive; i++) {
      const name = searchNames[i];
      try {
        logger.info('Processing alumni profile', { name, index: i + 1, total: searchNames.length });
        const progressPercent = (i / searchNames.length) * 100;
        updateState({
          currentProfile: { name, position: '', company: '', location: '' },
          message: `Searching for: ${name} (${i + 1}/${searchNames.length})`,
          progress: Math.round(progressPercent),
          progressPercent: progressPercent,
          lastScrapedName: name,
          lastScrapedIndex: i
        });
        const profileData = await linkedInService.searchAndExtract(name);
        if (profileData && profileData.found) {
          appState.results.push(profileData);
          appState.scrapedCount++;
          appState.foundCount++;
          const resultData = {
            name: profileData.name,
            found: true,
            position: profileData.position,
            company: profileData.company,
            location: profileData.location,
            bio: profileData.bio,
            experience: profileData.experience,
            education: profileData.education,
            experienceText: profileData.experienceText,
            educationText: profileData.educationText,
            profileUrl: profileData.profileUrl,
            universityName: profileData.universityName,
            searchKeyword: profileData.searchKeyword,
            scrapedAt: profileData.scrapedAt,
            timestamp: new Date().toISOString()
          };
          try {
            await csvService.appendResultRealTime(resultData);
            logger.info('Result saved to CSV in real-time', { name: profileData.name });
          } catch (csvError) {
            logger.error('Failed to save result to CSV in real-time', { error: csvError.message });
          }
          updateState({
            currentProfile: profileData,
            message: `Found: ${profileData.name} - ${profileData.position} at ${profileData.company} (Saved to CSV)`,
            results: [...appState.results],
            scrapedCount: appState.scrapedCount,
            foundCount: appState.foundCount
          });
          io.emit('scrapingResult', resultData);
          logger.info('Alumni profile found and saved', { 
            name: profileData.name,
            position: profileData.position,
            company: profileData.company,
            totalResults: appState.results.length 
          });
        } else {
          appState.notFoundCount++;
          appState.scrapedCount++;
          const resultData = {
            name: name,
            found: false,
            position: 'Not found',
            company: 'N/A',
            location: 'N/A',
            bio: '',
            experience: [],
            education: [],
            experienceText: '',
            educationText: '',
            profileUrl: '',
            universityName: process.env.UNIVERSITY_NAME || 'Universitas Indonesia',
            searchKeyword: name,
            scrapedAt: new Date().toISOString(),
            error: profileData?.error || 'Not found in alumni directory',
            timestamp: new Date().toISOString()
          };
          try {
            await csvService.appendResultRealTime(resultData);
            logger.info('Not found result saved to CSV in real-time', { name });
          } catch (csvError) {
            logger.error('Failed to save not found result to CSV in real-time', { error: csvError.message });
          }
          updateState({
            message: `No alumni profile found for: ${name} (Saved to CSV)`,
            notFoundCount: appState.notFoundCount,
            scrapedCount: appState.scrapedCount
          });
          io.emit('scrapingResult', resultData);
          logger.info('Alumni profile not found but saved', { name });
        }
        if (i < searchNames.length - 1 && appState.scrapingActive) {
          try {
            logger.info('Navigating back to alumni page for next search...');
            updateState({
              message: `Preparing for next search... (${i + 2}/${searchNames.length})`
            });
            const navResult = await linkedInService.navigateBackToAlumniPage();
            if (!navResult.success) {
              logger.warn('Failed to navigate back to alumni page, continuing anyway...', { error: navResult.message });
            } else {
              logger.info('Successfully navigated back to alumni page');
            }
          } catch (navError) {
            logger.warn('Navigation back to alumni page failed, continuing anyway...', { error: navError.message });
          }
        }
        const delay = Math.random() * 3000 + 3000; // 3-6 seconds
        await new Promise(resolve => setTimeout(resolve, delay));
      } catch (error) {
        logger.error('Error processing alumni profile', { 
          name, 
          error: error.message 
        });
        appState.notFoundCount++;
        appState.scrapedCount++;
        const resultData = {
          name: name,
          found: false,
          position: 'Error',
          company: 'Error',
          location: 'Error',
          bio: 'Error occurred during scraping',
          experience: [],
          education: [],
          experienceText: '',
          educationText: '',
          profileUrl: '',
          universityName: process.env.UNIVERSITY_NAME || 'Universitas Indonesia',
          searchKeyword: name,
          error: error.message,
          scrapedAt: new Date().toISOString(),
          timestamp: new Date().toISOString()
        };
        try {
          await csvService.appendResultRealTime(resultData);
          logger.info('Error result saved to CSV in real-time', { name });
        } catch (csvError) {
          logger.error('Failed to save error result to CSV in real-time', { error: csvError.message });
        }
        updateState({
          message: `Error processing ${name}: ${error.message} (Saved to CSV)`,
          notFoundCount: appState.notFoundCount,
          scrapedCount: appState.scrapedCount
        });
        io.emit('scrapingResult', resultData);
      }
    }
    if (appState.scrapingActive) {
      logger.info('Alumni scraping completed', { 
        totalProcessed: searchNames.length,
        resultsFound: appState.results.length,
        foundCount: appState.foundCount,
        scrapedCount: appState.scrapedCount,
        notFoundCount: appState.notFoundCount
      });
      const finalCsvFile = csvService.finalizeRealTimeSession();
      try {
        logger.info('Navigating to user profile after scraping completion...');
        updateState({
          status: 'navigating-home',
          message: 'Scraping completed! Navigating to your profile...'
        });
        const navigationResult = await linkedInService.navigateToMyProfile();
        if (navigationResult.success) {
          logger.info('Successfully navigated to user profile after scraping');
          updateState({
            scrapingActive: false,
            status: 'completed',
            message: `Alumni scraping completed! Found ${appState.foundCount} profiles, ${appState.notFoundCount} not found, ${appState.scrapedCount} total processed. Results saved to: ${finalCsvFile ? path.basename(finalCsvFile) : 'CSV file'}. You are now on your profile page.`,
            progress: 100,
            progressPercent: 100,
            finalCsvFile: finalCsvFile
          });
        } else {
          logger.warn('Failed to navigate to user profile, but scraping completed successfully');
          updateState({
            scrapingActive: false,
            status: 'completed',
            message: `Alumni scraping completed! Found ${appState.foundCount} profiles, ${appState.notFoundCount} not found, ${appState.scrapedCount} total processed. Results saved to: ${finalCsvFile ? path.basename(finalCsvFile) : 'CSV file'}.`,
            progress: 100,
            progressPercent: 100,
            finalCsvFile: finalCsvFile
          });
        }
      } catch (navError) {
        logger.error('Error navigating to user profile after scraping:', navError);
        updateState({
          scrapingActive: false,
          status: 'completed',
          message: `Alumni scraping completed! Found ${appState.foundCount} profiles, ${appState.notFoundCount} not found, ${appState.scrapedCount} total processed. Results saved to: ${finalCsvFile ? path.basename(finalCsvFile) : 'CSV file'}.`,
          progress: 100,
          progressPercent: 100,
          finalCsvFile: finalCsvFile
        });
      }
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
server.listen(PORT, HOST, () => {
  console.log(`Backend started on ${BACKEND_URL}`);
  if (NODE_ENV === 'development') {
    console.log(`Frontend URL: ${FRONTEND_DEV_URL} (dev server)`);
  } else {
    console.log(`Frontend URL: ${FRONTEND_PROD_URL} (production)`);
  }
  console.log(`Environment: ${NODE_ENV}`);
});
