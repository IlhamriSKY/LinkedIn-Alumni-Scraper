"""
LinkedIn Alumni Scraper Logging Utilities

This module provides centralized logging configuration focused on errors and 
scraping progress tracking for the LinkedIn Alumni Scraper application.

Classes:
    LoggerMixin: Mixin class for adding logging capabilities to other classes
    ScrapingLogger: Specialized logger for scraping progress tracking

Features:
    - Error-focused logging configuration
    - Scraping progress tracking and reporting
    - Clean console output with minimal noise
    - File-based error logging for debugging
    - Real-time scraping status updates
"""

import logging
import os
from datetime import datetime
from typing import Optional, Dict, Any

from .config import config


def setup_minimal_logger(component_name: str, show_scraping_progress: bool = False) -> logging.Logger:
    """
    Setup minimal logger focused on errors and scraping progress only.
    
    Args:
        component_name: Name of the component for log identification
        show_scraping_progress: Whether to show scraping progress messages
        
    Returns:
        Configured logger instance
    """
    # Ensure logs directory exists
    if not os.path.exists(config.logs_dir):
        try:
            os.makedirs(config.logs_dir, exist_ok=True)
        except OSError:
            config.logs_dir = "."
    
    # Create log file for errors only
    error_log_file = os.path.join(
        config.logs_dir,
        f"errors_{datetime.now().strftime('%Y%m%d')}.log"
    )
    
    # Create logger
    logger = logging.getLogger(f"linkedin_scraper.{component_name}")
    
    # Remove existing handlers to avoid duplicates
    for handler in logger.handlers[:]:
        logger.removeHandler(handler)
    
    # Set logging level based on component
    if component_name in ['scraper', 'session'] or show_scraping_progress:
        logger.setLevel(logging.INFO)
    else:
        logger.setLevel(logging.ERROR)
    
    # Error file handler - only logs errors to file
    error_file_handler = logging.FileHandler(error_log_file, encoding='utf-8')
    error_file_handler.setLevel(logging.ERROR)
    error_file_handler.setFormatter(
        logging.Formatter('%(asctime)s | ERROR | [%(name)s] %(message)s')
    )
    logger.addHandler(error_file_handler)
    
    # Console handler - errors and scraping progress only
    console_handler = logging.StreamHandler()
    if show_scraping_progress:
        console_handler.setLevel(logging.INFO)
        console_handler.setFormatter(
            logging.Formatter('%(message)s')  # Clean format for progress
        )
    else:
        console_handler.setLevel(logging.ERROR)
        console_handler.setFormatter(
            logging.Formatter('❌ [%(name)s] %(message)s')  # Clear error format
        )
    
    logger.addHandler(console_handler)
    logger.propagate = False  # Prevent duplicate logs
    
    return logger


class ScrapingLogger:
    """
    Specialized logger for scraping progress tracking with clean output.
    """
    
    def __init__(self, component_name: str = 'scraper'):
        """Initialize scraping logger."""
        self.logger = setup_minimal_logger(component_name, show_scraping_progress=True)
        self.current_profile = None
        self.total_profiles = 0
        self.completed_profiles = 0
    
    def start_scraping_session(self, total_profiles: int, session_info: str = ""):
        """Log the start of a scraping session."""
        self.total_profiles = total_profiles
        self.completed_profiles = 0
        print(f"🚀 Starting scraping session: {session_info}")
        print(f"📊 Target profiles: {total_profiles}")
        print("─" * 60)
    
    def start_profile_scraping(self, profile_name: str, profile_index: int):
        """Log the start of individual profile scraping."""
        self.current_profile = profile_name
        progress_percent = (profile_index / self.total_profiles * 100) if self.total_profiles > 0 else 0
        print(f"👤 [{profile_index:3d}/{self.total_profiles}] ({progress_percent:5.1f}%) Scraping: {profile_name}")
    
    def profile_completed(self, profile_name: str, found_profiles: int):
        """Log completion of profile scraping."""
        self.completed_profiles += 1
        if found_profiles > 0:
            print(f"✅ Found {found_profiles} profiles for '{profile_name}'")
        else:
            print(f"⚠️  No profiles found for '{profile_name}'")
    
    def profile_error(self, profile_name: str, error_message: str):
        """Log profile scraping error."""
        print(f"❌ Error scraping '{profile_name}': {error_message}")
        self.logger.error(f"Profile scraping error - {profile_name}: {error_message}")
    
    def scraping_status(self, current_action: str):
        """Log current scraping action."""
        if self.current_profile:
            print(f"   🔄 {current_action}...")
    
    def session_complete(self, successful: int, failed: int, total_time: str):
        """Log session completion."""
        print("─" * 60)
        print(f"🎉 Scraping session completed!")
        print(f"✅ Successful: {successful}")
        print(f"❌ Failed: {failed}")
        print(f"⏱️  Total time: {total_time}")
        print("─" * 60)
    
    def data_saved(self, file_path: str, record_count: int):
        """Log data saving."""
        print(f"💾 Data saved: {record_count} records → {file_path}")
    
    def error(self, message: str):
        """Log error message."""
        print(f"❌ {message}")
        self.logger.error(message)


def get_error_logger(component_name: str) -> logging.Logger:
    """
    Get error-only logger for a component.
    
    Args:
        component_name: Component identifier
        
    Returns:
        Logger instance configured for errors only
    """
    return setup_minimal_logger(component_name, show_scraping_progress=False)


def get_scraping_logger() -> ScrapingLogger:
    """
    Get specialized scraping progress logger.
    
    Returns:
        ScrapingLogger instance for progress tracking
    """
    return ScrapingLogger()


class LoggerMixin:
    """
    Mixin class to add minimal logging capability to any class.
    
    Usage:
        class MyClass(LoggerMixin):
            def __init__(self):
                super().__init__()
                self._init_logger('MyClass')
    """
    
    def _init_logger(self, component_name: str, show_progress: bool = False) -> None:
        """Initialize minimal logger for the class."""
        self._logger = setup_minimal_logger(component_name, show_progress)
        self._component_name = component_name
    
    def log_error(self, message: str) -> None:
        """Log error message (always shown)."""
        if hasattr(self, '_logger'):
            self._logger.error(message)
    
    def log_progress(self, message: str) -> None:
        """Log progress message (only for scraping components)."""
        if hasattr(self, '_logger') and self._component_name in ['scraper', 'session']:
            self._logger.info(message)
    
    def log_critical(self, message: str) -> None:
        """Log critical error message."""
        if hasattr(self, '_logger'):
            self._logger.critical(message)

# Global scraping logger instance
scraping_logger = ScrapingLogger()
