<template>
  <div
    v-if="visible"
    :class="[
      'fixed top-4 right-4 z-50 flex w-full max-w-sm items-center space-x-4 rounded-lg border p-4 shadow-lg transition-all duration-300 transform',
      {
        'bg-background text-foreground border-border': variant === 'default',
        'bg-destructive text-destructive-foreground border-destructive': variant === 'destructive',
        'bg-green-600 text-white border-green-600': variant === 'success',
        'bg-yellow-600 text-white border-yellow-600': variant === 'warning',
      },
      visible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
    ]"
  >
    <div class="flex items-center space-x-2">
      <!-- Success Icon -->
      <svg v-if="variant === 'success'" class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
      </svg>
      <!-- Error Icon -->
      <svg v-else-if="variant === 'destructive'" class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
      </svg>
      <!-- Warning Icon -->
      <svg v-else-if="variant === 'warning'" class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.232 16.5c-.77.833.192 2.5 1.732 2.5z"/>
      </svg>
      <!-- Default Icon -->
      <svg v-else class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
      </svg>
      
      <div class="flex-1">
        <p class="font-medium">{{ title }}</p>
        <p v-if="description" class="text-sm opacity-90">{{ description }}</p>
      </div>
    </div>
    
    <button @click="close" class="ml-auto opacity-70 hover:opacity-100">
      <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
      </svg>
    </button>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const props = defineProps({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  variant: {
    type: String,
    default: 'default',
    validator: (value) => ['default', 'destructive', 'success', 'warning'].includes(value)
  },
  duration: {
    type: Number,
    default: 5000
  }
})

const emit = defineEmits(['close'])

const visible = ref(false)

const close = () => {
  visible.value = false
  setTimeout(() => {
    emit('close')
  }, 300)
}

onMounted(() => {
  visible.value = true
  if (props.duration > 0) {
    setTimeout(close, props.duration)
  }
})
</script>
