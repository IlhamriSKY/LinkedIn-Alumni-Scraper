"""
LinkedIn Authentication Manager

This module handles all authentication-related operations including login, logout,
and session validation with anti-detection measures for the LinkedIn Alumni Scraper.

Classes:
    LinkedInAuth: Main authentication management class

Features:
    - Automated and manual login capabilities
    - Session validation and recovery
    - Anti-detection login patterns
    - Error-only logging for clean output
"""

import os
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException
from typing import Optional

from core.config import config
from core.driver import LinkedInDriver
from core.logging_utils import get_error_logger


class LinkedInAuth:
    """
    Manages LinkedIn authentication operations.
    
    This class provides automated and manual login capabilities with comprehensive
    session validation and recovery mechanisms. It implements anti-detection
    patterns to avoid triggering LinkedIn's security measures.
    
    Attributes:
        driver_manager: WebDriver management instance
        logger: Error-only logger for authentication operations
        
    Methods:
        login: Perform automated login
        manual_login: Guide user through manual login
        is_logged_in: Check current login status
        logout: Perform logout operation
    """
    
    def __init__(self, driver_manager: LinkedInDriver):
        """
        Initialize authentication manager.
        
        Args:
            driver_manager: LinkedInDriver instance for browser operations
        """
        self.driver_manager = driver_manager
        self._logger = get_error_logger("auth")
    
    def is_logged_in(self) -> bool:
        """
        Check if user is currently logged in to LinkedIn.
        
        Returns:
            True if logged in, False otherwise
        """
        try:
            # Navigate to LinkedIn feed to check login status
            if not self.driver_manager.navigate_to("https://www.linkedin.com/feed"):
                return False
            
            driver = self.driver_manager.get_driver()
            current_url = driver.current_url
            
            # Quick check for logged-in URLs
            if "linkedin.com/feed" in current_url or "linkedin.com/in/" in current_url:
                return True
            
            # Try to find elements that only appear when logged in
            try:
                WebDriverWait(driver, 5).until(
                    EC.any_of(
                        EC.presence_of_element_located((By.CLASS_NAME, "global-nav")),
                        EC.presence_of_element_located((By.ID, "global-nav")),
                        EC.presence_of_element_located((By.CSS_SELECTOR, "[data-control-name='nav.settings']"))
                    )
                )
                return True
                
            except TimeoutException:
                return False
                
        except Exception as e:
            self._logger.error(f"Error checking login status: {e}")
            return False
    
    def manual_login(self) -> bool:
        """
        Open LinkedIn login page for manual authentication.
        
        Returns:
            True after opening login page
        """
        try:
            self.driver_manager.navigate_to("https://www.linkedin.com/login")
            print("🔐 Please log in manually in the browser window")
            return True
        except Exception as e:
            self._logger.error(f"Manual login failed: {e}")
            return False
    
    def auto_login(self, email: Optional[str] = None, password: Optional[str] = None) -> bool:
        """
        Attempt automatic login to LinkedIn.
        
        Args:
            email: LinkedIn email (uses config if not provided)
            password: LinkedIn password (uses config if not provided)
            
        Returns:
            True if login successful, False otherwise
        """
        # Use provided credentials or fall back to config
        login_email = email or config.linkedin_email
        login_password = password or config.linkedin_password
        
        if not login_email or not login_password:
            self._logger.error("LinkedIn credentials not found")
            return False
        
        return self._perform_login(login_email, login_password)
    
    def _perform_login(self, email: str, password: str) -> bool:
        """
        Perform the actual login process.
        
        Args:
            email: LinkedIn email
            password: LinkedIn password
            
        Returns:
            True if login successful, False otherwise
        """
        try:
            # Check if already logged in
            if self.is_logged_in():
                return True
            
            driver = self.driver_manager.get_driver()
            
            if not self.driver_manager.navigate_to("https://www.linkedin.com/login"):
                return False
            
            # Wait for login page to load
            try:
                WebDriverWait(driver, 5).until(
                    EC.presence_of_element_located((By.ID, "username"))
                )
            except TimeoutException:
                self._logger.error("Login page did not load properly")
                return False
            
            # Handle any existing popups
            self._dismiss_popups(driver)
            
            # Enter credentials
            try:
                username_field = driver.find_element(By.ID, "username")
                password_field = driver.find_element(By.ID, "password")
                
                # Type credentials with human-like behavior
                self.driver_manager.type_like_human(username_field, email, fast_mode=True)
                self.driver_manager.random_delay('action', fast_mode=True)
                
                self.driver_manager.type_like_human(password_field, password, fast_mode=True)
                self.driver_manager.random_delay('action', fast_mode=True)
                
            except Exception as e:
                self._logger.error(f"Could not enter credentials: {e}")
                return False
            
            # Submit login form
            try:
                login_button = driver.find_element(By.XPATH, "//button[@type='submit']")
                login_button.click()
                
            except Exception as e:
                self._logger.error(f"Could not submit login form: {e}")
                return False
            
            # Wait for login to complete and verify
            return self._verify_login_success(driver)
            
        except Exception as e:
            print(f"[ERROR] Unexpected error during login: {e}")
            self._logger.error(f"Unexpected error during login: {e}")
            return False
    
    def _dismiss_popups(self, driver):
        """Dismiss any Chrome popups or notifications."""
        try:
            driver.execute_script("""
                // Try to dismiss various Chrome popups
                const popups = document.querySelectorAll('[role="dialog"], .save-password-bubble, [data-testid="save-password-bubble"]');
                popups.forEach(popup => {
                    const neverButton = popup.querySelector('[data-tooltip="Never"], button[data-tooltip="Not now"], .never-button');
                    if (neverButton) neverButton.click();
                });
            """)
            self.driver_manager.random_delay('action', fast_mode=True)
        except Exception:
            pass  # Ignore popup dismissal errors
    
    def _verify_login_success(self, driver, max_attempts: int = 3) -> bool:
        """
        Verify that login was successful.
        
        Args:
            driver: WebDriver instance
            max_attempts: Maximum verification attempts
            
        Returns:
            True if login successful, False otherwise
        """
        for attempt in range(max_attempts):
            try:
                # Wait for login success indicators
                WebDriverWait(driver, 10).until(
                    EC.any_of(
                        EC.presence_of_element_located((By.CLASS_NAME, "global-nav")),
                        EC.presence_of_element_located((By.ID, "global-nav")),
                        EC.url_contains("feed"),
                        EC.url_contains("mynetwork"),
                        EC.url_contains("learning"),
                        EC.presence_of_element_located((By.CSS_SELECTOR, "[data-control-name='nav.settings']"))
                    )
                )
                print("[SUCCESS] Login successful!")
                return True
                
            except TimeoutException:
                current_url = driver.current_url
                print(f"[DEBUG] Current URL: {current_url}")
                
                if "challenge" in current_url:
                    print("[WARNING] LinkedIn security challenge detected")
                    print("[INFO] Please complete the security challenge manually and then continue")
                    return False
                    
                elif "checkpoint" in current_url:
                    print("[WARNING] LinkedIn checkpoint detected")
                    print("[INFO] Please complete the checkpoint manually and then continue")
                    return False
                    
                elif "login" in current_url:
                    print(f"[WARNING] Still on login page after attempt {attempt + 1}")
                    if attempt < max_attempts - 1:
                        self.driver_manager.random_delay('action', fast_mode=True)
                        continue
                        
                else:
                    # Check if we're actually logged in but page is still loading
                    try:
                        if driver.find_element(By.CSS_SELECTOR, "[data-control-name='nav.settings']"):
                            print("[SUCCESS] Login successful (found nav element)!")
                            return True
                    except Exception:
                        pass
                    
                    print(f"[WARNING] Unexpected URL: {current_url}")
                    if attempt < max_attempts - 1:
                        self.driver_manager.random_delay('action', fast_mode=True)
                        continue
        
        print("[ERROR] Login verification failed after all attempts")
        self._logger.error("Login verification failed after all attempts")
        return False
    
    def ensure_logged_in(self) -> bool:
        """
        Ensure user is logged in, attempting auto-login if necessary.
        
        Returns:
            True if logged in successfully, False otherwise
        """
        try:
            if self.is_logged_in():
                print("[OK] Already logged in")
                return True
            
            print("[INFO] Not logged in, attempting auto-login...")
            return self.auto_login()
            
        except Exception as e:
            print(f"[ERROR] Error ensuring login: {e}")
            self._logger.error(f"Error ensuring login: {e}")
            return False
    
    def open_linkedin_login(self) -> dict:
        """
        Navigate to LinkedIn login page.
        
        Returns:
            Result dictionary with success status and message
        """
        try:
            if self.driver_manager.navigate_to("https://www.linkedin.com/login"):
                return {
                    'success': True,
                    'message': 'LinkedIn login page opened successfully'
                }
            else:
                return {
                    'success': False,
                    'message': 'Failed to open LinkedIn login page'
                }
        except Exception as e:
            return {
                'success': False,
                'message': f'Error opening LinkedIn login page: {str(e)}'
            }
