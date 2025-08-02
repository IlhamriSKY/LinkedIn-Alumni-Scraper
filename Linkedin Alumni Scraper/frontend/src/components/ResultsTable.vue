<template>
  <!-- Results Table -->
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
    <CardContent class="space-y-4">
      <!-- Search -->
      <div>
        <Label for="search">Search Results</Label>
        <Input
          id="search"
          :model-value="searchQuery"
          @update:model-value="updateSearchQuery"
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
          @click="updateCurrentPage(currentPage - 1)"
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
          @click="updateCurrentPage(currentPage + 1)"
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
</template>

<script setup>
import { computed } from 'vue'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const props = defineProps({
  results: Array,
  searchQuery: String,
  currentPage: Number,
  resultsPerPage: Number
})

const emit = defineEmits(['refreshResults', 'downloadResults', 'updateSearchQuery', 'updateCurrentPage'])

const filteredResults = computed(() => {
  if (!props.searchQuery) return props.results
  const query = props.searchQuery.toLowerCase()
  return props.results.filter(result => 
    (result.name || '').toLowerCase().includes(query) ||
    (result.title || '').toLowerCase().includes(query) ||
    (result.company || '').toLowerCase().includes(query) ||
    (result.location || '').toLowerCase().includes(query)
  )
})

const totalPages = computed(() => Math.ceil(filteredResults.value.length / props.resultsPerPage))

const paginatedResults = computed(() => {
  const start = (props.currentPage - 1) * props.resultsPerPage
  const end = start + props.resultsPerPage
  return filteredResults.value.slice(start, end)
})

const refreshResults = () => emit('refreshResults')
const downloadResults = () => emit('downloadResults')
const updateSearchQuery = (value) => emit('updateSearchQuery', value)
const updateCurrentPage = (page) => emit('updateCurrentPage', page)
</script>
