<template>
  <!-- LinkedIn Authentication Section -->
  <Card v-if="!props.loginStatus.logged_in" class="border-destructive/50">
    <CardHeader>
      <CardTitle class="flex items-center space-x-2">
        <svg class="h-5 w-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
        </svg>
        <span>LinkedIn Authentication Required</span>
      </CardTitle>
    </CardHeader>
    <CardContent class="space-y-6">
      <!-- Login Progress Indicator -->
      <div v-if="props.loading.login" class="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
        <div class="flex items-center space-x-3">
          <svg class="animate-spin h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 0 1 4 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
          </svg>
          <div class="flex-1">
            <p class="font-medium text-blue-900 dark:text-blue-100">{{ getLoginStatusText() }}</p>
            <div class="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2 mt-2">
              <div 
                class="bg-blue-600 h-2 rounded-full transition-all duration-500"
                :style="{ width: ((props.loginProgress?.step || 0) * 20) + '%' }"
              ></div>
            </div>
            <p class="text-sm text-blue-700 dark:text-blue-300 mt-1">{{ props.loginProgress?.message || 'Processing...' }}</p>
          </div>
        </div>
      </div>

      <!-- Login Instructions -->
      <div v-else class="text-center space-y-4">
        <div class="bg-yellow-50 dark:bg-yellow-950/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
          <div class="flex items-start space-x-3">
            <svg class="h-5 w-5 text-yellow-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.232 16.5c-.77.833.192 2.5 1.732 2.5z"/>
            </svg>
            <div class="text-left">
              <p class="font-medium text-yellow-800 dark:text-yellow-200">Authentication Required</p>
              <p class="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                You need to be logged in to LinkedIn to start scraping alumni data.
              </p>
            </div>
          </div>
        </div>
      </div>
    </CardContent>
    <CardFooter class="flex flex-col space-y-3">
      <!-- Auto Login Button -->
      <Button 
        @click="performManualLogin"
        :disabled="props.loading.login || props.browserManuallyClosed"
        variant="default"
        size="lg"
        class="w-full bg-blue-600 hover:bg-blue-700 text-white"
      >
        <svg v-if="props.loading.login" class="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 0 1 4 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
        </svg>
        <svg v-else class="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
        </svg>
        {{ props.browserManuallyClosed ? 'Open Browser First' : props.loading.login ? getLoginStatusText() : 'Login to LinkedIn' }}
      </Button>

      <!-- Manual Check Button -->
      <Button 
        @click="manualCheckLogin"
        :disabled="props.loading.manualCheck"
        variant="outline"  
        size="sm"
        class="w-full"
      >
        <svg v-if="props.loading.manualCheck" class="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 0 1 4 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
        </svg>
        <svg v-else class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
        {{ props.loading.manualCheck ? 'Checking...' : 'Check Login Status' }}
      </Button>
    </CardFooter>
  </Card>
</template>

<script setup>
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

const props = defineProps({
  loginStatus: {
    type: Object,
    default: () => ({ logged_in: false, university: '', linkedin_url: '' })
  },
  loading: {
    type: Object,
    default: () => ({ login: false, cssDetection: false, scraping: false, manualCheck: false, browser: false })
  },
  browserManuallyClosed: {
    type: Boolean,
    default: false
  },
  loginProgress: {
    type: Object,
    default: () => ({ step: 0, message: 'Initializing...' })
  }
})

const emit = defineEmits(['performManualLogin', 'manualCheckLogin'])

const performManualLogin = () => emit('performManualLogin')
const manualCheckLogin = () => emit('manualCheckLogin')

const getLoginStatusText = () => {
  const messages = [
    'Initializing...',
    'Opening LinkedIn...',
    'Typing credentials...',
    'Logging in...',
    'Verifying login...'
  ]
  return messages[props.loginProgress?.step || 0] || 'Authenticating...'
}
</script>