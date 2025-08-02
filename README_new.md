# 🌐 LinkedIn Alumni Scraper

> **Automatically scrape LinkedIn alumni data!** A Python tool to collect alumni data from university LinkedIn pages with a modern web interface and clean logging system.

## ⚠️ USE AT YOUR OWN RISK

❗ **IMPORTANT:** This tool may violate LinkedIn's Terms of Service. Scraping LinkedIn can result in account restrictions or legal issues. Use for educational purposes only. You are fully responsible for compliance with all laws and terms.

---

## 🚀 Quick Setup

### 1️⃣ **Setup Virtual Environment**

```bash
# Clone repository
git clone https://github.com/IlhamriSKY/Linkedin_Scraper.git
cd Linkedin_Scraper

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate
```

### 2️⃣ **Install Dependencies**

```bash
pip install -r requirements.txt
```

### 3️⃣ **Configure Environment**

```bash
# Copy example environment file
cp .env.example .env

# Edit .env file with your LinkedIn credentials:
# LINKEDIN_EMAIL=your_email@example.com
# LINKEDIN_PASSWORD=your_password
# UNIVERSITY_LINKEDIN_ID=your-university-id
# UNIVERSITY_NAME=Your University Name
```

### 4️⃣ **Setup Names List**

```bash
# Copy example names file
cp "Linkedin Alumni Scraper/data/person_locations/indonesia_names_example.csv" "Linkedin Alumni Scraper/data/person_locations/indonesia_names.csv"

# Edit indonesia_names.csv with names you want to scrape
```

---

## 🎯 How to Run

### **Web Interface (Recommended)**

```bash
cd "Linkedin Alumni Scraper"
python app.py
```

Open browser to `http://localhost:5000`

### **Command Line**

```bash
cd "Linkedin Alumni Scraper"
python main.py
```

**Process:**
1. 🔐 **Auto login** - Automatically logs into LinkedIn
2. 🔍 **Auto-detect CSS** - Detects required CSS classes
3. 👥 **Scrape alumni** - Scrapes data based on names list
4. 💾 **Save data** - Exports to CSV with timestamp
5. 🧹 **Clean data** - Processes and cleans final output

---

## 🧪 Testing (For Contributors)

### **Setup Testing**

```bash
# Ensure virtual environment is active
pip install pytest pytest-cov mockito
```

### **Run Tests**

```bash
# Run all tests
python -m pytest tests/ -v

# Run tests with coverage
python -m pytest tests/ -v --cov=core --cov-report=html

# Run specific test file
python -m pytest tests/test_auth.py -v
```

**Current Coverage:** 94.4% (134/142 tests passing)

---

## 📜 License

MIT License - Use for educational purposes only. Users are responsible for compliance with LinkedIn's Terms of Service.
