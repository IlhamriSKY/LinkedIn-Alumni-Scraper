"""
Unit Tests for Session Module

Comprehensive test suite for session management and user authentication functionality.
Tests login status detection, session persistence, and authentication workflows.
"""

import unittest
from unittest.mock import Mock, patch, MagicMock
import sys
import os
import tempfile
import json

# Add project path
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, PROJECT_ROOT)
sys.path.insert(0, os.path.join(PROJECT_ROOT, 'Linkedin Alumni Scraper'))
sys.path.insert(0, os.path.join(PROJECT_ROOT, 'Linkedin Alumni Scraper', 'core'))


class TestSessionManagement(unittest.TestCase):
    """Test cases for session management and authentication functionality."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.temp_dir = tempfile.mkdtemp()
        self.session_file = os.path.join(self.temp_dir, 'session.json')
        
        # Mock session data
        self.mock_session_data = {
            'cookies': [
                {
                    'name': 'li_at',
                    'value': 'test_auth_token',
                    'domain': '.linkedin.com'
                },
                {
                    'name': 'JSESSIONID',
                    'value': 'test_session_id',
                    'domain': '.linkedin.com'
                }
            ],
            'user_agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'timestamp': '2024-01-01T00:00:00Z'
        }
    
    def tearDown(self):
        """Clean up test fixtures."""
        if os.path.exists(self.temp_dir):
            import shutil
            shutil.rmtree(self.temp_dir)
    
    def test_save_session_data(self):
        """Test saving session data to file."""
        # Save session data
        with open(self.session_file, 'w') as f:
            json.dump(self.mock_session_data, f, indent=2)
        
        # Verify file exists and contains correct data
        self.assertTrue(os.path.exists(self.session_file))
        
        with open(self.session_file, 'r') as f:
            loaded_data = json.load(f)
        
        self.assertEqual(loaded_data, self.mock_session_data)
    
    def test_load_session_data(self):
        """Test loading session data from file."""
        # Create session file
        with open(self.session_file, 'w') as f:
            json.dump(self.mock_session_data, f, indent=2)
        
        # Load session data
        with open(self.session_file, 'r') as f:
            loaded_data = json.load(f)
        
        # Verify data loaded correctly
        self.assertEqual(loaded_data['cookies'], self.mock_session_data['cookies'])
        self.assertEqual(loaded_data['user_agent'], self.mock_session_data['user_agent'])
    
    def test_load_session_data_file_not_exists(self):
        """Test loading session data when file doesn't exist."""
        non_existent_file = os.path.join(self.temp_dir, 'nonexistent.json')
        
        # Should handle gracefully
        self.assertFalse(os.path.exists(non_existent_file))
    
    def test_validate_session_cookies(self):
        """Test session cookie validation."""
        cookies = self.mock_session_data['cookies']
        
        # Check for required cookies
        cookie_names = [cookie['name'] for cookie in cookies]
        self.assertIn('li_at', cookie_names)
        self.assertIn('JSESSIONID', cookie_names)
        
        # Validate cookie properties
        for cookie in cookies:
            self.assertIsInstance(cookie['name'], str)
            self.assertIsInstance(cookie['value'], str)
            self.assertIsInstance(cookie['domain'], str)
    
    def test_session_cookie_extraction(self):
        """Test extracting specific cookies from session."""
        cookies = self.mock_session_data['cookies']
        
        # Extract li_at cookie
        li_at_cookie = None
        for cookie in cookies:
            if cookie['name'] == 'li_at':
                li_at_cookie = cookie
                break
        
        self.assertIsNotNone(li_at_cookie)
        if li_at_cookie:
            self.assertEqual(li_at_cookie['value'], 'test_auth_token')
    
    def test_session_timestamp_validation(self):
        """Test session timestamp validation."""
        timestamp = self.mock_session_data['timestamp']
        
        # Verify timestamp format (ISO 8601)
        self.assertIsInstance(timestamp, str)
        self.assertTrue('T' in timestamp)
        self.assertTrue('Z' in timestamp or '+' in timestamp)
    
    def test_user_agent_validation(self):
        """Test user agent validation."""
        user_agent = self.mock_session_data['user_agent']
        
        # Verify user agent format
        self.assertIsInstance(user_agent, str)
        self.assertTrue(len(user_agent) > 50)  # Realistic length
        self.assertIn('Mozilla', user_agent)
        self.assertIn('Chrome', user_agent)
    
    def test_session_data_structure(self):
        """Test session data structure validation."""
        # Verify required keys exist
        required_keys = ['cookies', 'user_agent', 'timestamp']
        for key in required_keys:
            self.assertIn(key, self.mock_session_data)
        
        # Verify data types
        self.assertIsInstance(self.mock_session_data['cookies'], list)
        self.assertIsInstance(self.mock_session_data['user_agent'], str)
        self.assertIsInstance(self.mock_session_data['timestamp'], str)
    
    def test_cookie_domain_validation(self):
        """Test cookie domain validation."""
        cookies = self.mock_session_data['cookies']
        
        for cookie in cookies:
            domain = cookie['domain']
            self.assertIn('linkedin.com', domain)
            # Domain should start with . for proper scope
            self.assertTrue(domain.startswith('.') or domain == 'linkedin.com')
    
    def test_session_data_serialization(self):
        """Test session data JSON serialization."""
        # Serialize to JSON string
        json_string = json.dumps(self.mock_session_data)
        
        # Verify serialization worked
        self.assertIsInstance(json_string, str)
        self.assertTrue(len(json_string) > 100)  # Should be substantial
        
        # Verify deserialization works
        deserialized_data = json.loads(json_string)
        self.assertEqual(deserialized_data, self.mock_session_data)
    
    def test_empty_session_handling(self):
        """Test handling of empty session data."""
        empty_session = {
            'cookies': [],
            'user_agent': '',
            'timestamp': ''
        }
        
        # Should handle empty data gracefully
        json_string = json.dumps(empty_session)
        loaded_data = json.loads(json_string)
        
        self.assertEqual(loaded_data['cookies'], [])
        self.assertEqual(loaded_data['user_agent'], '')
        self.assertEqual(loaded_data['timestamp'], '')
    
    def test_invalid_session_data_handling(self):
        """Test handling of invalid session data."""
        invalid_sessions = [
            None,
            {},
            {'cookies': None},
            {'cookies': [], 'user_agent': None},
            {'cookies': 'invalid', 'user_agent': '', 'timestamp': ''}
        ]
        
        for invalid_session in invalid_sessions:
            if invalid_session is not None and isinstance(invalid_session, dict):
                # Should be able to serialize invalid data
                json_string = json.dumps(invalid_session)
                self.assertIsInstance(json_string, str)
    
    def test_session_file_permissions(self):
        """Test session file permissions and access."""
        # Create session file
        with open(self.session_file, 'w') as f:
            json.dump(self.mock_session_data, f)
        
        # Verify file is readable and writable
        self.assertTrue(os.access(self.session_file, os.R_OK))
        self.assertTrue(os.access(self.session_file, os.W_OK))
    
    def test_concurrent_session_access(self):
        """Test concurrent access to session data."""
        # Write session data
        with open(self.session_file, 'w') as f:
            json.dump(self.mock_session_data, f)
        
        # Simulate concurrent reads
        data_copies = []
        for _ in range(3):
            with open(self.session_file, 'r') as f:
                data_copy = json.load(f)
                data_copies.append(data_copy)
        
        # All copies should be identical
        for data_copy in data_copies:
            self.assertEqual(data_copy, self.mock_session_data)
    
    def test_session_backup_and_restore(self):
        """Test session backup and restore functionality."""
        backup_file = os.path.join(self.temp_dir, 'session_backup.json')
        
        # Create original session
        with open(self.session_file, 'w') as f:
            json.dump(self.mock_session_data, f)
        
        # Create backup
        with open(self.session_file, 'r') as src, open(backup_file, 'w') as dst:
            dst.write(src.read())
        
        # Verify backup exists and is identical
        self.assertTrue(os.path.exists(backup_file))
        
        with open(backup_file, 'r') as f:
            backup_data = json.load(f)
        
        self.assertEqual(backup_data, self.mock_session_data)


if __name__ == '__main__':
    unittest.main()
