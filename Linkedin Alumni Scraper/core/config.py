"""
LinkedIn Configuration Manager

This module handles all configuration settings, environment variables, and constants
required for the LinkedIn Alumni Scraper application with centralized management capabilities.

Classes:
    ConfigManager: Main configuration management class

Features:
    - Environment variable loading and validation
    - Secure credential handling with masking
    - Chrome browser options configuration
    - University-specific settings management
    - Comprehensive delay and timing configurations
"""

import os
from typing import Dict, Tuple, Optional
from dotenv import load_dotenv


class ConfigManager:
    """
    Centralized configuration management for the LinkedIn Alumni Scraper.
    
    This class manages environment variables, delay configurations, file paths,
    and other application settings in a clean, organized manner. It provides
    secure handling of credentials and environment-specific configurations.
    
    Attributes:
        script_dir (str): Base directory path
        data_dir (str): Data directory path
        results_dir (str): Results directory path
        driver_path (str): Chrome driver path
        linkedin_email (str): LinkedIn login email
        linkedin_password (str): LinkedIn login password
        delay_config (dict): Timing configuration settings
    """
    
    def __init__(self):
        """Initialize configuration manager and load environment variables."""
        load_dotenv()
        self._script_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        self._setup_paths()
        self._setup_credentials()
        self._setup_university_info()
    
    def _setup_paths(self):
        """Setup all file and directory paths."""
        self.script_dir = self._script_dir
        self.logs_dir = os.path.join(self._script_dir, "logs")
        self.data_dir = os.path.join(self._script_dir, "data")
        self.frontend_dir = os.path.join(self._script_dir, "frontend")
        
        # Data files
        self.names_file = os.path.join(self.data_dir, "person_locations", "indonesia_names.csv")
        self.default_output_file = os.path.join(self.data_dir, "Linkedin_SCU_Alumni_2025.csv")
        self.results_dir = os.path.join(self.data_dir, "scraping_result")
        
        # Ensure directories exist
        os.makedirs(self.logs_dir, exist_ok=True)
        os.makedirs(self.results_dir, exist_ok=True)
    
    def _setup_credentials(self):
        """Setup LinkedIn credentials with masking for security."""
        self.linkedin_email = os.getenv('LINKEDIN_EMAIL')
        self.linkedin_password = os.getenv('LINKEDIN_PASSWORD')
        self.secret_key = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')
        
        # Masked email for display
        self.masked_email = self._mask_email(self.linkedin_email)
    
    def _setup_university_info(self):
        """Setup university-specific configuration."""
        self.university_name = os.getenv('UNIVERSITY_NAME', 'Default University')
        self.university_linkedin_id = os.getenv('UNIVERSITY_LINKEDIN_ID', 'default-id')
    
    def _mask_email(self, email: Optional[str]) -> str:
        """
        Mask email for secure display.
        
        Args:
            email: Email address to mask
            
        Returns:
            Masked email string
        """
        if not email or '@' not in email:
            return 'Email not configured in .env'
        
        username, domain = email.split('@', 1)
        if len(username) <= 2:
            masked_username = username[0] + '*'
        else:
            masked_username = username[0] + '*' * (len(username) - 2) + username[-1]
        
        return f"{masked_username}@{domain}"
    
    def get_delay_config(self, delay_type: str, fast_mode: bool = False) -> Tuple[float, float]:
        """
        Get delay configuration for anti-bot detection.
        
        Args:
            delay_type: Type of delay ('action', 'typing', 'scroll', 'click', 'page_load')
            fast_mode: If True, use faster delays for better user experience
            
        Returns:
            Tuple of (min_delay, max_delay) in seconds
        """
        if fast_mode:
            delay_configs = {
                'action': (0.3, 0.8),
                'typing': (0.02, 0.05),
                'scroll': (0.5, 1.0),
                'click': (0.2, 0.5),
                'page_load': (1.0, 2.0)
            }
        else:
            delay_configs = {
                'action': (float(os.getenv('MIN_ACTION_DELAY', 2)), float(os.getenv('MAX_ACTION_DELAY', 5))),
                'typing': (float(os.getenv('MIN_TYPING_DELAY', 0.05)), float(os.getenv('MAX_TYPING_DELAY', 0.2))),
                'scroll': (float(os.getenv('MIN_SCROLL_DELAY', 1.5)), float(os.getenv('MAX_SCROLL_DELAY', 4))),
                'click': (float(os.getenv('MIN_CLICK_DELAY', 0.8)), float(os.getenv('MAX_CLICK_DELAY', 2))),
                'page_load': (float(os.getenv('MIN_PAGE_LOAD_DELAY', 3)), float(os.getenv('MAX_PAGE_LOAD_DELAY', 7)))
            }
        
        return delay_configs.get(delay_type, (0.5, 1.0) if fast_mode else (2, 5))
    
    def get_chrome_options(self) -> list:
        """
        Get Chrome browser options for anti-detection.
        
        Returns:
            List of Chrome options
        """
        return [
            "--disable-popup-blocking",
            "--disable-software-rasterizer", 
            "--disable-dev-shm-usage",
            "--no-sandbox",
            "--start-maximized",
            "--lang=en-US,en",
            "--disable-web-security",
            "--disable-features=VizDisplayCompositor",
            "--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
            "--disable-extensions",
            "--disable-plugins"
        ]
    
    def get_chrome_prefs(self) -> Dict:
        """
        Get Chrome preferences for anti-detection.
        
        Returns:
            Dictionary of Chrome preferences
        """
        return {
            "credentials_enable_service": False,
            "profile.password_manager_enabled": False,
            "profile.default_content_setting_values.notifications": 2
        }
    
    @property
    def cors_origins(self) -> list:
        """Get CORS allowed origins for Flask app."""
        return [
            "http://localhost:3000",
            "http://127.0.0.1:3000", 
            "http://localhost:5173",
            "http://127.0.0.1:5173"
        ]
    
    def validate_credentials(self) -> bool:
        """
        Validate if LinkedIn credentials are configured.
        
        Returns:
            True if credentials are valid, False otherwise
        """
        return bool(self.linkedin_email and self.linkedin_password)
    
    def get_university_search_url(self, keyword: str) -> str:
        """
        Get LinkedIn university search URL for a keyword.
        
        Args:
            keyword: Search keyword/name
            
        Returns:
            Complete LinkedIn search URL
        """
        return f"https://www.linkedin.com/school/{self.university_linkedin_id}/people/?keywords={keyword}"

    def get(self, key: str, default: Optional[str] = None) -> Optional[str]:
        """
        Get configuration value by key.
        
        Args:
            key: Configuration key
            default: Default value if key not found
            
        Returns:
            Configuration value or default
        """
        # First check environment variables
        env_value = os.getenv(key)
        if env_value is not None:
            return env_value
            
        # Then check instance attributes
        if hasattr(self, key.lower()):
            return getattr(self, key.lower())
            
        # Common mappings for test compatibility
        key_mappings = {
            'FLASK_PORT': '5000',
            'MAX_PROFILES': '10',
            'SCRIPT_DIR': self.script_dir,
            'LINKEDIN_EMAIL': self.linkedin_email,
            'LINKEDIN_PASSWORD': self.linkedin_password,
            'UNIVERSITY_NAME': self.university_name,
            'UNIVERSITY_LINKEDIN_ID': self.university_linkedin_id
        }
        
        return key_mappings.get(key, default)

    def validate(self) -> bool:
        """
        Validate configuration settings.
        
        Returns:
            True if configuration is valid, False otherwise
        """
        return self.validate_credentials()


# Global configuration instance
config = ConfigManager()
