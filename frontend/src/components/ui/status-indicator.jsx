import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

/**
 * Status Indicator Component with Pulse Animation
 * Shows connection status with visual feedback
 */
export const StatusIndicator = ({ 
  connected = false, 
  label = "Status", 
  connectedText = "Connected",
  disconnectedText = "Disconnected",
  size = "default" 
}) => {
  if (connected) {
    return (
      <div className="flex items-center gap-2">
        {/* Pulse Dot Indicator */}
        <div className="relative flex items-center justify-center">
          <div className="absolute w-3 h-3 bg-green-400 rounded-full animate-ping opacity-75"></div>
          <div className="relative w-2 h-2 bg-green-500 rounded-full"></div>
        </div>
        
        {/* Connected Badge - No pulse */}
        <Badge className="bg-green-500 hover:bg-green-600 text-white border-green-500">
          {connectedText}
        </Badge>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {/* Static Dot Indicator */}
      <div className="relative flex items-center justify-center">
        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
      </div>
      
      {/* Disconnected Badge - No pulse */}
      <Badge variant="destructive">
        {disconnectedText}
      </Badge>
    </div>
  );
};

/**
 * Simple Pulse Badge - Enhanced version of Badge with pulse
 */
export const PulseBadge = ({ 
  children, 
  pulsing = false, 
  variant = "default",
  color = "green", // green, blue, red, yellow
  className,
  ...props 
}) => {
  const colorClasses = {
    green: {
      ring: "bg-green-400",
      badge: "bg-green-500 hover:bg-green-600 border-green-500"
    },
    blue: {
      ring: "bg-blue-400", 
      badge: "bg-blue-500 hover:bg-blue-600 border-blue-500"
    },
    red: {
      ring: "bg-red-400",
      badge: "bg-red-500 hover:bg-red-600 border-red-500"
    },
    yellow: {
      ring: "bg-yellow-400",
      badge: "bg-yellow-500 hover:bg-yellow-600 border-yellow-500"
    }
  };

  const colors = colorClasses[color] || colorClasses.green;

  if (pulsing) {
    return (
      <div className="relative inline-flex">
        {/* Pulse Ring */}
        <div className={cn("absolute inset-0 rounded-md animate-ping opacity-30", colors.ring)}></div>
        
        {/* Badge */}
        <Badge 
          className={cn("relative text-white", colors.badge, className)}
          {...props}
        >
          {children}
        </Badge>
      </div>
    );
  }

  return (
    <Badge variant={variant} className={className} {...props}>
      {children}
    </Badge>
  );
};

export default StatusIndicator;
