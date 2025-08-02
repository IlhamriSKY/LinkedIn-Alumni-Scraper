"""
LinkedIn Alumni Scraper - Main Scraping Engine

Core scraping functionality with anti-detection measures and automated authentication.
Features: Auto-login, CSS class detection, human-like delays, session recovery.

Functions:
    Browser management utilities
    Authentication handling methods
    Data extraction processes
    Session recovery mechanisms
"""

import os
import time
import random
import csv
import logging
from datetime import datetime
from bs4 import BeautifulSoup
import pandas as pd
import undetected_chromedriver as uc
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import NoSuchElementException, TimeoutException
from dotenv import load_dotenv
from core.data_processor import data_processor

# Configuration
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))

# Initialize new logging system
from core.logging_utils import ScrapingLogger, get_error_logger

# Initialize scraping logger for progress tracking
scraping_logger = ScrapingLogger()
logger = get_error_logger(__name__)
load_dotenv()

# Configuration
linkedin_email = os.getenv('LINKEDIN_EMAIL')
if linkedin_email and '@' in linkedin_email:
    username, domain = linkedin_email.split('@', 1)
    masked_username = username[0] + '*' * (len(username) - 2) + username[-1] if len(username) > 2 else username[0] + '*'
    print(f"[SUCCESS] LinkedIn email loaded: {masked_username}@{domain}")

UNIVERSITY_LINKEDIN_ID = os.getenv('UNIVERSITY_LINKEDIN_ID', 'unika-soegijapranata-semarang')
UNIVERSITY_NAME = os.getenv('UNIVERSITY_NAME', 'University name not configured in .env')
print(f"[INFO] University: {UNIVERSITY_NAME}")

def get_delay_config(delay_type, fast_mode=False):
    """
    Retrieve delay configuration for anti-bot detection.
    
    Args:
        delay_type (str): Type of delay ('action', 'typing', 'scroll', 'click', 'page_load')
        fast_mode (bool): If True, use faster delays for better user experience
        
    Returns:
        tuple: (min_delay, max_delay) in seconds
    """
    if fast_mode:
        delay_configs = {
            'action': (0.3, 0.8), 'typing': (0.02, 0.05), 'scroll': (0.5, 1.0),
            'click': (0.2, 0.5), 'page_load': (1.0, 2.0)
        }
    else:
        delay_configs = {
            'action': (float(os.getenv('MIN_ACTION_DELAY', 2)), float(os.getenv('MAX_ACTION_DELAY', 5))),
            'typing': (float(os.getenv('MIN_TYPING_DELAY', 0.05)), float(os.getenv('MAX_TYPING_DELAY', 0.2))),
            'scroll': (float(os.getenv('MIN_SCROLL_DELAY', 1.5)), float(os.getenv('MAX_SCROLL_DELAY', 4))),
            'click': (float(os.getenv('MIN_CLICK_DELAY', 0.8)), float(os.getenv('MAX_CLICK_DELAY', 2))),
            'page_load': (float(os.getenv('MIN_PAGE_LOAD_DELAY', 3)), float(os.getenv('MAX_PAGE_LOAD_DELAY', 7)))
        }
    return delay_configs.get(delay_type, (0.5, 1.0) if fast_mode else (2, 5))

def random_delay(delay_type='action', fast_mode=False):
    """
    Generate and execute random delay for human-like behavior.
    
    Args:
        delay_type (str): Type of delay to apply ('action', 'typing', 'scroll', 'click', 'page_load')
        fast_mode (bool): If True, use shorter delays for faster processing
        
    Returns:
        float: The actual delay used in seconds
    """
    min_delay, max_delay = get_delay_config(delay_type, fast_mode)
    delay = random.uniform(min_delay, max_delay)
    time.sleep(delay)
    return delay

def type_like_human(element, text, fast_mode=False):
    """
    Simulate human-like typing with random delays between characters.
    
    Args:
        element: WebElement to type into
        text (str): Text to type
        fast_mode (bool): If True, use shorter delays for faster typing
    """
    element.clear()
    min_delay, max_delay = get_delay_config('typing', fast_mode)
    for char in text:
        element.send_keys(char)
        time.sleep(random.uniform(min_delay, max_delay))

# Global state
driver = None
scraped_urls = set()
stop_scraping = False
driver_initialized = False
city_file_path = os.path.join(SCRIPT_DIR, "data", "person_locations", "indonesia_names.csv")
csv_file = os.path.join(SCRIPT_DIR, "data", "Linkedin_SCU_Alumni_2025.csv")
current_scraping_session = None

# New tracking variables for enhanced UI
current_scraping_name = None
scraping_progress = 0

def get_driver():
    """
    Retrieve the global WebDriver instance, initializing if necessary.
    
    This function ensures a single browser session is maintained throughout
    the application lifecycle for optimal performance and session persistence.
    Includes automatic recovery from dead sessions.
    
    Returns:
        webdriver.Chrome: The active Chrome WebDriver instance
        
    Example:
        driver = get_driver()
        driver.get("https://linkedin.com")
    """
    global driver, driver_initialized
    
    # Check if we need to initialize or if current driver is dead
    if driver is None or not driver_initialized:
        logger.info("[RETRY] No driver instance found, initializing new session")
        return start_driver()
    
    # Test if existing driver is still alive
    try:
        # Quick test to see if driver is responsive
        driver.current_url
        return driver
    except Exception as e:
        logger.warning(f"[WARN] Existing driver session is dead: {e}")
        logger.info("[RETRY] Creating new driver session")
        
        # Mark as uninitialized and restart
        driver_initialized = False
        driver = None
        return start_driver()

def is_driver_alive():
    """
    Check if the current driver session is alive and responsive.
    
    Returns:
        bool: True if driver is alive and responsive, False otherwise
    """
    global driver, driver_initialized
    
    if not driver or not driver_initialized:
        return False
    
    try:
        # Test basic driver functionality
        driver.current_url
        driver.title
        return True
    except Exception as e:
        logger.warning(f"[WARN] Driver health check failed: {e}")
        return False

def recover_driver_session():
    """
    Recover from a dead driver session by creating a new one.
    
    Returns:
        webdriver.Chrome: New driver instance or None if recovery failed
    """
    global driver, driver_initialized
    
    logger.warning("[RECOVERY] Attempting driver session recovery...")
    
    try:
        # Clean up dead session
        if driver:
            try:
                driver.quit()
            except:
                pass
        
        # Reset state
        driver = None
        driver_initialized = False
        
        # Create new session
        new_driver = start_driver()
        
        if new_driver:
            logger.info("[OK] Driver session recovered successfully")
            return new_driver
        else:
            logger.error("[ERROR] Driver recovery failed")
            return None
            
    except Exception as e:
        logger.error(f"[ERROR] Error during driver recovery: {e}")
        return None

def get_browser_status():
    """
    Get current browser session status.
    Returns:
        dict: Browser status information
    """
    global driver, driver_initialized
    try:
        if not driver or not driver_initialized:
            return {
                'is_open': False,
                'is_alive': False,
                'current_url': None,
                'status': 'Browser not initialized'
            }
        # Test if driver is alive
        current_url = driver.current_url
        return {
            'is_open': True,
            'is_alive': True,
            'current_url': current_url,
            'status': 'Browser is active and responsive'
        }
    except Exception as e:
        return {
            'is_open': bool(driver),
            'is_alive': False,
            'current_url': None,
            'status': f'Browser session is dead: {str(e)}'
        }

def close_browser():
    """
    Close the browser session and clean up resources.
    Returns:
        dict: Result of browser closure
    """
    global driver, driver_initialized
    try:
        if driver:
            driver.quit()
            logger.info("[OK] Browser closed successfully")
            status = "Browser closed successfully"
        else:
            status = "No browser session to close"
        # Reset state
        driver = None
        driver_initialized = False
        return {
            'success': True,
            'message': status
        }
    except Exception as e:
        logger.error(f"[ERROR] Error closing browser: {e}")
        # Force reset state even if quit failed
        driver = None
        driver_initialized = False
        return {
            'success': True,
            'message': f'Browser force closed: {str(e)}'
        }

def open_browser():
    """
    Open a new browser session.
    Returns:
        dict: Result of browser opening
    """
    try:
        # Check if browser is already open and alive
        status = get_browser_status()
        if status['is_alive']:
            return {
                'success': True,
                'message': 'Browser is already open and active',
                'url': status['current_url']
            }
        # Start new browser session
        new_driver = start_driver()
        if new_driver:
            return {
                'success': True,
                'message': 'Browser opened successfully',
                'url': new_driver.current_url
            }
        else:
            return {
                'success': False,
                'message': 'Failed to open browser'
            }
    except Exception as e:
        logger.error(f"[ERROR] Error opening browser: {e}")
        return {
            'success': False,
            'message': f'Error opening browser: {str(e)}'
        }

def open_linkedin_login():
    """
    Navigate to LinkedIn login page.
    Returns:
        dict: Result of navigation
    """
    try:
        driver = get_driver()
        if not driver:
            return {
                'success': False,
                'message': 'Browser not available. Please open browser first.'
            }
        driver.get("https://www.linkedin.com/login")
        time.sleep(2)  # Give time for page to load
        return {
            'success': True,
            'message': 'LinkedIn login page opened successfully',
            'url': driver.current_url
        }
    except Exception as e:
        logger.error(f"[ERROR] Error opening LinkedIn: {e}")
        return {
            'success': False,
            'message': f'Error opening LinkedIn: {str(e)}'
        }

def start_driver():
    """
    Initialize and configure the Chrome WebDriver with anti-detection settings.
    
    This function sets up an undetected Chrome browser instance with optimized
    configurations to avoid bot detection. It includes custom user agent,
    disabled features, and performance optimizations.
    
    Returns:
        webdriver.Chrome: Configured Chrome WebDriver instance
        
    Raises:
        WebDriverException: If Chrome driver initialization fails
        
    Note:
        Uses undetected_chromedriver to bypass basic anti-bot measures
    """
    global driver, driver_initialized
    if driver is not None and driver_initialized:
        try:
            # Test if driver is still alive by accessing current_url
            driver.current_url
            logger.info("[OK] Using existing browser session")
            return driver
        except:
            # Driver is dead, need to restart
            logger.warning("[WARN] Existing driver session is dead, restarting...")
            driver = None
            driver_initialized = False
    
    options = uc.ChromeOptions()
    
    # Browser optimizations
    options.add_argument("--disable-popup-blocking")
    options.add_argument("--disable-software-rasterizer")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--no-sandbox")
    options.add_argument("--start-maximized")
    options.add_argument("--lang=en-US,en")
    options.add_argument("--disable-web-security")
    options.add_argument("--disable-features=VizDisplayCompositor")
    options.add_argument("--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36")
    options.add_argument("--disable-extensions")
    options.add_argument("--disable-plugins")
    
    # Disable password prompts
    prefs = {
        "credentials_enable_service": False,
        "profile.password_manager_enabled": False,
        "profile.default_content_setting_values.notifications": 2
    }
    options.add_experimental_option("prefs", prefs)
    
    try:
        chromedriver_path = os.path.join(SCRIPT_DIR, "driver", "chromedriver.exe")
        driver = uc.Chrome(driver_executable_path=chromedriver_path, options=options)
        driver_initialized = True
        driver.implicitly_wait(10)
        return driver
    except Exception as e:
        logger.error(f"Browser startup failed: {e}")
        raise

def manual_login():
    """
    Open LinkedIn login page for manual authentication.
    
    This function provides a fallback authentication method when automated
    login fails or additional verification is required.
    
    Returns:
        bool: Always returns True after opening login page
        
    Example:
        manual_login()  # Opens browser for manual login
    """
    driver = get_driver()
    driver.get("https://www.linkedin.com/login")
    print("[INFO] Please log in manually in the browser window.")
    return True

def check_login_status():
    """
    Enhanced check if user is already logged in to LinkedIn.
    
    Returns:
        bool: True if already logged in, False otherwise
    """
    try:
        driver = get_driver()
        if not driver:
            print("[DEBUG] No driver available for login check")
            return False
            
        current_url = driver.current_url
        print(f"[DEBUG] Checking login status for URL: {current_url}")
        
        # Enhanced URL check - more comprehensive LinkedIn URLs
        logged_in_urls = ['feed', 'mynetwork', 'jobs', 'messaging', 'notifications', 'in/profile', 'profile/view']
        if any(indicator in current_url for indicator in logged_in_urls):
            print("[INFO] Already logged in - found in URL")
            return True
        
        # Check for login page indicators (negative check)
        login_page_indicators = ['login', 'checkpoint', 'authwall']
        if any(indicator in current_url for indicator in login_page_indicators):
            print("[INFO] Not logged in - on login page")
            return False
            
        # Try to find navigation elements that indicate login
        navigation_selectors = [
            "[data-control-name='nav.settings']",
            ".global-nav",
            "#global-nav", 
            ".global-nav__me",
            "[data-control-name='nav.homepage']",
            ".global-nav__primary-link",
            ".nav-item__profile-member-photo"
        ]
        
        for selector in navigation_selectors:
            try:
                WebDriverWait(driver, 1).until(
                    EC.presence_of_element_located((By.CSS_SELECTOR, selector))
                )
                print(f"[INFO] Already logged in - found element: {selector}")
                return True
            except TimeoutException:
                continue
        
        # Additional check for profile photo or user menu
        profile_selectors = [
            ".profile-photo",
            "[data-control-name='identity.profile_picture']",
            ".nav-item__profile-member-photo img"
        ]
        
        for selector in profile_selectors:
            try:
                WebDriverWait(driver, 1).until(
                    EC.presence_of_element_located((By.CSS_SELECTOR, selector))
                )
                print(f"[INFO] Already logged in - found profile element: {selector}")
                return True
            except TimeoutException:
                continue
        
        # Final check - look for any LinkedIn authenticated content
        try:
            # Check if page contains authenticated LinkedIn content
            page_source = driver.page_source.lower()
            if 'linkedin.com' in current_url and any(keyword in page_source for keyword in ['nav-item', 'global-nav', 'feed-container']):
                print("[INFO] Already logged in - authenticated content detected")
                return True
        except Exception:
            pass
            
        print("[INFO] Not logged in - no authentication indicators found")
        return False
            
    except Exception as e:
        print(f"[ERROR] Error checking login status: {e}")
        return False

def auto_login():
    """
    Automatically authenticate with LinkedIn using credentials from environment variables.
    Enhanced with session recovery and robust error handling.
    
    This function performs automated LinkedIn login using credentials stored in the .env file.
    It implements human-like typing patterns and configurable delays to avoid detection,
    with enhanced handling for Chrome popups and interruptions.
    
    Environment Variables Required:
        LINKEDIN_EMAIL: LinkedIn account email address
        LINKEDIN_PASSWORD: LinkedIn account password
        
    Returns:
        bool: True if login successful, False otherwise
        
    Raises:
        TimeoutException: If login elements are not found within timeout period
        Exception: For other login-related errors
        
    Example:
        if auto_login():
            print("Successfully logged in")
        else:
            print("Login failed")
            
    Note:
        Uses human-like typing delays and page load waits for stealth operation
        Handles Chrome save password popups and other browser interruptions
    """
    def _perform_login():
        try:
            # First check if already logged in
            print("[INFO] Checking if already logged in...")
            if check_login_status():
                print("[SUCCESS] Already logged in to LinkedIn!")
                return True
                
            print("[INFO] Starting automatic login process...")
            driver = get_driver()
            email = os.getenv('LINKEDIN_EMAIL')
            password = os.getenv('LINKEDIN_PASSWORD')
            
            if not email or not password:
                print("[ERROR] LinkedIn credentials not found in .env file")
                logger.error("LinkedIn credentials not found in .env file")
                return False
                
            print(f"[INFO] Using email: {email[:5]}...@{email.split('@')[1]}")
            print("[INFO] Navigating to LinkedIn login page...")
            driver.get("https://www.linkedin.com/login")
            
            # Wait for login page to load with fast delay for login
            random_delay('page_load', fast_mode=True)
            print("[INFO] Login page loaded successfully")
            
            # Wait for page to be fully loaded - faster timeout for login
            WebDriverWait(driver, 5).until(
                EC.presence_of_element_located((By.ID, "username"))
            )
            
            # Handle any existing popups or dialogs first
            try:
                # Try to dismiss Chrome save password notification
                driver.execute_script("""
                    // Try to dismiss various Chrome popups
                    const popups = document.querySelectorAll('[role="dialog"], .save-password-bubble, [data-testid="save-password-bubble"]');
                    popups.forEach(popup => {
                        const neverButton = popup.querySelector('[data-tooltip="Never"], button[data-tooltip="Not now"], .never-button');
                        if (neverButton) neverButton.click();
                    });
                """)
                random_delay('action', fast_mode=True)
            except:
                pass  # Ignore if no popups
            
            # Find and fill email field with human-like typing - faster timeout
            try:
                email_field = WebDriverWait(driver, 8).until(
                    EC.element_to_be_clickable((By.ID, "username"))
                )
                # Clear any existing content first
                email_field.clear()
                random_delay('click', fast_mode=True)
                type_like_human(email_field, email, fast_mode=True)
                print("[SUCCESS] Email entered successfully")
            except TimeoutException:
                print("[ERROR] Could not find email field")
                logger.error("Could not find email field during login")
                return False
            
            # Find and fill password field with human-like typing - faster timeout
            try:
                password_field = WebDriverWait(driver, 8).until(
                    EC.element_to_be_clickable((By.ID, "password"))
                )
                password_field.clear()
                random_delay('click', fast_mode=True)
                type_like_human(password_field, password, fast_mode=True)
                print("[SUCCESS] Password entered successfully")
            except TimeoutException:
                print("[ERROR] Could not find password field")
                logger.error("Could not find password field during login")
                return False
            
            # Try to dismiss any Chrome popups that might appear after typing
            try:
                driver.execute_script("""
                    // Try to dismiss various Chrome popups
                    const popups = document.querySelectorAll('[role="dialog"], .save-password-bubble, [data-testid="save-password-bubble"]');
                    popups.forEach(popup => {
                        const neverButton = popup.querySelector('[data-tooltip="Never"], button[data-tooltip="Not now"], .never-button');
                        if (neverButton) neverButton.click();
                    });
                """)
                random_delay('action', fast_mode=True)
            except:
                pass
            
            # Click login button with realistic delay - faster timeout
            try:
                login_button = WebDriverWait(driver, 8).until(
                    EC.element_to_be_clickable((By.XPATH, "//button[@type='submit']"))
                )
                random_delay('click', fast_mode=True)
                # Use JavaScript click to avoid interceptions
                driver.execute_script("arguments[0].click();", login_button)
                print("[PROCESSING] Login button clicked, waiting for response...")
            except TimeoutException:
                print("[ERROR] Could not find login button")
                logger.error("Could not find login button during login")
                return False
            
            # Wait longer for login to complete and handle various scenarios
            print("[WAIT] Waiting for login to complete...")
            
            # Try multiple approaches to verify login success
            for attempt in range(3):
                try:
                    # Wait for successful login indicators - faster timeout for login
                    WebDriverWait(driver, 6).until(
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
                    # Check current URL and handle different scenarios
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
                        if attempt < 2:
                            random_delay('action', fast_mode=True)
                            continue
                    else:
                        # Check if we're actually logged in but page is still loading
                        try:
                            if driver.find_element(By.CSS_SELECTOR, "[data-control-name='nav.settings']"):
                                print("[SUCCESS] Login successful (found nav element)!")
                                return True
                        except:
                            pass
                        
                        print(f"[WARNING] Unexpected URL: {current_url}")
                        if attempt < 2:
                            random_delay('action', fast_mode=True)
                            continue
            
            print("[ERROR] Login verification failed after all attempts")
            logger.error("Login verification failed after all attempts")
            return False
            
        except Exception as e:
            print(f"[ERROR] Unexpected error during login: {e}")
            logger.error(f"Unexpected error during login: {e}")
            return False
    
    # Use safe operation with recovery
    result = safe_driver_operation(_perform_login, max_retries=1)
    return result or False

def stop_scraping_process():
    """
    Stop the currently running scraping process gracefully.
    
    Sets the global stop_scraping flag to True, which signals the main scraping
    loop to gracefully terminate after completing the current profile.
    
    Note:
        This function provides a safe way to interrupt scraping without data loss.
        The scraping will complete the current profile before stopping.
        
    Global Variables Modified:
        stop_scraping (bool): Set to True to signal process termination
    """
    global stop_scraping
    stop_scraping = True
    print("[STOP] Stop scraping signal sent.")

def reset_scraping_flag():
    """
    Reset the scraping control flag to allow new scraping sessions.
    
    Resets the global stop_scraping flag to False, enabling a new scraping
    session to start. This should be called at the beginning of each new
    scraping operation.
    
    Global Variables Modified:
        stop_scraping (bool): Reset to False to allow scraping to proceed
    """
    global stop_scraping
    stop_scraping = False

def safe_driver_operation(operation_func, *args, max_retries=2, **kwargs):
    """
    Execute a driver operation with automatic recovery from dead sessions.
    
    This function provides a robust wrapper for WebDriver operations that may fail
    due to dead browser sessions. It automatically detects failures and attempts
    to recover by creating a new driver session.
    
    Args:
        operation_func (callable): Function to execute with driver
        *args: Variable length argument list to pass to operation_func
        max_retries (int): Maximum number of recovery attempts (default: 2)
        **kwargs: Arbitrary keyword arguments to pass to operation_func
        
    Returns:
        Any: Result of operation_func if successful, None if all attempts fail
        
    Example:
        result = safe_driver_operation(some_selenium_function, arg1, arg2, timeout=10)
        
    Note:
        Used internally to ensure reliable WebDriver operations throughout the scraping process.
    """
    global driver
    
    for attempt in range(max_retries + 1):
        try:
            # Ensure we have a working driver
            if not is_driver_alive():
                print(f"[WARNING] Driver not alive on attempt {attempt + 1}, recovering...")
                driver = recover_driver_session()
                if not driver:
                    logger.error(f"[ERROR] Driver recovery failed on attempt {attempt + 1}")
                    continue
            
            # Execute the operation
            return operation_func(*args, **kwargs)
            
        except Exception as e:
            logger.warning(f"[WARN] Driver operation failed on attempt {attempt + 1}: {e}")
            
            if attempt < max_retries:
                logger.info(f"[RETRY] Retrying operation ({attempt + 1}/{max_retries})")
                driver = recover_driver_session()
                if not driver:
                    logger.error(f"[ERROR] Recovery failed, skipping retry {attempt + 1}")
                    continue
            else:
                logger.error(f"[ERROR] All retries exhausted for operation")
                return None
    
    return None

def is_logged_in():
    """
    Check if user is currently logged into LinkedIn.
    
    Performs a comprehensive check by navigating to LinkedIn feed and looking for
    logged-in specific elements like navigation bar and settings menu.
    
    Returns:
        bool: True if user is logged in, False otherwise
        
    Note:
        Uses safe_driver_operation for automatic recovery from dead sessions.
        Checks multiple elements to ensure reliable login status detection.
    """
    def _check_login():
        try:
            driver = get_driver()
            
            # First, navigate to LinkedIn to check if we're logged in
            try:
                driver.get("https://www.linkedin.com/feed")
                random_delay('page_load')
            except Exception as e:
                print(f"[ERROR] Could not navigate to LinkedIn: {e}")
                logger.error(f"Could not navigate to LinkedIn: {e}")
                return False
            
            current_url = driver.current_url
            print(f"[DEBUG] Current URL for login check: {current_url}")
            
            # Quick check for logged-in URLs
            if "linkedin.com/feed" in current_url or "linkedin.com/in/" in current_url:
                print("[SUCCESS] User is logged in (URL check)")
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
                print("[SUCCESS] User is logged in (element check)")
                return True
            except TimeoutException:
                print("[INFO] User is not logged in")
                return False
                
        except Exception as e:
            print(f"[ERROR] Error checking login status: {e}")
            logger.error(f"Error checking login status: {e}")
            return False
    
    return safe_driver_operation(_check_login) or False

def ensure_logged_in():
    """
    Ensure user is logged into LinkedIn, attempting auto-login if necessary.
    
    Checks current login status and automatically attempts login if not authenticated.
    Uses the auto_login function with credentials from environment variables.
    
    Returns:
        bool: True if login successful or already logged in, False otherwise
        
    Note:
        This is the main authentication entry point for the scraping process.
        Uses safe_driver_operation for session recovery capabilities.
    """
    def _ensure_login():
        if is_logged_in():
            print("[SUCCESS] Already logged in!")
            return True
        
        print("[INFO] Not logged in, attempting automatic login...")
        return auto_login()
    
    result = safe_driver_operation(_ensure_login)
    if result:
        return True
    else:
        print("[ERROR] Automatic login failed. Please check credentials.")
        logger.error("Automatic login failed. Please check credentials.")
        return False

def auto_detect_classes():
    """Automatically detect CSS classes for location and sections by analyzing a sample profile."""
    try:
        print("[SEARCH] Auto-detecting CSS classes...")
        
        # First try to find profiles using name search for more targeted results
        sample_profile_url = find_sample_profile_by_name()
        
        # If name search fails, try the general alumni page
        if not sample_profile_url:
            sample_profile_url = find_sample_profile_from_alumni_page()
        
        if not sample_profile_url:
            print("[ERROR] Could not find sample profile for class detection")
            return get_fallback_classes()
        
        # Open sample profile in new tab with delay
        driver.execute_script("window.open(arguments[0]);", sample_profile_url)
        random_delay('action')
        driver.switch_to.window(driver.window_handles[1])
        random_delay('page_load')
        
        # Scroll to load all sections
        scroll_page(driver, max_clicks=3)
        
        soup = BeautifulSoup(driver.page_source, 'lxml')
        
        # Auto-detect location class
        location_class = auto_detect_location_class(soup)
        
        # Auto-detect section class
        section_class = auto_detect_section_class(soup)
        
        # Close the profile tab with delay
        driver.close()
        random_delay('action')
        driver.switch_to.window(driver.window_handles[0])
        
        print(f"[SUCCESS] Auto-detected classes:")
        print(f"   [LOCATION] Location class: {location_class}")
        print(f"   [SECTION] Section class: {section_class}")
        
        return location_class, section_class
        
    except Exception as e:
        print(f"[ERROR] Error in auto-detection: {e}")
        return get_fallback_classes()

def find_sample_profile_by_name():
    """Find a sample profile by searching for a name from the names CSV."""
    try:
        driver = get_driver()
        print(f"[DEBUG] Looking for CSV file at: {city_file_path}")
        
        # Read names from CSV with better error handling
        if os.path.exists(city_file_path):
            print(f"[INFO] CSV file found, reading names...")
            try:
                names_df = pd.read_csv(city_file_path, encoding='utf-8')
                print(f"[DEBUG] CSV columns: {names_df.columns.tolist()}")
                print(f"[DEBUG] CSV shape: {names_df.shape}")
                
                if "Name" not in names_df.columns:
                    print("[ERROR] Column 'Name' not found in CSV file")
                    return None
                    
                names = names_df["Name"].dropna().tolist()[:5]  # Try first 5 names, remove NaN
                print(f"[INFO] Found {len(names)} names to search: {names}")
                
                for i, name in enumerate(names):
                    print(f"[INFO] Searching for name {i+1}/{len(names)}: {name}")
                    search_url = f"https://www.linkedin.com/school/{UNIVERSITY_LINKEDIN_ID}/people/?keywords={name.strip()}"
                    print(f"[DEBUG] Search URL: {search_url}")
                    
                    driver.get(search_url)
                    random_delay('action', fast_mode=True)  # Use fast mode for search
                    
                    try:
                        profiles = WebDriverWait(driver, 8).until(  # Reduced timeout
                            EC.presence_of_all_elements_located((By.XPATH, '//div[contains(@class, "org-people-profile-card__profile-info")]'))
                        )
                        
                        if profiles:
                            profile_url_element = profiles[0].find_element(By.XPATH, './/div[contains(@class, "artdeco-entity-lockup__title")]//a[contains(@href, "/in/")]')
                            profile_url = profile_url_element.get_attribute("href")
                            if profile_url:
                                print(f"[SUCCESS] Found sample profile using name: {name}")
                                print(f"[SUCCESS] Profile URL: {profile_url}")
                                return profile_url
                    except Exception as search_error:
                        print(f"[WARNING] Search failed for {name}: {search_error}")
                        continue
                        
            except Exception as csv_error:
                print(f"[ERROR] Failed to read CSV file: {csv_error}")
                return None
        else:
            print(f"[ERROR] CSV file not found at: {city_file_path}")
            return None
                    
        return None
    except Exception as e:
        print(f"[WARNING] Error finding profile by name: {e}")
        return None

def find_sample_profile_from_alumni_page():
    """Find a sample profile from the general alumni page."""
    try:
        driver = get_driver()
        # Go to university alumni page to find a sample profile
        sample_url = f"https://www.linkedin.com/school/{UNIVERSITY_LINKEDIN_ID}/people/"
        driver.get(sample_url)
        random_delay('page_load')
        
        # Scroll to load profiles
        scroll_page(driver, max_clicks=2)
        
        # Find a sample profile URL
        profiles = WebDriverWait(driver, 10).until(
            EC.presence_of_all_elements_located((By.XPATH, '//div[contains(@class, "org-people-profile-card__profile-info")]'))
        )
        
        for profile in profiles[:3]:  # Try first 3 profiles
            try:
                profile_url_element = profile.find_element(By.XPATH, './/div[contains(@class, "artdeco-entity-lockup__title")]//a[contains(@href, "/in/")]')
                sample_profile_url = profile_url_element.get_attribute("href")
                if sample_profile_url:
                    print("[SUCCESS] Found sample profile from alumni page")
                    return sample_profile_url
            except:
                continue
                
        return None
    except Exception as e:
        print(f"[WARNING] Error finding profile from alumni page: {e}")
        return None

def get_fallback_classes():
    """Return fallback CSS classes if auto-detection fails."""
    location_class = "text-body-small inline t-black--light break-words"
    section_class = "artdeco-list__item pvs-list__item--line-separated pvs-list__item--one-column"
    print(f"[WARNING] Using fallback classes:")
    print(f"   [LOCATION] Location: {location_class}")
    print(f"   [SECTION] Section: {section_class}")
    return location_class, section_class

def auto_detect_location_class(soup):
    """Auto-detect location class from profile HTML."""
    try:
        # Common location selectors to try
        location_selectors = [
            {'tag': 'span', 'class_contains': ['text-body-small', 'break-words']},
            {'tag': 'div', 'class_contains': ['text-body-small', 'inline']},
            {'tag': 'span', 'class_contains': ['text-body-small', 'inline', 't-black--light']},
            {'tag': 'div', 'class_contains': ['pv-text-details__left-panel']},
            {'tag': 'span', 'class_contains': ['text-body-small']},
        ]
        
        # Try to find location element by looking for common location patterns
        for selector in location_selectors:
            elements = soup.find_all(selector['tag'])
            for element in elements:
                if element.get('class'):
                    class_list = element.get('class')
                    class_str = ' '.join(class_list)
                    
                    # Check if this element contains location-like text
                    text = element.get_text(strip=True).lower()
                    if any(keyword in text for keyword in ['indonesia', 'jakarta', 'semarang', 'surabaya', 'bandung', 'yogyakarta', 'area', 'region']):
                        # Check if classes match our selector pattern
                        if all(keyword in class_str for keyword in selector['class_contains']):
                            print(f"[TARGET] Found location class: {class_str}")
                            return class_str
        
        # Fallback: look for common location class patterns
        fallback_patterns = [
            "text-body-small inline t-black--light break-words",
            "text-body-small break-words",
            "pv-text-details__left-panel",
            "text-body-small inline"
        ]
        
        for pattern in fallback_patterns:
            if soup.find('span', {'class': pattern}) or soup.find('div', {'class': pattern}):
                print(f"[TARGET] Using fallback location class: {pattern}")
                return pattern
                
        return "text-body-small inline t-black--light break-words"  # Default fallback
        
    except Exception as e:
        print(f"[WARNING] Error detecting location class: {e}")
        return "text-body-small inline t-black--light break-words"

def auto_detect_section_class(soup):
    """Auto-detect section class for experience/education from profile HTML - Optimized version."""
    try:
        # Fast detection - Try most common patterns first
        common_patterns = [
            "artdeco-list__item pvs-list__item--line-separated pvs-list__item--one-column",
            "artdeco-list__item pvs-list__item--line-separated", 
            "pvs-list__item--line-separated",
            "artdeco-list__item",
            "pv-entity__summary-info"
        ]
        
        print("[INFO] Quick CSS pattern detection...")
        
        # Fast check for most common patterns (90% of cases)
        for pattern in common_patterns:
            if soup.find('div', {'class': pattern}):
                print(f"[SUCCESS] Fast detection found: {pattern}")
                return pattern
        
        print("[INFO] Fallback to deep detection...")
        
        # Fallback - Look for experience section (slower but thorough)
        experience_selectors = [
            'section[id*="experience"]',
            'section[data-section="experience"]', 
            'div[id*="experience"]',
            'section:has(h2:contains("Experience"))',
            'div:has(h3:contains("Experience"))'
        ]
        
        for selector in experience_selectors:
            try:
                experience_section = soup.select_one(selector)
                if experience_section:
                    # Find list items quickly
                    list_items = experience_section.select('div[class*="list"], div[class*="item"]')[:5]  # Limit to first 5
                    
                    for item in list_items:
                        class_str = ' '.join(item.get('class', []))
                        if class_str and len(class_str) > 10:  # Must have meaningful class
                            print(f"[SUCCESS] Deep detection found: {class_str}")
                            return class_str
                    break
            except:
                continue
                
        # Final fallback 
        print("[WARNING] Using default pattern")
        return "artdeco-list__item pvs-list__item--line-separated pvs-list__item--one-column"
        
    except Exception as e:
        print(f"[WARNING] Error detecting section class: {e}")
        return "artdeco-list__item pvs-list__item--line-separated pvs-list__item--one-column"

def scroll_page(driver, max_clicks=10):
    """Scrolls down dynamically and clicks 'Load more' if present."""
    clicks = 0
    total_scrolls = random.randint(10, 20)

    body = driver.find_element("tag name", "body")

    for i in range(total_scrolls):
        # Scroll a bit with human-like variation
        scroll_height = random.randint(300, 700)
        driver.execute_script(f"window.scrollBy(0, {scroll_height});")
        random_delay('scroll')

        # Occasionally scroll up to mimic human behavior
        if random.random() < 0.2:
            driver.execute_script(f"window.scrollBy(0, {-random.randint(100, 300)});")
            random_delay('action')

        # Try clicking "Load more" if it's there
        try:
            load_more = driver.find_element(By.XPATH, '//*[@class="artdeco-button artdeco-button--muted artdeco-button--1 artdeco-button--full artdeco-button--secondary ember-view scaffold-finite-scroll__load-button"]')
            if load_more.is_displayed():
                print("[PROCESSING] Clicking 'Load more'...")
                driver.execute_script("arguments[0].click();", load_more)
                random_delay('action')
                clicks += 1
                if clicks >= max_clicks:
                    print("[STOP] Max load-more clicks reached.")
                    break
        except NoSuchElementException:
            pass

    # Final scroll to bottom
    driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")

def extract_profile_data(profile_url, location_class, section_class):
    """Extracts Experience, Education, and Licenses from an individual LinkedIn profile with dynamic class input."""
    driver = get_driver()
    driver.get(profile_url)
    random_delay('page_load')
    scroll_page(driver)

    soup = BeautifulSoup(driver.page_source, 'lxml')

    profile_data = {
        "Location": "N/A",
        "Experience": [],
        "Education": [],
        "Licenses & Certifications": []
    }

    # Extract Location using user-defined class
    if location_class:
        location_div = soup.find('div', {'class': location_class})
        if location_div:
            location_span = location_div.find('span')
            if location_span:
                text = location_span.get_text(strip=True)
                if text:
                    profile_data["Location"] = text

    # Common logic to find section by ID
    def find_section_by_id(section_id):
        return soup.find('section', {'id': section_id}) or \
               next((sec for sec in soup.find_all('section') if sec.find('div', {'id': section_id})), None)

    # Extract Experience
    experience = find_section_by_id('experience')
    if experience and section_class:
        experiences = experience.find_all('div', {'class': section_class})
        for exp in experiences:
            job_title = exp.find('span', {'class': 'visually-hidden'})
            company = exp.find('span', {'class': 't-14 t-normal'})
            duration = exp.find('span', {'class': 't-14 t-normal t-black--light'})

            profile_data["Experience"].append({
                "Job Title": job_title.get_text(strip=True) if job_title else "N/A",
                "Company": company.get_text(strip=True) if company else "N/A",
                "Duration": duration.get_text(strip=True) if duration else "N/A"
            })

    # Extract Education
    education = find_section_by_id('education')
    if education and section_class:
        educations = education.find_all('div', {'class': section_class})
        for edu in educations:
            spans = edu.find_all('span', {'class': 'visually-hidden'})
            school = spans[0].get_text(strip=True) if len(spans) > 0 else "N/A"
            degree = spans[1].get_text(strip=True) if len(spans) > 1 else "N/A"
            duration = spans[2].get_text(strip=True) if len(spans) > 2 else "N/A"
            project = spans[3].get_text(strip=True) if len(spans) > 3 else "N/A"

            profile_data["Education"].append({
                "School": school,
                "Degree": degree,
                "Duration": duration,
                "Project": project
            })

    # Extract Licenses & Certifications
    licenses = find_section_by_id('licenses_and_certifications')
    if licenses and section_class:
        license_list = licenses.find_all('div', {'class': section_class})
        for lic in license_list:
            cert_name = lic.find('span', {'class': 'visually-hidden'})
            issued_by = lic.find('span', {'class': 't-14 t-normal'})

            profile_data["Licenses & Certifications"].append({
                "Certification": cert_name.get_text(strip=True) if cert_name else "N/A",
                "Issued By": issued_by.get_text(strip=True) if issued_by else "N/A"
            })

    return profile_data



def search_alumni(keyword, profiles_scraped, max_profiles, location_class, section_class):
    """
    Search and scrape LinkedIn alumni profiles for a specific keyword with enhanced error handling.
    
    This function implements the 'let it error' principle - continues to next profile if one fails,
    ensuring robust operation. Each profile opens in a new tab, gets scraped, then tab is closed.
    
    Args:
        keyword (str): Name to search for
        profiles_scraped (int): Current count of scraped profiles
        max_profiles (int): Maximum profiles to scrape
        location_class (str): CSS selector for location
        section_class (str): CSS selector for experience sections
        
    Returns:
        list: List of dictionaries containing scraped profile data
    """
    global stop_scraping
    driver = get_driver()
    
    # Ensure we're on the main window (not a profile tab)
    if len(driver.window_handles) > 1:
        # Close any extra tabs and return to main window
        while len(driver.window_handles) > 1:
            driver.switch_to.window(driver.window_handles[-1])
            driver.close()
        driver.switch_to.window(driver.window_handles[0])
    
    alumni_list = []
    
    # Navigate to LinkedIn search with the keyword
    try:
        search_url = f"https://www.linkedin.com/school/{UNIVERSITY_LINKEDIN_ID}/people/?keywords={keyword}"
        scraping_logger.scraping_status("Navigating to search page")
        driver.get(search_url)
        random_delay('page_load')
    except Exception as e:
        logger.error(f"Failed to navigate to search page for {keyword}: {e}")
        return []

    # Main scraping loop with scroll attempts
    while profiles_scraped + len(alumni_list) < max_profiles:
        if stop_scraping:
            return alumni_list

        try:
            # Scroll page to load profiles
            scraping_logger.scraping_status("Loading profiles")
            scroll_page(driver)
            random_delay('action')

            # Find all profile containers with error handling
            try:
                profiles = WebDriverWait(driver, 15).until(
                    EC.presence_of_all_elements_located((By.XPATH, '//div[contains(@class, "org-people-profile-card__profile-info")]'))
                )
            except Exception as e:
                logger.error(f"Could not find profile containers for {keyword}: {e}")
                break

            new_profile_found = False
            profile_count = 0

            for profile in profiles:
                if stop_scraping:
                    return alumni_list
                    
                if profiles_scraped + len(alumni_list) >= max_profiles:
                    return alumni_list

                try:
                    profile_count += 1

                    # Extract profile URL with error handling
                    try:
                        profile_url_element = profile.find_element(By.XPATH, './/div[contains(@class, "artdeco-entity-lockup__title")]//a[contains(@href, "/in/")]')
                        profile_url = profile_url_element.get_attribute("href") if profile_url_element else ""
                        
                        if not profile_url or profile_url in scraped_urls:
                            continue
                            
                    except Exception as e:
                        continue

                    # Extract basic profile info with error handling
                    try:
                        name_element = profile.find_element(By.XPATH, './/div[contains(@class, "artdeco-entity-lockup__title")]')
                        name = name_element.text.strip() if name_element else "Unknown"
                    except:
                        name = keyword  # Fallback to search keyword

                    try:
                        job_element = profile.find_element(By.XPATH, './/div[contains(@class, "artdeco-entity-lockup__subtitle")]')
                        job_title = job_element.text.strip() if job_element else "N/A"
                    except:
                        job_title = "N/A"

                    try:
                        image_element = profile.find_element(By.TAG_NAME, "img")
                        image_url = image_element.get_attribute("src") if image_element else "No image"
                    except:
                        image_url = "No image"

                    # Now scrape detailed profile data
                    profile_data = {}
                    tab_opened = False
                    
                    try:
                        # Open profile in new tab
                        scraping_logger.scraping_status(f"Scraping profile: {name}")
                        driver.execute_script("window.open(arguments[0]);", profile_url)
                        tab_opened = True
                        random_delay('action')
                        
                        # Switch to the new tab
                        driver.switch_to.window(driver.window_handles[1])
                        random_delay('page_load')
                        
                        # Extract detailed profile data
                        profile_data = extract_profile_data(profile_url, location_class, section_class)
                        
                    except Exception as e:
                        logger.error(f"Error scraping profile {name}: {e}")
                        # Use fallback data
                        profile_data = {
                            "Location": "N/A",
                            "Experience": "Error extracting experience",
                            "Education": "Error extracting education", 
                            "Licenses & Certifications": "Error extracting certifications"
                        }
                    
                    finally:
                        # Always close the profile tab and return to main window
                        if tab_opened and len(driver.window_handles) > 1:
                            try:
                                driver.close()  # Close current tab (profile tab)
                                driver.switch_to.window(driver.window_handles[0])  # Return to main window
                            except Exception as e:
                                logger.error(f"Could not close profile tab properly: {e}")
                                # Force return to main window
                                try:
                                    driver.switch_to.window(driver.window_handles[0])
                                except:
                                    pass

                    # Add to results regardless of scraping success (let it error principle)
                    scraped_urls.add(profile_url)
                    new_profile_found = True

                    alumni_list.append({
                        "City": profile_data.get("Location", "N/A"),
                        "Name": name,
                        "Headlines": job_title,
                        "Linkedin Link": profile_url,
                        "Profile Picture": image_url,
                        "Experience": profile_data.get("Experience", "N/A"),
                        "Education": profile_data.get("Education", "N/A"),
                        "Licenses & Certifications": profile_data.get("Licenses & Certifications", "N/A"),
                        "Scraped At": datetime.now().strftime('%Y-%m-%d %H:%M:%S')
                    })

                except Exception as e:
                    logger.error(f"Critical error processing profile {profile_count}: {e}")
                    # Continue to next profile (let it error principle)
                    continue

            # Check if we found new profiles in this scroll
            if not new_profile_found:
                break

        except Exception as e:
            logger.error(f"Error during search loop for {keyword}: {e}")
            break

    return alumni_list


def save_to_csv(all_alumni_data, filename=csv_file):
    # Always load existing data if the file exists
    existing_data = load_existing_data(filename) if os.path.exists(filename) else []

    # Merge new data into the existing data (overwrite profiles with matching URLs)
    for new_profile in all_alumni_data:
        existing_profile = next((p for p in existing_data if p["Linkedin Link"] == new_profile["Linkedin Link"]), None)
        if existing_profile:
            existing_data[existing_data.index(existing_profile)] = new_profile
        else:
            existing_data.append(new_profile)

    # Save the merged data back to the CSV
    with open(filename, mode='w', newline='', encoding='utf-8') as f:
        fieldnames = ["City", "Name", "Headlines", "Linkedin Link", "Profile Picture", "Experience", "Education", "Licenses & Certifications", "Scraped At"]
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(existing_data)

    print(f"[SUCCESS] Data successfully saved to {filename}")
    
    
def load_existing_data(filename):
    """Load existing data from the CSV file."""
    try:
        if os.path.exists(filename):
            with open(filename, newline='', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                return list(reader)
        else:
            return []
    except Exception as e:
        print(f"[WARNING] Error loading existing data: {e}")
        return []


def count_names_to_scrape(input_file=None):
    """Count total names that will be scraped."""
    try:
        file_path = input_file if input_file else city_file_path
        if os.path.exists(file_path):
            df = pd.read_csv(file_path)
            total_names = len(df)
            print(f"[STATS] Total names to scrape: {total_names}")
            return total_names
        else:
            print(f"[ERROR] File not found: {file_path}")
            return 0
    except Exception as e:
        print(f"[WARNING] Error counting names: {e}")
        return 0


def get_last_scraped_name(output_file):
    """Get the last successfully scraped name from output file."""
    try:
        if os.path.exists(output_file):
            df = pd.read_csv(output_file)
            if not df.empty:
                # Get the last scraped entry and return the name
                last_entry = df.iloc[-1]
                last_name = last_entry.get('Name', '')
                print(f"[PROCESSING] Last scraped name: {last_name}")
                return last_name
        return None
    except Exception as e:
        print(f"[WARNING] Error getting last scraped name: {e}")
        return None


def get_resume_point(input_file, output_file):
    """Get the starting point for resuming scraping with comprehensive logging."""
    try:
        last_name = get_last_scraped_name(output_file)
        if not last_name:
            logger.info("[NEW] Starting from beginning (no previous data found)")
            return 0
        
        # Read input file to find the index of last scraped name
        file_path = input_file if input_file else city_file_path
        if os.path.exists(file_path):
            df = pd.read_csv(file_path)
            name_list = df['Name'].tolist()
            
            # Find the index of last scraped name
            for i, name in enumerate(name_list):
                if name.strip() == last_name.strip():
                    resume_index = i + 1  # Start from next name
                    remaining_names = len(name_list) - resume_index
                    next_name = name_list[resume_index] if resume_index < len(name_list) else 'END'
                    
                    logger.info(f"[TARGET] Found resume point at index {resume_index}")
                    logger.info(f"[NOTE] Last scraped: '{last_name}'")
                    logger.info(f"[NEXT] Next to scrape: '{next_name}'")
                    logger.info(f"[DATA] Remaining names: {remaining_names}")
                    return resume_index
            
            # If last name not found in input file, start from beginning
            logger.warning(f"[WARN] Last scraped name '{last_name}' not found in input file. Starting from beginning.")
            return 0
        else:
            logger.error(f"[ERROR] Input file not found: {file_path}")
            return 0
            
    except Exception as e:
        logger.error(f"[ERROR] Error determining resume point: {e}")
        return 0


def save_scraping_progress(name, output_file):
    """Save current scraping progress to a temporary file with logging."""
    global current_scraping_name, scraping_progress
    current_scraping_name = name
    
    try:
        progress_file = "data/scraping_progress.txt"
        os.makedirs(os.path.dirname(progress_file), exist_ok=True)
        with open(progress_file, 'w', encoding='utf-8') as f:
            f.write(f"Last scraped: {name}\n")
            f.write(f"Output file: {output_file}\n")
            f.write(f"Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        logger.debug(f"[SAVE] Progress saved: {name}")
    except Exception as e:
        logger.warning(f"[WARN] Error saving progress: {e}")


def get_scraping_progress():
    """
    Get current scraping progress percentage.
    
    Returns:
        float: Progress percentage (0-100) of current scraping session
        
    Note:
        Used by the web interface to display real-time progress updates.
    """
    global scraping_progress
    return scraping_progress


def get_current_scraping_name():
    """
    Get the name currently being processed in the scraping session.
    
    Returns:
        str: Name of the person currently being scraped, None if no active session
        
    Note:
        Used by the web interface to show which profile is being processed.
    """
    global current_scraping_name
    return current_scraping_name


def update_scraping_progress(current_index, total_count):
    """
    Update the scraping progress percentage based on current position.
    
    Args:
        current_index (int): Current position in the name list (0-based)
        total_count (int): Total number of names to process
        
    Note:
        Automatically calculates percentage and updates global progress variable.
        Safe against division by zero.
    """
    global scraping_progress
    if total_count > 0:
        scraping_progress = (current_index / total_count) * 100
    return scraping_progress


def set_input_file(uploaded_file_path):
    """
    Set the input CSV file path for the scraping session.
    
    Args:
        uploaded_file_path (str): Path to uploaded CSV file, or None to use default
        
    Returns:
        str: Path to the selected input file (uploaded or default)
        
    Note:
        If uploaded file doesn't exist, automatically falls back to default
        indonesia_names.csv file. Updates global city_file_path variable.
    """
    global city_file_path
    if uploaded_file_path and os.path.exists(uploaded_file_path):
        city_file_path = uploaded_file_path
        logger.info(f"[FILE] Using uploaded file: {uploaded_file_path}")
    else:
        city_file_path = os.path.join(SCRIPT_DIR, "data", "person_locations", "indonesia_names.csv")
        logger.info(f"[FILE] Using default file: {city_file_path}")
    return city_file_path


def run_scraper(location_class=None, section_class=None, max_profiles=10, auto_detect=True, input_file=None, output_file=None, resume_scraping=True):
    """
    Main scraper function with clean progress logging.
    
    Flow:
    1. Auto login (if not already logged in)
    2. Detect CSS classes (if auto_detect enabled)
    3. Upload/use name list
    4. Scraping (with new tab for each profile)
    5. Download results
    
    Implements 'let it error' principle - continues with next name if current fails.
    Supports resume functionality to continue from last scraped profile.
    """
    global scraped_urls
    
    # Start scraping session with clean progress tracking
    scraping_logger.start_scraping_session(max_profiles, f"LinkedIn Alumni Scraper - {UNIVERSITY_NAME}")
    
    # Reset the stop flag at the beginning of scraping
    reset_scraping_flag()

    # Step 1: Ensure we have a browser session and are logged in
    print("🔐 Authenticating...")
    if not ensure_logged_in():
        logger.error("Failed to login. Cannot proceed with scraping.")
        return False
    print("✅ Authentication successful")
    
    # Step 2: Auto-detect CSS classes if not provided or if auto_detect is True
    print("🔍 Detecting CSS classes...")
    if auto_detect or not location_class or not section_class:
        detected_location_class, detected_section_class = auto_detect_classes()
        
        # Use detected classes if available, otherwise use provided ones
        location_class = detected_location_class or location_class or "text-body-small inline t-black--light break-words"
        section_class = detected_section_class or section_class or "artdeco-list__item pvs-list__item--line-separated pvs-list__item--one-column"
        
    print("✅ CSS classes configured")
    
    # Step 3: Set input file (uploaded or default)
    print("📂 Setting up input file...")
    current_input_file = set_input_file(input_file)
    
    # Determine output file (always use csv_file for append mode)
    if not output_file:
        output_file = csv_file
    
    # Count total names to be scraped
    total_names = count_names_to_scrape(current_input_file)
    if total_names == 0:
        logger.error("No names found to scrape!")
        return False
    
    print(f"📊 Found {total_names} names to process")
    
    # Step 4: Determine starting point for resume scraping
    start_index = 0
    if resume_scraping:
        start_index = get_resume_point(current_input_file, output_file)
        if start_index > 0:
            print(f"⏭️ Resuming from name #{start_index + 1}")
    
    # Load existing scraped URLs to avoid duplicates
    existing_data = load_existing_data(output_file)
    scraped_urls = set(p["Linkedin Link"] for p in existing_data)

    # Prepare name list
    keywords_df = pd.read_csv(current_input_file)
    keywords = keywords_df["Name"].tolist()[start_index:]  # Start from resume point

    # Initialize tracking variables
    all_data = []
    profiles_scraped = len(existing_data)  # Count existing profiles
    current_name_index = start_index
    successful_names = 0
    failed_names = 0

    print(f"🚀 Starting scraping - Target: {max_profiles} profiles")

    # Main scraping loop
    for i, keyword in enumerate(keywords):
        if stop_scraping:
            print("⏹️ Scraping stopped by user")
            break
            
        if profiles_scraped >= max_profiles:
            print(f"🎯 Reached target: {max_profiles} profiles")
            break
        
        current_name_number = current_name_index + 1
        remaining_profiles = max_profiles - profiles_scraped
        
        # Start scraping this person with progress display
        scraping_logger.start_profile_scraping(keyword, current_name_number)
        
        try:
            # Search alumni for this keyword
            alumni = search_alumni(keyword, profiles_scraped, max_profiles, location_class, section_class)
            
            if alumni:
                profiles_found = len(alumni)
                profiles_scraped += profiles_found
                all_data.extend(alumni)
                successful_names += 1
                
                scraping_logger.profile_completed(keyword, profiles_found)
                
                # Save progress after each successful name
                save_scraping_progress(keyword, output_file)
                
            else:
                failed_names += 1
                scraping_logger.profile_completed(keyword, 0)
            
            # Save data periodically (every 3 names or if we have 5+ profiles)
            if (i + 1) % 3 == 0 or len(all_data) >= 5:
                if all_data:
                    save_to_csv(all_data, filename=output_file)
                    print(f"💾 Saved {len(all_data)} profiles")
                    all_data = []  # Clear the list to save memory
                    
        except Exception as e:
            failed_names += 1
            logger.error(f"Error processing '{keyword}': {e}")
            scraping_logger.profile_error(keyword, str(e))
            save_scraping_progress(keyword, output_file)
            # Continue to next name (let it error principle)
            continue
            
        current_name_index += 1
        
        # Add small delay between names to be respectful
        if i < len(keywords) - 1:  # Don't delay on last iteration
            random_delay('action')

    # Save any remaining data
    if all_data:
        save_to_csv(all_data, filename=output_file)
        print(f"💾 Final save: {len(all_data)} profiles")
        
    # Step 6: Results and cleanup
    session_start_time = datetime.now()  # Add this line at the start of the function later
    session_end_time = datetime.now()
    
    if profiles_scraped > len(existing_data):
        new_profiles = profiles_scraped - len(existing_data)
        
        # Generate cleaned output path based on input file
        base_name = os.path.splitext(os.path.basename(output_file))[0]
        cleaned_output = f"data/scraping_result/Cleaned_{base_name}.csv"
        
        try:
            data_processor.clean_scraped_data(input_path=output_file, output_path=cleaned_output)
            print("🧹 Data cleaning completed")
        except Exception as e:
            logger.error(f"Data cleaning failed: {e}")
        
        scraping_logger.session_complete(successful_names, failed_names, "session time")
        print(f"📁 Files: {output_file} | {cleaned_output}")
    else:
        print("⚠️ No new profiles were scraped in this session")

    # Keep the driver session alive for future use
    print("🌐 Browser session maintained for future use")
    
    return True

def cleanup_driver():
    """Cleanup driver when needed."""
    global driver, driver_initialized
    try:
        if driver:
            print("🧹 Cleaning up browser session...")
            
            # Close all tabs except the main one
            if len(driver.window_handles) > 1:
                main_window = driver.window_handles[0]
                for handle in driver.window_handles[1:]:
                    driver.switch_to.window(handle)
                    driver.close()
                driver.switch_to.window(main_window)
            
            # Quit the driver
            driver.quit()
            print("✅ Browser session terminated")
    except Exception as e:
        logger.error(f"Error during cleanup: {e}")
    finally:
        driver = None
        driver_initialized = False
