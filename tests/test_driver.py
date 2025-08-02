"""
Unit Tests for Driver Module

Comprehensive test suite for LinkedInDriver management and browser automation functionality.
Tests Chrome WebDriver initialization, configuration, anti-detection measures, and lifecycle management.
"""

import unittest
from unittest.mock import Mock, patch, MagicMock, PropertyMock
import sys
import os
import time
import tempfile
import shutil

# Add project path
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, PROJECT_ROOT)
sys.path.insert(0, os.path.join(PROJECT_ROOT, 'Linkedin Alumni Scraper'))
sys.path.insert(0, os.path.join(PROJECT_ROOT, 'Linkedin Alumni Scraper', 'core'))

from core.driver import LinkedInDriver


class TestLinkedInDriver(unittest.TestCase):
    """Test cases for LinkedInDriver class and WebDriver functionality."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.driver_manager = LinkedInDriver()
    
    def tearDown(self):
        """Clean up test fixtures."""
        try:
            if hasattr(self.driver_manager, '_driver') and self.driver_manager._driver:
                self.driver_manager.cleanup()
        except:
            pass
    
    @patch('driver.uc.Chrome')
    @patch('driver.uc.ChromeOptions')
    def test_initialize_driver_success(self, mock_options, mock_chrome):
        """Test successful WebDriver initialization."""
        # Mock Chrome options
        mock_options_instance = Mock()
        mock_options.return_value = mock_options_instance
        
        # Mock Chrome driver
        mock_driver = Mock()
        mock_chrome.return_value = mock_driver
        
        # Initialize driver
        driver = self.driver_manager._initialize_driver()
        
        # Verify driver creation
        self.assertIsNotNone(driver)
        self.assertEqual(driver, mock_driver)
        self.assertTrue(self.driver_manager._driver_initialized)
        mock_chrome.assert_called_once()
    
    @patch('driver.uc.Chrome')
    def test_initialize_driver_failure(self, mock_chrome):
        """Test WebDriver initialization failure handling."""
        # Mock Chrome to raise exception
        mock_chrome.side_effect = Exception("WebDriver initialization failed")
        
        # Attempt to initialize driver
        with self.assertRaises(Exception):
            self.driver_manager._initialize_driver()
    
    def test_driver_property_getter(self):
        """Test driver property getter."""
        # Initially should be None
        self.assertIsNone(self.driver_manager.driver)
        
        # Set a mock driver
        mock_driver = Mock()
        self.driver_manager._driver = mock_driver
        
        # Should return the mock driver
        self.assertEqual(self.driver_manager.driver, mock_driver)
    
    @patch('driver.uc.Chrome')
    @patch('driver.uc.ChromeOptions')
    def test_get_driver_new_instance(self, mock_options, mock_chrome):
        """Test getting driver creates new instance when none exists."""
        mock_driver = Mock()
        mock_chrome.return_value = mock_driver
        
        # Get driver
        driver = self.driver_manager.get_driver()
        
        # Verify new instance created
        self.assertIsNotNone(driver)
        self.assertEqual(driver, mock_driver)
        self.assertTrue(self.driver_manager._driver_initialized)
    
    @patch('driver.uc.Chrome')
    @patch('driver.uc.ChromeOptions')
    def test_get_driver_existing_instance(self, mock_options, mock_chrome):
        """Test getting existing driver instance."""
        mock_driver = Mock()
        mock_driver.current_url = "https://www.linkedin.com"
        mock_chrome.return_value = mock_driver
        
        # Create initial driver
        self.driver_manager._initialize_driver()
        
        # Get existing driver
        retrieved_driver = self.driver_manager.get_driver()
        
        # Verify same instance returned
        self.assertEqual(retrieved_driver, mock_driver)
        
        # Verify Chrome was only called once
        mock_chrome.assert_called_once()
    
    def test_is_driver_alive_no_driver(self):
        """Test driver alive check when no driver exists."""
        result = self.driver_manager._is_driver_alive()
        self.assertFalse(result)
    
    def test_is_driver_alive_with_working_driver(self):
        """Test driver alive check with working driver."""
        mock_driver = Mock()
        mock_driver.current_url = "https://www.linkedin.com"
        
        self.driver_manager._driver = mock_driver
        self.driver_manager._driver_initialized = True
        
        result = self.driver_manager._is_driver_alive()
        self.assertTrue(result)
    
    def test_is_driver_alive_with_dead_driver(self):
        """Test driver alive check with dead driver."""
        mock_driver = Mock()
        # Configure the mock to raise exception on property access  
        type(mock_driver).current_url = PropertyMock(side_effect=Exception("Driver session dead"))
        
        self.driver_manager._driver = mock_driver
        self.driver_manager._driver_initialized = True
        
        result = self.driver_manager._is_driver_alive()
        self.assertFalse(result)
    
    @patch('driver.uc.Chrome')
    @patch('driver.uc.ChromeOptions')
    def test_recover_session(self, mock_options, mock_chrome):
        """Test session recovery after driver death."""
        mock_driver = Mock()
        mock_chrome.return_value = mock_driver
        
        # Recover session
        recovered_driver = self.driver_manager._recover_session()
        
        # Verify new driver created
        self.assertIsNotNone(recovered_driver)
        self.assertEqual(recovered_driver, mock_driver)
        self.assertTrue(self.driver_manager._driver_initialized)
    
    @patch('driver.uc.Chrome')
    @patch('driver.uc.ChromeOptions')
    def test_navigate_to_url(self, mock_options, mock_chrome):
        """Test URL navigation functionality."""
        mock_driver = Mock()
        mock_chrome.return_value = mock_driver
        
        # Initialize driver
        self.driver_manager._initialize_driver()
        
        # Navigate to URL
        test_url = "https://www.linkedin.com"
        self.driver_manager.navigate_to(test_url)
        
        # Verify navigation
        mock_driver.get.assert_called_with(test_url)
    
    @patch('core.driver.config.get_delay_config')
    @patch('driver.uc.Chrome')
    @patch('driver.uc.ChromeOptions')
    def test_human_delay(self, mock_options, mock_chrome, mock_delay_config):
        """Test human-like delay functionality."""
        mock_driver = Mock()
        mock_chrome.return_value = mock_driver
        mock_delay_config.return_value = (0.1, 0.2)  # Mock delay range
        
        # Test delay range
        start_time = time.time()
        self.driver_manager.random_delay('action')
        end_time = time.time()
        
        # Verify delay was applied
        delay_time = end_time - start_time
        self.assertGreaterEqual(delay_time, 0.1)
        self.assertLessEqual(delay_time, 0.3)  # Allow small buffer
    
    @patch('driver.uc.Chrome')
    @patch('driver.uc.ChromeOptions')
    def test_wait_for_element(self, mock_options, mock_chrome):
        """Test element waiting functionality."""
        mock_driver = Mock()
        mock_element = Mock()
        mock_wait = Mock()
        mock_wait.until.return_value = mock_element
        
        mock_chrome.return_value = mock_driver
        
        with patch('core.driver.WebDriverWait', return_value=mock_wait):
            # Initialize driver
            self.driver_manager._initialize_driver()
            
            # Wait for element
            element = self.driver_manager.wait_for_element(("xpath", "//div[@class='test']"), 10)
            
            # Verify element found
            self.assertIsNotNone(element)
            self.assertEqual(element, mock_element)
    
    @patch('driver.uc.Chrome')
    @patch('driver.uc.ChromeOptions')
    def test_cleanup_success(self, mock_options, mock_chrome):
        """Test successful driver cleanup operation."""
        mock_driver = Mock()
        mock_chrome.return_value = mock_driver
        
        # Create and cleanup driver
        self.driver_manager._initialize_driver()
        self.driver_manager.cleanup()
        
        # Verify quit was called
        mock_driver.quit.assert_called_once()
        
        # Verify driver reference is cleared
        self.assertIsNone(self.driver_manager._driver)
        self.assertFalse(self.driver_manager._driver_initialized)
    
    def test_cleanup_no_driver(self):
        """Test cleanup when no driver exists."""
        # Attempt to cleanup non-existent driver
        result = self.driver_manager.cleanup()
        
        # Should handle gracefully
        self.assertIsNone(result)
    
    @patch('driver.uc.Chrome')
    @patch('driver.uc.ChromeOptions')
    def test_cleanup_exception_handling(self, mock_options, mock_chrome):
        """Test driver cleanup with exception handling."""
        mock_driver = Mock()
        mock_driver.quit.side_effect = Exception("Quit failed")
        mock_chrome.return_value = mock_driver
        
        # Create driver
        self.driver_manager._initialize_driver()
        
        # Cleanup driver (should handle exception)
        self.driver_manager.cleanup()
        
        # Verify driver reference is still cleared
        self.assertIsNone(self.driver_manager._driver)
        self.assertFalse(self.driver_manager._driver_initialized)
    
    @patch('driver.uc.Chrome')
    @patch('driver.uc.ChromeOptions')
    def test_driver_lifecycle_management(self, mock_options, mock_chrome):
        """Test complete driver lifecycle management."""
        mock_driver = Mock()
        mock_driver.current_url = "https://www.linkedin.com"
        mock_chrome.return_value = mock_driver
        
        # Test complete lifecycle
        # 1. Get driver (creates new)
        created_driver = self.driver_manager.get_driver()
        self.assertIsNotNone(created_driver)
        self.assertEqual(self.driver_manager._driver, mock_driver)
        
        # 2. Get existing driver
        retrieved_driver = self.driver_manager.get_driver()
        self.assertEqual(retrieved_driver, mock_driver)
        
        # 3. Cleanup driver
        self.driver_manager.cleanup()
        self.assertIsNone(self.driver_manager._driver)
        self.assertFalse(self.driver_manager._driver_initialized)
        
        # 4. Verify driver methods were called
        mock_driver.quit.assert_called_once()
    
    def test_logger_setup(self):
        """Test logger setup functionality."""
        logger = self.driver_manager._setup_logger()
        
        # Verify logger is created
        self.assertIsNotNone(logger)
        self.assertEqual(logger.name, f"core.driver.LinkedInDriver")


if __name__ == '__main__':
    unittest.main()
