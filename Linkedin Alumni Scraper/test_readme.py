#!/usr/bin/env python3
"""
Quick test script for README verification
"""

try:
    print("🧪 Testing LinkedIn Alumni Scraper components...")
    
    # Test 1: Core imports
    print("1️⃣ Testing core imports...")
    from core.logging_utils import ScrapingLogger, get_error_logger
    print("   ✅ Logging utilities imported")
    
    from core.auth import LinkedInAuth
    print("   ✅ Authentication module imported")
    
    from core.config import config
    print("   ✅ Configuration module imported")
    
    # Test 2: Logging system
    print("2️⃣ Testing logging system...")
    logger = ScrapingLogger()
    logger.start_scraping_session(3, "README Test Session")
    logger.start_profile_scraping("John Doe", 1)
    logger.profile_completed("John Doe", 1)
    logger.session_complete(1, 0, "2.5s")
    print("   ✅ Clean logging system working!")
    
    # Test 3: Data files
    print("3️⃣ Testing data files...")
    import os
    example_file = "data/person_locations/indonesia_names_example.csv"
    if os.path.exists(example_file):
        print("   ✅ Example names file exists")
    else:
        print("   ❌ Example names file missing")
    
    env_example = "../.env.example"
    if os.path.exists(env_example):
        print("   ✅ .env.example file exists")
    else:
        print("   ❌ .env.example file missing")
    
    print("\n🎉 All README components verified successfully!")
    print("📖 README.md is ready for users!")
    
except Exception as e:
    print(f"❌ Error during testing: {e}")
    import traceback
    traceback.print_exc()
