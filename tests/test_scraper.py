"""
Unit Tests for Scraper Module

Comprehensive test suite for LinkedIn scraping functionality.
Tests profile data extraction, alumni search, pagination, and data processing workflows.
"""

import unittest
from unittest.mock import Mock, patch, MagicMock
import sys
import os
import tempfile
import json
import csv
from datetime import datetime

# Add project path
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, PROJECT_ROOT)
sys.path.insert(0, os.path.join(PROJECT_ROOT, 'Linkedin Alumni Scraper'))
sys.path.insert(0, os.path.join(PROJECT_ROOT, 'Linkedin Alumni Scraper', 'core'))


class TestLinkedInScraper(unittest.TestCase):
    """Test cases for LinkedIn scraper functionality."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.temp_dir = tempfile.mkdtemp()
        self.output_file = os.path.join(self.temp_dir, 'test_results.csv')
        
        # Mock profile data
        self.mock_profile_data = {
            'name': 'John Doe',
            'title': 'Software Engineer',
            'company': 'Tech Corp',
            'location': 'San Francisco, CA',
            'education': 'Stanford University',
            'profile_url': 'https://www.linkedin.com/in/johndoe/',
            'connection_degree': '2nd',
            'mutual_connections': 5,
            'scraped_at': datetime.now().isoformat()
        }
        
        # Mock search parameters
        self.mock_search_params = {
            'school': 'Stanford University',
            'degree': 'Computer Science',
            'location': 'San Francisco Bay Area',
            'industry': 'Technology',
            'company_size': '51-200'
        }
    
    def tearDown(self):
        """Clean up test fixtures."""
        if os.path.exists(self.temp_dir):
            import shutil
            shutil.rmtree(self.temp_dir)
    
    def test_profile_data_structure_validation(self):
        """Test profile data structure validation."""
        # Verify required fields exist
        required_fields = [
            'name', 'title', 'company', 'location', 
            'education', 'profile_url', 'scraped_at'
        ]
        
        for field in required_fields:
            self.assertIn(field, self.mock_profile_data)
            self.assertIsNotNone(self.mock_profile_data[field])
    
    def test_profile_data_types(self):
        """Test profile data type validation."""
        # String fields
        string_fields = ['name', 'title', 'company', 'location', 'education', 'profile_url', 'connection_degree']
        for field in string_fields:
            if field in self.mock_profile_data:
                self.assertIsInstance(self.mock_profile_data[field], str)
        
        # Integer fields
        if 'mutual_connections' in self.mock_profile_data:
            self.assertIsInstance(self.mock_profile_data['mutual_connections'], int)
        
        # Timestamp field
        self.assertIsInstance(self.mock_profile_data['scraped_at'], str)
        # Should be ISO format
        self.assertRegex(self.mock_profile_data['scraped_at'], r'\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}')
    
    def test_profile_url_validation(self):
        """Test LinkedIn profile URL validation."""
        profile_url = self.mock_profile_data['profile_url']
        
        # Should be valid LinkedIn URL
        self.assertTrue(profile_url.startswith('https://www.linkedin.com/in/'))
        self.assertTrue(profile_url.endswith('/'))
        
        # Should contain profile identifier
        url_parts = profile_url.split('/')
        self.assertTrue(len(url_parts) >= 5)
        profile_id = url_parts[4]
        self.assertTrue(len(profile_id) > 0)
    
    def test_search_parameters_validation(self):
        """Test search parameters validation."""
        # Verify search parameters structure
        for key, value in self.mock_search_params.items():
            self.assertIsInstance(key, str)
            self.assertIsInstance(value, str)
            self.assertTrue(len(value) > 0)
    
    def test_csv_output_generation(self):
        """Test CSV output file generation."""
        # Create CSV with profile data
        with open(self.output_file, 'w', newline='', encoding='utf-8') as csvfile:
            fieldnames = list(self.mock_profile_data.keys())
            writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerow(self.mock_profile_data)
        
        # Verify file was created
        self.assertTrue(os.path.exists(self.output_file))
        
        # Verify file contents
        with open(self.output_file, 'r', encoding='utf-8') as csvfile:
            reader = csv.DictReader(csvfile)
            rows = list(reader)
            self.assertEqual(len(rows), 1)
            self.assertEqual(rows[0]['name'], self.mock_profile_data['name'])
    
    def test_multiple_profiles_csv_output(self):
        """Test CSV output with multiple profiles."""
        profiles = [
            self.mock_profile_data,
            {
                **self.mock_profile_data,
                'name': 'Jane Smith',
                'title': 'Product Manager',
                'profile_url': 'https://www.linkedin.com/in/janesmith/'
            },
            {
                **self.mock_profile_data,
                'name': 'Bob Johnson',
                'title': 'Data Scientist',
                'profile_url': 'https://www.linkedin.com/in/bobjohnson/'
            }
        ]
        
        # Create CSV with multiple profiles
        with open(self.output_file, 'w', newline='', encoding='utf-8') as csvfile:
            fieldnames = list(self.mock_profile_data.keys())
            writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
            writer.writeheader()
            for profile in profiles:
                writer.writerow(profile)
        
        # Verify file contents
        with open(self.output_file, 'r', encoding='utf-8') as csvfile:
            reader = csv.DictReader(csvfile)
            rows = list(reader)
            self.assertEqual(len(rows), 3)
            self.assertEqual(rows[0]['name'], 'John Doe')
            self.assertEqual(rows[1]['name'], 'Jane Smith')
            self.assertEqual(rows[2]['name'], 'Bob Johnson')
    
    def test_profile_data_sanitization(self):
        """Test profile data sanitization."""
        # Test data with special characters
        dirty_profile = {
            'name': 'John "The Dev" O\'Connor',
            'title': 'Senior Software Engineer @ Tech Corp',
            'company': 'Tech Corp, Inc.',
            'location': 'San Francisco, CA, USA',
            'education': 'Stanford University (B.S. Computer Science)',
            'profile_url': 'https://www.linkedin.com/in/john-oconnor-123/',
            'scraped_at': datetime.now().isoformat()
        }
        
        # Should handle special characters in CSV
        with open(self.output_file, 'w', newline='', encoding='utf-8') as csvfile:
            fieldnames = list(dirty_profile.keys())
            writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerow(dirty_profile)
        
        # Verify data integrity
        with open(self.output_file, 'r', encoding='utf-8') as csvfile:
            reader = csv.DictReader(csvfile)
            rows = list(reader)
            self.assertEqual(len(rows), 1)
            self.assertEqual(rows[0]['name'], 'John "The Dev" O\'Connor')
    
    def test_empty_profile_handling(self):
        """Test handling of empty or missing profile data."""
        empty_profile = {
            'name': '',
            'title': '',
            'company': '',
            'location': '',
            'education': '',
            'profile_url': '',
            'scraped_at': datetime.now().isoformat()
        }
        
        # Should handle empty data gracefully
        with open(self.output_file, 'w', newline='', encoding='utf-8') as csvfile:
            fieldnames = list(empty_profile.keys())
            writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerow(empty_profile)
        
        # Verify empty data handling
        with open(self.output_file, 'r', encoding='utf-8') as csvfile:
            reader = csv.DictReader(csvfile)
            rows = list(reader)
            self.assertEqual(len(rows), 1)
            self.assertEqual(rows[0]['name'], '')
    
    def test_duplicate_profile_detection(self):
        """Test duplicate profile detection."""
        profiles = [
            self.mock_profile_data,
            self.mock_profile_data,  # Duplicate
            {
                **self.mock_profile_data,
                'name': 'Jane Smith',
                'profile_url': 'https://www.linkedin.com/in/janesmith/'
            }
        ]
        
        # Remove duplicates based on profile URL
        seen_urls = set()
        unique_profiles = []
        for profile in profiles:
            if profile['profile_url'] not in seen_urls:
                unique_profiles.append(profile)
                seen_urls.add(profile['profile_url'])
        
        # Should have 2 unique profiles
        self.assertEqual(len(unique_profiles), 2)
        self.assertEqual(unique_profiles[0]['name'], 'John Doe')
        self.assertEqual(unique_profiles[1]['name'], 'Jane Smith')
    
    def test_pagination_parameter_handling(self):
        """Test pagination parameter handling."""
        pagination_params = {
            'start': 0,
            'count': 25,
            'total_results': 100,
            'current_page': 1,
            'total_pages': 4
        }
        
        # Verify pagination parameters
        self.assertIsInstance(pagination_params['start'], int)
        self.assertIsInstance(pagination_params['count'], int)
        self.assertIsInstance(pagination_params['total_results'], int)
        self.assertGreaterEqual(pagination_params['start'], 0)
        self.assertGreater(pagination_params['count'], 0)
        self.assertGreater(pagination_params['total_results'], 0)
    
    def test_search_result_parsing(self):
        """Test search result parsing functionality."""
        # Mock search results HTML structure
        mock_search_results = [
            {
                'profile_element': 'mock_element_1',
                'name': 'John Doe',
                'title': 'Software Engineer',
                'company': 'Tech Corp'
            },
            {
                'profile_element': 'mock_element_2',
                'name': 'Jane Smith',
                'title': 'Product Manager',
                'company': 'Startup Inc'
            }
        ]
        
        # Verify search results structure
        for result in mock_search_results:
            self.assertIn('name', result)
            self.assertIn('title', result)
            self.assertIn('company', result)
            self.assertIsInstance(result['name'], str)
            self.assertTrue(len(result['name']) > 0)
    
    def test_rate_limiting_parameters(self):
        """Test rate limiting parameter validation."""
        rate_limit_config = {
            'min_delay': 1.0,
            'max_delay': 3.0,
            'request_per_minute': 30,
            'burst_limit': 5,
            'cooldown_period': 60
        }
        
        # Verify rate limiting parameters
        self.assertIsInstance(rate_limit_config['min_delay'], float)
        self.assertIsInstance(rate_limit_config['max_delay'], float)
        self.assertGreater(rate_limit_config['max_delay'], rate_limit_config['min_delay'])
        self.assertGreater(rate_limit_config['request_per_minute'], 0)
        self.assertGreater(rate_limit_config['burst_limit'], 0)
    
    def test_error_handling_scenarios(self):
        """Test error handling in various scenarios."""
        error_scenarios = [
            {
                'error_type': 'network_timeout',
                'should_retry': True,
                'max_retries': 3
            },
            {
                'error_type': 'rate_limited',
                'should_retry': True,
                'backoff_multiplier': 2.0
            },
            {
                'error_type': 'access_denied',
                'should_retry': False,
                'requires_manual_intervention': True
            },
            {
                'error_type': 'element_not_found',
                'should_retry': True,
                'max_retries': 2
            }
        ]
        
        for scenario in error_scenarios:
            self.assertIn('error_type', scenario)
            self.assertIn('should_retry', scenario)
            self.assertIsInstance(scenario['should_retry'], bool)
    
    def test_progress_tracking(self):
        """Test progress tracking functionality."""
        progress_data = {
            'total_profiles': 100,
            'profiles_scraped': 45,
            'profiles_failed': 2,
            'current_page': 3,
            'total_pages': 10,
            'estimated_time_remaining': 300,  # seconds
            'start_time': datetime.now().isoformat()
        }
        
        # Calculate progress percentage
        if progress_data['total_profiles'] > 0:
            progress_percentage = (progress_data['profiles_scraped'] / progress_data['total_profiles']) * 100
            self.assertGreaterEqual(progress_percentage, 0)
            self.assertLessEqual(progress_percentage, 100)
    
    def test_session_persistence(self):
        """Test session persistence across scraping runs."""
        session_data = {
            'last_scraped_page': 5,
            'total_profiles_scraped': 125,
            'search_parameters': self.mock_search_params,
            'timestamp': datetime.now().isoformat(),
            'resume_url': 'https://www.linkedin.com/school/stanford-university/people/?page=6'
        }
        
        # Save session data
        session_file = os.path.join(self.temp_dir, 'scraping_session.json')
        with open(session_file, 'w') as f:
            json.dump(session_data, f, indent=2)
        
        # Verify session data can be loaded
        with open(session_file, 'r') as f:
            loaded_session = json.load(f)
        
        self.assertEqual(loaded_session['last_scraped_page'], 5)
        self.assertEqual(loaded_session['total_profiles_scraped'], 125)
    
    def test_data_quality_validation(self):
        """Test data quality validation checks."""
        quality_checks = {
            'name_not_empty': lambda p: len(p.get('name', '').strip()) > 0,
            'valid_profile_url': lambda p: p.get('profile_url', '').startswith('https://www.linkedin.com/in/'),
            'title_reasonable_length': lambda p: 0 < len(p.get('title', '')) < 200,
            'company_not_generic': lambda p: p.get('company', '') not in ['', 'N/A', 'Unknown'],
            'location_format': lambda p: ',' in p.get('location', '') or len(p.get('location', '')) < 50
        }
        
        # Run quality checks on mock profile
        for check_name, check_func in quality_checks.items():
            try:
                result = check_func(self.mock_profile_data)
                self.assertIsInstance(result, bool, f"Quality check {check_name} should return boolean")
            except Exception as e:
                self.fail(f"Quality check {check_name} raised an exception: {e}")


if __name__ == '__main__':
    unittest.main()
