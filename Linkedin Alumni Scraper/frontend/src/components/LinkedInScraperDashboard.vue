<template>
  <div class="min-h-screen bg-background">
    <!-- Header -->
    <header class="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div class="container mx-auto flex h-16 items-center justify-between px-4">
        <div class="flex items-center space-x-4">
          <!-- Logo -->
          <div class="flex items-center space-x-3">
            <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white">
              <svg class="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
            </div>
            <div>
              <h1 class="text-xl font-bold">LinkedIn Alumni Scraper</h1>
              <p class="text-sm text-foreground/90 font-semibold">{{ universityName }}</p>
            </div>
          </div>
        </div>

        <div class="flex items-center space-x-4">
          <!-- Backend Connection Status -->
          <Badge 
            :class="[
              'flex items-center space-x-1 font-medium',
              backendConnected ? 'badge-connected' : 'badge-disconnected'
            ]"
          >
            <div 
              :class="[
                'h-2 w-2 rounded-full bg-white'
              ]"
            />
            <span class="font-medium">{{ backendConnected ? 'Backend Connected' : 'Backend Disconnected' }}</span>
          </Badge>

          <!-- LinkedIn Login Status -->
          <Badge 
            v-if="backendConnected"
            :class="[
              'flex items-center space-x-1 font-medium',
              loginStatus.logged_in ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100' : 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100'
            ]"
          >
            <div 
              :class="[
                'h-2 w-2 rounded-full',
                loginStatus.logged_in ? 'bg-green-600' : 'bg-orange-600'
              ]"
            />
            <span class="font-medium">{{ loginStatus.logged_in ? 'LinkedIn Connected' : 'Not Logged In' }}</span>
          </Badge>

          <ThemeToggle />
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="container mx-auto px-4 py-8 space-y-6">
      <!-- Stats Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <!-- Total Names Card -->
        <Card>
          <CardContent class="p-6">
            <div class="flex items-center">
              <div class="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900">
                <svg class="h-6 w-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
                </svg>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-muted-foreground">Total Names</p>
                <p class="text-2xl font-bold">{{ stats.total_names || 0 }}</p>
                <p class="text-xs text-muted-foreground mt-1">Ready to scrape</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <!-- Scraped Count Card -->
        <Card>
          <CardContent class="p-6">
            <div class="flex items-center">
              <div class="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900">
                <svg class="h-6 w-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-muted-foreground">Completed</p>
                <p class="text-2xl font-bold">{{ stats.scraped_count || 0 }}</p>
                <p class="text-xs text-muted-foreground mt-1">Profiles scraped</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <!-- Progress Card -->
        <Card>
          <CardContent class="p-6">
            <div class="flex items-center">
              <div class="flex h-12 w-12 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900">
                <svg class="h-6 w-6 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
                </svg>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-muted-foreground">Progress</p>
                <p class="text-2xl font-bold">{{ progressPercentage }}%</p>
                <div class="w-full bg-secondary rounded-full h-2 mt-2">
                  <div 
                    class="bg-orange-600 h-2 rounded-full transition-all duration-300"
                    :style="{ width: progressPercentage + '%' }"
                  ></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <!-- Status Card -->
        <Card>
          <CardContent class="p-6">
            <div class="flex items-center">
              <div :class="[
                'flex h-12 w-12 items-center justify-center rounded-lg',
                scrapingStatus.is_running 
                  ? 'bg-green-100 dark:bg-green-900' 
                  : 'bg-gray-100 dark:bg-gray-900'
              ]">
                <svg 
                  :class="[
                    'h-6 w-6',
                    scrapingStatus.is_running 
                      ? 'text-green-600 dark:text-green-400 animate-pulse' 
                      : 'text-gray-600 dark:text-gray-400'
                  ]"
                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path v-if="scrapingStatus.is_running" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h8m-5-5.5a3 3 0 11-6 0 3 3 0 016 0z"/>
                  <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-muted-foreground">Status</p>
                <p class="text-2xl font-bold">
                  {{ scrapingStatus.is_running ? 'Running' : 'Idle' }}
                </p>
                <Badge 
                  :variant="scrapingStatus.is_running ? 'default' : 'secondary'"
                  class="mt-1"
                >
                  {{ scrapingStatus.is_running ? 'Active' : 'Stopped' }}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <!-- Browser Control Section -->
      <Card>
        <CardHeader>
          <CardTitle class="flex items-center space-x-2">
            <svg class="h-5 w-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
            </svg>
            <span>Browser Control</span>
            <Badge 
              :class="[
                'ml-2 text-xs',
                browserStatus.is_alive ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
              ]"
            >
              {{ browserStatus.is_alive ? 'Active' : 'Inactive' }}
            </Badge>
          </CardTitle>
          <CardDescription>
            Control browser session and navigate to LinkedIn manually when needed.
          </CardDescription>
        </CardHeader>
        <CardContent class="space-y-4">
          <!-- Browser Status Display -->
          <div class="bg-muted/50 p-4 rounded-lg">
            <div class="flex items-center space-x-3">
              <div class="flex-shrink-0">
                <svg 
                  :class="[
                    'h-8 w-8',
                    browserStatus.is_alive ? 'text-green-600' : 'text-gray-400'
                  ]" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                </svg>
              </div>
              <div class="flex-grow">
                <div class="flex items-center justify-between">
                  <h4 class="font-medium text-sm">Browser Status</h4>
                  <div class="flex items-center space-x-2">
                    <div 
                      :class="[
                        'w-2 h-2 rounded-full',
                        browserStatus.is_alive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
                      ]"
                    ></div>
                    <span class="text-xs text-muted-foreground">
                      {{ browserStatus.is_alive ? 'Running' : 'Stopped' }}
                    </span>
                  </div>
                </div>
                <div class="mt-1 text-xs text-muted-foreground">
                  <span>Status: {{ browserStatus.is_open ? 'Open' : 'Closed' }}</span>
                  <span class="mx-2">•</span>
                  <span>Process: {{ browserStatus.is_alive ? 'Active' : 'Inactive' }}</span>
                  <span class="mx-2">•</span>
                  <span>Login: {{ loginStatus.logged_in ? 'Connected' : 'Not logged in' }}</span>
                </div>
                <div v-if="browserStatus.current_url" class="mt-1 text-xs text-muted-foreground">
                  📍 {{ browserStatus.current_url }}
                </div>
              </div>
            </div>
          </div>
          
          <!-- Browser Control Button -->
          <div class="flex justify-center">
            <Button 
              @click="openBrowser"
              :disabled="loading.browser"
              variant="outline"
              size="sm"
              class="w-48"
            >
              <svg v-if="loading.browser" class="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 0 1 4 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
              </svg>
              <svg v-else class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
              </svg>
              {{ browserStatus.is_alive ? 'Browser Running' : 'Open Browser' }}
            </Button>
          </div>
        </CardContent>
      </Card>

      <!-- Login Section Component -->
      <LoginSection 
        :login-status="loginStatus"
        :loading="loading"
        :browser-manually-closed="browserManuallyClosed"
        :login-progress="loginProgress"
        @perform-manual-login="performManualLogin"
        @manual-check-login="manualCheckLogin"
      />

      <!-- Scraping Control Component -->
      <ScrapingControl 
        :login-status="loginStatus"
        :loading="loading"
        :browser-manually-closed="browserManuallyClosed"
        :scraping-config="scrapingConfig"
        @auto-detect-classes="autoDetectClasses"
        @start-scraping="startScraping"
      />

      <!-- Progress Display Component -->
      <ProgressDisplay 
        :scraping-status="scrapingStatus"
        :stats="stats"
      />

      <!-- Results Table Component -->
      <ResultsTable 
        :results="results"
        :search-query="searchQuery"
        :current-page="currentPage"
        :results-per-page="resultsPerPage"
        @refresh-results="refreshResults"
        @download-results="downloadResults"
        @update-search-query="updateSearchQuery"
        @update-current-page="updateCurrentPage"
      />
    </main>
    
    <!-- Toast Container -->
    <ToastContainer />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import ThemeToggle from '@/components/ThemeToggle.vue'
import LoginSection from '@/components/LoginSection.vue'
import ScrapingControl from '@/components/ScrapingControl.vue'
import ProgressDisplay from '@/components/ProgressDisplay.vue'
import ResultsTable from '@/components/ResultsTable.vue'
import ToastContainer from '@/components/ToastContainer.vue'
import { api, apiRetry } from '@/utils/api'
import { useToast } from '@/composables/useToast'

// Toast management
const toast = useToast()

// State Management
const backendConnected = ref(false)

const loginStatus = ref({
  logged_in: false,
  university: '',
  linkedin_url: ''
})

const scrapingStatus = ref({
  is_running: false,
  current_name: '',
  current_index: 0
})

const stats = ref({
  total_names: 0,
  scraped_count: 0,
  last_scraped: ''
})

const results = ref([])
const universityInfo = ref(null)
const searchQuery = ref('')
const currentPage = ref(1)
const resultsPerPage = 10

const loading = ref({
  login: false,
  cssDetection: false,
  scraping: false,
  manualCheck: false,
  browser: false
})

const browserStatus = ref({
  is_open: false,
  is_alive: false,
  current_url: null,
  status: 'Browser status unknown'
})

const browserManuallyClosed = ref(false)

const loginProgress = ref({
  step: 0,
  message: 'Initializing...'
})

const scrapingConfig = ref({
  location_class: '',
  section_class: '',
  max_profiles: 50
})

// Computed Properties
const universityName = computed(() => {
  return universityInfo.value?.name || 'Loading University...'
})

const progressPercentage = computed(() => {
  if (!stats.value.total_names) return 0
  return Math.round((scrapingStatus.value.current_index / stats.value.total_names) * 100)
})

// Auto-update system
let updateInterval = null

const startAutoUpdate = () => {
  if (updateInterval) return
  
  updateInterval = setInterval(async () => {
    try {
      // Skip updates if any critical process is running to avoid interference
      if (loading.value.browser || loading.value.login || loading.value.scraping) {
        return
      }
      
      // Fetch status updates in order of importance
      await fetchBrowserStatus()
      await fetchLoginStatus()
      
      // Only fetch heavy operations if not actively scraping
      if (!scrapingStatus.value.is_running) {
        await fetchStats()
        await fetchResults()
      }
      
      // University info is rarely changed, fetch less frequently
      if (Math.random() < 0.1) { // ~10% chance each cycle
        await fetchUniversityInfo()
      }
      
    } catch (error) {
      console.error('[ERROR] Auto-update failed:', error)
      // Continue polling even if one update fails
    }
  }, 15000) // Faster polling for better UX (15 seconds instead of 30)
}

const stopAutoUpdate = () => {
  if (updateInterval) {
    clearInterval(updateInterval)
    updateInterval = null
  }
}

// API Methods
const apiCallWithStatus = async (apiCall) => {
  try {
    const result = await apiCall()
    backendConnected.value = true
    return result
  } catch (error) {
    backendConnected.value = false
    throw error
  }
}

const fetchBrowserStatus = async () => {
  try {
    const data = await apiCallWithStatus(() => api.getBrowserStatus())
    if (data.success) {
      const previousStatus = browserStatus.value.is_alive
      browserStatus.value = data.data
      
      // Detect browser close and set manual close flag
      if (previousStatus && !browserStatus.value.is_alive && !loading.value.browser) {
        browserManuallyClosed.value = true
        toast.warning('Browser Closed', 'Browser was closed. Open manually when ready to continue.')
      }
    }
  } catch (error) {
    console.error('Error fetching browser status:', error)
    browserStatus.value = {
      is_open: false,
      is_alive: false,
      current_url: null,
      status: 'Error checking browser status'
    }
  }
}

const fetchLoginStatus = async () => {
  try {
    const data = await api.checkAuthStatus()
    if (data.success && data.data) {
      loginStatus.value.logged_in = data.data.logged_in
    }
  } catch (error) {
    console.error('Error checking login status:', error)
    loginStatus.value.logged_in = false
  }
}

const fetchStats = async () => {
  try {
    const data = await apiCallWithStatus(() => api.getStats())
    if (data.success && data.data) {
      stats.value = data.data
      if (data.data.current_index !== undefined) {
        scrapingStatus.value.current_index = data.data.current_index
      }
    }
  } catch (error) {
    console.error('Error fetching stats:', error)
  }
}

const fetchResults = async () => {
  try {
    const data = await api.getResults()
    results.value = data.data || data.results || []
  } catch (error) {
    console.error('Error fetching results:', error)
  }
}

const fetchUniversityInfo = async () => {
  try {
    const data = await apiCallWithStatus(() => api.getSystemInfo())
    
    if (data && data.success && data.data) {
      universityInfo.value = data.data
    } else {
      universityInfo.value = {
        name: 'Error loading university',
        email: 'Backend connection failed',
        total_names: 0
      }
    }
  } catch (error) {
    console.error('[ERROR] Error fetching university info:', error)
    
    universityInfo.value = {
      name: 'Backend Connection Failed',
      email: 'Check if backend is running on the configured port',
      total_names: 0
    }
  }
}

const openBrowser = async () => {
  if (loading.value.browser) return
  
  loading.value.browser = true
  try {
    const data = await apiRetry(() => api.openBrowser(), 2, 2000)
    if (data.success) {
      // Show success toast when browser opens
      toast.success('Browser Opened', 'LinkedIn browser has been opened successfully!')
      browserManuallyClosed.value = false // Reset manual close flag
    } else {
      toast.error('Failed to Open Browser', data.message || 'Failed to open browser')
    }
  } catch (error) {
    console.error('Error opening browser:', error)
    if (error.message && error.message.includes('timeout')) {
      toast.error('Browser Opening Timeout', 'Please check if backend is running.')
    } else if (error.message && error.message.includes('Cannot connect to backend')) {
      toast.error('Backend Connection Failed', 'Please make sure the backend server is running.')
    } else {
      toast.error('Browser Opening Error', error.message || 'Unknown error occurred')
    }
  } finally {
    loading.value.browser = false
  }
}

// Component event handlers
const performManualLogin = async () => {
  loading.value.login = true
  loginProgress.value = { step: 0, message: 'Initializing login process...' }
  
  try {
    if (browserManuallyClosed.value) {
      toast.warning('Browser Required', 'Please open browser manually first before attempting login.')
      loading.value.login = false
      loginProgress.value = { step: 0, message: 'Browser required - open manually' }
      return
    }
    
    loginProgress.value = { step: 1, message: 'Checking current login status...' }
    const alreadyLoggedIn = await fetchLoginStatus()
    if (alreadyLoggedIn) {
      toast.success('Already Logged In', 'You are already logged in to LinkedIn!')
      loading.value.login = false
      return
    }
    
    loginProgress.value = { step: 2, message: 'Opening LinkedIn login page...' }
    const data = await api.manualLogin()
    
    if (data.success) {
      toast.success('Login Process Started', 'LinkedIn login page opened. Starting auto-login...')
      
      loginProgress.value = { step: 3, message: 'Auto-typing credentials and logging in...' }
      const autoLoginResult = await api.autoLogin()
      
      if (autoLoginResult.success) {
        loginProgress.value = { step: 4, message: 'Verifying login success...' }
        toast.info('Verifying Login', 'Checking login status...')
        
        // Poll for login completion
        let attempts = 0
        const maxAttempts = 12
        const pollInterval = setInterval(async () => {
          attempts++
          const isLoggedIn = await fetchLoginStatus()
          
          if (isLoggedIn) {
            clearInterval(pollInterval)
            loading.value.login = false
            loginProgress.value = { step: 0, message: 'Successfully logged in!' }
            toast.success('Login Successful', 'Successfully connected to LinkedIn!')
          } else if (attempts >= maxAttempts) {
            clearInterval(pollInterval)
            loading.value.login = false
            loginProgress.value = { step: 0, message: 'Login timeout' }
            toast.warning('Login Timeout', 'Login verification timed out. Please check manually in browser.')
          }
        }, 5000)
      } else {
        toast.error('Auto Login Failed', 'Please login manually in the browser.')
        loading.value.login = false
        loginProgress.value = { step: 0, message: 'Login failed' }
      }
    } else {
      toast.error('Login Failed', data.error || 'Failed to open LinkedIn page')
      loading.value.login = false
      loginProgress.value = { step: 0, message: 'Failed to open LinkedIn page' }
    }
  } catch (error) {
    console.error('[ERROR] Error during manual login:', error)
    toast.error('Network Error', error.message || 'Network error occurred')
    loading.value.login = false
    loginProgress.value = { step: 0, message: 'Network error occurred' }
  }
}

const manualCheckLogin = async () => {
  loading.value.manualCheck = true
  
  try {
    const isLoggedIn = await fetchLoginStatus()
    
    if (isLoggedIn) {
      toast.success('✅ LinkedIn connection confirmed!')
      await fetchStats()
    } else {
      toast.info('ℹ️ Not connected to LinkedIn')
    }
  } catch (error) {
    console.error('[ERROR] Manual check failed:', error)
    toast.error('Failed to check login status')
  } finally {
    loading.value.manualCheck = false
  }
}

const autoDetectClasses = async () => {
  loading.value.cssDetection = true
  try {
    const data = await api.apiRequest('/auto-detect-classes', { 
      method: 'POST' 
    })
    if (data.success) {
      scrapingConfig.value.location_class = data.location_class || ''
      scrapingConfig.value.section_class = data.section_class || ''
      toast.success('CSS Detection Complete', 'CSS classes detected and updated successfully!')
    } else {
      toast.error('CSS Detection Failed', data.error || 'Failed to detect CSS classes')
    }
  } catch (error) {
    console.error('Error detecting classes:', error)
    toast.error('CSS Detection Error', error.message || 'Failed to detect CSS classes')
  } finally {
    loading.value.cssDetection = false
  }
}

const startScraping = async () => {
  if (browserManuallyClosed.value) {
    toast.warning('Browser Required', 'Browser is required for scraping. Please open browser manually first.')
    return
  }
  
  loading.value.scraping = true
  try {
    const data = await api.startScraping(scrapingConfig.value)
    if (data.success) {
      toast.success('Scraping Started', 'LinkedIn alumni scraping has been started successfully!')
      scrapingStatus.value.is_running = true
    } else {
      console.error('❌ Failed to start scraping:', data.error)
      toast.error('Scraping Failed', data.error || 'Failed to start scraping process')
    }
  } catch (error) {
    console.error('Error starting scraping:', error)
    toast.error('Scraping Error', error.message || 'Error starting scraping process')
  } finally {
    loading.value.scraping = false
  }
}

const downloadResults = () => {
  if (results.value.length > 0) {
    api.downloadFile(results.value[0].filename)
  }
}

const refreshResults = () => {
  fetchResults()
}

const updateSearchQuery = (query) => {
  searchQuery.value = query
  currentPage.value = 1
}

const updateCurrentPage = (page) => {
  currentPage.value = page
}

// Lifecycle
onMounted(async () => {
  // Initial data fetch
  await fetchUniversityInfo()
  await fetchBrowserStatus()
  await fetchLoginStatus()
  await fetchStats()
  await fetchResults()
  
  // Start auto-update system only if not refreshing
  if (!sessionStorage.getItem('pageRefreshed')) {
    startAutoUpdate()
  } else {
    sessionStorage.removeItem('pageRefreshed')
    setTimeout(() => {
      startAutoUpdate()
    }, 2000)
  }
})

onUnmounted(() => {
  sessionStorage.setItem('pageRefreshed', 'true')
  stopAutoUpdate()
})
</script>

<style scoped>
button, .btn, [role="button"] {
  cursor: pointer !important;
}

button:disabled, .btn:disabled, [role="button"]:disabled {
  cursor: not-allowed !important;
}

.badge-connected {
  background-color: rgb(220 252 231);
  color: rgb(22 101 52);
  border-color: rgb(187 247 208);
}

.dark .badge-connected {
  background-color: rgb(20 83 45);
  color: rgb(187 247 208);
  border-color: rgb(22 101 52);
}

.badge-disconnected {
  background-color: rgb(254 226 226);
  color: rgb(153 27 27);
  border-color: rgb(252 165 165);
}

.dark .badge-disconnected {
  background-color: rgb(127 29 29);
  color: rgb(252 165 165);
  border-color: rgb(153 27 27);
}
</style>
