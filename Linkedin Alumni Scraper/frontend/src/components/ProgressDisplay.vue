<template>
  <!-- Real-time Progress -->
  <Card v-if="scrapingStatus.is_running">
    <CardHeader>
      <CardTitle class="flex items-center space-x-2">
        <svg class="h-5 w-5 text-green-600 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
        </svg>
        <span>Scraping in Progress</span>
        <Badge variant="default" class="bg-green-600">Active</Badge>
      </CardTitle>
    </CardHeader>
    <CardContent class="space-y-4">
      <!-- Current Profile Info -->
      <div class="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
        <div class="flex items-center justify-between">
          <div>
            <p class="font-medium text-green-900 dark:text-green-100">Currently Processing</p>
            <p class="text-lg font-bold text-green-800 dark:text-green-200">
              {{ scrapingStatus.current_name || 'Loading...' }}
            </p>
          </div>
          <div class="text-right">
            <p class="text-sm text-green-700 dark:text-green-300">Profile</p>
            <p class="text-2xl font-bold text-green-800 dark:text-green-200">
              {{ scrapingStatus.current_index || 0 }}
            </p>
          </div>
        </div>
      </div>

      <!-- Progress Bar -->
      <div class="space-y-2">
        <div class="flex justify-between text-sm">
          <span class="text-muted-foreground">Progress</span>
          <span class="font-medium">{{ progressPercentage }}%</span>
        </div>
        <div class="w-full bg-secondary rounded-full h-3 overflow-hidden">
          <div 
            class="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full transition-all duration-500 ease-out"
            :style="{ width: progressPercentage + '%' }"
          ></div>
        </div>
        <div class="flex justify-between text-xs text-muted-foreground">
          <span>{{ stats.scraped_count || 0 }} completed</span>
          <span>{{ stats.total_names || 0 }} total</span>
        </div>
      </div>

      <!-- Live Stats -->
      <div class="grid grid-cols-3 gap-4">
        <div class="text-center p-3 bg-muted/50 rounded-lg">
          <p class="text-2xl font-bold text-green-600">{{ stats.scraped_count || 0 }}</p>
          <p class="text-xs text-muted-foreground">Scraped</p>
        </div>
        <div class="text-center p-3 bg-muted/50 rounded-lg">
          <p class="text-2xl font-bold text-blue-600">{{ scrapingStatus.current_index || 0 }}</p>
          <p class="text-xs text-muted-foreground">Current</p>
        </div>
        <div class="text-center p-3 bg-muted/50 rounded-lg">
          <p class="text-2xl font-bold text-orange-600">{{ (stats.total_names || 0) - (stats.scraped_count || 0) }}</p>
          <p class="text-xs text-muted-foreground">Remaining</p>
        </div>
      </div>

      <!-- Last Scraped Info -->
      <div v-if="stats.last_scraped" class="text-center text-sm text-muted-foreground">
        Last update: {{ new Date(stats.last_scraped).toLocaleString() }}
      </div>
    </CardContent>
  </Card>
</template>

<script setup>
import { computed } from 'vue'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const props = defineProps({
  scrapingStatus: Object,
  stats: Object
})

const progressPercentage = computed(() => {
  if (!props.stats.total_names) return 0
  return Math.round((props.scrapingStatus.current_index / props.stats.total_names) * 100)
})
</script>
