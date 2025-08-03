"""
LinkedIn WebDriver Manager

This module handles all browser-related operations with anti-detection measures
for the LinkedIn Alumni Scraper application. It provides secure browser automation
with human-like interaction patterns to avoid detection.

Classes:
    LinkedInDriver: Main WebDriver management class

Features:
    - Anti-detection browser configuration
    - Human-like interaction delays
    - Automatic session recovery
    - Singleton pattern for resource management
"""

import time
import random
import logging
import undetected_chromedriver as uc
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import WebDriverException, TimeoutException
from typing import Optional, Tuple
from datetime import datetime

from core.config import config


class LinkedInDriver:
    """
    Manages Chrome WebDriver instance with anti-detection capabilities.
    
    This class provides a singleton pattern for browser management, automatic 
    session recovery, and human-like interaction delays to avoid bot detection.
    It handles all low-level browser operations required for LinkedIn scraping.
    
    Attributes:
        _driver: Chrome WebDriver instance
        _driver_initialized: Driver initialization status
        _logger: Logger instance for driver operations
    
    Methods:
        get_driver: Get or create WebDriver instance
        quit_driver: Safely quit the WebDriver
        navigate_to: Navigate to specified URL
        wait_for_element: Wait for element to be present
        human_delay: Add human-like delays
    """
    
    def __init__(self):
        """Initialize the driver manager."""
        self._driver: Optional[webdriver.Chrome] = None
        self._driver_initialized = False
        self._logger = self._setup_logger()
    
    def _setup_logger(self) -> logging.Logger:
        """Setup logger for driver operations."""
        log_file = config.logs_dir + f"/driver_{datetime.now().strftime('%Y%m%d')}.log"
        
        logging.basicConfig(
            level=logging.ERROR,
            format='%(asctime)s | %(levelname)s | [DRIVER] %(message)s',
            handlers=[logging.FileHandler(log_file, encoding='utf-8')]
        )
        
        return logging.getLogger(f"{__name__}.LinkedInDriver")
    
    @property
    def driver(self) -> Optional[webdriver.Chrome]:
        """Get the current driver instance."""
        return self._driver
    
    def get_driver(self) -> webdriver.Chrome:
        """
        Get or initialize the WebDriver instance.
        
        Returns:
            Chrome WebDriver instance
            
        Raises:
            WebDriverException: If driver initialization fails
        """
        if self._driver is None or not self._driver_initialized:
            return self._initialize_driver()
        
        # Test if existing driver is still alive
        if not self._is_driver_alive():
            self._logger.warning("Existing driver session is dead, creating new one")
            return self._recover_session()
        
        return self._driver
    
    def _initialize_driver(self) -> webdriver.Chrome:
        """
        Initialize a new Chrome WebDriver instance.
        
        Returns:
            Configured Chrome WebDriver
            
        Raises:
            WebDriverException: If initialization fails
        """
        try:
            options = uc.ChromeOptions()
            
            # Add Chrome options
            for option in config.get_chrome_options():
                options.add_argument(option)
            
            # Add preferences
            options.add_experimental_option("prefs", config.get_chrome_prefs())
            
            # Initialize undetected Chrome
            self._driver = uc.Chrome(options=options, version_main=None)
            self._driver_initialized = True
            
            print("[OK] Browser initialized successfully")
            return self._driver
            
        except Exception as e:
            self._logger.error(f"Failed to initialize driver: {e}")
            raise WebDriverException(f"Driver initialization failed: {e}")
    
    def _is_driver_alive(self) -> bool:
        """
        Check if the current driver session is alive and responsive.
        Uses a safer method that doesn't trigger page refresh.
        
        Returns:
            True if driver is alive, False otherwise
        """
        if not self._driver or not self._driver_initialized:
            return False
        
        try:
            # Use window_handles instead of current_url to avoid triggering refresh
            # This is a safer check that doesn't interact with the page content
            _ = self._driver.window_handles
            return True
        except Exception:
            return False
    
    def _recover_session(self) -> webdriver.Chrome:
        """
        Recover from a dead driver session.
        
        Returns:
            New driver instance
        """
        self._logger.warning("Attempting driver session recovery")
        
        try:
            if self._driver:
                self._driver.quit()
        except Exception:
            pass
        
        self._driver = None
        self._driver_initialized = False
        
        return self._initialize_driver()
    
    def navigate_to(self, url: str, wait_for_load: bool = True) -> bool:
        """
        Navigate to a specific URL with error handling.
        
        Args:
            url: URL to navigate to
            wait_for_load: Whether to wait for page load
            
        Returns:
            True if navigation successful, False otherwise
        """
        try:
            driver = self.get_driver()
            driver.get(url)
            
            if wait_for_load:
                self.random_delay('page_load')
            
            return True
            
        except Exception as e:
            self._logger.error(f"Navigation to {url} failed: {e}")
            return False
    
    def random_delay(self, delay_type: str = 'action', fast_mode: bool = False) -> float:
        """
        Apply random delay to simulate human behavior.
        
        Args:
            delay_type: Type of delay to apply
            fast_mode: Use shorter delays if True
            
        Returns:
            Actual delay used in seconds
        """
        min_delay, max_delay = config.get_delay_config(delay_type, fast_mode)
        delay = random.uniform(min_delay, max_delay)
        time.sleep(delay)
        return delay
    
    def type_like_human(self, element, text: str, fast_mode: bool = False):
        """
        Simulate human-like typing with random delays.
        
        Args:
            element: WebElement to type into
            text: Text to type
            fast_mode: Use shorter delays if True
        """
        element.clear()
        min_delay, max_delay = config.get_delay_config('typing', fast_mode)
        
        for char in text:
            element.send_keys(char)
            time.sleep(random.uniform(min_delay, max_delay))
    
    def wait_for_element(self, locator: Tuple[str, str], timeout: int = 10):
        """
        Wait for an element to be present and return it.
        
        Args:
            locator: Tuple of (By.TYPE, value)
            timeout: Maximum wait time in seconds
            
        Returns:
            WebElement if found
            
        Raises:
            TimeoutException: If element not found within timeout
        """
        driver = self.get_driver()
        wait = WebDriverWait(driver, timeout)
        return wait.until(EC.presence_of_element_located(locator))
    
    def scroll_page(self, max_clicks: int = 10) -> bool:
        """
        Scroll page to load more content.
        
        Args:
            max_clicks: Maximum scroll attempts
            
        Returns:
            True if scrolling completed successfully
        """
        try:
            driver = self.get_driver()
            
            for _ in range(max_clicks):
                # Scroll down
                driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
                self.random_delay('scroll')
                
                # Look for "Show more" button
                try:
                    show_more_btn = driver.find_element(By.XPATH, "//button[contains(text(), 'Show more')]")
                    if show_more_btn.is_displayed():
                        show_more_btn.click()
                        self.random_delay('click')
                except Exception:
                    pass
            
            return True
            
        except Exception as e:
            self._logger.error(f"Page scrolling failed: {e}")
            return False
    
    def get_page_source(self) -> str:
        """
        Get current page source safely.
        
        Returns:
            Page source HTML or empty string if failed
        """
        try:
            driver = self.get_driver()
            return driver.page_source
        except Exception as e:
            self._logger.error(f"Failed to get page source: {e}")
            return ""
    
    def close_extra_tabs(self):
        """Close all tabs except the main one."""
        try:
            driver = self.get_driver()
            
            if len(driver.window_handles) > 1:
                main_window = driver.window_handles[0]
                
                for handle in driver.window_handles[1:]:
                    driver.switch_to.window(handle)
                    driver.close()
                
                driver.switch_to.window(main_window)
                print(f"[OK] Closed {len(driver.window_handles) - 1} extra tabs")
                
        except Exception as e:
            self._logger.error(f"Failed to close extra tabs: {e}")
    
    def is_browser_responsive(self) -> bool:
        """
        Check if browser is responsive without triggering refresh.
        Uses safe operations that don't interact with page content.
        
        Returns:
            True if browser is responsive, False otherwise
        """
        try:
            if not self._driver or not self._driver_initialized:
                return False
            
            # Safe check - get window handles (doesn't interact with page)
            handles = self._driver.window_handles
            
            # Check if we have at least one window
            if not handles:
                return False
            
            # Try to get window size (safe operation)
            try:
                _ = self._driver.get_window_size()
                return True
            except Exception:
                return False
                
        except Exception as e:
            self._logger.debug(f"Browser responsiveness check failed: {e}")
            return False

    def get_status(self) -> dict:
        """
        Get current browser status.
        
        Returns:
            Dictionary with status information
        """
        try:
            if not self._driver or not self._driver_initialized:
                return {
                    'status': 'not_initialized',
                    'is_alive': False,
                    'current_url': None,
                    'window_count': 0
                }
            
            is_alive = self.is_browser_responsive()  # Use safer method
            
            if is_alive:
                # Get current_url safely without triggering refresh
                try:
                    current_url = self._driver.current_url
                except Exception as url_error:
                    # If current_url fails, don't fail the entire status check
                    self._logger.warning(f"Could not get current URL: {url_error}")
                    current_url = "unknown"
                
                return {
                    'status': 'active',
                    'is_alive': True,
                    'current_url': current_url,
                    'window_count': len(self._driver.window_handles)
                }
            else:
                return {
                    'status': 'dead',
                    'is_alive': False,
                    'current_url': None,
                    'window_count': 0
                }
                
        except Exception as e:
            self._logger.error(f"Failed to get status: {e}")
            return {
                'status': 'error',
                'is_alive': False,
                'current_url': None,
                'window_count': 0,
                'error': str(e)
            }
    
    def cleanup(self):
        """Clean up the driver and close browser."""
        try:
            if self._driver:
                self.close_extra_tabs()
                self._driver.quit()
                print("[OK] Browser session terminated")
        except Exception as e:
            self._logger.warning(f"Error during cleanup: {e}")
        finally:
            self._driver = None
            self._driver_initialized = False
