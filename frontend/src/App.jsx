import React from 'react'
import socketService from '@/services/SocketService'
import { ThemeProvider } from '@/components/theme-provider'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ThemeToggle } from '@/components/theme-toggle'
import { StatusIndicator } from '@/components/ui/status-indicator'
import { LoginSteps } from '@/components/ui/login-steps'
import { AlumniDataTable } from '@/components/ui/alumni-data-table'
import { LoadingButton, LoadingInline, LoadingDots } from '@/components/ui/loading-spinner'
import { toast } from '@/hooks/use-toast'
import { Toaster } from '@/components/ui/toaster'
import { 
  Users, 
  Activity, 
  Database, 
  Clock,
  Play,
  Pause,
  RotateCcw,
  Download,
  LogIn,
  Chrome,
  GraduationCap,
  UserCheck,
  UserX,
  Home,
  User,
  Eye
} from 'lucide-react'

// Dynamic API configuration from environment variables
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';
let APP_NAME = 'LinkedIn Alumni Scraper';
let UNIVERSITY_NAME = 'Your University';

/**
 * Main LinkedIn Alumni Scraper Application
 * Professional dashboard with OOP architecture and Socket.IO real-time updates
 */
class App extends React.Component {
  constructor(props) {
    super(props);
    
    this.state = {
      currentSection: 'dashboard',
      backendConnected: false,
      config: {
        apiBaseUrl: API_BASE_URL,
        backendUrl: BACKEND_URL,
        socketUrl: SOCKET_URL,
        universityName: UNIVERSITY_NAME,
        toastDuration: 5000,
        enableAutoRefresh: true,
        enableToastNotifications: true,
        environment: import.meta.env.MODE || 'development',
        version: '3.0.0'
      },
      currentPage: '',
      currentTab: {
        type: 'No page loaded',
        title: 'Blank Page',
        description: 'No page is currently loaded',
        url: '',
        hostname: '',
        isLinkedIn: false
      },
      totalSearchNames: 0,
      scrapedCount: 0,
      notFoundCount: 0,
      foundCount: 0,
      progressPercent: 0,
      lastScrapedName: '',
      stats: {
        totalProfiles: 0,
        activeSession: true,
        lastScraping: '2024-08-05 14:30:00',
        totalUniversities: 12
      },
      scrapingStatus: 'Idle', // Idle, Running, Paused, Completed, Error
      progress: 0,
      isLoading: false,
      isLoggingIn: false,
      isNavigating: false,
      loginStatus: 'Not Logged In', // Not Logged In, Logging In, Logged In
      browserStatus: 'Closed', // Closed, Opening, Open
      universityName: UNIVERSITY_NAME,
      scrapingResults: [],
      alumniData: [], // Store detailed alumni data
      currentView: 'dashboard', // dashboard, results
      currentCsvFile: null, // Track current real-time CSV file
      currentCsvFileName: null, // Track CSV file name for DataTable
      csvFileStats: null, // CSV file statistics
      // Login steps state
      loginSteps: [
        { title: 'Checking Status', description: 'Verifying current authentication' },
        { title: 'Navigate Login', description: 'Opening LinkedIn login page' },
        { title: 'Authenticating', description: 'Processing login credentials' },
        { title: 'Complete', description: 'Successfully authenticated' }
      ],
      currentLoginStep: -1,
      showLoginSteps: false,
      loginError: false
    };

    // Initialize Socket.IO connection using singleton service
    this.componentId = 'main-app';
    this.setupSocketListeners();
  }

  componentDidMount() {
    // Start periodic login status check
    this.startPeriodicLoginCheck();
    
    // Start real-time browser monitoring
    this.startBrowserMonitoring();
    
    // Load initial configuration
    this.loadConfig();
    
    // Load CSV data for DataTable
    this.loadCsvData();
    
    // Start periodic CSV refresh for DataTable
    this.startCsvDataRefresh();
  }

  componentWillUnmount() {
    // Clean up socket listeners for this component
    socketService.removeListeners(this.componentId);
    
    // Clear periodic check
    this.stopPeriodicLoginCheck();
    
    // Clear browser monitoring
    this.stopBrowserMonitoring();
    
    // Clear CSV data refresh
    this.stopCsvDataRefresh();
  }

  startPeriodicLoginCheck = () => {
    // Check login status every 10 seconds when browser is open
    this.loginCheckInterval = setInterval(() => {
      if (this.state.browserStatus === 'Open' && this.state.loginStatus === 'Not Logged In') {
        this.checkLoginStatusSilently();
      }
    }, 10000); // Check every 10 seconds
  };

  stopPeriodicLoginCheck = () => {
    if (this.loginCheckInterval) {
      clearInterval(this.loginCheckInterval);
      this.loginCheckInterval = null;
    }
  };

  startBrowserMonitoring = () => {
    // Monitor browser info every 2 seconds for real-time updates
    this.browserMonitorInterval = setInterval(() => {
      this.fetchBrowserInfo();
    }, 2000); // Check every 2 seconds for responsive updates
  };

  stopBrowserMonitoring = () => {
    if (this.browserMonitorInterval) {
      clearInterval(this.browserMonitorInterval);
      this.browserMonitorInterval = null;
    }
  };

  startCsvDataRefresh = () => {
    // Refresh CSV data every 5 seconds for real-time updates
    this.csvRefreshInterval = setInterval(() => {
      this.loadCsvData();
    }, 5000); // Refresh every 5 seconds
  };

  stopCsvDataRefresh = () => {
    if (this.csvRefreshInterval) {
      clearInterval(this.csvRefreshInterval);
      this.csvRefreshInterval = null;
    }
  };

  loadCsvData = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/csv/current`);
      const result = await response.json();
      
      if (result.success) {
        this.setState({
          alumniData: result.data || [],
          currentCsvFileName: result.fileName,
          csvFileStats: result.fileStats
        });
      }
    } catch (error) {
      console.error('Error loading CSV data:', error);
    }
  };

  fetchBrowserInfo = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/browser/info`);
      const result = await response.json();
      
      if (result.success) {
        // Update state with latest browser info
        this.setState(prevState => ({
          ...prevState,
          browserStatus: result.browserActive ? 'Open' : 'Closed',
          currentPage: result.pageInfo.url || '',
          currentTab: {
            type: this.getPageTypeFromUrl(result.pageInfo.url),
            title: result.pageInfo.title || 'No page loaded',
            description: this.getPageDescriptionFromUrl(result.pageInfo.url),
            url: result.pageInfo.url || '',
            hostname: result.pageInfo.hostname || '',
            isLinkedIn: result.pageInfo.isLinkedIn || false
          }
        }));
      }
    } catch (error) {
      // Silently handle errors for real-time monitoring
      console.debug('Browser info fetch error:', error);
    }
  };

  getPageTypeFromUrl = (url) => {
    if (!url) return 'No page loaded';
    
    if (url.includes('linkedin.com/feed')) return 'LinkedIn Feed';
    if (url.includes('linkedin.com/login')) return 'Login Page';
    if (url.includes('linkedin.com/school')) return 'University Alumni';
    if (url.includes('linkedin.com/in/')) return 'Profile Page';
    if (url.includes('linkedin.com/search')) return 'Search Results';
    if (url.includes('linkedin.com')) return 'LinkedIn';
    if (url.startsWith('about:blank')) return 'Blank Page';
    return 'External Page';
  };

  getPageDescriptionFromUrl = (url) => {
    if (!url) return 'No page is currently loaded';
    
    if (url.includes('linkedin.com/feed')) return 'Main LinkedIn feed page';
    if (url.includes('linkedin.com/login')) return 'LinkedIn authentication page';
    if (url.includes('linkedin.com/school')) return 'Alumni directory page';
    if (url.includes('linkedin.com/in/')) return 'Individual LinkedIn profile';
    if (url.includes('linkedin.com/search')) return 'LinkedIn search results';
    if (url.includes('linkedin.com')) return 'LinkedIn platform page';
    if (url.startsWith('about:blank')) return 'Empty browser tab';
    return 'Non-LinkedIn website';
  };

  checkLoginStatusSilently = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/login/check`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      const result = await response.json();
      
      if (result.success && result.alreadyLoggedIn) {
        this.setState({ loginStatus: 'Logged In' });
        console.log('Periodic check: User is now logged in');
        this.showToast('success', 'Login Detected', 'LinkedIn login detected automatically');
      }
    } catch (error) {
      console.log('Periodic login check failed:', error);
    }
  };

  // Toast notification helper
  showToast = (variant, title, description) => {
    toast({
      variant: variant,
      title: title,
      description: description,
    });
  };

  setupSocketListeners = () => {
    socketService.on('connect', () => {
      console.log('Connected to backend via Socket.IO');
      this.setState({ backendConnected: true });
      this.showToast('success', 'Backend Connected', 'Successfully connected to server');
      // Load search names count when connected
      this.loadSearchNamesCount();
    }, this.componentId);

    socketService.on('disconnect', () => {
      console.log('Disconnected from backend');
      this.setState({ backendConnected: false });
      this.showToast('destructive', 'Backend Disconnected', 'Connection to server lost');
    }, this.componentId);

    socketService.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      this.setState({ backendConnected: false });
      this.showToast('destructive', 'Connection Error', 'Failed to connect to server');
    }, this.componentId);

    socketService.on('stateUpdate', (data) => {
      console.log('Received state update:', data);
      this.setState(prevState => ({
        ...prevState,
        browserStatus: data.browserOpen ? 'Open' : 'Closed',
        loginStatus: data.loggedIn ? 'Logged In' : 'Not Logged In',
        scrapingStatus: data.scrapingActive ? 'Running' : 'Idle',
        progress: data.progress || 0,
        scrapedCount: data.scrapedCount || 0,
        notFoundCount: data.notFoundCount || 0,
        foundCount: data.foundCount || 0,
        progressPercent: data.progressPercent || 0,
        lastScrapedName: data.lastScrapedName || '',
        currentCsvFile: data.currentCsvFile || data.finalCsvFile || prevState.currentCsvFile,
        isLoading: ['opening-browser', 'logging-in', 'navigating', 'scraping'].includes(data.status),
        isLoggingIn: data.status === 'logging-in' || data.status === 'checking-login',
        isNavigating: data.status === 'navigating',
        stats: {
          ...prevState.stats,
          totalProfiles: prevState.totalSearchNames // Use search names count
        }
      }));
      
      // Auto-detect login from LinkedIn feed access
      if (data.browserOpen && this.state.currentTab.isLinkedIn && this.state.currentTab.type === 'LinkedIn Feed') {
        console.log('Auto-detected login from LinkedIn feed access');
        this.setState(prevState => ({
          ...prevState,
          loginStatus: 'Logged In'
        }));
      }
    }, this.componentId);

    socketService.on('pageUpdate', (data) => {
      console.log('Page update:', data);
      const pageInfo = this.getPageInfo(data);
      
      this.setState({ 
        currentPage: data.url || data.currentPage || '',
        currentTab: pageInfo
      });
      
      // Auto-detect login status from page info
      if (pageInfo.isLinkedIn && (pageInfo.type === 'LinkedIn Feed' || pageInfo.type === 'Profile Page')) {
        console.log('Auto-detected LinkedIn access - updating login status');
        this.setState(prevState => ({
          ...prevState,
          loginStatus: 'Logged In'
        }));
      }
      
      // Show toast for significant page changes (not for real-time updates)
      if (data.tabChange && !data.realTimeUpdate) {
        if (pageInfo.type === 'LinkedIn Feed') {
          this.showToast('success', 'LinkedIn Access', 'Successfully accessed LinkedIn feed');
        } else if (pageInfo.type === 'University Alumni') {
          this.showToast('success', 'University Page', 'Successfully navigated to university alumni page');
        }
      }
    }, this.componentId);

    socketService.on('loginUpdate', (data) => {
      console.log('Login update:', data);
      this.setState({ 
        loginStatus: data.success ? 'Logged In' : 'Not Logged In',
        isLoggingIn: false,
        showLoginSteps: false,
        currentLoginStep: -1,
        loginError: !data.success
      });
      if (data.success) {
        this.showToast('success', 'Login Successful', 'Successfully logged into LinkedIn');
      } else if (!data.alreadyLoggedIn && data.showError !== false) {
        // Only show login failed toast if it's not an auto-check and showError is not explicitly false
        this.showToast('destructive', 'Login Failed', data.error || 'Failed to login to LinkedIn');
      }
    }, this.componentId);

    // New socket listener for login steps
    socketService.on('loginStep', (data) => {
      console.log('Login step:', data);
      this.setState({
        currentLoginStep: data.step,
        showLoginSteps: true,
        loginError: data.error || false
      });
      
      // Update the step description if provided
      if (data.title && data.step >= 0 && data.step < this.state.loginSteps.length) {
        const updatedSteps = [...this.state.loginSteps];
        updatedSteps[data.step] = {
          ...updatedSteps[data.step],
          title: data.title,
          description: data.description || updatedSteps[data.step].description
        };
        this.setState({ loginSteps: updatedSteps });
      }
      
      // Hide steps when login is completed successfully
      if (data.completed) {
        setTimeout(() => {
          this.setState({ 
            showLoginSteps: false,
            currentLoginStep: -1 
          });
        }, 2000); // Hide after 2 seconds
      }
    }, this.componentId);

    socketService.on('browserUpdate', (data) => {
      console.log('Browser update:', data);
      const browserStatus = data.status === 'opening' ? 'Opening' : 
                           data.status === 'open' ? 'Open' : 'Closed';
      
      this.setState({ 
        browserStatus: browserStatus,
        isLoading: data.status === 'opening',
        currentPage: data.currentPage || data.url || '',
        currentTab: this.getPageInfo(data)
      });

      // Show toast for browser events
      if (data.status === 'open') {
        this.showToast('success', 'Browser Opened', 'Chrome browser is now ready');
      } else if (data.status === 'closed') {
        this.showToast('info', 'Browser Closed', 'Chrome browser has been closed');
      }
    }, this.componentId);

    socketService.on('scrapingResult', (data) => {
      console.log('Scraping result:', data);
      this.setState(prevState => ({
        scrapingResults: [...prevState.scrapingResults, data]
        // Don't update alumniData here - let CSV refresh handle it
      }));
      
      // Trigger immediate CSV refresh to get updated data
      this.loadCsvData();
    }, this.componentId);

    // New tab monitoring socket listener
    socketService.on('tabUpdate', (data) => {
      console.log('Tab update received:', data);
      // Update the current tab info if needed (removed tabCount)
      this.setState(prevState => ({
        ...prevState,
        currentTab: {
          ...prevState.currentTab,
          timestamp: data.timestamp
        }
      }));
      
      // Don't show toast for real-time updates to avoid spam
      if (!data.realTimeUpdate) {
        console.log(`Tab update processed`);
      }
    }, this.componentId);
  }

  getPageInfo = (data) => {
    const url = data.url || data.currentPage || '';
    const title = data.title || '';
    
    // Extract meaningful page information
    let pageType = 'Unknown Page';
    let pageDescription = '';
    
    if (!url) {
      return {
        type: 'No page loaded',
        title: 'Blank Page',
        description: 'No page is currently loaded'
      };
    }
    
    if (url.includes('linkedin.com/feed')) {
      pageType = 'LinkedIn Feed';
      pageDescription = 'Main LinkedIn feed page';
    } else if (url.includes('linkedin.com/login')) {
      pageType = 'Login Page';
      pageDescription = 'LinkedIn authentication page';
    } else if (url.includes('linkedin.com/school')) {
      pageType = 'University Alumni';
      pageDescription = 'Alumni directory page';
    } else if (url.includes('linkedin.com/in/')) {
      pageType = 'Profile Page';
      pageDescription = 'Individual LinkedIn profile';
    } else if (url.includes('linkedin.com/search')) {
      pageType = 'Search Results';
      pageDescription = 'LinkedIn search results';
    } else if (url.includes('linkedin.com')) {
      pageType = 'LinkedIn';
      pageDescription = 'LinkedIn platform page';
    } else if (url.startsWith('about:blank')) {
      pageType = 'Blank Page';
      pageDescription = 'Empty browser tab';
    } else {
      pageType = 'External Page';
      pageDescription = 'Non-LinkedIn website';
    }
    
    return {
      type: pageType,
      title: title || pageType,
      description: pageDescription,
      url: url,
      hostname: data.hostname || '',
      isLinkedIn: data.isLinkedIn || url.includes('linkedin.com')
    };
  }

  loadConfig = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/config`);
      const config = await response.json();
      
      // Configuration is now loaded from environment variables
      // No need to update global variables
      
      this.setState({ 
        config: config,
        universityName: config.universityName
      });
      
      console.log('Configuration loaded from backend:', config);
    } catch (error) {
      console.error('Error loading configuration:', error);
      this.showToast('destructive', 'Config Error', 'Failed to load configuration from backend');
    }
  }

  loadSearchNamesCount = async () => {
    try {
      // Load config first if not already loaded
      if (!this.state.config.universityName || this.state.config.universityName === 'Your University') {
        await this.loadConfig();
      }
      
      const response = await fetch(`${API_BASE_URL}/api/search-names-count`);
      const result = await response.json();
      if (result.success) {
        this.setState({ 
          totalSearchNames: result.count,
          stats: {
            ...this.state.stats,
            totalProfiles: result.count
          }
        });
      }
    } catch (error) {
      console.error('Error loading search names count:', error);
      this.showToast('destructive', 'Data Loading Error', 'Failed to load search names count');
    }
  }

  handleOpenBrowser = async () => {
    this.setState({ isLoading: true, browserStatus: 'Opening' });
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/browser/open`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const result = await response.json();
      if (result.success) {
        this.setState({ browserStatus: 'Open' });
        this.showToast('success', 'Browser Opened', 'Chrome browser is now ready');
      } else {
        console.error('Failed to open browser:', result.message);
        this.showToast('destructive', 'Browser Error', 'Failed to open Chrome browser');
      }
    } catch (error) {
      console.error('Error opening browser:', error);
      this.showToast('destructive', 'Browser Error', 'Failed to open Chrome browser');
    } finally {
      this.setState({ isLoading: false });
    }
  }

  handleLogin = async () => {
    this.setState({ 
      isLoggingIn: true, 
      loginStatus: 'Checking Login...',
      showLoginSteps: true,
      currentLoginStep: 0,
      loginError: false
    });
    
    try {
      // First check if already logged in
      console.log('Checking current login status...');
      const checkResponse = await fetch(`${API_BASE_URL}/api/login/check`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const checkResult = await checkResponse.json();
      console.log('Login check result:', checkResult);
      
      if (checkResult.success && checkResult.loggedIn) {
        // Already logged in
        this.setState({ 
          loginStatus: 'Logged In',
          isLoggingIn: false,
          currentLoginStep: 3,
          showLoginSteps: true
        });
        this.showToast('info', 'Already Logged In', 'You are already logged in to LinkedIn');
        
        // Hide steps after delay
        setTimeout(() => {
          this.setState({ 
            showLoginSteps: false,
            currentLoginStep: -1 
          });
        }, 2000);
        return;
      }
      
      // Not logged in, proceed with login process
      console.log('Not logged in, starting login process...');
      this.setState({ 
        loginStatus: 'Logging In...',
        currentLoginStep: 1
      });
      
      const response = await fetch(`${API_BASE_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const result = await response.json();
      if (result.success) {
        this.setState({ 
          loginStatus: 'Logged In',
          currentLoginStep: 3
        });
        this.showToast('success', 'Login Successful', 'Successfully logged into LinkedIn');
        
        // Hide steps after delay
        setTimeout(() => {
          this.setState({ 
            showLoginSteps: false,
            currentLoginStep: -1 
          });
        }, 2000);
      } else {
        console.error('Login failed:', result.message);
        this.setState({ 
          loginStatus: 'Not Logged In',
          loginError: true
        });
        this.showToast('destructive', 'Login Failed', result.message || 'Failed to login to LinkedIn');
      }
    } catch (error) {
      console.error('Error during login process:', error);
      this.setState({ 
        loginStatus: 'Not Logged In',
        loginError: true
      });
      this.showToast('destructive', 'Login Error', 'Failed to login to LinkedIn');
    } finally {
      this.setState({ isLoggingIn: false });
    }
  }

  handleNavigateToProfile = async () => {
    console.log('Navigating to user profile...');
    this.setState({ isNavigating: true });
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/navigate-profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const result = await response.json();
      console.log('Profile navigation result:', result);
      
      if (result.success) {
        this.showToast('success', 'Navigation Successful', 'Navigated to your profile page');
      } else {
        console.error('Navigation failed:', result.message);
        this.showToast('destructive', 'Navigation Error', result.message || 'Failed to navigate to profile page');
      }
    } catch (error) {
      console.error('Error navigating to profile:', error);
      this.showToast('destructive', 'Navigation Error', 'Failed to navigate to profile page');
    } finally {
      this.setState({ isNavigating: false });
    }
  }

  handleNavigateToProfile = async () => {
    console.log('Navigating to user profile...');
    this.setState({ isNavigating: true });
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/navigate-profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const result = await response.json();
      console.log('Profile navigation result:', result);
      
      if (result.success) {
        this.showToast('success', 'Navigation Successful', 'Navigated to your profile');
      } else {
        console.error('Navigation failed:', result.message);
        this.showToast('destructive', 'Navigation Error', result.message || 'Failed to navigate to profile');
      }
    } catch (error) {
      console.error('Error navigating to profile:', error);
      this.showToast('destructive', 'Navigation Error', 'Failed to navigate to profile');
    } finally {
      this.setState({ isNavigating: false });
    }
  }

  handleNavigateToFeed = async () => {
    console.log('Navigating to LinkedIn feed...');
    this.setState({ isNavigating: true });
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/navigate-feed`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const result = await response.json();
      console.log('Feed navigation result:', result);
      
      if (result.success) {
        this.showToast('success', 'Navigation Successful', 'Navigated to LinkedIn feed');
      } else {
        console.error('Navigation failed:', result.message);
        this.showToast('destructive', 'Navigation Error', result.message || 'Failed to navigate to feed');
      }
    } catch (error) {
      console.error('Error navigating to feed:', error);
      this.showToast('destructive', 'Navigation Error', 'Failed to navigate to feed');
    } finally {
      this.setState({ isNavigating: false });
    }
  }

  handleNavigateUniversity = async () => {
    console.log('Navigating to university...');
    this.setState({ isNavigating: true });
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/navigate-university`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const result = await response.json();
      console.log('University navigation result:', result);
      
      if (result.success) {
        this.showToast('info', 'Navigation Successful', 'Navigated to university alumni page');
      } else {
        console.error('Navigation failed:', result.message);
        this.showToast('destructive', 'Navigation Error', result.message || 'Failed to navigate to university page');
      }
    } catch (error) {
      console.error('Error navigating to university:', error);
      this.showToast('destructive', 'Navigation Error', 'Failed to navigate to university page');
    } finally {
      this.setState({ isNavigating: false });
    }
  }

  handleStartScraping = async () => {
    console.log('Starting alumni-specific scraping with real-time CSV save...');
    this.setState({ isLoading: true, scrapingStatus: 'Running' });
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/scrape/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const result = await response.json();
      if (result.success) {
        console.log('Alumni scraping started:', result.message);
        this.setState({ currentCsvFile: result.csvFile });
        this.showToast('success', 'Real-time Alumni Scraping Started', 'University alumni directory search has begun with instant CSV save');
      } else {
        console.error('Failed to start scraping:', result.message);
        this.setState({ scrapingStatus: 'Idle' });
        this.showToast('destructive', 'Scraping Error', result.message || 'Failed to start data scraping');
      }
    } catch (error) {
      console.error('Error starting scraping:', error);
      this.setState({ scrapingStatus: 'Idle' });
      this.showToast('destructive', 'Scraping Error', 'Failed to start data scraping');
    } finally {
      this.setState({ isLoading: false });
    }
  }

  handlePauseScraping = async () => {
    console.log('Pausing scraping...');
    this.setState({ isLoading: true });
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/scrape/pause`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const result = await response.json();
      if (result.success) {
        this.setState({ scrapingStatus: 'Paused' });
        console.log('Scraping paused:', result.message);
        this.showToast('warning', 'Scraping Paused', 'Data scraping has been paused');
      } else {
        console.error('Failed to pause scraping:', result.message);
        this.showToast('destructive', 'Pause Error', result.message || 'Failed to pause data scraping');
      }
    } catch (error) {
      console.error('Error pausing scraping:', error);
      this.showToast('destructive', 'Pause Error', 'Failed to pause data scraping');
    } finally {
      this.setState({ isLoading: false });
    }
  }

  handleResetSession = async () => {
    console.log('Resetting session...');
    this.setState({ isLoading: true });
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/scrape/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const result = await response.json();
      if (result.success) {
        this.setState({ 
          scrapingStatus: 'Idle', 
          progress: 0,
          progressPercent: 0,
          scrapedCount: 0,
          notFoundCount: 0,
          foundCount: 0,
          lastScrapedName: '',
          currentCsvFile: null,
          scrapingResults: []
        });
        
        // Reload CSV data after reset
        this.loadCsvData();
        console.log('Session reset:', result.message);
        this.showToast('info', 'Session Reset', 'Data scraping has been reset');
      } else {
        console.error('Failed to reset session:', result.message);
        this.showToast('destructive', 'Reset Error', result.message || 'Failed to reset session');
      }
    } catch (error) {
      console.error('Error resetting session:', error);
      this.showToast('destructive', 'Reset Error', 'Failed to reset session');
    } finally {
      this.setState({ isLoading: false });
    }
  }

  handleExportData = async () => {
    console.log('Exporting data...');
    try {
      const response = await fetch(`${API_BASE_URL}/api/download/results`);
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'linkedin_alumni_results.csv';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        this.showToast('success', 'Export Successful', 'Results file has been downloaded');
      } else {
        throw new Error('Failed to export data');
      }
    } catch (error) {
      console.error('Error exporting data:', error);
      this.showToast('destructive', 'Export Error', 'Failed to export results file');
    }
  }

  render() {
    const { stats, scrapingStatus, progress } = this.state;

    return (
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <div className="min-h-screen bg-background">
          {/* Header */}
          <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
            <div className="container flex h-16 items-center space-x-4 sm:justify-between sm:space-x-0">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                    <span className="text-primary-foreground font-bold text-sm">LS</span>
                  </div>
                  <div className="hidden sm:block">
                    <h1 className="text-lg font-semibold">{APP_NAME}</h1>
                    <p className="text-xs text-muted-foreground">Alumni Management Dashboard</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <ThemeToggle />
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="container mx-auto p-6">
            <div className="space-y-6">
              {/* Page Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                  <p className="text-muted-foreground">
                    Monitor your LinkedIn scraping activities and manage data for {this.state.universityName}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <StatusIndicator 
                    connected={this.state.backendConnected}
                    connectedText="Backend Connected"
                    disconnectedText="Backend Disconnected"
                  />
                </div>
              </div>

              {/* Statistics Cards */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Names</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{this.state.totalSearchNames.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">
                      From search_names.csv
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Found</CardTitle>
                    <UserCheck className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">{this.state.foundCount.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">
                      Alumni profiles found
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Not Found</CardTitle>
                    <UserX className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">{this.state.notFoundCount.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">
                      Names not found on LinkedIn
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Scraped</CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">{this.state.scrapedCount.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">
                      Total processed profiles
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Progress</CardTitle>
                    <Database className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{this.state.progressPercent.toFixed(1)}%</div>
                    <p className="text-xs text-muted-foreground">
                      {this.state.lastScrapedName || 'Ready to start'}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Progress and Controls */}
              <div className="space-y-6">
              {/* Browser Controller */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Chrome className="h-5 w-5" />
                      Browser Controller
                    </CardTitle>
                    <CardDescription>
                      Manage browser and LinkedIn login for {this.state.universityName}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center justify-between">
                        <span>Browser Status</span>
                        <Badge variant={this.state.browserStatus === 'Open' ? 'default' : 'secondary'}>
                          {this.state.browserStatus}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Login Status</span>
                        <Badge variant={this.state.loginStatus === 'Logged In' ? 'default' : 'secondary'}>
                          {this.state.isLoggingIn ? (
                            <div className="flex items-center">
                              <LoadingInline size="xs" variant="secondary" className="mr-1" />
                              {this.state.loginStatus}
                            </div>
                          ) : (
                            this.state.loginStatus
                          )}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between col-span-2">
                        <span>Current Page</span>
                        <div className="text-right">
                          {this.state.isNavigating ? (
                            <div className="flex items-center text-xs">
                              <LoadingInline size="xs" variant="secondary" className="mr-1" />
                              Navigating...
                            </div>
                          ) : (
                            <div className="text-xs">
                              <Badge variant={this.state.currentTab.isLinkedIn ? 'default' : 'secondary'} className="text-xs">
                                {this.state.currentTab.type}
                              </Badge>
                              {/* Real-time monitoring indicator */}
                              <div className="inline-flex items-center ml-2">
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                <span className="text-xs text-green-600 ml-1">Live</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Simplified Current Page Information with Real-time indicator */}
                    {this.state.currentPage && (
                      <div className="text-xs text-muted-foreground p-2 bg-muted/50 rounded border">
                        <div className="font-mono break-all">
                          {this.state.currentPage}
                        </div>
                        <div className="flex items-center mt-1 text-green-600">
                          <div className="w-1 h-1 bg-green-500 rounded-full animate-ping mr-1"></div>
                          <span className="text-xs">Real-time monitoring active</span>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant={this.state.browserStatus === 'Open' ? 'secondary' : 'default'}
                        onClick={this.handleOpenBrowser}
                        disabled={this.state.isLoading || this.state.browserStatus === 'Open'}
                        className="bg-blue-600 hover:bg-blue-700 text-white border-0"
                      >
                        <Chrome className="h-4 w-4 mr-1" />
                        {this.state.browserStatus === 'Opening' ? 'Opening...' : 'Open Browser'}
                      </Button>
                      
                      {/* Login Button - Show when browser open and not logged in */}
                      {this.state.browserStatus === 'Open' && 
                       this.state.loginStatus === 'Not Logged In' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={this.handleLogin}
                          disabled={this.state.isLoggingIn}
                          className="border-green-600 text-green-600 hover:bg-green-600 hover:text-white"
                        >
                          {this.state.isLoggingIn ? (
                            <>
                              <LoadingInline size="xs" variant="success" className="mr-2" />
                              {this.state.loginStatus === 'Checking Login...' ? 'Checking...' : 'Logging in...'}
                            </>
                          ) : (
                            <>
                              <LogIn className="h-4 w-4 mr-1" />
                              Login to LinkedIn
                            </>
                          )}
                        </Button>
                      )}
                      
                      {/* Navigate University Button - Show only when on LinkedIn Feed specifically */}
                      {this.state.browserStatus === 'Open' && 
                       this.state.currentTab.type === 'LinkedIn Feed' && 
                       this.state.currentTab.url.includes('/feed') && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={this.handleNavigateUniversity}
                          disabled={this.state.isNavigating}
                          className="bg-purple-600 hover:bg-purple-700 text-white border-0"
                        >
                          {this.state.isNavigating ? (
                            <>
                              <LoadingInline size="xs" variant="white" className="mr-2" />
                              Navigating...
                            </>
                          ) : (
                            <>
                              <GraduationCap className="h-4 w-4 mr-1" />
                              Navigate to University
                            </>
                          )}
                        </Button>
                      )}

                      {/* Navigate to Feed Button - Show when logged in and not on feed */}
                      {this.state.browserStatus === 'Open' && 
                       this.state.loginStatus === 'Logged In' && 
                       !this.state.currentTab.url.includes('/feed') && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={this.handleNavigateToFeed}
                          disabled={this.state.isNavigating}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white border-0"
                        >
                          {this.state.isNavigating ? (
                            <>
                              <LoadingInline size="xs" variant="white" className="mr-2" />
                              Navigating...
                            </>
                          ) : (
                            <>
                              <Home className="h-4 w-4 mr-1" />
                              LinkedIn Feed
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                    
                    {/* Login Steps Indicator */}
                    {this.state.showLoginSteps && (
                      <div className="mt-4 p-3 bg-muted/20 rounded-md border">
                        <LoginSteps 
                          currentStep={this.state.currentLoginStep}
                          steps={this.state.loginSteps}
                          isError={this.state.loginError}
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Scraping Controller */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5" />
                      Scraping Controller
                    </CardTitle>
                    <CardDescription>
                      Start, pause, or resume scraping process
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Progress</span>
                        <span>{this.state.progressPercent.toFixed(1)}% ({this.state.scrapedCount}/{this.state.totalSearchNames})</span>
                      </div>
                      <Progress value={this.state.progressPercent} className="w-full" />
                      {this.state.lastScrapedName && (
                        <div className="text-xs text-muted-foreground">
                          Last processed: {this.state.lastScrapedName}
                        </div>
                      )}
                      {this.state.currentCsvFile && this.state.scrapingStatus === 'Running' && (
                        <div className="text-xs text-green-600 dark:text-green-400 flex items-center">
                          <LoadingDots size="sm" variant="success" className="mr-2" />
                          Real-time save: {this.state.currentCsvFile.split('/').pop() || this.state.currentCsvFile}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        onClick={this.handleStartScraping}
                        disabled={this.state.scrapingStatus === 'Running' || this.state.loginStatus !== 'Logged In'}
                        className="bg-green-600 hover:bg-green-700 text-white border-0"
                      >
                        {this.state.scrapingStatus === 'Running' ? (
                          <>
                            <LoadingDots size="sm" variant="white" className="mr-2" />
                            Running Alumni Search
                          </>
                        ) : (
                          <>
                            <Play className="h-4 w-4 mr-1" />
                            {this.state.scrapingStatus === 'Paused' ? 'Resume Alumni Search' : 'Start Alumni Search'}
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={this.handlePauseScraping}
                        disabled={this.state.scrapingStatus !== 'Running'}
                        className="border-yellow-600 text-yellow-600 hover:bg-yellow-600 hover:text-white"
                      >
                        <Pause className="h-4 w-4 mr-1" />
                        Pause
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={this.handleResetSession}
                        disabled={this.state.scrapingStatus === 'Running'}
                        className="border-red-600 text-red-600 hover:bg-red-600 hover:text-white"
                      >
                        <RotateCcw className="h-4 w-4 mr-1" />
                        Reset
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Results DataTable - CSV Source */}
                <AlumniDataTable 
                  data={this.state.alumniData}
                  title="Alumni Scraping Results"
                  isLoading={false}
                />
                </div>
              
              {/* Remove Alumni Results View section since we no longer have view switching */}
            </div>
          </main>
          
          {/* Toast Notifications */}
          <Toaster />
        </div>
      </ThemeProvider>
    );
  }
}

export default App;
