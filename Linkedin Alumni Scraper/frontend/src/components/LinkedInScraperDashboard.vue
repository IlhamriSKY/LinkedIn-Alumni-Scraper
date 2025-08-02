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
          <!-- Login Status -->
          <Badge 
            :class="[
              'flex items-center space-x-1 font-medium',
              loginStatus.logged_in ? 'badge-connected' : 'badge-disconnected'
            ]"
          >
            <div 
              :class="[
                'h-2 w-2 rounded-full bg-white'
              ]"
            />
            <span class="font-medium">{{ loginStatus.logged_in ? 'Connected' : 'Disconnected' }}</span>
          </Badge>

          <!-- Theme Toggle -->
          <ThemeToggle />
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="container mx-auto px-4 py-8 space-y-8">
      <!-- Quick Stats Grid -->
      <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
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
              <div class="flex-1">
                <h3 class="text-sm font-medium text-foreground">Browser Status</h3>
                <p class="text-sm text-muted-foreground">
                  {{ browserStatus.status }}
                </p>
                <p v-if="browserStatus.current_url" class="text-xs text-muted-foreground mt-1">
                  📍 {{ browserStatus.current_url }}
                </p>
              </div>
            </div>
          </div>
          
          <!-- Browser Control Buttons -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
            <!-- Open Browser -->
            <Button 
              @click="openBrowser"
              :disabled="loading.browser || browserStatus.is_alive"
              variant="outline"
              size="sm"
              class="w-full"
            >
              <svg v-if="loading.browser" class="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
              </svg>
              <svg v-else class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
              </svg>
              {{ browserStatus.is_alive ? 'Browser Open' : 'Open Browser' }}
            </Button>
            
            <!-- Open LinkedIn -->
            <Button 
              @click="openLinkedIn"
              :disabled="loading.linkedin || !browserStatus.is_alive"
              variant="outline"
              size="sm"
              class="w-full"
            >
              <svg v-if="loading.linkedin" class="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
              </svg>
              <svg v-else class="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
              {{ !browserStatus.is_alive ? 'Browser Required' : 'Open LinkedIn' }}
            </Button>
            
            <!-- Close Browser -->
            <Button 
              @click="closeBrowser"
              :disabled="loading.browser || !browserStatus.is_open"
              variant="destructive"
              size="sm"
              class="w-full"
            >
              <svg v-if="loading.browser" class="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
              </svg>
              <svg v-else class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
              {{ !browserStatus.is_open ? 'No Browser' : 'Close Browser' }}
            </Button>
          </div>
          
          <!-- Browser Tip -->
          <div class="flex items-center space-x-2 text-sm text-muted-foreground bg-purple-50 dark:bg-purple-950 p-3 rounded-lg border border-purple-200 dark:border-purple-800">
            <svg class="h-4 w-4 text-purple-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <span>Browser won't auto-open anymore. Use these controls to manage browser manually.</span>
          </div>
        </CardContent>
      </Card>

      <!-- LinkedIn Authentication Section -->
      <Card v-if="!loginStatus.logged_in" class="border-destructive/50">
        <CardHeader>
          <CardTitle class="flex items-center space-x-2">
            <svg class="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3 3v1"/>
            </svg>
            <span>LinkedIn Authentication Required</span>
          </CardTitle>
          <CardDescription>
            Ready to authenticate with LinkedIn using credentials from environment file.
          </CardDescription>
        </CardHeader>
        <CardContent class="space-y-6">
          <!-- Display Email from .env -->
          <div class="bg-muted/50 p-4 rounded-lg">
            <div class="flex items-center space-x-3">
              <div class="flex-shrink-0">
                <svg class="h-8 w-8 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </div>
              <div class="flex-1">
                <h3 class="text-sm font-medium text-foreground">LinkedIn Account</h3>
                <p class="text-sm text-muted-foreground">
                  {{ universityInfo?.email || 'Loading from .env...' }}
                </p>
                <p v-if="!universityInfo" class="text-xs text-red-500 mt-1">
                  ⚠️ Unable to load from backend
                </p>
              </div>
              <div class="flex-shrink-0">
                <Badge variant="outline" class="text-xs">
                  From .env
                </Badge>
              </div>
            </div>
          </div>
          
          <div class="flex items-center space-x-2 text-sm text-muted-foreground bg-blue-50 dark:bg-blue-950 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
            <svg class="h-4 w-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <span>Credentials are loaded securely from environment configuration.</span>
          </div>
        </CardContent>
        <CardFooter class="flex flex-col space-y-3">
          <!-- Show different content based on login status -->
          <Button 
            v-if="!loginStatus.logged_in"
            @click="performManualLogin"
            :disabled="loading.login"
            class="w-full cursor-pointer hover:cursor-pointer"
            size="lg"
          >
            <svg v-if="loading.login" class="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
            </svg>
            <svg v-else class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013 3v1"/>
            </svg>
            {{ loading.login ? getLoginStatusText() : 'Connect to LinkedIn' }}
          </Button>
          
          <!-- Login Process Indicator -->
          <div v-if="loading.login && !loginStatus.logged_in" class="w-full">
            <!-- Progress Steps -->
            <div class="flex items-center justify-between text-xs text-muted-foreground mb-2">
              <span>Login Progress</span>
              <span>{{ loginProgress.step }}/4</span>
            </div>
            
            <!-- Progress Bar -->
            <div class="w-full bg-secondary rounded-full h-2 mb-2">
              <div 
                class="bg-blue-600 h-2 rounded-full transition-all duration-500"
                :style="{ width: (loginProgress.step / 4 * 100) + '%' }"
              ></div>
            </div>
            
            <!-- Current Step Description -->
            <div class="flex items-center text-sm text-muted-foreground">
              <svg class="animate-spin mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
              </svg>
              <span>{{ loginProgress.message }}</span>
            </div>
          </div>
          
          <!-- Manual Check Button (when not logging in) -->
          <Button 
            v-if="!loading.login"
            @click="manualCheckLogin"
            :disabled="loading.manualCheck"
            variant="outline"
            size="sm"
            class="w-full"
          >
            <svg v-if="loading.manualCheck" class="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
            </svg>
            <svg v-else class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
            {{ loading.manualCheck ? 'Checking...' : 'Check Login Status' }}
          </Button>
          
          <!-- Show success message when logged in -->
          <div v-if="loginStatus.logged_in" class="w-full flex items-center justify-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <svg class="mr-2 h-5 w-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <span class="text-green-800 dark:text-green-200 font-medium">Successfully Connected to LinkedIn</span>
          </div>
        </CardFooter>
      </Card>

      <!-- Scraping Control Panel -->
      <Card v-if="loginStatus.logged_in">
        <CardHeader>
          <CardTitle class="flex items-center space-x-2">
            <svg class="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
            <span>Scraping Configuration</span>
          </CardTitle>
          <CardDescription>
            Configure your LinkedIn scraping parameters and start collecting alumni data.
          </CardDescription>
        </CardHeader>
        <CardContent class="space-y-6">
          <!-- Auto-Detection Section -->
          <div class="rounded-lg border bg-card p-4">
            <div class="flex items-center justify-between">
              <div class="space-y-1">
                <h3 class="font-medium">CSS Class Auto-Detection</h3>
                <p class="text-sm text-muted-foreground">Automatically detect LinkedIn's current CSS classes</p>
              </div>
              <Button 
                @click="autoDetectClasses"
                :disabled="loading.cssDetection"
                variant="outline"
              >
                <svg v-if="loading.cssDetection" class="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                </svg>
                <svg v-else class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                </svg>
                {{ loading.cssDetection ? 'Detecting...' : 'Auto Detect' }}
              </Button>
            </div>
          </div>

          <!-- Manual Configuration -->
          <div class="grid gap-4 md:grid-cols-2">
            <div class="space-y-2">
              <Label for="location-class">Location CSS Class</Label>
              <Input 
                id="location-class"
                v-model="scrapingConfig.location_class"
                placeholder="e.g., .geo-location"
              />
            </div>
            <div class="space-y-2">
              <Label for="section-class">Section CSS Class</Label>
              <Input 
                id="section-class"
                v-model="scrapingConfig.section_class"
                placeholder="e.g., .profile-section"
              />
            </div>
          </div>

          <div class="space-y-2">
            <Label for="max-profiles">Maximum Profiles to Scrape</Label>
            <Input 
              id="max-profiles"
              v-model="scrapingConfig.max_profiles"
              type="number"
              placeholder="50"
              min="1"
              max="1000"
            />
            <p class="text-xs text-muted-foreground">Recommended: 50-100 profiles per session</p>
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            @click="startScraping"
            :disabled="loading.scraping || scrapingStatus.is_running"
            class="w-full"
            size="lg"
          >
            <svg v-if="loading.scraping" class="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
            </svg>
            <svg v-else class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h8m-5-5.5a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
            {{ loading.scraping ? 'Starting Scraper...' : 'Start Scraping Session' }}
          </Button>
        </CardFooter>
      </Card>

      <!-- Real-time Progress -->
      <Card v-if="scrapingStatus.is_running">
        <CardHeader>
          <CardTitle class="flex items-center space-x-2">
            <svg class="h-5 w-5 text-blue-600 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
            </svg>
            <span>Live Scraping Progress</span>
          </CardTitle>
          <CardDescription>
            Real-time updates from your scraping session
          </CardDescription>
        </CardHeader>
        <CardContent class="space-y-4">
          <div class="flex items-center justify-between">
            <div class="space-y-1">
              <p class="font-medium">Currently Processing:</p>
              <p class="text-sm text-muted-foreground">{{ scrapingStatus.current_name || 'Initializing...' }}</p>
            </div>
            <Badge variant="outline">
              {{ scrapingStatus.current_index || 0 }} / {{ stats.total_names || 0 }}
            </Badge>
          </div>
          
          <div class="space-y-2">
            <div class="flex justify-between text-sm">
              <span>Overall Progress</span>
              <span class="font-medium">{{ progressPercentage }}%</span>
            </div>
            <div class="h-3 w-full overflow-hidden rounded-full bg-secondary">
              <div 
                class="h-full bg-primary transition-all duration-500 ease-out"
                :style="{ width: progressPercentage + '%' }"
              ></div>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Results Table -->
      <Card>
        <CardHeader>
          <CardTitle class="flex items-center space-x-2">
            <svg class="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2h2a2 2 0 002-2z"/>
            </svg>
            <span>Scraped Results</span>
          </CardTitle>
          <CardDescription>
            Browse and download your collected LinkedIn alumni data
          </CardDescription>
        </CardHeader>
        <CardContent class="space-y-4">
          <!-- Search and Actions -->
          <div class="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div class="flex items-center space-x-2 w-full sm:w-auto">
              <div class="relative flex-1 sm:flex-initial">
                <svg class="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                </svg>
                <Input 
                  v-model="searchQuery"
                  placeholder="Search by name, title, company, or location..."
                  class="w-full sm:w-80 pl-10"
                />
              </div>
              <Button variant="outline" @click="refreshResults" size="sm">
                <svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                </svg>
                <span class="hidden sm:inline">Refresh</span>
              </Button>
            </div>
            
            <Button @click="downloadResults" :disabled="!results.length" size="sm">
              <svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
              <span class="hidden sm:inline">Download CSV</span>
              <span class="sm:hidden">CSV</span>
            </Button>
          </div>

          <!-- Results Table -->
          <div class="rounded-md border">
            <div class="overflow-x-auto">
              <table class="w-full min-w-[600px]">
                <thead>
                  <tr class="border-b bg-muted/50">
                    <th class="px-2 sm:px-4 py-3 text-left text-xs sm:text-sm font-medium min-w-[120px]">Name</th>
                    <th class="px-2 sm:px-4 py-3 text-left text-xs sm:text-sm font-medium min-w-[140px]">Title</th>
                    <th class="px-2 sm:px-4 py-3 text-left text-xs sm:text-sm font-medium min-w-[120px]">Company</th>
                    <th class="px-2 sm:px-4 py-3 text-left text-xs sm:text-sm font-medium min-w-[100px]">Location</th>
                    <th class="px-2 sm:px-4 py-3 text-left text-xs sm:text-sm font-medium min-w-[80px]">Profile</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="!filteredResults.length" class="border-b">
                    <td colspan="5" class="px-4 py-12 text-center">
                      <div class="flex flex-col items-center space-y-3 text-muted-foreground">
                        <svg class="h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/>
                        </svg>
                        <div class="space-y-1">
                          <p class="font-medium">No results found</p>
                          <p class="text-sm">
                            {{ searchQuery ? 'No results match your search. Try different keywords.' : 'Start scraping to see LinkedIn alumni data here' }}
                          </p>
                        </div>
                      </div>
                    </td>
                  </tr>
                  <tr 
                    v-for="(result, index) in paginatedResults" 
                    :key="index"
                    class="border-b transition-colors hover:bg-muted/50"
                  >
                    <td class="px-2 sm:px-4 py-3 text-xs sm:text-sm font-medium">
                      <div class="max-w-[120px] truncate" :title="result.name || 'N/A'">
                        {{ result.name || 'N/A' }}
                      </div>
                    </td>
                    <td class="px-2 sm:px-4 py-3 text-xs sm:text-sm">
                      <div class="max-w-[140px] truncate" :title="result.title || 'N/A'">
                        {{ result.title || 'N/A' }}
                      </div>
                    </td>
                    <td class="px-2 sm:px-4 py-3 text-xs sm:text-sm">
                      <div class="max-w-[120px] truncate" :title="result.company || 'N/A'">
                        {{ result.company || 'N/A' }}
                      </div>
                    </td>
                    <td class="px-2 sm:px-4 py-3 text-xs sm:text-sm">
                      <div class="max-w-[100px] truncate" :title="result.location || 'N/A'">
                        {{ result.location || 'N/A' }}
                      </div>
                    </td>
                    <td class="px-2 sm:px-4 py-3 text-xs sm:text-sm">
                      <Button 
                        v-if="result.profile_url"
                        variant="outline"
                        size="sm"
                        as-child
                        class="h-7 px-2 text-xs"
                      >
                        <a :href="result.profile_url" target="_blank" class="inline-flex items-center">
                          <svg class="mr-1 h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                          </svg>
                          <span class="hidden sm:inline">View</span>
                        </a>
                      </Button>
                      <span v-else class="text-muted-foreground text-xs">N/A</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Pagination -->
          <div class="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div class="text-sm text-muted-foreground">
              <span class="hidden sm:inline">Showing</span>
              <span class="font-medium">{{ ((currentPage - 1) * resultsPerPage) + 1 }}</span>
              <span class="hidden sm:inline">to</span>
              <span class="sm:hidden">-</span>
              <span class="font-medium">{{ Math.min(currentPage * resultsPerPage, filteredResults.length) }}</span>
              <span class="hidden sm:inline">of</span>
              <span class="sm:hidden">/</span>
              <span class="font-medium">{{ filteredResults.length }}</span>
              <span class="hidden sm:inline">results</span>
              {{ searchQuery ? `(filtered from ${results.length} total)` : '' }}
            </div>
            <div class="flex items-center space-x-2">
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
import { api } from '@/utils/api'
import { toast } from 'vue-sonner'

// State Management
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
  browser: false,
  linkedin: false
})

const browserStatus = ref({
  is_open: false,
  is_alive: false,
  current_url: null,
  status: 'Browser status unknown'
})

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

// Polling Management
let pollingInterval = null
let loginCheckInterval = null

// Real-time login detection
const startLoginPolling = () => {
  if (loginCheckInterval) {
    console.log('[POLLING] Login polling already active')
    return // Already polling
  }
  
  console.log('[POLLING] Starting real-time login detection...')
  loginCheckInterval = setInterval(async () => {
    try {
      console.log('[POLLING] Checking login status...')
      const wasLoggedIn = loginStatus.value.logged_in
      const isNowLoggedIn = await checkLoginStatus()
      
      console.log(`[POLLING] Status check: was=${wasLoggedIn}, now=${isNowLoggedIn}`)
      
      // Detect login status change
      if (!wasLoggedIn && isNowLoggedIn) {
        console.log('[DETECT] Login status changed: NOT LOGGED IN → LOGGED IN')
        console.log('[SUCCESS] Login confirmed! Stopping loading and polling...')
        
        // Only now stop loading since login is confirmed
        loading.value.login = false
        updateLoginProgress(0, 'Successfully logged in!')
        
        toast.success('✅ Successfully connected to LinkedIn!')
        await fetchStatus()
        await fetchStats()
        
        // Stop login polling since we're now logged in
        stopLoginPolling()
      } else if (wasLoggedIn && !isNowLoggedIn) {
        console.log('[DETECT] Login status changed: LOGGED IN → NOT LOGGED IN')
        toast.warn('⚠️ LinkedIn connection lost')
      } else if (!isNowLoggedIn) {
        // Still not logged in, keep loading active
        console.log('[POLLING] Still not logged in, keeping loading active...')
      }
    } catch (error) {
      console.error('[ERROR] Login polling error:', error)
    }
  }, 3000) // Check every 3 seconds
}

const stopLoginPolling = () => {
  if (loginCheckInterval) {
    console.log('[POLLING] Stopping login detection polling...')
    clearInterval(loginCheckInterval)
    loginCheckInterval = null
  }
}

const startPolling = () => {
  if (pollingInterval) return // Already polling
  
  console.log('[POLLING] Starting progress polling...')
  pollingInterval = setInterval(async () => {
    try {
      await fetchProgress()
      await fetchStats()
      
      if (!scrapingStatus.value.is_running) {
        console.log('[POLLING] Scraping finished, stopping polling')
        stopPolling()
      }
    } catch (error) {
      console.error('[ERROR] Polling error:', error)
    }
  }, 2000)
}

const stopPolling = () => {
  if (pollingInterval) {
    console.log('[POLLING] Stopping progress polling...')
    clearInterval(pollingInterval)
    pollingInterval = null
  }
}

// API Methods
const updateLoginProgress = (step, message) => {
  loginProgress.value.step = step
  loginProgress.value.message = message
  console.log(`[PROGRESS] Step ${step}/4: ${message}`)
}

const getLoginStatusText = () => {
  const messages = [
    'Initializing...',
    'Opening LinkedIn...',
    'Typing credentials...',
    'Logging in...',
    'Verifying login...'
  ]
  return messages[loginProgress.value.step] || 'Authenticating...'
}

const manualCheckLogin = async () => {
  console.log('[MANUAL] Manual login status check initiated')
  loading.value.manualCheck = true
  
  try {
    const isLoggedIn = await checkLoginStatus()
    
    if (isLoggedIn) {
      toast.success('✅ LinkedIn connection confirmed!')
      await fetchStatus()
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

const checkLoginStatus = async () => {
  try {
    console.log('[LOGIN] Checking if already logged in to LinkedIn...')
    const data = await api.checkLoginStatus()
    
    if (data.success && data.logged_in) {
      console.log('[LOGIN] User is already logged in!')
      loginStatus.value.logged_in = true
      if (!loading.value.manualCheck) {
        toast.success('Already logged in to LinkedIn')
      }
    } else {
      console.log('[LOGIN] User is not logged in')
      loginStatus.value.logged_in = false
    }
    
    return data.logged_in
  } catch (error) {
    console.error('[ERROR] Error checking login status:', error)
    loginStatus.value.logged_in = false
    return false
  }
}

const fetchStatus = async () => {
  try {
    const data = await api.getStatus()
    // Only update non-login related status
    if (data.data || data) {
      const statusData = data.data || data
      loginStatus.value.university = statusData.university || ''
      loginStatus.value.linkedin_url = statusData.linkedin_url || ''
      // Don't reset logged_in status here - let checkLoginStatus handle it
    }
  } catch (error) {
    console.error('Error fetching status:', error)
  }
}

const fetchStats = async () => {
  try {
    const data = await api.getStats()
    stats.value = data.data || data
    if (data.data) {
      scrapingStatus.value.current_index = data.data.scraped_count || 0
    }
  } catch (error) {
    console.error('Error fetching stats:', error)
  }
}

// Browser Control Functions
const fetchBrowserStatus = async () => {
  try {
    const data = await api.apiRequest('/browser-status')
    if (data.success) {
      browserStatus.value = data.data
    } else {
      console.error('Error fetching browser status:', data.error)
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

const openBrowser = async () => {
  loading.value.browser = true
  try {
    const data = await api.apiRequest('/browser-open', { method: 'POST' })
    if (data.success) {
      toast.success(data.message)
      await fetchBrowserStatus()
    } else {
      toast.error(data.message || 'Failed to open browser')
    }
  } catch (error) {
    console.error('Error opening browser:', error)
    toast.error('Error opening browser')
  } finally {
    loading.value.browser = false
  }
}

const closeBrowser = async () => {
  loading.value.browser = true
  try {
    const data = await api.apiRequest('/browser-close', { method: 'POST' })
    if (data.success) {
      toast.success(data.message)
      await fetchBrowserStatus()
    } else {
      toast.error(data.message || 'Failed to close browser')
    }
  } catch (error) {
    console.error('Error closing browser:', error)
    toast.error('Error closing browser')
  } finally {
    loading.value.browser = false
  }
}

const openLinkedIn = async () => {
  loading.value.linkedin = true
  try {
    const data = await api.apiRequest('/open-linkedin', { method: 'POST' })
    if (data.success) {
      toast.success(data.message)
      await fetchBrowserStatus()
    } else {
      toast.error(data.message || 'Failed to open LinkedIn')
    }
  } catch (error) {
    console.error('Error opening LinkedIn:', error)
    toast.error('Error opening LinkedIn')
  } finally {
    loading.value.linkedin = false
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
  console.log('[FETCH] Starting fetchUniversityInfo...')
  try {
    console.log('[API] Fetching university info via API...')
    const data = await api.getUniversityInfo()
    console.log('[DATA] Response data:', data)
    
    if (data && data.success && data.data) {
      universityInfo.value = data.data
      console.log('[OK] University info loaded successfully:', universityInfo.value)
    } else {
      console.error('[ERROR] Invalid response format:', data)
      universityInfo.value = {
        name: 'Error loading university',
        email: 'Backend connection failed',
        total_names: 0
      }
    }
  } catch (error) {
    console.error('[ERROR] Error fetching university info:', error)
    console.log('[DEBUG] Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    })
    
    // Set fallback data
    universityInfo.value = {
      name: 'Backend Connection Failed',
      email: 'Check if backend is running on port 5000',
      total_names: 0
    }
  }
}

const performManualLogin = async () => {
  console.log('[LOGIN] Starting manual login process...')
  loading.value.login = true
  updateLoginProgress(0, 'Initializing login process...')
  
  try {
    // Step 1: Check if already logged in
    updateLoginProgress(1, 'Checking current login status...')
    const alreadyLoggedIn = await checkLoginStatus()
    if (alreadyLoggedIn) {
      console.log('[LOGIN] Already logged in, skipping manual login')
      await fetchStatus()
      loading.value.login = false
      return
    }
    
    // Step 2: Open LinkedIn login page
    updateLoginProgress(2, 'Opening LinkedIn login page...')
    console.log('[API] Sending manual login request...')
    const data = await api.manualLogin()
    console.log('[DATA] Response data:', data)
    
    if (data.success) {
      console.log('[OK] LinkedIn login page opened!')
      toast.success('LinkedIn login page opened in browser. Starting auto-login...')
      
      // Start real-time login detection
      console.log('[POLLING] Starting real-time login detection...')
      startLoginPolling()
      
      // Step 3: Start automatic login after opening the page
      setTimeout(async () => {
        try {
          updateLoginProgress(3, 'Auto-typing credentials and logging in...')
          console.log('[AUTO] Starting automatic login...')
          const autoLoginResult = await api.autoLogin()
          
          if (autoLoginResult.success) {
            updateLoginProgress(4, 'Verifying login success...')
            console.log('[SUCCESS] Auto-login request successful!')
            toast.success('Auto-login initiated! Verifying login status...')
            // Don't manually set logged_in here - let polling detect it
            // Keep polling running to detect when login is complete
          } else {
            toast.error('Auto login failed. Please login manually in the browser.')
            loading.value.login = false
            stopLoginPolling()
            updateLoginProgress(0, 'Login failed')
          }
        } catch (error) {
          console.error('[ERROR] Auto login error:', error)
          toast.error('Auto login failed. Please login manually in the browser.')
          loading.value.login = false
          stopLoginPolling()
          updateLoginProgress(0, 'Login error occurred')
        }
      }, 2000) // Wait 2 seconds for page to load, then auto login
      
    } else {
      console.error('[ERROR] Manual login failed:', data.error)
      toast.error(`Login failed: ${data.error}`)
      loading.value.login = false
      updateLoginProgress(0, 'Failed to open LinkedIn page')
    }
  } catch (error) {
    console.error('[ERROR] Error during manual login:', error)
    toast.error(`Network error: ${error.message}`)
    loading.value.login = false
    updateLoginProgress(0, 'Network error occurred')
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
    }
  } catch (error) {
    console.error('Error detecting classes:', error)
  } finally {
    loading.value.cssDetection = false
  }
}

const startScraping = async () => {
  loading.value.scraping = true
  try {
    const data = await api.startScraping(scrapingConfig.value)
    if (data.success) {
      console.log('✅ Scraping started successfully!')
      toast.success('Scraping started successfully!')
      scrapingStatus.value.is_running = true
      startPolling()
    } else {
      console.error('❌ Failed to start scraping:', data.error)
      toast.error(`Failed to start scraping: ${data.error}`)
    }
  } catch (error) {
    console.error('Error starting scraping:', error)
    toast.error(`Error starting scraping: ${error.message}`)
  } finally {
    loading.value.scraping = false
  }
}

const downloadResults = () => {
  // Use the API utility for downloading
  if (results.value.length > 0) {
    api.downloadFile(results.value[0].filename)
  }
}

const refreshResults = () => {
  fetchResults()
}

// Watchers
watch(searchQuery, () => {
  currentPage.value = 1 // Reset to first page when search changes
})

// Watch login status changes to stop loading
watch(() => loginStatus.value.logged_in, (newValue, oldValue) => {
  if (!oldValue && newValue) {
    // Login status changed from false to true
    console.log('[WATCH] Login status changed to true, stopping login loading...')
    loading.value.login = false
    stopLoginPolling() // Stop polling once logged in
    updateLoginProgress(4, 'Login successful!')
    
    // Reset progress after a short delay
    setTimeout(() => {
      updateLoginProgress(0, 'Ready')
    }, 2000)
  }
})

// Lifecycle
onMounted(async () => {
  console.log('[MOUNT] Component mounted, starting data fetch...')
  await fetchUniversityInfo()
  
  // Check browser status first
  await fetchBrowserStatus()
  
  // Check login status first before fetching other data
  await checkLoginStatus()
  
  await fetchStatus()
  await fetchStats()
  await fetchResults()
  
  // Start real-time login detection (always active)
  startLoginPolling()
  
  // Start browser status monitoring
  setInterval(fetchBrowserStatus, 5000) // Check browser status every 5 seconds
  
  if (scrapingStatus.value.is_running) {
    startPolling()
  }
  console.log('[OK] All initial data fetched and real-time monitoring started')
})

onUnmounted(() => {
  console.log('[UNMOUNT] Stopping all polling intervals...')
  stopPolling()
  stopLoginPolling()
})
</script>

<style scoped>
/* Ensure all buttons have pointer cursor */
button, .btn, [role="button"] {
  cursor: pointer !important;
}

/* Disabled state should show not-allowed cursor */
button:disabled, .btn:disabled, [role="button"]:disabled {
  cursor: not-allowed !important;
}

/* Badge styling for connection status */
.badge-connected {
  background-color: rgb(220 252 231); /* bg-green-100 */
  color: rgb(22 101 52); /* text-green-800 */
  border-color: rgb(187 247 208); /* border-green-200 */
}

.dark .badge-connected {
  background-color: rgb(20 83 45); /* dark:bg-green-900 */
  color: rgb(187 247 208); /* dark:text-green-200 */
  border-color: rgb(22 101 52); /* dark:border-green-800 */
}

.badge-disconnected {
  background-color: rgb(254 226 226); /* bg-red-100 */
  color: rgb(153 27 27); /* text-red-800 */
  border-color: rgb(252 165 165); /* border-red-200 */
}

.dark .badge-disconnected {
  background-color: rgb(127 29 29); /* dark:bg-red-900 */
  color: rgb(252 165 165); /* dark:text-red-200 */
  border-color: rgb(153 27 27); /* dark:border-red-800 */
}
</style>
