import { ref, computed, onMounted, watch } from 'vue'

const isDark = ref(false)

export function useDarkMode() {
  const toggleDarkMode = () => {
    isDark.value = !isDark.value
    updateTheme()
  }

  const setDarkMode = (value) => {
    isDark.value = value
    updateTheme()
  }

  const updateTheme = () => {
    const root = document.documentElement
    
    if (isDark.value) {
      root.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      root.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
    
    // Force update by triggering a style recalculation
    document.body.style.display = 'none'
    document.body.offsetHeight // trigger reflow
    document.body.style.display = ''
  }

  const initializeTheme = () => {
    const savedTheme = localStorage.getItem('theme')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    
    if (savedTheme) {
      isDark.value = savedTheme === 'dark'
    } else {
      isDark.value = prefersDark
    }
    
    updateTheme()
  }

  const themeIcon = computed(() => isDark.value ? 'sun' : 'moon')
  const themeLabel = computed(() => isDark.value ? 'Switch to Light Mode' : 'Switch to Dark Mode')

  // Watch for system theme changes
  const watchSystemTheme = () => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (e) => {
      if (!localStorage.getItem('theme')) {
        isDark.value = e.matches
        updateTheme()
      }
    }
    
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange)
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(handleChange)
    }
    
    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange)
      } else {
        mediaQuery.removeListener(handleChange)
      }
    }
  }

  onMounted(() => {
    initializeTheme()
    const cleanup = watchSystemTheme()
    
    // Cleanup function for unmounting
    return cleanup
  })

  return {
    isDark: computed(() => isDark.value),
    toggleDarkMode,
    setDarkMode,
    themeIcon,
    themeLabel
  }
}
