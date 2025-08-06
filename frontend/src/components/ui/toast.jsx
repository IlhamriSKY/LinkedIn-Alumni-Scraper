import * as React from "react"
import * as ToastPrimitives from "@radix-ui/react-toast"
import { cva } from "class-variance-authority";
import { X } from "lucide-react"

import { cn } from "@/lib/utils"

const ToastProvider = ToastPrimitives.Provider

const ToastViewport = React.forwardRef(({ className, ...props }, ref) => (
  <ToastPrimitives.Viewport
    ref={ref}
    className={cn(
      "fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse gap-2 p-6 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col sm:max-w-[350px] md:max-w-[380px]",
      className
    )}
    {...props} />
))
ToastViewport.displayName = ToastPrimitives.Viewport.displayName

const toastVariants = cva(
  "group pointer-events-auto relative flex w-full items-center justify-between space-x-3 overflow-hidden rounded-lg border-2 p-3 pr-10 mb-1 backdrop-blur-sm transition-all duration-300 data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full hover:scale-[1.02]",
  {
    variants: {
      variant: {
        default: "border-slate-300 bg-white/95 text-slate-900 ring-1 ring-slate-200 dark:border-slate-600 dark:bg-slate-800/95 dark:text-slate-100 dark:ring-slate-700",
        destructive: "border-red-400 bg-red-50/95 text-red-900 ring-1 ring-red-200 dark:border-red-500 dark:bg-red-950/95 dark:text-red-100 dark:ring-red-800",
        success: "border-green-400 bg-green-50/95 text-green-900 ring-1 ring-green-200 dark:border-green-500 dark:bg-green-950/95 dark:text-green-100 dark:ring-green-800",
        warning: "border-yellow-400 bg-yellow-50/95 text-yellow-900 ring-1 ring-yellow-200 dark:border-yellow-500 dark:bg-yellow-950/95 dark:text-yellow-100 dark:ring-yellow-800",
        info: "border-blue-400 bg-blue-50/95 text-blue-900 ring-1 ring-blue-200 dark:border-blue-500 dark:bg-blue-950/95 dark:text-blue-100 dark:ring-blue-800",
        elegant: "border-purple-400 bg-gradient-to-r from-purple-50/95 to-pink-50/95 text-purple-900 ring-1 ring-purple-200 dark:border-purple-500 dark:from-purple-950/95 dark:to-pink-950/95 dark:text-purple-100 dark:ring-purple-800",
        modern: "border-indigo-400 bg-gradient-to-br from-indigo-50/95 via-white/95 to-cyan-50/95 text-indigo-900 ring-1 ring-indigo-200 dark:border-indigo-500 dark:from-indigo-950/95 dark:via-slate-900/95 dark:to-cyan-950/95 dark:text-indigo-100 dark:ring-indigo-800",
        minimal: "border-gray-200 bg-gray-50/95 text-gray-800 ring-1 ring-gray-100 dark:border-gray-700 dark:bg-gray-900/95 dark:text-gray-200 dark:ring-gray-800",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const Toast = React.forwardRef(({ className, variant, ...props }, ref) => {
  return (
    <ToastPrimitives.Root
      ref={ref}
      className={cn(toastVariants({ variant }), className)}
      {...props} />
  );
})
Toast.displayName = ToastPrimitives.Root.displayName

const ToastAction = React.forwardRef(({ className, ...props }, ref) => (
  <ToastPrimitives.Action
    ref={ref}
    className={cn(
      "inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 text-sm font-medium transition-colors hover:bg-secondary focus:outline-none focus:ring-1 focus:ring-ring disabled:pointer-events-none disabled:opacity-50 group-[.destructive]:border-muted/40 group-[.destructive]:hover:border-destructive/30 group-[.destructive]:hover:bg-destructive group-[.destructive]:hover:text-destructive-foreground group-[.destructive]:focus:ring-destructive",
      className
    )}
    {...props} />
))
ToastAction.displayName = ToastPrimitives.Action.displayName

const ToastClose = React.forwardRef(({ className, ...props }, ref) => (
  <ToastPrimitives.Close
    ref={ref}
    className={cn(
      "absolute right-2 top-2 p-1 text-current opacity-70 transition-all duration-200 hover:opacity-100 hover:scale-110 focus:opacity-100 focus:outline-none active:scale-95 group-hover:opacity-90",
      className
    )}
    toast-close=""
    {...props}>
    <X className="h-4 w-4" />
    <span className="sr-only">Close</span>
  </ToastPrimitives.Close>
))
ToastClose.displayName = ToastPrimitives.Close.displayName

const ToastTitle = React.forwardRef(({ className, ...props }, ref) => (
  <ToastPrimitives.Title
    ref={ref}
    className={cn("text-sm font-bold tracking-wide [&+div]:text-xs [&+div]:mt-1", className)}
    {...props} />
))
ToastTitle.displayName = ToastPrimitives.Title.displayName

const ToastDescription = React.forwardRef(({ className, ...props }, ref) => (
  <ToastPrimitives.Description 
    ref={ref} 
    className={cn("text-sm opacity-90 leading-relaxed", className)} 
    {...props} />
))
ToastDescription.displayName = ToastPrimitives.Description.displayName

export { ToastProvider, ToastViewport, Toast, ToastTitle, ToastDescription, ToastClose, ToastAction };
