"""
LinkedIn Alumni Scraper Engine

This module provides the main scraping engine with advanced profile extraction
capabilities and modern architecture for LinkedIn alumni data collection.

Classes:
    ClassDetector: Automatic CSS class detection for dynamic LinkedIn elements
    AlumniScraper: Primary scraping engine for LinkedIn profile data extraction

Features:
    - Dynamic CSS class detection and adaptation
    - Comprehensive profile data extraction
    - Anti-detection scraping patterns
    - Advanced error handling and recovery
    - Session management integration
"""

import os
import time
import csv
import logging
import pandas as pd
from datetime import datetime
from bs4 import BeautifulSoup
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException
from typing import List, Dict, Any, Optional, Tuple

from .config import config
from .driver import LinkedInDriver
from .auth import LinkedInAuth
from .session import ScrapingSession, session_manager
from .data_processor import data_processor


class ClassDetector:
    """
    Automatically detects CSS classes for LinkedIn profile elements.
    
    Handles the dynamic nature of LinkedIn's CSS classes by analyzing
    sample profiles to determine current selectors.
    """
    
    def __init__(self, driver_manager: LinkedInDriver):
        """
        Initialize class detector.
        
        Args:
            driver_manager: LinkedInDriver instance for browser operations
        """
        self.driver_manager = driver_manager
        self._logger = self._setup_logger()
    
    def _setup_logger(self) -> logging.Logger:
        """Setup logger for class detection operations."""
        log_file = config.logs_dir + f"/detector_{datetime.now().strftime('%Y%m%d')}.log"
        
        logging.basicConfig(
            level=logging.ERROR,
            format='%(asctime)s | %(levelname)s | [DETECTOR] %(message)s',
            handlers=[logging.FileHandler(log_file, encoding='utf-8')]
        )
        
        return logging.getLogger(f"{__name__}.ClassDetector")
    
    def auto_detect_classes(self) -> Tuple[str, str]:
        """
        Automatically detect CSS classes for location and sections.
        
        Returns:
            Tuple of (location_class, section_class)
        """
        try:
            print("[SEARCH] Auto-detecting CSS classes...")
            
            # Try to find a sample profile
            sample_profile_url = self._find_sample_profile_by_name()
            
            if not sample_profile_url:
                sample_profile_url = self._find_sample_profile_from_alumni_page()
            
            if not sample_profile_url:
                print("[ERROR] Could not find sample profile for class detection")
                return self._get_fallback_classes()
            
            # Open sample profile in new tab
            driver = self.driver_manager.get_driver()
            driver.execute_script("window.open(arguments[0]);", sample_profile_url)
            self.driver_manager.random_delay('action')
            driver.switch_to.window(driver.window_handles[1])
            self.driver_manager.random_delay('page_load')
            
            # Scroll to load all sections
            self.driver_manager.scroll_page(max_clicks=3)
            
            # Get page source and detect classes
            soup = BeautifulSoup(driver.page_source, 'lxml')
            
            location_class = self._auto_detect_location_class(soup)
            section_class = self._auto_detect_section_class(soup)
            
            # Close the profile tab
            driver.close()
            self.driver_manager.random_delay('action')
            driver.switch_to.window(driver.window_handles[0])
            
            print(f"[SUCCESS] Auto-detected classes:")
            print(f"   [LOCATION] Location class: {location_class}")
            print(f"   [SECTION] Section class: {section_class}")
            
            return location_class, section_class
            
        except Exception as e:
            print(f"[ERROR] Error in auto-detection: {e}")
            self._logger.error(f"Auto-detection failed: {e}")
            return self._get_fallback_classes()
    
    def _find_sample_profile_by_name(self) -> Optional[str]:
        """Find a sample profile by searching for a name from the CSV."""
        try:
            # Get first few names from CSV
            df = pd.read_csv(config.names_file)
            sample_names = df["Name"].head(3).tolist()
            
            driver = self.driver_manager.get_driver()
            
            for name in sample_names:
                search_url = config.get_university_search_url(name)
                
                if not self.driver_manager.navigate_to(search_url, wait_for_load=True):
                    continue
                
                try:
                    # Look for profile links
                    profile_links = driver.find_elements(
                        By.XPATH, 
                        '//a[contains(@href, "/in/") and contains(@href, "linkedin.com")]'
                    )
                    
                    if profile_links:
                        sample_url = profile_links[0].get_attribute('href')
                        print(f"[OK] Found sample profile via name search: {sample_url}")
                        return sample_url
                        
                except Exception as e:
                    print(f"[WARN] Could not find profile for {name}: {e}")
                    continue
            
            return None
            
        except Exception as e:
            print(f"[ERROR] Error finding sample profile by name: {e}")
            return None
    
    def _find_sample_profile_from_alumni_page(self) -> Optional[str]:
        """Find a sample profile from the general alumni page."""
        try:
            alumni_url = f"https://www.linkedin.com/school/{config.university_linkedin_id}/people/"
            
            if not self.driver_manager.navigate_to(alumni_url, wait_for_load=True):
                return None
            
            driver = self.driver_manager.get_driver()
            
            # Scroll to load profiles
            self.driver_manager.scroll_page(max_clicks=2)
            
            # Look for any profile link
            profile_links = driver.find_elements(
                By.XPATH,
                '//a[contains(@href, "/in/") and contains(@href, "linkedin.com")]'
            )
            
            if profile_links:
                sample_url = profile_links[0].get_attribute('href')
                print(f"[OK] Found sample profile from alumni page: {sample_url}")
                return sample_url
            
            return None
            
        except Exception as e:
            print(f"[ERROR] Error finding sample profile from alumni page: {e}")
            return None
    
    def _auto_detect_location_class(self, soup) -> str:
        """Auto-detect location class from profile HTML."""
        try:
            # Common patterns for location elements
            location_patterns = [
                'text-body-small inline t-black--light break-words',
                'pv-text-details__left-panel',
                'text-body-small',
                'text-color-text-low-emphasis'
            ]
            
            # Try to find location div and extract class
            for pattern in location_patterns:
                location_divs = soup.find_all('div', {'class': lambda x: x and pattern in x})
                
                for div in location_divs:
                    text = div.get_text(strip=True).lower()
                    # Check if this might be a location (contains common location keywords)
                    if any(keyword in text for keyword in ['area', 'region', 'city', 'indonesia', 'jakarta']):
                        class_attr = div.get('class')
                        if class_attr:
                            detected_class = ' '.join(class_attr)
                            print(f"[OK] Detected location class: {detected_class}")
                            return detected_class
            
            # Fallback: use the first pattern
            return location_patterns[0]
            
        except Exception as e:
            print(f"[ERROR] Location class detection failed: {e}")
            return 'text-body-small inline t-black--light break-words'
    
    def _auto_detect_section_class(self, soup) -> str:
        """Auto-detect section class for experience from profile HTML."""
        try:
            # Look for experience section
            section_ids = ['experience', 'education']
            
            for section_id in section_ids:
                experience = next(
                    (sec for sec in soup.find_all('section') if sec.find('div', {'id': section_id})), 
                    None
                )
                
                if experience:
                    # Look for list items within the section
                    list_items = experience.find_all('li')
                    
                    for item in list_items:
                        class_attr = item.get('class')
                        if class_attr and len(class_attr) > 0:
                            detected_class = ' '.join(class_attr)
                            # Validate this looks like an experience item
                            if any(keyword in detected_class.lower() for keyword in ['list', 'item', 'pvs']):
                                print(f"[OK] Detected section class: {detected_class}")
                                return detected_class
            
            # Fallback class
            return 'artdeco-list__item pvs-list__item--line-separated pvs-list__item--one-column'
            
        except Exception as e:
            print(f"[ERROR] Section class detection failed: {e}")
            return 'artdeco-list__item pvs-list__item--line-separated pvs-list__item--one-column'
    
    def _get_fallback_classes(self) -> Tuple[str, str]:
        """Return fallback CSS classes if auto-detection fails."""
        location_class = "text-body-small inline t-black--light break-words"
        section_class = "artdeco-list__item pvs-list__item--line-separated pvs-list__item--one-column"
        
        print(f"[WARNING] Using fallback classes:")
        print(f"   [LOCATION] Location: {location_class}")
        print(f"   [SECTION] Section: {section_class}")
        
        return location_class, section_class


class ProfileExtractor:
    """
    Extracts data from individual LinkedIn profiles.
    
    Handles profile navigation, data extraction, and error recovery
    for individual LinkedIn profile pages.
    """
    
    def __init__(self, driver_manager: LinkedInDriver):
        """
        Initialize profile extractor.
        
        Args:
            driver_manager: LinkedInDriver instance for browser operations
        """
        self.driver_manager = driver_manager
        self._logger = self._setup_logger()
    
    def _setup_logger(self) -> logging.Logger:
        """Setup logger for profile extraction operations."""
        log_file = config.logs_dir + f"/extractor_{datetime.now().strftime('%Y%m%d')}.log"
        
        logging.basicConfig(
            level=logging.ERROR,
            format='%(asctime)s | %(levelname)s | [EXTRACTOR] %(message)s',
            handlers=[logging.FileHandler(log_file, encoding='utf-8')]
        )
        
        return logging.getLogger(f"{__name__}.ProfileExtractor")
    
    def extract_profile_data(self, profile_url: str, location_class: str, section_class: str) -> Dict[str, str]:
        """
        Extract experience, education, and licenses from a LinkedIn profile.
        
        Args:
            profile_url: LinkedIn profile URL
            location_class: CSS class for location element
            section_class: CSS class for experience sections
            
        Returns:
            Dictionary containing extracted profile data
        """
        try:
            driver = self.driver_manager.get_driver()
            
            # Navigate to profile
            driver.get(profile_url)
            self.driver_manager.random_delay('page_load')
            
            # Scroll to load all sections
            self.driver_manager.scroll_page(max_clicks=5)
            
            # Get page source and parse
            soup = BeautifulSoup(driver.page_source, 'lxml')
            
            # Extract location
            location = self._extract_location(soup, location_class)
            
            # Extract experience
            experience = self._extract_experience(soup, section_class)
            
            # Extract education
            education = self._extract_education(soup, section_class)
            
            # Extract certifications
            certifications = self._extract_certifications(soup, section_class)
            
            return {
                "Location": location,
                "Experience": experience,
                "Education": education,
                "Licenses & Certifications": certifications
            }
            
        except Exception as e:
            self._logger.error(f"Profile extraction failed for {profile_url}: {e}")
            return {
                "Location": "Error extracting location",
                "Experience": "Error extracting experience",
                "Education": "Error extracting education",
                "Licenses & Certifications": "Error extracting certifications"
            }
    
    def _extract_location(self, soup, location_class: str) -> str:
        """Extract location from profile."""
        try:
            location_div = soup.find('div', {'class': location_class})
            if location_div:
                location_span = location_div.find('span')
                if location_span:
                    text = location_span.get_text(strip=True)
                    return text if text else "Location not specified"
            return "Location not found"
        except Exception:
            return "Error extracting location"
    
    def _extract_experience(self, soup, section_class: str) -> str:
        """Extract experience section from profile."""
        try:
            # Find experience section
            experience = next(
                (sec for sec in soup.find_all('section') if sec.find('div', {'id': 'experience'})), 
                None
            )
            
            if not experience:
                return "No experience section found"
            
            experiences = experience.find_all('div', {'class': section_class})
            experience_list = []
            
            for exp in experiences:
                job_title = exp.find('span', {'class': 'visually-hidden'})
                company = exp.find('span', {'class': 't-14 t-normal'})
                duration = exp.find('span', {'class': 't-14 t-normal t-black--light'})
                
                experience_item = {
                    "Job Title": job_title.get_text(strip=True) if job_title else "N/A",
                    "Company": company.get_text(strip=True) if company else "N/A",
                    "Duration": duration.get_text(strip=True) if duration else "N/A"
                }
                
                experience_list.append(experience_item)
            
            return str(experience_list) if experience_list else "No experience details found"
            
        except Exception:
            return "Error extracting experience"
    
    def _extract_education(self, soup, section_class: str) -> str:
        """Extract education section from profile."""
        try:
            # Similar to experience extraction but for education section
            education = next(
                (sec for sec in soup.find_all('section') if sec.find('div', {'id': 'education'})), 
                None
            )
            
            if not education:
                return "No education section found"
            
            # Extract education details similar to experience
            education_items = education.find_all('div', {'class': section_class})
            education_list = []
            
            for edu in education_items:
                # Extract education details
                school = edu.find('span', {'class': 'visually-hidden'})
                degree = edu.find('span', {'class': 't-14 t-normal'})
                
                if school or degree:
                    education_item = {
                        "School": school.get_text(strip=True) if school else "N/A",
                        "Degree": degree.get_text(strip=True) if degree else "N/A"
                    }
                    education_list.append(education_item)
            
            return str(education_list) if education_list else "No education details found"
            
        except Exception:
            return "Error extracting education"
    
    def _extract_certifications(self, soup, section_class: str) -> str:
        """Extract certifications section from profile."""
        try:
            # Look for licenses & certifications section
            certifications = next(
                (sec for sec in soup.find_all('section') 
                 if sec.find('div', {'id': 'licenses_and_certifications'})), 
                None
            )
            
            if not certifications:
                return "No certifications section found"
            
            cert_items = certifications.find_all('div', {'class': section_class})
            cert_list = []
            
            for cert in cert_items:
                cert_name = cert.find('span', {'class': 'visually-hidden'})
                issuer = cert.find('span', {'class': 't-14 t-normal'})
                
                if cert_name or issuer:
                    cert_item = {
                        "Certification": cert_name.get_text(strip=True) if cert_name else "N/A",
                        "Issuer": issuer.get_text(strip=True) if issuer else "N/A"
                    }
                    cert_list.append(cert_item)
            
            return str(cert_list) if cert_list else "No certification details found"
            
        except Exception:
            return "Error extracting certifications"


class LinkedInScraper:
    """
    Main LinkedIn Alumni Scraper class.
    
    Orchestrates the entire scraping process including authentication,
    class detection, profile searching, and data extraction.
    """
    
    def __init__(self):
        """Initialize the LinkedIn scraper with all required components."""
        self.driver_manager = LinkedInDriver()
        self.auth_manager = LinkedInAuth(self.driver_manager)
        self.class_detector = ClassDetector(self.driver_manager)
        self.profile_extractor = ProfileExtractor(self.driver_manager)
        self._logger = self._setup_logger()
    
    def _setup_logger(self) -> logging.Logger:
        """Setup logger for scraper operations."""
        log_file = config.logs_dir + f"/scraper_{datetime.now().strftime('%Y%m%d')}.log"
        
        logging.basicConfig(
            level=logging.ERROR,
            format='%(asctime)s | %(levelname)s | [SCRAPER] %(message)s',
            handlers=[logging.FileHandler(log_file, encoding='utf-8')]
        )
        
        return logging.getLogger(f"{__name__}.LinkedInScraper")
    
    def run_scraper(
        self,
        location_class: Optional[str] = None,
        section_class: Optional[str] = None,
        max_profiles: int = 10,
        auto_detect: bool = True,
        input_file: Optional[str] = None,
        output_file: Optional[str] = None,
        resume_scraping: bool = True
    ) -> bool:
        """
        Main scraper function with comprehensive logging and error handling.
        
        Args:
            location_class: CSS class for location elements
            section_class: CSS class for experience sections
            max_profiles: Maximum number of profiles to scrape
            auto_detect: Whether to auto-detect CSS classes
            input_file: Path to input CSV file with names
            output_file: Path to output CSV file
            resume_scraping: Whether to resume from last position
            
        Returns:
            True if scraping completed successfully, False otherwise
        """
        # Create and start scraping session
        session = session_manager.create_session()
        
        try:
            print("=" * 80)
            print("[START] STARTING SCRAPING SESSION")
            print("=" * 80)
            
            # Step 1: Ensure authentication
            print("[INFO] STEP 1: Authentication Check")
            if not self.auth_manager.ensure_logged_in():
                print("[ERROR] Failed to login. Cannot proceed with scraping.")
                session.complete_session(success=False, error_message="Authentication failed")
                return False
            print("[OK] Authentication successful")
            
            # Step 2: Auto-detect CSS classes
            print("[INFO] STEP 2: CSS Class Detection")
            if auto_detect or not location_class or not section_class:
                print("[AI] Starting auto-detection of CSS classes...")
                detected_location_class, detected_section_class = self.class_detector.auto_detect_classes()
                location_class = detected_location_class or location_class or "text-body-small inline t-black--light break-words"
                section_class = detected_section_class or section_class or "artdeco-list__item pvs-list__item--line-separated pvs-list__item--one-column"
                print("[OK] CSS classes determined")
            else:
                print("[OK] Using provided CSS classes")
            
            print(f"[TARGET] Using CSS classes:")
            print(f"   [LOCATION] Location: {location_class}")
            print(f"   [SECTION] Section: {section_class}")
            
            # Step 3: Setup input/output files
            print("[INFO] STEP 3: File Setup")
            current_input_file = input_file or config.names_file
            current_output_file = output_file or config.default_output_file
            
            # Count total names
            total_names = self._count_names_to_scrape(current_input_file)
            if total_names == 0:
                print("[ERROR] No names found to scrape!")
                session.complete_session(success=False, error_message="No names found in input file")
                return False
            
            print(f"[DATA] Total names available: {total_names}")
            
            # Step 4: Start scraping session
            session.start_session(total_names, max_profiles)
            
            # Step 5: Main scraping loop
            success = self._execute_scraping_loop(
                session, current_input_file, current_output_file,
                location_class, section_class, max_profiles, resume_scraping
            )
            
            # Step 6: Complete session and cleanup
            if success:
                session.complete_session(success=True)
                print("[PARTY] SCRAPING SESSION COMPLETED!")
            else:
                session.complete_session(success=False)
                print("[WARN] SCRAPING SESSION ENDED")
            
            return success
            
        except Exception as e:
            self._logger.error(f"Scraping session failed: {e}")
            session.complete_session(success=False, error_message=str(e))
            print(f"[ERROR] Scraping session failed: {e}")
            return False
    
    def _execute_scraping_loop(
        self,
        session: ScrapingSession,
        input_file: str,
        output_file: str,
        location_class: str,
        section_class: str,
        max_profiles: int,
        resume_scraping: bool
    ) -> bool:
        """Execute the main scraping loop."""
        try:
            # Load names and determine starting point
            keywords_df = pd.read_csv(input_file)
            keywords = keywords_df["Name"].tolist()
            
            start_index = 0
            if resume_scraping:
                start_index = self._get_resume_point(input_file, output_file)
            
            keywords = keywords[start_index:]
            all_data = []
            profiles_scraped = 0
            
            print("=" * 80)
            print("[INFO] MAIN SCRAPING LOOP")
            print("=" * 80)
            print(f"[DATA] Starting from index {start_index}")
            print(f"[DATA] Names remaining: {len(keywords)}")
            print(f"[DATA] Max profiles target: {max_profiles}")
            
            # Main loop
            for i, keyword in enumerate(keywords):
                if session.should_stop():
                    print("[STOP] Scraping stopped by user")
                    break
                
                if profiles_scraped >= max_profiles:
                    print(f"[TARGET] Reached maximum profiles limit: {max_profiles}")
                    break
                
                current_index = start_index + i
                session.update_progress(keyword, current_index, profiles_scraped)
                
                print("─" * 60)
                print(f"[CHECK] Processing: {keyword}")
                print(f"[DATA] Progress: {current_index + 1}/{session.progress.total_names} | Scraped: {profiles_scraped}/{max_profiles}")
                
                try:
                    # Search alumni for this keyword
                    alumni = self._search_alumni(keyword, profiles_scraped, max_profiles, location_class, section_class, session)
                    
                    if alumni:
                        profiles_found = len(alumni)
                        profiles_scraped += profiles_found
                        all_data.extend(alumni)
                        session.add_successful_name(keyword, profiles_found)
                        
                        # Save progress
                        self._save_scraping_progress(keyword, output_file)
                        
                    else:
                        session.add_failed_name(keyword, "No profiles found")
                    
                    # Save data periodically
                    if (i + 1) % 3 == 0 or len(all_data) >= 5:
                        if all_data:
                            self._save_to_csv(all_data, output_file)
                            all_data = []  # Clear to save memory
                    
                except Exception as e:
                    self._logger.error(f"Error processing '{keyword}': {e}")
                    session.add_failed_name(keyword, str(e))
                    continue
                
                # Small delay between names
                if i < len(keywords) - 1:
                    self.driver_manager.random_delay('action')
            
            # Save any remaining data
            if all_data:
                self._save_to_csv(all_data, output_file)
            
            return True
            
        except Exception as e:
            self._logger.error(f"Scraping loop failed: {e}")
            return False
    
    def _search_alumni(
        self,
        keyword: str,
        profiles_scraped: int,
        max_profiles: int,
        location_class: str,
        section_class: str,
        session: ScrapingSession
    ) -> List[Dict[str, Any]]:
        """Search alumni for a specific keyword."""
        try:
            driver = self.driver_manager.get_driver()
            alumni_list = []
            
            # Navigate to search page
            search_url = config.get_university_search_url(keyword)
            if not self.driver_manager.navigate_to(search_url, wait_for_load=True):
                return []
            
            # Main scraping loop for this keyword
            while profiles_scraped + len(alumni_list) < max_profiles:
                if session.should_stop():
                    break
                
                try:
                    # Scroll to load profiles
                    self.driver_manager.scroll_page()
                    self.driver_manager.random_delay('action')
                    
                    # Find profile containers
                    profiles = WebDriverWait(driver, 15).until(
                        EC.presence_of_all_elements_located((By.XPATH, '//div[contains(@class, "org-people-profile-card__profile-info")]'))
                    )
                    
                    new_profile_found = False
                    
                    for profile in profiles:
                        if session.should_stop() or profiles_scraped + len(alumni_list) >= max_profiles:
                            break
                        
                        try:
                            # Extract basic profile info
                            name_element = profile.find_element(By.TAG_NAME, "a")
                            name = name_element.text.strip()
                            profile_url = name_element.get_attribute('href')
                            
                            # Skip if already scraped
                            if session.is_url_scraped(profile_url):
                                continue
                            
                            # Extract additional details
                            job_title = "N/A"
                            image_url = "N/A"
                            
                            try:
                                job_element = profile.find_element(By.CLASS_NAME, "artdeco-entity-lockup__subtitle")
                                job_title = job_element.text.strip()
                            except:
                                pass
                            
                            try:
                                img_element = profile.find_element(By.TAG_NAME, "img")
                                image_url = img_element.get_attribute('src')
                            except:
                                pass
                            
                            # Extract detailed profile data
                            profile_data = self.profile_extractor.extract_profile_data(
                                profile_url, location_class, section_class
                            )
                            
                            # Add to results
                            alumni_data = {
                                "City": profile_data.get("Location", "N/A"),
                                "Name": name,
                                "Headlines": job_title,
                                "Linkedin Link": profile_url,
                                "Profile Picture": image_url,
                                "Experience": profile_data.get("Experience", "N/A"),
                                "Education": profile_data.get("Education", "N/A"),
                                "Licenses & Certifications": profile_data.get("Licenses & Certifications", "N/A"),
                                "Scraped At": datetime.now().strftime('%Y-%m-%d %H:%M:%S')
                            }
                            
                            alumni_list.append(alumni_data)
                            session.add_scraped_url(profile_url)
                            session.add_result(alumni_data)
                            new_profile_found = True
                            
                            print(f"[OK] Added profile {len(alumni_list)} for {keyword}: {name}")
                            
                        except Exception as e:
                            print(f"[ERROR] Error processing profile: {e}")
                            continue
                    
                    if not new_profile_found:
                        print(f"[SKIP] No new profiles found on this scroll for {keyword}")
                        break
                        
                except Exception as e:
                    print(f"[ERROR] Error during search loop for {keyword}: {e}")
                    break
            
            print(f"[OK] Completed search for {keyword}: {len(alumni_list)} profiles scraped")
            return alumni_list
            
        except Exception as e:
            self._logger.error(f"Alumni search failed for {keyword}: {e}")
            return []
    
    def _count_names_to_scrape(self, input_file: str) -> int:
        """Count total names in input file."""
        try:
            return len(pd.read_csv(input_file))
        except Exception:
            return 0
    
    def _get_resume_point(self, input_file: str, output_file: str) -> int:
        """Get the starting point for resuming scraping."""
        try:
            if not os.path.exists(output_file):
                return 0
            
            # Get last scraped name
            output_df = pd.read_csv(output_file)
            if output_df.empty:
                return 0
            
            last_scraped = output_df.iloc[-1]['Name']
            
            # Find index in input file
            input_df = pd.read_csv(input_file)
            matching_indices = input_df[input_df['Name'] == last_scraped].index.tolist()
            
            if matching_indices:
                return matching_indices[-1] + 1
            
            return 0
            
        except Exception:
            return 0
    
    def _save_to_csv(self, data: List[Dict[str, Any]], filename: str):
        """Save data to CSV file."""
        try:
            df = pd.DataFrame(data)
            
            # Check if file exists to determine if we need headers
            file_exists = os.path.exists(filename)
            
            df.to_csv(filename, mode='a', header=not file_exists, index=False)
            print(f"[SAVE] Saved {len(data)} profiles to {filename}")
            
        except Exception as e:
            self._logger.error(f"Failed to save data to CSV: {e}")
    
    def _save_scraping_progress(self, name: str, output_file: str):
        """Save scraping progress for resume functionality."""
        try:
            progress_file = output_file.replace('.csv', '_progress.txt')
            with open(progress_file, 'w') as f:
                f.write(f"{name}\n{datetime.now().isoformat()}")
        except Exception:
            pass  # Progress saving is not critical
    
    def cleanup(self):
        """Clean up all resources."""
        try:
            self.driver_manager.cleanup()
        except Exception as e:
            self._logger.error(f"Cleanup failed: {e}")


# Global scraper instance for backward compatibility
linkedin_scraper = LinkedInScraper()
