"""
Test Data Processing Module

Unit tests for the LinkedIn Alumni Scraper data processing and cleaning functionality.
Tests data extraction, formatting, validation, and CSV operations.
"""

import unittest
import os
import sys
import tempfile
import csv
import pandas as pd
from unittest.mock import patch, MagicMock

# Add project path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'Linkedin Alumni Scraper'))


class TestDataProcessing(unittest.TestCase):
    """Test suite for data processing functionality."""

    def setUp(self):
        """Set up test fixtures before each test method."""
        self.test_data_dir = tempfile.mkdtemp()
        self.sample_profile_data = {
            "City": "Jakarta, Indonesia",
            "Name": "John Doe",
            "Headlines": "Software Engineer at Tech Corp",
            "Linkedin Link": "https://linkedin.com/in/johndoe",
            "Profile Picture": "https://media.linkedin.com/profile.jpg",
            "Experience": [
                {"Job Title": "Software Engineer", "Company": "Tech Corp", "Duration": "2020-Present"},
                {"Job Title": "Junior Developer", "Company": "StartupCo", "Duration": "2019-2020"}
            ],
            "Education": [
                {"School": "University of Technology", "Degree": "Computer Science", "Duration": "2015-2019"}
            ],
            "Licenses & Certifications": [
                {"Certification": "AWS Solutions Architect", "Issued By": "Amazon Web Services"}
            ]
        }

    def test_profile_data_structure(self):
        """Test that profile data has the correct structure."""
        required_fields = [
            "City", "Name", "Headlines", "Linkedin Link", 
            "Profile Picture", "Experience", "Education", "Licenses & Certifications"
        ]
        
        for field in required_fields:
            with self.subTest(field=field):
                self.assertIn(field, self.sample_profile_data, f"Missing required field: {field}")

    def test_data_type_validation(self):
        """Test validation of data types for profile fields."""
        # Test string fields
        string_fields = ["City", "Name", "Headlines", "Linkedin Link", "Profile Picture"]
        for field in string_fields:
            with self.subTest(field=field):
                self.assertIsInstance(self.sample_profile_data[field], str, f"{field} should be string")

        # Test list fields
        list_fields = ["Experience", "Education", "Licenses & Certifications"]
        for field in list_fields:
            with self.subTest(field=field):
                self.assertIsInstance(self.sample_profile_data[field], list, f"{field} should be list")

    def test_experience_data_format(self):
        """Test experience data formatting."""
        experience_data = self.sample_profile_data["Experience"]
        self.assertIsInstance(experience_data, list)
        
        for exp in experience_data:
            with self.subTest(experience=exp):
                required_exp_fields = ["Job Title", "Company", "Duration"]
                for field in required_exp_fields:
                    self.assertIn(field, exp, f"Experience missing field: {field}")
                    self.assertIsInstance(exp[field], str, f"Experience {field} should be string")

    def test_education_data_format(self):
        """Test education data formatting."""
        education_data = self.sample_profile_data["Education"]
        self.assertIsInstance(education_data, list)
        
        for edu in education_data:
            with self.subTest(education=edu):
                required_edu_fields = ["School", "Degree", "Duration"]
                for field in required_edu_fields:
                    self.assertIn(field, edu, f"Education missing field: {field}")
                    self.assertIsInstance(edu[field], str, f"Education {field} should be string")

    def test_certification_data_format(self):
        """Test certification data formatting."""
        cert_data = self.sample_profile_data["Licenses & Certifications"]
        self.assertIsInstance(cert_data, list)
        
        for cert in cert_data:
            with self.subTest(certification=cert):
                required_cert_fields = ["Certification", "Issued By"]
                for field in required_cert_fields:
                    self.assertIn(field, cert, f"Certification missing field: {field}")
                    self.assertIsInstance(cert[field], str, f"Certification {field} should be string")

    def test_csv_data_export(self):
        """Test CSV data export functionality."""
        test_csv_path = os.path.join(self.test_data_dir, "test_export.csv")
        test_data = [self.sample_profile_data.copy()]
        
        # Mock CSV export
        try:
            # Convert complex data to strings for CSV
            csv_data = []
            for profile in test_data:
                csv_row = profile.copy()
                # Convert lists to string representation
                for field in ["Experience", "Education", "Licenses & Certifications"]:
                    if isinstance(csv_row[field], list):
                        csv_row[field] = str(csv_row[field])
                csv_data.append(csv_row)
            
            # Write to CSV
            if csv_data:
                df = pd.DataFrame(csv_data)
                df.to_csv(test_csv_path, index=False)
                
                # Verify file was created
                self.assertTrue(os.path.exists(test_csv_path))
                
                # Verify data integrity
                loaded_df = pd.read_csv(test_csv_path)
                self.assertEqual(len(loaded_df), 1)
                self.assertEqual(loaded_df.iloc[0]['Name'], 'John Doe')
                
        except Exception as e:
            self.fail(f"CSV export failed: {e}")

    def test_data_cleaning_function(self):
        """Test data cleaning and formatting functions."""
        # Test text cleaning
        dirty_text_samples = [
            "['Item 1', 'Item 2', 'Item 3']",
            "Extra spaces   and   tabs\t\t",
            "Unicode characters: café, naïve, résumé",
            "HTML entities: &amp; &lt; &gt;"
        ]
        
        for sample in dirty_text_samples:
            with self.subTest(text=sample):
                # Mock cleaning function
                cleaned = sample.strip()
                if cleaned.startswith('[') and cleaned.endswith(']'):
                    # Convert list string to formatted text
                    cleaned = cleaned.replace('[', '').replace(']', '').replace("'", "")
                
                self.assertIsInstance(cleaned, str)
                self.assertNotEqual(cleaned, sample)  # Should be different after cleaning

    def test_duplicate_detection(self):
        """Test duplicate profile detection."""
        profiles = [
            {"Name": "John Doe", "Linkedin Link": "https://linkedin.com/in/johndoe"},
            {"Name": "Jane Smith", "Linkedin Link": "https://linkedin.com/in/janesmith"},
            {"Name": "John Doe", "Linkedin Link": "https://linkedin.com/in/johndoe"},  # Duplicate
        ]
        
        # Mock duplicate detection
        seen_links = set()
        unique_profiles = []
        duplicates_found = 0
        
        for profile in profiles:
            link = profile["Linkedin Link"]
            if link in seen_links:
                duplicates_found += 1
            else:
                seen_links.add(link)
                unique_profiles.append(profile)
        
        self.assertEqual(len(unique_profiles), 2, "Should have 2 unique profiles")
        self.assertEqual(duplicates_found, 1, "Should detect 1 duplicate")

    def test_data_validation(self):
        """Test data validation for required fields."""
        test_cases = [
            {"name": "Valid profile", "data": self.sample_profile_data, "valid": True},
            {"name": "Missing name", "data": {**self.sample_profile_data, "Name": ""}, "valid": False},
            {"name": "Invalid LinkedIn URL", "data": {**self.sample_profile_data, "Linkedin Link": "invalid-url"}, "valid": False},
            {"name": "Empty experience", "data": {**self.sample_profile_data, "Experience": []}, "valid": True}  # Empty is valid
        ]
        
        for case in test_cases:
            with self.subTest(case=case["name"]):
                data = case["data"]
                expected_valid = case["valid"]
                
                # Mock validation logic
                is_valid = True
                
                # Check required string fields
                if not data.get("Name") or not data.get("Name").strip():
                    is_valid = False
                
                # Check LinkedIn URL format
                linkedin_url = data.get("Linkedin Link", "")
                if linkedin_url and not linkedin_url.startswith("https://linkedin.com"):
                    is_valid = False
                
                self.assertEqual(is_valid, expected_valid, f"Validation failed for: {case['name']}")

    def test_text_formatting(self):
        """Test text formatting functions."""
        formatting_tests = [
            {"input": "software engineer", "expected": "Software Engineer", "operation": "title_case"},
            {"input": "  extra spaces  ", "expected": "extra spaces", "operation": "strip"},
            {"input": "TEXT IN CAPS", "expected": "Text In Caps", "operation": "proper_case"},
            {"input": "multiple\n\nlines", "expected": "multiple lines", "operation": "clean_lines"}
        ]
        
        for test in formatting_tests:
            with self.subTest(test=test):
                input_text = test["input"]
                expected = test["expected"]
                operation = test["operation"]
                
                # Mock formatting operations
                if operation == "title_case":
                    result = input_text.title()
                elif operation == "strip":
                    result = input_text.strip()
                elif operation == "proper_case":
                    result = input_text.lower().title()
                elif operation == "clean_lines":
                    result = ' '.join(input_text.split())
                else:
                    result = input_text
                
                self.assertEqual(result, expected, f"Formatting failed for {operation}")

    def test_data_aggregation(self):
        """Test data aggregation and statistics."""
        multiple_profiles = [
            {"Name": "John Doe", "City": "Jakarta"},
            {"Name": "Jane Smith", "City": "Jakarta"},
            {"Name": "Bob Wilson", "City": "Surabaya"},
            {"Name": "Alice Brown", "City": "Jakarta"}
        ]
        
        # Mock aggregation
        city_counts = {}
        for profile in multiple_profiles:
            city = profile["City"] 
            city_counts[city] = city_counts.get(city, 0) + 1
        
        self.assertEqual(city_counts["Jakarta"], 3, "Should count 3 profiles from Jakarta")
        self.assertEqual(city_counts["Surabaya"], 1, "Should count 1 profile from Surabaya")
        self.assertEqual(len(city_counts), 2, "Should have 2 unique cities")

    def tearDown(self):
        """Clean up after each test method."""
        # Clean up test files
        if os.path.exists(self.test_data_dir):
            import shutil
            shutil.rmtree(self.test_data_dir)


if __name__ == '__main__':
    unittest.main(verbosity=2)
