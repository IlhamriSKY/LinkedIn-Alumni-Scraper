"""
Test Configuration Manager

Unit tests for the LinkedIn Alumni Scraper configuration management module.
Tests environment variable loading, validation, and configuration integrity.
"""

import unittest
import os
import tempfile
from unittest.mock import patch, MagicMock
import sys

# Add project path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'Linkedin Alumni Scraper'))

from core.config import ConfigManager


class TestConfigManager(unittest.TestCase):
    """Test suite for ConfigManager class."""

    def setUp(self):
        """Set up test fixtures before each test method."""
        self.config_manager = ConfigManager()

    def test_config_manager_initialization(self):
        """Test that ConfigManager initializes correctly."""
        self.assertIsInstance(self.config_manager, ConfigManager)
        self.assertTrue(hasattr(self.config_manager, 'get'))
        self.assertTrue(hasattr(self.config_manager, 'validate'))

    def test_environment_variable_loading(self):
        """Test that environment variables are loaded correctly."""
        with patch.dict(os.environ, {
            'LINKEDIN_EMAIL': 'test@example.com',
            'LINKEDIN_PASSWORD': 'testpass123',
            'UNIVERSITY_NAME': 'Test University'
        }):
            config = ConfigManager()
            self.assertEqual(config.get('LINKEDIN_EMAIL'), 'test@example.com')
            self.assertEqual(config.get('UNIVERSITY_NAME'), 'Test University')

    def test_default_values(self):
        """Test that default values are returned when environment variables are not set."""
        with patch.dict(os.environ, {}, clear=True):
            config = ConfigManager()
            self.assertEqual(config.get('FLASK_PORT', '5000'), '5000')
            self.assertEqual(config.get('MAX_PROFILES', '10'), '10')

    def test_university_configuration(self):
        """Test university-specific configuration parameters."""
        with patch.dict(os.environ, {
            'UNIVERSITY_LINKEDIN_ID': 'test-university',
            'UNIVERSITY_NAME': 'Test University'
        }):
            config = ConfigManager()
            self.assertEqual(config.get('UNIVERSITY_LINKEDIN_ID'), 'test-university')
            self.assertEqual(config.get('UNIVERSITY_NAME'), 'Test University')

    def test_path_configuration(self):
        """Test that path configurations are handled properly."""
        config = ConfigManager()
        script_dir = config.get('SCRIPT_DIR')
        self.assertTrue(os.path.isabs(script_dir))
        self.assertTrue(os.path.exists(script_dir))

    def test_boolean_configuration_parsing(self):
        """Test that boolean values are parsed correctly."""
        with patch.dict(os.environ, {
            'DEBUG_MODE': 'true',
            'AUTO_LOGIN': 'false'
        }):
            config = ConfigManager()
            # Test that string boolean values can be evaluated
            self.assertIn(config.get('DEBUG_MODE'), ['true', 'True', 'TRUE'])
            self.assertIn(config.get('AUTO_LOGIN'), ['false', 'False', 'FALSE'])

    def test_configuration_validation(self):
        """Test configuration validation functionality."""
        config = ConfigManager()
        
        # Test that validation method exists and is callable
        self.assertTrue(hasattr(config, 'validate'))
        self.assertTrue(callable(getattr(config, 'validate')))

    def test_missing_required_configuration(self):
        """Test behavior when required configuration is missing."""
        # Test that config handles missing values gracefully
        config = ConfigManager()
        # Test non-existent key
        result = config.get('NON_EXISTENT_KEY')
        self.assertIsNone(result)
        
        # Test with default value
        result_with_default = config.get('NON_EXISTENT_KEY', 'default_value')
        self.assertEqual(result_with_default, 'default_value')

    def test_configuration_override(self):
        """Test that configuration can be overridden."""
        with patch.dict(os.environ, {'TEST_VAR': 'original'}):
            config = ConfigManager()
            self.assertEqual(config.get('TEST_VAR'), 'original')
            
            # Test override capability if method exists
            if hasattr(config, 'set'):
                config.set('TEST_VAR', 'overridden')
                self.assertEqual(config.get('TEST_VAR'), 'overridden')

    def test_configuration_types(self):
        """Test that configuration handles different data types correctly."""
        with patch.dict(os.environ, {
            'STRING_VAL': 'text',
            'NUMERIC_VAL': '123',
            'FLOAT_VAL': '45.67'
        }):
            config = ConfigManager()
            self.assertEqual(config.get('STRING_VAL'), 'text')
            self.assertEqual(config.get('NUMERIC_VAL'), '123')
            self.assertEqual(config.get('FLOAT_VAL'), '45.67')

    def tearDown(self):
        """Clean up after each test method."""
        # Clean up any test-specific environment variables
        test_vars = ['TEST_VAR', 'DEBUG_MODE', 'AUTO_LOGIN']
        for var in test_vars:
            if var in os.environ:
                del os.environ[var]


if __name__ == '__main__':
    unittest.main(verbosity=2)
