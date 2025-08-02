/**
 * API Configuration and Utilities
 * Centralized API configuration to handle backend communication
 */

// API Base URL - uses proxy in development, direct URL in production
const API_BASE_URL = import.meta.env.DEV ? '/api' : 'http://127.0.0.1:5000/api'

/**
 * Make API request with proper error handling
 * @param {string} endpoint - API endpoint (without /api prefix)
 * @param {object} options - Fetch options
 * @returns {Promise} - API response
 */
export const apiRequest = async (endpoint, options = {}) => {
  const url = endpoint.startsWith('/api') ? endpoint : `${API_BASE_URL}${endpoint}`
  
  console.log(`[API] Making request to: ${url}`)
  console.log(`[API] Base URL: ${API_BASE_URL}`)
  console.log(`[API] DEV mode: ${import.meta.env.DEV}`)
  
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    timeout: 10000, // 10 second timeout
    ...options
  }

  try {
    console.log(`[API] Sending request with options:`, defaultOptions)
    
    // Add timeout using AbortController
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)
    
    const response = await fetch(url, {
      ...defaultOptions,
      signal: controller.signal
    })
    
    clearTimeout(timeoutId)
    
    console.log(`[API] Response status: ${response.status}`)
    console.log(`[API] Response ok: ${response.ok}`)
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`)
    }
    
    const jsonData = await response.json()
    console.log(`[API] Response data:`, jsonData)
    return jsonData
  } catch (error) {
    console.error(`[API] Error for ${url}:`, error)
    console.error(`[API] Error type:`, error.constructor.name)
    console.error(`[API] Error message:`, error.message)
    
    // Provide more specific error messages
    if (error.name === 'AbortError') {
      throw new Error('Request timeout - Backend may not be ready')
    } else if (error.message.includes('Failed to fetch')) {
      throw new Error('Cannot connect to backend - Check if backend is running on port 5000')
    }
    
    throw error
  }
}

/**
 * API endpoints
 */
export const API_ENDPOINTS = {
  // University info
  UNIVERSITY_INFO: '/university-info',
  
  // Status and stats
  STATUS: '/scraping-status',
  STATS: '/stats',
  HEALTH: '/health',
  CHECK_LOGIN_STATUS: '/check-login-status',
  
  // Login operations
  AUTO_LOGIN: '/auto-login',
  MANUAL_LOGIN: '/manual-login',
  
  // Scraping operations
  START_SCRAPING: '/start-scraping',
  STOP_SCRAPING: '/stop-scraping',
  
  // Results
  RESULTS: '/results',
  DOWNLOAD: '/download'
}

/**
 * API helper functions
 */
export const api = {
  // Direct API request function
  apiRequest: apiRequest,
  
  // Get university information
  getUniversityInfo: () => apiRequest(API_ENDPOINTS.UNIVERSITY_INFO),
  
  // Get scraping status
  getStatus: () => apiRequest(API_ENDPOINTS.STATUS),
  
  // Get statistics
  getStats: () => apiRequest(API_ENDPOINTS.STATS),
  
  // Health check
  getHealth: () => apiRequest(API_ENDPOINTS.HEALTH),
  
  // Check login status
  checkLoginStatus: () => apiRequest(API_ENDPOINTS.CHECK_LOGIN_STATUS),
  
  // Auto login
  autoLogin: () => apiRequest(API_ENDPOINTS.AUTO_LOGIN, {
    method: 'POST'
  }),
  
  // Manual login (opens LinkedIn in browser)
  manualLogin: () => apiRequest(API_ENDPOINTS.MANUAL_LOGIN, {
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
  
  // Get results
  getResults: () => apiRequest(API_ENDPOINTS.RESULTS),
  
  // Download file
  downloadFile: (filename) => {
    const url = `${API_BASE_URL}${API_ENDPOINTS.DOWNLOAD}/${filename}`
    window.open(url, '_blank')
  }
}

export default api
