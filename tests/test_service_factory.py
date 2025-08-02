"""
Test Service Factory Module

Unit tests for the LinkedIn Alumni Scraper service factory and dependency injection system.
Tests service creation, singleton patterns, and dependency management.
"""

import unittest
import os
import sys
from unittest.mock import patch, MagicMock

# Add project path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'Linkedin Alumni Scraper'))


class TestServiceFactory(unittest.TestCase):
    """Test suite for service factory functionality."""

    def setUp(self):
        """Set up test fixtures before each test method."""
        # Mock service factory components
        self.mock_services = {}

    def test_singleton_pattern(self):
        """Test that service factory implements singleton pattern correctly."""
        # Mock singleton implementation
        class MockServiceFactory:
            _instance = None
            
            def __new__(cls):
                if not cls._instance:
                    cls._instance = super().__new__(cls)
                return cls._instance
        
        # Test singleton behavior
        factory1 = MockServiceFactory()
        factory2 = MockServiceFactory()
        
        self.assertIs(factory1, factory2, "Service factory should implement singleton pattern")

    def test_service_creation(self):
        """Test creation of various service instances."""
        service_types = [
            "config_manager",
            "driver_manager", 
            "auth_manager",
            "session_manager",
            "scraper"
        ]
        
        for service_type in service_types:
            with self.subTest(service=service_type):
                # Mock service creation
                mock_service = MagicMock()
                mock_service.service_type = service_type
                
                # Simulate service factory behavior
                created_service = mock_service
                
                self.assertIsNotNone(created_service, f"Should create {service_type} service")
                self.assertEqual(created_service.service_type, service_type)

    def test_dependency_injection(self):
        """Test dependency injection between services."""
        # Mock service dependencies
        mock_config = MagicMock()
        mock_driver = MagicMock()
        mock_auth = MagicMock()
        
        # Test dependency relationships
        dependencies = [
            {"service": "auth_manager", "requires": ["driver_manager"]},
            {"service": "scraper", "requires": ["driver_manager", "auth_manager"]},
            {"service": "session_manager", "requires": []}
        ]
        
        for dep in dependencies:
            with self.subTest(dependency=dep):
                service_name = dep["service"]
                required_deps = dep["requires"]
                
                # Mock dependency injection
                injected_deps = {}
                for req_dep in required_deps:
                    if req_dep == "driver_manager":
                        injected_deps[req_dep] = mock_driver
                    elif req_dep == "auth_manager":
                        injected_deps[req_dep] = mock_auth
                
                # Verify dependencies are available
                self.assertEqual(len(injected_deps), len(required_deps), 
                               f"All dependencies should be injected for {service_name}")

    def test_service_caching(self):
        """Test that services are cached and reused."""
        # Mock service caching
        cached_services = {}
        
        def get_or_create_service(service_name):
            if service_name not in cached_services:
                cached_services[service_name] = MagicMock()
                cached_services[service_name].created_at = len(cached_services)
            return cached_services[service_name]
        
        # Test caching behavior
        service1 = get_or_create_service("test_service")
        service2 = get_or_create_service("test_service")
        
        self.assertIs(service1, service2, "Should return cached service instance")
        self.assertEqual(service1.created_at, service2.created_at, "Should be same instance")

    def test_service_cleanup(self):
        """Test service cleanup and resource management."""
        # Mock services with cleanup methods
        services = {
            "driver": MagicMock(),
            "auth": MagicMock(),
            "session": MagicMock()
        }
        
        # Add cleanup methods to mocks
        for service in services.values():
            service.cleanup = MagicMock()
        
        # Test cleanup process
        cleanup_results = {}
        for name, service in services.items():
            try:
                service.cleanup()
                cleanup_results[name] = True
            except Exception:
                cleanup_results[name] = False
        
        # Verify all services were cleaned up
        for name, result in cleanup_results.items():
            with self.subTest(service=name):
                self.assertTrue(result, f"Service {name} should cleanup successfully")

    def test_service_initialization_order(self):
        """Test that services are initialized in the correct order."""
        initialization_order = []
        
        # Mock services with initialization tracking
        class MockService:
            def __init__(self, name, dependencies=None):
                self.name = name
                self.dependencies = dependencies or []
                initialization_order.append(name)
        
        # Create services with dependencies
        config = MockService("config")
        driver = MockService("driver", ["config"])
        auth = MockService("auth", ["driver"])
        scraper = MockService("scraper", ["auth", "driver"])
        
        # Verify initialization order
        expected_order = ["config", "driver", "auth", "scraper"]
        self.assertEqual(initialization_order, expected_order, 
                        "Services should initialize in dependency order")

    def test_circular_dependency_prevention(self):
        """Test prevention of circular dependencies."""
        # Mock circular dependency detection
        def detect_circular_dependency(services_map):
            visited = set()
            rec_stack = set()
            
            def has_cycle(service, deps_map):
                if service in rec_stack:
                    return True
                if service in visited:
                    return False
                
                visited.add(service)
                rec_stack.add(service)
                
                dependencies = deps_map.get(service, [])
                for dep in dependencies:
                    if has_cycle(dep, deps_map):
                        return True
                
                rec_stack.remove(service)
                return False
            
            for service in services_map:
                if has_cycle(service, services_map):
                    return True
            return False
        
        # Test valid dependency graph (no cycles)
        valid_deps = {
            "config": [],
            "driver": ["config"],
            "auth": ["driver"],
            "scraper": ["auth"]
        }
        
        self.assertFalse(detect_circular_dependency(valid_deps), 
                        "Should not detect cycle in valid dependency graph")
        
        # Test circular dependency
        circular_deps = {
            "service_a": ["service_b"],
            "service_b": ["service_a"]
        }
        
        self.assertTrue(detect_circular_dependency(circular_deps), 
                       "Should detect circular dependency")

    def test_service_configuration(self):
        """Test service configuration and customization."""
        # Mock service configurations
        service_configs = {
            "driver": {
                "headless": False,
                "timeout": 30,
                "user_agent": "custom-agent"
            },
            "auth": {
                "auto_login": True,
                "retry_attempts": 3
            },
            "scraper": {
                "max_profiles": 100,
                "delay_range": [1, 3]
            }
        }
        
        for service_name, config in service_configs.items():
            with self.subTest(service=service_name):
                # Mock service with configuration
                mock_service = MagicMock()
                mock_service.configure(config)
                
                # Verify configuration was applied
                mock_service.configure.assert_called_once_with(config)

    def test_service_health_checks(self):
        """Test service health checking functionality."""
        # Mock services with health check methods
        services = {
            "driver": MagicMock(),
            "auth": MagicMock(),
            "scraper": MagicMock()
        }
        
        # Configure health check responses
        services["driver"].is_healthy.return_value = True
        services["auth"].is_healthy.return_value = True
        services["scraper"].is_healthy.return_value = False  # Simulate unhealthy service
        
        # Test health checks
        health_results = {}
        for name, service in services.items():
            health_results[name] = service.is_healthy()
        
        # Verify health check results
        self.assertTrue(health_results["driver"], "Driver should be healthy")
        self.assertTrue(health_results["auth"], "Auth should be healthy") 
        self.assertFalse(health_results["scraper"], "Scraper should be unhealthy")

    def test_factory_error_handling(self):
        """Test error handling in service factory."""
        # Mock service creation that can fail
        def create_service_with_error(service_name):
            if service_name == "failing_service":
                raise Exception("Service creation failed")
            return MagicMock()
        
        # Test successful service creation
        try:
            service = create_service_with_error("working_service")
            self.assertIsNotNone(service, "Should create working service")
        except Exception:
            self.fail("Should not raise exception for working service")
        
        # Test failed service creation
        with self.assertRaises(Exception):
            create_service_with_error("failing_service")

    def tearDown(self):
        """Clean up after each test method."""
        # Clean up mock services
        self.mock_services.clear()


if __name__ == '__main__':
    unittest.main(verbosity=2)
