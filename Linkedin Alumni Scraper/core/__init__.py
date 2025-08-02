"""
LinkedIn Alumni Scraper Core Module

This module provides a comprehensive OOP architecture for LinkedIn alumni scraping
with modern design patterns and professional service management capabilities.

Classes:
    ConfigManager: Centralized configuration management
    LinkedInDriver: WebDriver management with anti-detection
    LinkedInAuth: Authentication and login handling  
    ScrapingSession: Session and progress tracking
    LinkedInScraper: Main scraping orchestrator
    ServiceFactory: Dependency injection and service management

Features:
    - Clean separation of concerns architecture
    - Dependency injection with service factory
    - Comprehensive error handling and logging
    - Anti-detection browser automation
    - Professional session management
"""

from core.config import config, ConfigManager
from core.driver import LinkedInDriver
from core.auth import LinkedInAuth
from core.session import ScrapingSession, SessionManager, session_manager
from core.scraper import LinkedInScraper, ClassDetector, ProfileExtractor
from core.login_checker import LoginStatusChecker
from core.data_processor import DataProcessor, data_processor
from core.logging_utils import get_error_logger, get_scraping_logger, scraping_logger, LoggerMixin
from core.factory import (
    ServiceFactory, ServiceContext, service_factory,
    get_scraper, get_driver_manager, get_auth_manager, 
    get_session_manager, cleanup_all, get_service_status
)

__version__ = "2.0.0"
__author__ = "LinkedIn Alumni Scraper Team"

# Public API exports
__all__ = [
    # Core classes
    'ConfigManager',
    'LinkedInDriver', 
    'LinkedInAuth',
    'ScrapingSession',
    'SessionManager',
    'LinkedInScraper',
    'ClassDetector',
    'ProfileExtractor',
    'LoginStatusChecker',
    
    # Factory and dependency injection
    'ServiceFactory',
    'ServiceContext',
    'service_factory',
    
    # Convenience functions
    'get_scraper',
    'get_driver_manager', 
    'get_auth_manager',
    'get_session_manager',
    'cleanup_all',
    'get_service_status',
    
    # Global instances
    'config',
    'session_manager'
]
