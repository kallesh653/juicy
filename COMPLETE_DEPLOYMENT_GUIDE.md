# ColdDrink Billing System - Complete Deployment Guide

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [MongoDB Installation](#mongodb-installation)
3. [Application Installation](#application-installation)
4. [Running the Application](#running-the-application)
5. [Accessing from Mobile/Tablet](#accessing-from-mobiletablet)
6. [Building Desktop Installer](#building-desktop-installer)
7. [MongoDB Data Management](#mongodb-data-management)
8. [Backup and Restore](#backup-and-restore)
9. [Troubleshooting](#troubleshooting)

---

## 1. Prerequisites

### Required Software:
- **Node.js** (v16 or higher) - [Download](https://nodejs.org)
- **MongoDB Community Server** (v5 or higher) - [Download](https://www.mongodb.com/try/download/community)
- **Git** (optional) - [Download](https://git-scm.com)

### System Requirements:
- Windows 10/11, macOS 10.14+, or Linux
- Minimum 4GB RAM
- 500MB free disk space

---

## 2. MongoDB Installation

### Windows Installation:

1. **Download MongoDB Community Server**
   - Go to: https://www.mongodb.com/try/download/community
   - Select: Windows, MSI package
   - Download and run installer

2. **During Installation:**
   - Choose "Complete" installation
   - CHECK "Install MongoDB as a Service" (IMPORTANT!)
   - CHECK "Install MongoDB Compass" (GUI tool)
   - Finish installation

3. **Verify Installation:**
   ```cmd
   mongod --version
   ```

4. **Create Data Directory:**
   ```cmd
   mkdir C:\data\db
   ```
   OR use user directory:
   ```cmd
   mkdir %USERPROFILE%\mongodb-data
   ```

### Starting MongoDB:

**Option A - As Windows Service (Automatic):**
MongoDB starts automatically with Windows if installed as service.

**Option B - Manual Start:**
```cmd
mongod --dbpath "C:\data\db"
```
OR
```cmd
mongod --dbpath "%USERPROFILE%\mongodb-data"
```

### MongoDB Data Storage Location:

Your billing data is stored locally at:
- Default: `C:\data\db\`
- Custom: `%USERPROFILE%\mongodb-data\`

Database name: `colddrink_billing`

---

## 3. Application Installation

### Step-by-Step Installation:

1. **Open Command Prompt as Administrator**

2. **Navigate to project folder:**
   ```cmd
   cd C:\Users\LEN0VO\Desktop\colddrink1.2
   ```

3. **Run the installer batch file:**
   ```cmd
   INSTALL.bat
   ```

   OR install manually:
   ```cmd
   :: Install backend dependencies
   cd backend
   npm install

   :: Install frontend dependencies
   cd ..\frontend
   npm install

   :: Install root dependencies (for Electron)
   cd ..
   npm install
   ```

4. **Create default users (First time only):**
   ```cmd
   cd backend
   npm run seed
   ```

   This creates:
   - Admin: `admin` / `admin123`
   - Cashier: `cashier` / `cashier123`

---

## 4. Running the Application

### Method 1: Quick Start (Recommended)

Double-click `START.bat` in the project folder.

This will:
- Check if MongoDB is running
- Start the backend server
- Start the frontend
- Open in browser automatically

### Method 2: Manual Start

**Terminal 1 - Start MongoDB:**
```cmd
mongod --dbpath "%USERPROFILE%\mongodb-data"
```

**Terminal 2 - Start Backend:**
```cmd
cd C:\Users\LEN0VO\Desktop\colddrink1.2\backend
npm run dev
```

**Terminal 3 - Start Frontend:**
```cmd
cd C:\Users\LEN0VO\Desktop\colddrink1.2\frontend
npm run dev
```

### Method 3: Electron Desktop App (Development)

```cmd
cd C:\Users\LEN0VO\Desktop\colddrink1.2
npm run electron:dev
```

### Access Points:
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5000
- **API Health Check:** http://localhost:5000/api/health

---

## 5. Accessing from Mobile/Tablet

### Same Network Access:

1. **Find your computer's IP address:**
   ```cmd
   ipconfig
   ```
   Look for `IPv4 Address` (e.g., `192.168.1.100`)

2. **On Mobile/Tablet browser, go to:**
   ```
   http://192.168.1.100:3000
   ```

3. **Important:** Your computer and mobile must be on the same WiFi network.

### Firewall Settings:

If mobile can't connect, allow ports through Windows Firewall:

1. Open Windows Defender Firewall
2. Click "Advanced settings"
3. Click "Inbound Rules" → "New Rule"
4. Select "Port" → Next
5. Enter: `3000, 5000`
6. Allow the connection
7. Apply to all profiles
8. Name it "ColdDrink Billing"

### Mobile-Optimized Features:
- Responsive design works on all screen sizes
- Touch-friendly interface
- Full billing functionality on mobile
- Reports viewable on tablet

---

## 6. Building Desktop Installer

### Create Windows Installer (.exe):

1. **Build the frontend:**
   ```cmd
   cd frontend
   npm run build
   ```

2. **Build Electron installer:**
   ```cmd
   cd ..
   npm run electron:build:win
   ```

3. **Find installer at:**
   ```
   C:\Users\LEN0VO\Desktop\colddrink1.2\release\
   ```
   File: `ColdDrink-Billing-Setup-1.0.0.exe`

### Installer Features:
- One-click installation
- Desktop shortcut
- Start menu entry
- Professional installer UI
- Uninstaller included

### For Mac:
```cmd
npm run electron:build:mac
```

### For Linux:
```cmd
npm run electron:build:linux
```

---

## 7. MongoDB Data Management

### Understanding MongoDB Structure:

```
colddrink_billing (Database)
├── users           - Login accounts
├── maincodes       - Product categories (Juices, Soda, etc.)
├── subcodes        - Individual products with prices
├── suppliers       - Supplier information
├── purchases       - Purchase records
├── bills           - Sales/billing records
├── stockledgers    - Stock transaction history
└── businesssettings - Shop configuration
```

### Viewing Your Data:

**Using MongoDB Compass (GUI):**
1. Open MongoDB Compass
2. Connect to: `mongodb://localhost:27017`
3. Click on `colddrink_billing` database
4. Browse collections

**Using Command Line:**
```cmd
mongosh
use colddrink_billing
db.bills.find().pretty()
db.users.find().pretty()
```

### Common MongoDB Commands:

```javascript
// Show all databases
show dbs

// Use billing database
use colddrink_billing

// Show all collections
show collections

// Count total bills
db.bills.countDocuments()

// Find today's bills
db.bills.find({
  billDate: {
    $gte: new Date().setHours(0,0,0,0)
  }
})

// Total sales amount
db.bills.aggregate([
  { $group: { _id: null, total: { $sum: "$grandTotal" } } }
])
```

---

## 8. Backup and Restore

### Manual Backup:

1. **Create backup folder:**
   ```cmd
   mkdir C:\ColdDrinkBackups
   ```

2. **Run backup:**
   ```cmd
   mongodump --db colddrink_billing --out "C:\ColdDrinkBackups\backup_%date:~-4,4%%date:~-7,2%%date:~-10,2%"
   ```

### Automated Daily Backup:

Create `backup.bat`:
```batch
@echo off
set BACKUP_PATH=C:\ColdDrinkBackups\%date:~-4,4%%date:~-7,2%%date:~-10,2%
mongodump --db colddrink_billing --out "%BACKUP_PATH%"
echo Backup completed to %BACKUP_PATH%
```

Schedule in Windows Task Scheduler for daily backup.

### Restore from Backup:

```cmd
mongorestore --db colddrink_billing "C:\ColdDrinkBackups\20240115\colddrink_billing"
```

### Export to JSON (Readable format):

```cmd
mongoexport --db colddrink_billing --collection bills --out "C:\ColdDrinkBackups\bills.json"
```

---

## 9. Troubleshooting

### Common Issues:

#### "MongoDB connection failed"
1. Check if MongoDB is running:
   ```cmd
   tasklist | findstr mongod
   ```
2. Start MongoDB if not running:
   ```cmd
   net start MongoDB
   ```
   OR
   ```cmd
   mongod --dbpath "%USERPROFILE%\mongodb-data"
   ```

#### "Port 3000/5000 already in use"
```cmd
:: Find process using port
netstat -ano | findstr :3000

:: Kill process (replace PID)
taskkill /PID 12345 /F
```

#### "Cannot access from mobile"
1. Check both devices are on same network
2. Check firewall settings
3. Try disabling firewall temporarily for testing
4. Verify correct IP address

#### "npm install fails"
```cmd
:: Clear npm cache
npm cache clean --force

:: Delete node_modules and reinstall
rmdir /s /q node_modules
npm install
```

#### "Login fails after fresh install"
```cmd
:: Run seed to create default users
cd backend
npm run seed
```

#### "Electron app won't start"
1. Make sure MongoDB is running
2. Check backend is running on port 5000
3. Build frontend first: `npm run build:frontend`

### Reset Everything:

If you need to start fresh:

1. **Stop all services**

2. **Delete database:**
   ```javascript
   // In mongosh
   use colddrink_billing
   db.dropDatabase()
   ```

3. **Recreate default data:**
   ```cmd
   cd backend
   npm run seed
   ```

---

## Quick Reference

### Default Credentials:
- **Admin:** admin / admin123
- **Cashier:** cashier / cashier123

### URLs:
- Frontend: http://localhost:3000
- Backend: http://localhost:5000
- Mobile: http://YOUR-IP:3000

### Important Files:
- `backend\.env` - Configuration settings
- `START.bat` - Quick launcher
- `INSTALL.bat` - Installation script

### Data Location:
- Database: `mongodb://localhost:27017/colddrink_billing`
- Data files: `%USERPROFILE%\mongodb-data\` or `C:\data\db\`

### Build Output:
- Frontend build: `frontend\dist\`
- Electron installer: `release\`

---

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review application logs in console
3. Check MongoDB logs

---

**ColdDrink Billing System v1.0.0**
Professional POS Software for Cold Drink Shops
