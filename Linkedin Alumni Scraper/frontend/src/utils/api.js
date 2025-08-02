/**
 * API Configuration and Utilities
 * Centralized API configuration to handle backend communication
 */

// Get Flask port from environment, fallback to 5000
const FLASK_PORT = import.meta.env.VITE_FLASK_PORT || '5000'

// API Base URL - use dynamic port from environment
const API_BASE_URL = `http://127.0.0.1:${FLASK_PORT}/api`

/**
 * Make API request with proper error handling
 * @param {string} endpoint - API endpoint (without /api prefix)
 * @param {object} options - Fetch options
 * @returns {Promise} - API response
 */
export const apiRequest = async (endpoint, options = {}) => {
  const url = endpoint.startsWith('/api') ? endpoint : `${API_BASE_URL}${endpoint}`
  
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    timeout: 10000, // 10 second timeout
    ...options
  }

  try {
    // Create AbortController for timeout
    const controller = new AbortController()
    
    // Set up timeout with proper cleanup
    const timeoutId = setTimeout(() => {
      controller.abort('Request timeout')
    }, 15000) // Increased timeout to 15 seconds for browser operations
    
    const response = await fetch(url, {
      ...defaultOptions,
      signal: controller.signal
    })
    
    // Clear timeout on successful response
    clearTimeout(timeoutId)
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`)
    }
    
    const jsonData = await response.json()
    return jsonData
  } catch (error) {
    console.error(`[API] Error for ${url}:`, error)
    console.error(`[API] Error type:`, error.constructor.name)
    console.error(`[API] Error message:`, error.message)
    
    // Handle specific error types with safe message checking
    if (error.name === 'AbortError') {
      throw new Error('Request timeout - Server took too long to respond')
    } else if (error.message && error.message.includes('Failed to fetch')) {
      throw new Error('Cannot connect to backend - Check if backend is running on port 5000')
    } else if (error.message && error.message.includes('NetworkError')) {
      throw new Error('Network error - Check your internet connection')
    } else if (!error.message) {
      // Handle cases where error.message is undefined
      throw new Error('Unknown network error occurred')
    }
    
    throw error
  }
}

/**
 * Retry mechanism for critical API operations
 * @param {Function} apiCall - The API call function to retry
 * @param {number} maxRetries - Maximum number of retries (default: 2)
 * @param {number} delay - Delay between retries in ms (default: 1000)
 * @returns {Promise} - API response or throws final error
 */
export const apiRetry = async (apiCall, maxRetries = 2, delay = 1000) => {
  let lastError
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await apiCall()
    } catch (error) {
      lastError = error
      
      // Don't retry on certain errors
      if (error.message && (
        error.message.includes('Cannot connect to backend') ||
        error.message.includes('Network error')
      )) {
        throw error
      }
      
      // If this is the last attempt, throw the error
      if (attempt === maxRetries) {
        throw error
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  
  throw lastError
}

/**
 * API endpoints - Updated to use original endpoints
 */
export const API_ENDPOINTS = {
  // System info (includes university info)
  SYSTEM_INFO: '/system/info',
  
  // Status endpoints
  SCRAPER_STATUS: '/scraper/status',
  BROWSER_STATUS: '/browser/status',
  AUTH_STATUS: '/auth/status',
  HEALTH: '/system/health',
  
  // Authentication operations
  AUTO_LOGIN: '/auth/auto-login',
  MANUAL_LOGIN: '/auth/manual-login',
  LOGIN_PAGE: '/auth/login-page',
  
  // Scraping operations
  START_SCRAPING: '/scraper/start',
  STOP_SCRAPING: '/scraper/stop',
  
  // Browser operations
  OPEN_BROWSER: '/browser/open',
  CLOSE_BROWSER: '/browser/close',
  
  // Data endpoints
  RESULTS: '/data/results',
  DOWNLOAD: '/data/download',
  STATS: '/data/stats'
}

/**
 * API helper functions - Updated to use original endpoints
 */
export const api = {
  // Direct API request function
  apiRequest: apiRequest,
  
  // Get system information (includes university info)
  getSystemInfo: () => apiRequest(API_ENDPOINTS.SYSTEM_INFO),
  
  // Backward compatibility - alias for getSystemInfo
  getUniversityInfo: () => apiRequest(API_ENDPOINTS.SYSTEM_INFO),
  
  // Get scraping status
  getScrapingStatus: () => apiRequest(API_ENDPOINTS.SCRAPER_STATUS),
  
  // Get browser status
  getBrowserStatus: () => apiRequest(API_ENDPOINTS.BROWSER_STATUS),
  
  // Check authentication status
  checkAuthStatus: () => apiRequest(API_ENDPOINTS.AUTH_STATUS),
  
  // Health check
  getHealth: () => apiRequest(API_ENDPOINTS.HEALTH),
  
  // Auto login
  autoLogin: () => apiRequest(API_ENDPOINTS.AUTO_LOGIN, {
    method: 'POST'
  }),
  
  // Manual login (opens LinkedIn in browser)
  manualLogin: () => apiRequest(API_ENDPOINTS.MANUAL_LOGIN, {
    method: 'POST'
  }),
  
  // Open LinkedIn login page
  openLinkedInLogin: () => apiRequest(API_ENDPOINTS.LOGIN_PAGE, {
    method: 'POST'
  }),
  
  // Start scraping
  startScraping: (data) => apiRequest(API_ENDPOINTS.START_SCRAPING, {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  
  // Stop scraping
  stopScraping: () => apiRequest(API_ENDPOINTS.STOP_SCRAPING, {
    method: 'POST'
  }),
  
  // Open browser
  openBrowser: () => apiRequest(API_ENDPOINTS.OPEN_BROWSER, {
    method: 'POST'
  }),
  
  // Close browser
  closeBrowser: () => apiRequest(API_ENDPOINTS.CLOSE_BROWSER, {
    method: 'POST'
  }),
  
  // Get results
  getResults: () => apiRequest(API_ENDPOINTS.RESULTS),
  
  // Get statistics
  getStats: () => apiRequest(API_ENDPOINTS.STATS),
  
  // Download file
  downloadFile: (filename) => {
    const url = `${API_BASE_URL}${API_ENDPOINTS.DOWNLOAD}/${filename}`
    window.open(url, '_blank')
  }
}

export default api
