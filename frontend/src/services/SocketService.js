/**
 * Socket.IO Service Singleton
 * Ensures only one socket connection across the entire application
 */

import io from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.listeners = new Map();
    this.initialized = false;
    
    // Prevent multiple instances during development HMR
    if (window.socketServiceInstance) {
      return window.socketServiceInstance;
    }
    window.socketServiceInstance = this;
  }

  // Get or create singleton socket instance
  getSocket() {
    if (!this.socket || this.socket.disconnected) {
      // Only create one connection
      if (this.initialized) {
        return this.socket;
      }
      
      console.log('Creating new socket connection...');
      this.socket = io(SOCKET_URL, {
        autoConnect: true,
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
        timeout: 20000,
        forceNew: false, // Reuse existing connection if possible
      });

      this.initialized = true;

      // Handle connection events
      this.socket.on('connect', () => {
        console.log('Socket connected:', this.socket.id);
        this.isConnected = true;
      });

      this.socket.on('disconnect', () => {
        console.log('Socket disconnected');
        this.isConnected = false;
      });

      this.socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        this.isConnected = false;
      });
    }

    return this.socket;
  }

  // Add event listener with automatic cleanup tracking
  on(event, callback, componentId = 'default') {
    const socket = this.getSocket();
    
    // Prevent duplicate listeners for the same component and event
    const listenerKey = `${componentId}-${event}`;
    
    // Track listeners for cleanup
    if (!this.listeners.has(componentId)) {
      this.listeners.set(componentId, new Map());
    }
    
    const componentListeners = this.listeners.get(componentId);
    
    // Remove existing listener if any
    if (componentListeners.has(event)) {
      const oldCallback = componentListeners.get(event);
      socket.off(event, oldCallback);
    }
    
    // Add new listener
    componentListeners.set(event, callback);
    socket.on(event, callback);
    
    console.log(`Added listener for ${componentId}: ${event}`);
  }

  // Remove all listeners for a specific component
  removeListeners(componentId) {
    if (this.listeners.has(componentId)) {
      const socket = this.getSocket();
      const componentListeners = this.listeners.get(componentId);
      
      componentListeners.forEach((callback, event) => {
        socket.off(event, callback);
      });
      
      this.listeners.delete(componentId);
      console.log(`Cleaned up listeners for component: ${componentId}`);
    }
  }

  // Emit event
  emit(event, data) {
    const socket = this.getSocket();
    socket.emit(event, data);
  }

  // Check connection status
  isSocketConnected() {
    return this.socket && this.socket.connected;
  }

  // Disconnect socket
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.isConnected = false;
      this.initialized = false;
    }
  }

  // Clean up all listeners and disconnect
  cleanup() {
    this.listeners.clear();
    this.disconnect();
    this.socket = null;
    if (window.socketServiceInstance === this) {
      delete window.socketServiceInstance;
    }
  }
}

// Export singleton instance
const socketService = new SocketService();
export default socketService;
