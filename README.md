<div align="center">

# 🔍 LinkedIn Alumni Scraper

**Modern LinkedIn Alumni Data Collection Tool**

[![Node.js](https://img.shields.io/badge/Node.js-16%2B-green?style=for-the-badge&logo=node.js)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-18%2B-blue?style=for-the-badge&logo=react)](https://reactjs.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](./LICENSE)

*Professional LinkedIn Alumni Data Collection with Real-time Dashboard*

[📥 Download](#-download) • [🚀 Quick Start](#-quick-start) • [📖 Documentation](#-documentation) • [⚖️ Legal Notice](#️-legal-disclaimer)

</div>

---

## 📋 Overview

LinkedIn Alumni Scraper is a modern, full-stack application designed for automated LinkedIn alumni data collection. Built with Node.js backend and React frontend, it provides a professional dashboard for real-time monitoring and control of scraping operations.

**Credit**: This project is based on [notyouriiz/Linkedin_Scraper](https://github.com/notyouriiz/Linkedin_Scraper) converted from Python to Node.js for easier backend and frontend development.

### ✨ Key Features

- **🤖 Automated Browser Control** - Puppeteer-based LinkedIn interaction with anti-detection
- **📊 Real-time Dashboard** - Live progress tracking with Socket.IO communication
- **🔧 Professional Interface** - Modern React dashboard with dark/light theme
- **📈 Progress Monitoring** - Real-time status updates and result tracking
- **📄 CSV Export** - Automatic data export with customizable formatting
- **🛡️ Anti-Detection** - Stealth mode browsing with human-like patterns

---

## ⚠️ **LEGAL DISCLAIMER**

**🚨 IMPORTANT: USE AT YOUR OWN RISK**

> **This software is provided for educational and research purposes only.**

### ⚖️ Legal Notice

By using this software, you acknowledge and agree that:

- 🚫 **Web scraping LinkedIn may violate their Terms of Service**
- ⚖️ **You are fully responsible for compliance with all applicable laws**
- 📋 **You must comply with LinkedIn's Terms of Service and data protection regulations**
- 🎓 **This tool is intended for educational and research purposes only**
- 🛡️ **The authors disclaim all liability for any consequences of use**
- 🔒 **You are responsible for respecting user privacy and data protection laws**

**USE RESPONSIBLY AND AT YOUR OWN RISK**

---

## 📥 Download

```bash
# Clone the repository
git clone https://github.com/IlhamriSKY/LinkedIn-Alumni-Scraper.git

# Navigate to project directory
cd LinkedIn-Alumni-Scraper
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js 16+** - [Download here](https://nodejs.org/)
- **Valid LinkedIn account** - Required for authentication
- **Chrome/Chromium browser** - Automatically managed by Puppeteer

### Installation

```bash
# Install all dependencies
node start.js --install
```

### Configuration

1. **Setup LinkedIn Credentials** (Required):
   ```bash
   # Copy example files and edit them
   cp backend/.env.example backend/.env
   
   # Edit backend/.env file
   LINKEDIN_EMAIL=your_email@example.com
   LINKEDIN_PASSWORD=your_password
   UNIVERSITY_NAME=Your University Name
   UNIVERSITY_LINKEDIN_ID=your-university-linkedin-id
   UNIVERSITY_LINKEDIN_URL=https://www.linkedin.com/school/your-university/people/
   ```

2. **Configure Frontend** (Required):
   ```bash
    # Copy example files and edit theme
    cp frontend/.env.example frontend/.env

   # Edit frontend/.env file
   VITE_API_BASE_URL=http://localhost:3001
   VITE_SOCKET_URL=http://localhost:3001
   VITE_APP_NAME=LinkedIn Alumni Scraper
   VITE_UNIVERSITY_NAME=Your University
   ```

3. **Prepare Search Names** (Required):
   ```bash
   # Copy example file and edit with your names
   cp search_names.example.csv search_names.csv
   
   # Edit search_names.csv with names to search:
   John Doe
   Jane Smith
   Michael Johnson
   ```

---

## 🏃‍♂️ Running the Application

### Development Mode

```bash
# Start development mode
node start.js --dev

# Start development mode with force kill ports (if ports are busy)
node start.js --dev --force

# This will start:
# - Frontend dev server: http://localhost:5173
# - Backend server: http://localhost:3001
```

### Production Mode

```bash
# Start production mode
node start.js

# Start production mode with force kill ports (if ports are busy)
node start.js --force

# This will:
# 1. Build the frontend for production
# 2. Start the backend server
# 3. Serve frontend through backend: http://localhost:3001
```

### Port Conflicts

If you encounter "port already in use" errors, use the `--force` flag to automatically kill processes using the required ports (3001 and 5173):

```bash
# For development
node start.js --dev --force

# For production
node start.js --force
```

This works on both Windows and Linux/macOS systems.

---

## 🎯 How to Use

### Step 1: Access the Dashboard

1. Start the application (development or production mode)
2. Open your browser and navigate to:
   - **Development**: http://localhost:5173
   - **Production**: http://localhost:5173

### Step 2: Browser Setup

1. Click **"Open Browser"** button in the dashboard
2. Wait for Chrome browser to launch automatically
3. Verify browser status shows "Browser Running"

### Step 3: LinkedIn Authentication

1. Click **"Login to LinkedIn"** button
2. The system will:
   - Navigate to LinkedIn login page
   - Attempt automatic login with configured credentials
   - Or allow manual login if needed

### Step 4: Configure Scraping

1. **Verify Login Status**: Ensure "Logged In" status is green
2. **Configure Settings** (optional):
   - Maximum profiles to scrape
   - CSS class detection settings
   - Delay configurations

### Step 5: Start Scraping

1. Click **"Start Scraping"** button
2. Monitor real-time progress:
   - Current profile being processed
   - Success/failure status
   - Results counter
   - Progress percentage

### Step 6: Monitor Results

1. **Real-time Updates**: View live scraping progress
2. **Results Table**: See extracted data immediately
3. **Status Indicators**: Monitor connection and process status
4. **Toast Notifications**: Receive instant feedback

### Step 7: Export Data

1. **Automatic Export**: Results are auto-exported to CSV
2. **Manual Export**: Click "Download Results" button
3. **File Location**: Check `results/` directory

---

## 📖 Documentation

## 🔧 Advanced Configuration

### Performance Tuning

```env
# Browser Settings
BROWSER_TIMEOUT=30000
NAVIGATION_TIMEOUT=30000
WAIT_TIMEOUT=5000

# Scraping Performance
DELAY_MIN=2000
DELAY_MAX=5000
BATCH_SIZE=50
MAX_RETRIES=3

# Rate Limiting
REQUESTS_PER_MINUTE=30
CONCURRENT_REQUESTS=3
```

### Security Settings

```env
# Anti-Detection
ENABLE_STEALTH=true
VIEWPORT_WIDTH=1366
VIEWPORT_HEIGHT=768
DISABLE_WEB_SECURITY=false

# Privacy
BLOCK_IMAGES=false
BLOCK_CSS=false
SAVE_SCREENSHOTS=false
```

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**⭐ If this project helps you, please give it a star! ⭐**

Made with ❤️ by [IlhamriSKY](https://github.com/IlhamriSKY)

</div>
