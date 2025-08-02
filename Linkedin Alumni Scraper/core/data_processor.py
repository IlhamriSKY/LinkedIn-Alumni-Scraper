"""
LinkedIn Data Processor

This module handles data cleaning, formatting, and processing operations for
LinkedIn scraping results with advanced text processing capabilities.

Classes:
    DataProcessor: Main data processing and cleaning class

Features:
    - Complex data structure parsing and formatting
    - Excel-compatible output generation
    - Safe handling of malformed data structures
    - Comprehensive data validation and sanitization
    - Pipeline-based processing workflow
"""

import pandas as pd
import ast
import os
from typing import Optional, Any, Dict, List
from core.config import config


class DataProcessor:
    """
    Advanced data processing and cleaning utilities for LinkedIn scraping results.
    
    This class provides comprehensive data cleaning, formatting, and validation
    capabilities for processing raw LinkedIn profile data into clean, readable
    formats suitable for analysis and reporting.
    
    Attributes:
        config: Configuration manager instance
        
    Methods:
        clean_and_format_text: Convert complex data structures to readable text
        clean_scraped_data: Main cleaning pipeline for CSV processing
        validate_data_structure: Validate data integrity and format
    """
    
    def __init__(self):
        """Initialize data processor with configuration."""
        self.config = config
    
    def clean_and_format_text(self, data: Any) -> str:
        """
        Clean and format complex data structures for display.
        
        Processes scraped data that may contain Python list/dict structures
        and converts them into readable, formatted text suitable for Excel cells.
        
        Args:
            data: Raw data, potentially containing Python data structures
            
        Returns:
            Cleaned and formatted text string
            
        Example:
            Input: "[{'Company': 'ABC Corp', 'Title': 'Developer'}]"
            Output: "- Company: ABC Corp\\n- Title: Developer"
        """
        if isinstance(data, str) and data.strip():
            try:
                # Attempt to parse as Python literal (list/dict)
                items = ast.literal_eval(data)
                if isinstance(items, list) and all(isinstance(i, dict) for i in items):
                    formatted_entries = []
                    for entry in items:
                        # Format each dictionary as key-value pairs
                        formatted_entry = "\\n".join(
                            [f"- {key}: {value}" for key, value in entry.items() if value]
                        )
                        formatted_entries.append(formatted_entry)
                    return "\\n\\n".join(formatted_entries)
                else:
                    return data.strip()
            except (SyntaxError, ValueError):
                # Return original data if parsing fails
                return data.strip()
        return "N/A"
    
    def validate_data_structure(self, df: pd.DataFrame) -> Dict[str, Any]:
        """
        Validate data structure and provide quality metrics.
        
        Args:
            df: DataFrame to validate
            
        Returns:
            Dictionary containing validation results and metrics
        """
        validation_results = {
            'total_rows': len(df),
            'total_columns': len(df.columns),
            'missing_data': df.isnull().sum().to_dict(),
            'data_types': df.dtypes.to_dict(),
            'validation_passed': True,
            'issues': []
        }
        
        # Check for critical columns
        required_columns = ['Name', 'Profile URL']
        for col in required_columns:
            if col not in df.columns:
                validation_results['issues'].append(f"Missing required column: {col}")
                validation_results['validation_passed'] = False
        
        return validation_results
    
    def clean_scraped_data(self, 
                          input_path: Optional[str] = None,
                          output_path: Optional[str] = None) -> Optional[str]:
        """
        Main data cleaning pipeline for scraped LinkedIn data.
        
        Processes raw CSV data from the scraper, applies cleaning and
        formatting transformations, and saves results in Excel-ready format.
        
        Args:
            input_path: Path to raw scraped data CSV file
            output_path: Path where cleaned data will be saved
            
        Returns:
            Path to cleaned output file, or None if processing failed
        """
        # Use default paths if not provided
        if input_path is None:
            input_path = self.config.default_output_file
        if output_path is None:
            output_path = os.path.join(
                self.config.results_dir, 
                f"Cleaned_{os.path.basename(input_path)}"
            )
        
        # Validate input file exists
        if not os.path.exists(input_path):
            print(f"[ERROR] Input file not found: {input_path}")
            return None

        try:
            # Load raw scraped data
            df = pd.read_csv(input_path)
            
            # Validate data structure
            validation = self.validate_data_structure(df)
            if not validation['validation_passed']:
                print(f"[WARNING] Data validation issues: {validation['issues']}")
            
            # Clean and format complex data columns
            target_columns = ["Experience", "Education", "Licenses & Certifications"]
            for column in target_columns:
                if column in df.columns:
                    df[column] = df[column].apply(self.clean_and_format_text)

            # Ensure output directory exists
            os.makedirs(os.path.dirname(output_path), exist_ok=True)
            
            # Save cleaned data
            df.to_csv(output_path, index=False)
            print(f"[SUCCESS] Cleaned data saved to: {output_path}")
            print(f"[INFO] Processed {len(df)} profiles with {len(df.columns)} columns")
            
            return output_path
            
        except Exception as e:
            print(f"[ERROR] Data cleaning failed: {str(e)}")
            return None
    
    def get_processing_stats(self, file_path: str) -> Dict[str, Any]:
        """
        Get statistics about processed data file.
        
        Args:
            file_path: Path to processed CSV file
            
        Returns:
            Dictionary containing processing statistics
        """
        if not os.path.exists(file_path):
            return {'error': 'File not found'}
        
        try:
            df = pd.read_csv(file_path)
            stats = {
                'total_profiles': len(df),
                'columns': list(df.columns),
                'file_size_mb': round(os.path.getsize(file_path) / (1024 * 1024), 2),
                'last_modified': os.path.getmtime(file_path),
                'data_completeness': {}
            }
            
            # Calculate data completeness for key columns
            key_columns = ['Name', 'Experience', 'Education', 'Current Position']
            for col in key_columns:
                if col in df.columns:
                    non_null_count = df[col].notna().sum()
                    completeness = round((non_null_count / len(df)) * 100, 1)
                    stats['data_completeness'][col] = f"{completeness}%"
            
            return stats
            
        except Exception as e:
            return {'error': f'Failed to analyze file: {str(e)}'}


# Global data processor instance
data_processor = DataProcessor()
