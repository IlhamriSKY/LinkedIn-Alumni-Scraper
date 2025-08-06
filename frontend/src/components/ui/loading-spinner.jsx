import React from 'react'
import { cn } from '@/lib/utils'

// Minimalist Spinner Component with Better Visibility
const LoadingSpinner = ({ 
  size = 'md', 
  variant = 'primary', 
  className = '',
  children = null,
  showText = false,
  text = ''
}) => {
  const sizeClasses = {
    xs: 'w-3 h-3 border-2',
    sm: 'w-4 h-4 border-2', 
    md: 'w-5 h-5 border-2',
    lg: 'w-6 h-6 border-[3px]',
    xl: 'w-8 h-8 border-[3px]'
  }
  
  // Enhanced colors with better dark/light mode support
  const variantClasses = {
    primary: 'border-blue-200/40 border-t-blue-500 dark:border-blue-300/30 dark:border-t-blue-400',
    secondary: 'border-gray-200/40 border-t-gray-600 dark:border-gray-600/40 dark:border-t-gray-300',
    success: 'border-green-200/40 border-t-green-500 dark:border-green-300/30 dark:border-t-green-400',
    danger: 'border-red-200/40 border-t-red-500 dark:border-red-300/30 dark:border-t-red-400',
    warning: 'border-yellow-200/40 border-t-yellow-500 dark:border-yellow-300/30 dark:border-t-yellow-400',
    white: 'border-white/40 border-t-white'
  }

  if (children) {
    return (
      <div className={cn("flex items-center gap-1.5", className)}>
        <div className={cn(
          "animate-spin rounded-full",
          sizeClasses[size],
          variantClasses[variant]
        )} />
        {children}
      </div>
    )
  }

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <div className={cn(
        "animate-spin rounded-full",
        sizeClasses[size],
        variantClasses[variant]
      )} />
      {showText && text && (
        <span className="text-xs text-muted-foreground">
          {text}
        </span>
      )}
    </div>
  )
}
// Simplified Loading Components
const LoadingButton = ({ size = 'sm', variant = 'white', className = '' }) => (
  <LoadingSpinner 
    size={size} 
    variant={variant} 
    className={className}
  />
)

const LoadingPage = ({ className = '' }) => (
  <div className={cn("flex items-center justify-center py-8", className)}>
    <LoadingSpinner size="lg" variant="primary" />
  </div>
)

const LoadingCard = ({ className = '' }) => (
  <div className={cn("flex items-center justify-center py-6", className)}>
    <LoadingSpinner size="md" variant="primary" />
  </div>
)

const LoadingInline = ({ size = 'sm', variant = 'primary', className = '' }) => (
  <LoadingSpinner 
    size={size} 
    variant={variant} 
    className={className}
  />
)

const LoadingPulse = ({ className = '', children }) => (
  <div className={cn("opacity-60", className)}>
    {children}
  </div>
)

export { 
  LoadingSpinner, 
  LoadingButton, 
  LoadingPage, 
  LoadingCard, 
  LoadingInline, 
  LoadingPulse
}
