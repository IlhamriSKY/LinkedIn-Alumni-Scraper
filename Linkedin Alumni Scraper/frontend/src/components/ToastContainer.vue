<template>
  <teleport to="body">
    <div class="fixed top-4 right-4 z-50 space-y-2">
      <Toast
        v-for="toast in toasts"
        :key="toast.id"
        :title="toast.title"
        :description="toast.description"
        :variant="toast.variant"
        :duration="toast.duration"
        @close="removeToast(toast.id)"
      />
    </div>
  </teleport>
</template>

<script setup>
import { useToast } from '@/composables/useToast'
import Toast from './ui/toast.vue'

const { toasts, removeToast } = useToast()
</script>
