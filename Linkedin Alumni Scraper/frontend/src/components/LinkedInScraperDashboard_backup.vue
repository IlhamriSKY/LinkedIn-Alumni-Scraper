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
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
              </svg>
              <svg v-else class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
              </svg>
              {{ browserStatus.is_alive ? 'Browser Running' : 'Open Browser' }}
            </Button>
          </div>
        </CardContent>
      </Card>

      <!-- Results Section -->
      <Card v-if="results.length > 0">
        <CardHeader>
          <CardTitle class="flex items-center justify-between">
            <span>Scraping Results</span>
            <div class="flex space-x-2">
              <Button @click="refreshResults" variant="outline" size="sm">
                <svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                </svg>
                Refresh
              </Button>
              <Button @click="downloadResults" variant="outline" size="sm">
                <svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
                Download
              </Button>
            </div>
          </CardTitle>
          <CardDescription>
            Total results: {{ filteredResults.length }}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <!-- Search -->
          <div class="mb-4">
            <Label for="search">Search Results</Label>
            <Input
              id="search"
              v-model="searchQuery"
              placeholder="Search by name, title, company, or location..."
              class="mt-1"
            />
          </div>

          <!-- Results Table -->
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b">
                  <th class="text-left p-2">Name</th>
                  <th class="text-left p-2">Title</th>
                  <th class="text-left p-2">Company</th>
                  <th class="text-left p-2">Location</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="result in paginatedResults" :key="result.name" class="border-b hover:bg-muted/50">
                  <td class="p-2 font-medium">{{ result.name || 'N/A' }}</td>
                  <td class="p-2">{{ result.title || 'N/A' }}</td>
                  <td class="p-2">{{ result.company || 'N/A' }}</td>
                  <td class="p-2">{{ result.location || 'N/A' }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          <div class="flex items-center justify-center space-x-2 mt-4">
            <Button 
              variant="outline" 
              size="sm"
              @click="currentPage--"
              :disabled="currentPage <= 1"
              class="px-3"
            >
              <svg class="mr-1 h-4 w-4 sm:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
              </svg>
              <span class="hidden sm:inline">Previous</span>
              <span class="sm:hidden">Prev</span>
            </Button>
            
            <!-- Page info -->
            <span class="text-sm text-muted-foreground px-2">
              {{ currentPage }} / {{ totalPages }}
            </span>
            
            <Button 
              variant="outline" 
              size="sm"
              @click="currentPage++"
              :disabled="currentPage >= totalPages"
              class="px-3"
            >
              <span class="hidden sm:inline">Next</span>
              <span class="sm:hidden">Next</span>
              <svg class="ml-1 h-4 w-4 sm:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
              </svg>
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import ThemeToggle from '@/components/ThemeToggle.vue'
import { api, apiRetry } from '@/utils/api'
import { toast } from 'vue-sonner'

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
  browser: false
})

const browserStatus = ref({
  is_open: false,
  is_alive: false,
  current_url: null,
  status: 'Browser status unknown'
})

// Computed Properties
const universityName = computed(() => {
  return universityInfo.value?.name || 'Loading University...'
})

const progressPercentage = computed(() => {
  if (!stats.value.total_names) return 0
  return Math.round((scrapingStatus.value.current_index / stats.value.total_names) * 100)
})

const filteredResults = computed(() => {
  if (!searchQuery.value) return results.value
  const query = searchQuery.value.toLowerCase()
  return results.value.filter(result => 
    (result.name || '').toLowerCase().includes(query) ||
    (result.title || '').toLowerCase().includes(query) ||
    (result.company || '').toLowerCase().includes(query) ||
    (result.location || '').toLowerCase().includes(query)
  )
})

const totalPages = computed(() => Math.ceil(filteredResults.value.length / resultsPerPage))

const paginatedResults = computed(() => {
  const start = (currentPage.value - 1) * resultsPerPage
  const end = start + resultsPerPage
  return filteredResults.value.slice(start, end)
})

// Auto-update system
let updateInterval = null

const startAutoUpdate = () => {
  if (updateInterval) return
  
  updateInterval = setInterval(async () => {
    try {
      if (!loading.value.browser) {
        await fetchUniversityInfo()
        await fetchBrowserStatus()
        await fetchLoginStatus()
        await fetchStats()
        if (!scrapingStatus.value.is_running) {
          await fetchResults()
        }
      }
    } catch (error) {
      console.error('[ERROR] Auto-update failed:', error)
    }
  }, 30000) // Update every 30 seconds
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
      browserStatus.value = data.data
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
      toast.success(data.message)
    } else {
      toast.error(data.message || 'Failed to open browser')
    }
  } catch (error) {
    console.error('Error opening browser:', error)
    if (error.message && error.message.includes('timeout')) {
      toast.error('Browser opening timed out. Please check if backend is running.')
    } else if (error.message && error.message.includes('Cannot connect to backend')) {
      toast.error('Cannot connect to backend. Please make sure the backend server is running.')
    } else {
      toast.error(`Error opening browser: ${error.message || 'Unknown error occurred'}`)
    }
  } finally {
    loading.value.browser = false
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

// Watchers
watch(searchQuery, () => {
  currentPage.value = 1
})

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
