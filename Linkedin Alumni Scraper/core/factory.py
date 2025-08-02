"""
LinkedIn Alumni Scraper Service Factory

This module provides centralized dependency injection and service management
for clean architecture design with enhanced testability and maintainability.

Classes:
    ServiceFactory: Main factory for creating and managing service instances
    ServiceContext: Context manager for service lifecycle

Features:
    - Dependency injection with singleton pattern
    - Thread-safe service management
    - Comprehensive lifecycle management
    - Advanced service health monitoring
    - Professional error handling and cleanup
"""

from typing import Dict, Any, Optional
import threading

from .config import config, ConfigManager
from .driver import LinkedInDriver
from .auth import LinkedInAuth
from .session import ScrapingSession, SessionManager, session_manager
from .scraper import LinkedInScraper, ClassDetector, ProfileExtractor


class ServiceFactory:
    """
    Factory class for creating and managing service instances.
    
    Implements singleton pattern to ensure single instances of services
    and provides dependency injection for clean architecture.
    """
    
    _instance = None
    _lock = threading.Lock()
    _services: Dict[str, Any] = {}
    
    def __new__(cls):
        """Ensure singleton pattern."""
        if not cls._instance:
            with cls._lock:
                if not cls._instance:
                    cls._instance = super().__new__(cls)
        return cls._instance
    
    def __init__(self):
        """Initialize service factory."""
        if not hasattr(self, '_initialized'):
            self._initialized = True
            self._services = {}
    
    def get_config_manager(self) -> ConfigManager:
        """Get or create ConfigManager instance."""
        if 'config_manager' not in self._services:
            self._services['config_manager'] = config
        return self._services['config_manager']
    
    def get_driver_manager(self) -> LinkedInDriver:
        """Get or create LinkedInDriver instance."""
        if 'driver_manager' not in self._services:
            self._services['driver_manager'] = LinkedInDriver()
        return self._services['driver_manager']
    
    def get_auth_manager(self) -> LinkedInAuth:
        """Get or create LinkedInAuth instance."""
        if 'auth_manager' not in self._services:
            driver_manager = self.get_driver_manager()
            self._services['auth_manager'] = LinkedInAuth(driver_manager)
        return self._services['auth_manager']
    
    def get_session_manager(self) -> SessionManager:
        """Get or create SessionManager instance."""
        if 'session_manager' not in self._services:
            self._services['session_manager'] = session_manager
        return self._services['session_manager']
    
    def get_class_detector(self) -> ClassDetector:
        """Get or create ClassDetector instance."""
        if 'class_detector' not in self._services:
            driver_manager = self.get_driver_manager()
            self._services['class_detector'] = ClassDetector(driver_manager)
        return self._services['class_detector']
    
    def get_profile_extractor(self) -> ProfileExtractor:
        """Get or create ProfileExtractor instance."""
        if 'profile_extractor' not in self._services:
            driver_manager = self.get_driver_manager()
            self._services['profile_extractor'] = ProfileExtractor(driver_manager)
        return self._services['profile_extractor']
    
    def get_scraper(self) -> LinkedInScraper:
        """Get or create LinkedInScraper instance."""
        if 'scraper' not in self._services:
            self._services['scraper'] = LinkedInScraper()
        return self._services['scraper']
    
    def create_scraping_session(self) -> ScrapingSession:
        """Create a new scraping session."""
        session_manager = self.get_session_manager()
        return session_manager.create_session()
    
    def cleanup_all_services(self):
        """Clean up all services and release resources."""
        try:
            # Clean up driver manager if exists
            if 'driver_manager' in self._services:
                self._services['driver_manager'].cleanup()
            
            # Clean up scraper if exists
            if 'scraper' in self._services:
                self._services['scraper'].cleanup()
            
            # Clear all services
            self._services.clear()
            
        except Exception as e:
            print(f"[ERROR] Error during service cleanup: {e}")
    
    def get_service_status(self) -> Dict[str, bool]:
        """Get status of all registered services."""
        status = {}
        for service_name in self._services:
            try:
                service = self._services[service_name]
                # Check if service has a health check method
                if hasattr(service, 'is_healthy'):
                    status[service_name] = service.is_healthy()
                else:
                    status[service_name] = service is not None
            except Exception:
                status[service_name] = False
        
        return status
    
    def reset_factory(self):
        """Reset factory - mainly for testing purposes."""
        with self._lock:
            self.cleanup_all_services()
            self._services = {}


class ServiceContext:
    """
    Context manager for automatic service cleanup.
    
    Provides a convenient way to ensure proper resource cleanup
    when using services in a context block.
    """
    
    def __init__(self):
        """Initialize service context."""
        self.factory = ServiceFactory()
    
    def __enter__(self):
        """Enter context and return factory."""
        return self.factory
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        """Exit context and cleanup all services."""
        self.factory.cleanup_all_services()


# Global factory instance
service_factory = ServiceFactory()


# Convenience functions for easy access
def get_scraper() -> LinkedInScraper:
    """Get the main scraper instance."""
    return service_factory.get_scraper()

def get_driver_manager() -> LinkedInDriver:
    """Get the driver manager instance."""
    return service_factory.get_driver_manager()

def get_auth_manager() -> LinkedInAuth:
    """Get the authentication manager instance."""
    return service_factory.get_auth_manager()

def get_session_manager() -> SessionManager:
    """Get the session manager instance."""
    return service_factory.get_session_manager()

def cleanup_all() -> None:
    """Clean up all services."""
    service_factory.cleanup_all_services()

def get_service_status() -> Dict[str, bool]:
    """Get status of all services."""
    return service_factory.get_service_status()
