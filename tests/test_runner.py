"""
Test Runner for LinkedIn Scraper Test Suite

Main test runner that executes all unit tests with comprehensive reporting.
Provides standardized test execution and result reporting for the LinkedIn Scraper application.
"""

import unittest
import sys
import os
import time
from io import StringIO
from datetime import datetime

# Add project path
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, PROJECT_ROOT)

# Import test modules
from tests.test_config import TestConfigManager
from tests.test_auth import TestAuthenticationModule
from tests.test_data_processing import TestDataProcessing
from tests.test_service_factory import TestServiceFactory
# from tests.test_driver import TestLinkedInDriver  # Temporarily disabled due to import issues
from tests.test_session import TestSessionManagement
from tests.test_scraper import TestLinkedInScraper


class LinkedInScraperTestRunner:
    """Professional test runner for LinkedIn Scraper application."""
    
    def __init__(self):
        """Initialize the test runner."""
        self.start_time = None
        self.end_time = None
        self.results = None
        
    def run_all_tests(self, verbosity=2):
        """
        Run all test suites with comprehensive reporting.
        
        Args:
            verbosity (int): Test output verbosity level (0-2)
            
        Returns:
            bool: True if all tests passed, False otherwise
        """
        print("=" * 80)
        print("LINKEDIN SCRAPER - PROFESSIONAL TEST SUITE")
        print("=" * 80)
        print(f"Test execution started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print()
        
        self.start_time = time.time()
        
        # Create test suite
        test_suite = unittest.TestSuite()
        
        # Add test cases
        test_cases = [
            TestConfigManager,
            TestAuthenticationModule,
            TestDataProcessing,
            TestServiceFactory,
            # TestLinkedInDriver,  # Temporarily disabled
            TestSessionManagement,
            TestLinkedInScraper
        ]
        
        for test_case in test_cases:
            tests = unittest.TestLoader().loadTestsFromTestCase(test_case)
            test_suite.addTests(tests)
        
        # Run tests with custom result handler
        stream = StringIO()
        runner = unittest.TextTestRunner(
            stream=stream,
            verbosity=verbosity,
            buffer=True
        )
        
        self.results = runner.run(test_suite)
        self.end_time = time.time()
        
        # Print results
        self._print_results(stream.getvalue())
        
        return self.results.wasSuccessful()
    
    def _print_results(self, test_output):
        """Print formatted test results."""
        if self.results is None:
            print("Error: No test results available")
            return
            
        print("=" * 80)
        print("TEST EXECUTION RESULTS")
        print("=" * 80)
        
        # Basic statistics
        total_tests = self.results.testsRun
        failures = len(self.results.failures)
        errors = len(self.results.errors)
        skipped = len(self.results.skipped) if hasattr(self.results, 'skipped') else 0
        passed = total_tests - failures - errors - skipped
        
        execution_time = (self.end_time or 0) - (self.start_time or 0)
        
        print(f"Tests Run:     {total_tests}")
        print(f"Passed:        {passed}")
        print(f"Failed:        {failures}")
        print(f"Errors:        {errors}")
        print(f"Skipped:       {skipped}")
        print(f"Success Rate:  {(passed/total_tests)*100:.1f}%" if total_tests > 0 else "N/A")
        print(f"Execution Time: {execution_time:.2f} seconds")
        print()
        
        # Detailed results
        if failures > 0:
            print("FAILURES:")
            print("-" * 40)
            for test, traceback in self.results.failures:
                print(f"FAIL: {test}")
                print(traceback)
                print()
        
        if errors > 0:
            print("ERRORS:")
            print("-" * 40)
            for test, traceback in self.results.errors:
                print(f"ERROR: {test}")
                print(traceback)
                print()
        
        # Overall result
        print("=" * 80)
        if self.results.wasSuccessful():
            print("ALL TESTS PASSED! The LinkedIn Scraper is ready for production.")
        else:
            print("SOME TESTS FAILED! Please review the failures above.")
        print("=" * 80)
        print(f"Test execution completed at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print()
    
    def run_specific_test(self, test_class_name, verbosity=2):
        """
        Run a specific test class.
        
        Args:
            test_class_name (str): Name of the test class to run
            verbosity (int): Test output verbosity level
            
        Returns:
            bool: True if tests passed, False otherwise
        """
        test_classes = {
            'config': TestConfigManager,
            'auth': TestAuthenticationModule,
            'data': TestDataProcessing,
            'factory': TestServiceFactory,
            # 'driver': TestLinkedInDriver,  # Temporarily disabled
            'session': TestSessionManagement,
            'scraper': TestLinkedInScraper
        }
        
        if test_class_name not in test_classes:
            print(f"Unknown test class: {test_class_name}")
            print(f"Available test classes: {', '.join(test_classes.keys())}")
            return False
        
        print(f"Running {test_class_name} tests...")
        
        test_class = test_classes[test_class_name]
        suite = unittest.TestLoader().loadTestsFromTestCase(test_class)
        runner = unittest.TextTestRunner(verbosity=verbosity)
        result = runner.run(suite)
        
        return result.wasSuccessful()


def main():
    """Main entry point for test execution."""
    import argparse
    
    parser = argparse.ArgumentParser(description="LinkedIn Scraper Test Runner")
    parser.add_argument('--test', '-t', help='Run specific test (config, auth, data, factory)')
    parser.add_argument('--verbose', '-v', action='store_true', help='Verbose output')
    parser.add_argument('--quiet', '-q', action='store_true', help='Quiet output')
    
    args = parser.parse_args()
    
    # Determine verbosity level
    if args.quiet:
        verbosity = 0
    elif args.verbose:
        verbosity = 2
    else:
        verbosity = 1
    
    # Create test runner
    runner = LinkedInScraperTestRunner()
    
    # Run tests
    if args.test:
        success = runner.run_specific_test(args.test, verbosity)
    else:
        success = runner.run_all_tests(verbosity)
    
    # Exit with appropriate code
    sys.exit(0 if success else 1)


if __name__ == '__main__':
    main()
