<template>
  <!-- Scraping Control Panel -->
  <Card v-if="loginStatus.logged_in">
    <CardHeader>
      <CardTitle class="flex items-center space-x-2">
        <svg class="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2V9a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
        </svg>
        <span>Scraping Configuration</span>
        <Badge variant="secondary" class="ml-2">Ready</Badge>
      </CardTitle>
    </CardHeader>
    <CardContent class="space-y-6">
      <!-- CSS Class Configuration -->
      <div class="grid gap-4 md:grid-cols-2">
        <div class="space-y-2">
          <Label for="location-class">Location CSS Class</Label>
          <Input
            id="location-class"
            v-model="scrapingConfig.location_class"
            placeholder="e.g., .location-class"
          />
        </div>
        <div class="space-y-2">
          <Label for="section-class">Section CSS Class</Label>
          <Input
            id="section-class"
            v-model="scrapingConfig.section_class"
            placeholder="e.g., .section-class"
          />
        </div>
      </div>

      <!-- Max Profiles -->
      <div class="space-y-2">
        <Label for="max-profiles">Maximum Profiles to Scrape</Label>
        <Input
          id="max-profiles"
          v-model.number="scrapingConfig.max_profiles"
          type="number"
          min="1"
          max="1000"
          placeholder="50"
        />
      </div>

      <!-- Auto-Detect Button -->
      <Button 
        @click="autoDetectClasses"
        :disabled="loading.cssDetection"
        variant="outline"
        size="sm"
        class="w-full"
      >
        <svg v-if="loading.cssDetection" class="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 818-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
        </svg>
        <svg v-else class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
        </svg>
        {{ loading.cssDetection ? 'Detecting...' : 'Auto-Detect CSS Classes' }}
      </Button>
    </CardContent>
    <CardFooter>
      <Button 
        @click="startScraping"
        :disabled="loading.scraping || browserManuallyClosed || !loginStatus.logged_in"
        variant="default"
        size="lg"
        class="w-full bg-green-600 hover:bg-green-700 text-white"
      >
        <svg v-if="loading.scraping" class="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
        </svg>
        <svg v-else class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h8m-5-5.5a3 3 0 11-6 0 3 3 0 016 0z"/>
        </svg>
        {{ browserManuallyClosed ? 'Open Browser First' : loading.scraping ? 'Starting Scraping...' : 'Start Scraping' }}
      </Button>
    </CardFooter>
  </Card>
</template>

<script setup>
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'

defineProps({
  loginStatus: Object,
  loading: Object,
  browserManuallyClosed: Boolean,
  scrapingConfig: Object
})

const emit = defineEmits(['autoDetectClasses', 'startScraping'])

const autoDetectClasses = () => emit('autoDetectClasses')
const startScraping = () => emit('startScraping')
</script>
