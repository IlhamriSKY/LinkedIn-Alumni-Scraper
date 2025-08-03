import { ref, reactive } from 'vue'

const toasts = ref([])
let toastId = 0

export const useToast = () => {
  const addToast = ({ title, description, variant = 'default', duration = 5000 }) => {
    const id = ++toastId
    const toast = {
      id,
      title,
      description,
      variant,
      duration
    }
    
    toasts.value.push(toast)
    
    return id
  }

  const removeToast = (id) => {
    const index = toasts.value.findIndex(toast => toast.id === id)
    if (index > -1) {
      toasts.value.splice(index, 1)
    }
  }

  const success = (title, description) => {
    return addToast({ title, description, variant: 'success' })
  }

  const error = (title, description) => {
    return addToast({ title, description, variant: 'destructive' })
  }

  const warning = (title, description) => {
    return addToast({ title, description, variant: 'warning' })
  }

  const info = (title, description) => {
    return addToast({ title, description, variant: 'default' })
  }

  return {
    toasts,
    addToast,
    removeToast,
    success,
    error,
    warning,
    info
  }
}
