import React from 'react'
import { cn } from '@/lib/utils'
const LoadingSpinner = ({ 
  size = 'md', 
  variant = 'primary', 
  className = '',
  children = null,
  showText = true,
  text = 'Loading...'
}) => {
  const sizeClasses = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4', 
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-8 h-8'
  }
  const variantClasses = {
    primary: 'border-blue-500',
    secondary: 'border-gray-500',
    success: 'border-green-500',
    danger: 'border-red-500',
    warning: 'border-yellow-500',
    white: 'border-white'
  }
  const textSizeClasses = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-sm', 
    lg: 'text-base',
    xl: 'text-lg'
  }
  if (children) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <div className={cn(
          "animate-spin rounded-full border-2 border-t-transparent",
          sizeClasses[size],
          variantClasses[variant]
        )} />
        {children}
      </div>
    )
  }
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className={cn(
        "animate-spin rounded-full border-2 border-t-transparent",
        sizeClasses[size],
        variantClasses[variant]
      )} />
      {showText && (
        <span className={cn(
          "font-medium text-muted-foreground",
          textSizeClasses[size]
        )}>
          {text}
        </span>
      )}
    </div>
  )
}
const LoadingButton = ({ size = 'sm', variant = 'white', text = 'Loading...', className = '' }) => (
  <LoadingSpinner 
    size={size} 
    variant={variant} 
    text={text} 
    className={className}
  />
)
const LoadingPage = ({ text = 'Loading content...', className = '' }) => (
  <div className={cn("flex flex-col items-center justify-center py-12", className)}>
    <LoadingSpinner size="lg" text={text} />
  </div>
)
const LoadingCard = ({ text = 'Loading...', className = '' }) => (
  <div className={cn("flex items-center justify-center py-8", className)}>
    <LoadingSpinner size="md" text={text} />
  </div>
)
const LoadingInline = ({ size = 'sm', variant = 'primary', className = '' }) => (
  <LoadingSpinner 
    size={size} 
    variant={variant} 
    showText={false} 
    className={className}
  />
)
const LoadingPulse = ({ className = '', children }) => (
  <div className={cn("animate-pulse", className)}>
    {children}
  </div>
)
const LoadingDots = ({ size = 'md', variant = 'primary', className = '' }) => {
  const dotSizeClasses = {
    sm: 'w-1 h-1',
    md: 'w-2 h-2',
    lg: 'w-3 h-3'
  }
  const dotColorClasses = {
    primary: 'bg-blue-500',
    secondary: 'bg-gray-500',
    success: 'bg-green-500',
    danger: 'bg-red-500',
    warning: 'bg-yellow-500',
    white: 'bg-white'
  }
  return (
    <div className={cn("flex items-center space-x-1", className)}>
      <div className={cn(
        "rounded-full animate-bounce",
        dotSizeClasses[size],
        dotColorClasses[variant]
      )} style={{ animationDelay: '0ms' }} />
      <div className={cn(
        "rounded-full animate-bounce",
        dotSizeClasses[size],
        dotColorClasses[variant]
      )} style={{ animationDelay: '150ms' }} />
      <div className={cn(
        "rounded-full animate-bounce",
        dotSizeClasses[size],
        dotColorClasses[variant]
      )} style={{ animationDelay: '300ms' }} />
    </div>
  )
}
export { 
  LoadingSpinner, 
  LoadingButton, 
  LoadingPage, 
  LoadingCard, 
  LoadingInline, 
  LoadingPulse,
  LoadingDots
}
