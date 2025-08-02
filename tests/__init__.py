"""
LinkedIn Alumni Scraper Test Suite

Professional unit test package for comprehensive testing of the LinkedIn Alumni Scraper application.
Provides standardized testing utilities and base classes for consistent test implementation.
"""

import os
import sys
import logging

# Add the project root to the Python path
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SCRAPER_ROOT = os.path.join(PROJECT_ROOT, "Linkedin Alumni Scraper")
sys.path.insert(0, SCRAPER_ROOT)

# Configure test logging
logging.basicConfig(
    level=logging.ERROR,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

# Test configuration
TEST_DATA_DIR = os.path.join(os.path.dirname(__file__), 'data')
TEST_OUTPUT_DIR = os.path.join(os.path.dirname(__file__), 'output')

# Ensure test directories exist
os.makedirs(TEST_DATA_DIR, exist_ok=True)
os.makedirs(TEST_OUTPUT_DIR, exist_ok=True)
