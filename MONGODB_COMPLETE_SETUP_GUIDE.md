# Complete MongoDB Setup Guide - Local & VPS Server

## Table of Contents

1. [What is MongoDB?](#what-is-mongodb)
2. [Local Computer Setup (Windows)](#local-computer-setup-windows)
3. [VPS Server Setup (Linux)](#vps-server-setup-linux)
4. [Connecting Your Application to MongoDB](#connecting-your-application-to-mongodb)
5. [Basic MongoDB Operations](#basic-mongodb-operations)
6. [Checking If Data is Saved](#checking-if-data-is-saved)
7. [Backup Strategies](#backup-strategies)
8. [Restore from Backup](#restore-from-backup)
9. [Crash Recovery](#crash-recovery)
10. [Security Best Practices](#security-best-practices)
11. [Monitoring & Maintenance](#monitoring--maintenance)
12. [Troubleshooting Common Issues](#troubleshooting-common-issues)

---

## What is MongoDB?

### Simple Explanation

MongoDB is a **database** - a program that stores your application's data permanently.

**Think of it like:**
- A filing cabinet where you store documents
- Each drawer is a "collection" (like bills, users, products)
- Each file in the drawer is a "document" (like one bill, one user)

### Why MongoDB?

| Feature | Benefit |
|---------|---------|
| **Document-based** | Stores data like JSON objects (easy to understand) |
| **Flexible schema** | Can add new fields without changing database |
| **Fast** | Optimized for read/write operations |
| **Scalable** | Can handle millions of records |

### MongoDB Structure

```
MongoDB Server
    └── Database (colddrink_billing)
            ├── Collection (users)
            │       ├── Document {name: "admin", role: "admin"}
            │       └── Document {name: "cashier", role: "user"}
            ├── Collection (bills)
            │       ├── Document {billNo: 1, total: 100}
            │       └── Document {billNo: 2, total: 250}
            └── Collection (subcodes)
                    ├── Document {name: "Coke", price: 50}
                    └── Document {name: "Pepsi", price: 50}
```

---

## Local Computer Setup (Windows)

### Step 1: Download MongoDB

1. Go to: https://www.mongodb.com/try/download/community
2. Select:
   - **Version:** Latest (7.0 or newer)
   - **Platform:** Windows
   - **Package:** MSI
3. Click **Download**

### Step 2: Install MongoDB

1. **Run the installer** (double-click the .msi file)

2. **Choose Setup Type:** Select "Complete"

3. **Service Configuration:**
   - ✅ Check "Install MongoDB as a Service"
   - ✅ Select "Run service as Network Service user"
   - Service Name: `MongoDB`
   - Data Directory: `C:\Program Files\MongoDB\Server\7.0\data`
   - Log Directory: `C:\Program Files\MongoDB\Server\7.0\log`

4. **Install MongoDB Compass:** (Optional but recommended)
   - ✅ Check "Install MongoDB Compass"
   - This is a GUI tool to view your data

5. Click **Install**

### Step 3: Verify Installation

After installation, MongoDB starts automatically as a Windows service.

**Check if MongoDB is running:**

```powershell
# Open PowerShell as Administrator
# Check MongoDB service status
Get-Service MongoDB
```

**Expected output:**
```
Status   Name               DisplayName
------   ----               -----------
Running  MongoDB            MongoDB Server
```

### Step 4: Add MongoDB to System PATH

This allows you to run `mongosh` from any location.

1. **Open System Properties:**
   - Press `Win + R`
   - Type `sysdm.cpl` and press Enter
   - Go to **Advanced** tab
   - Click **Environment Variables**

2. **Edit PATH:**
   - Under "System variables", find `Path`
   - Click **Edit**
   - Click **New**
   - Add: `C:\Program Files\MongoDB\Server\7.0\bin`
   - Click **OK** on all windows

3. **Restart your terminal** (close and reopen)

### Step 5: Test MongoDB Connection

```powershell
# Open new PowerShell/Command Prompt
mongosh
```

**Expected output:**
```
Current Mongosh Log ID: 65a1234567890abcdef12345
Connecting to:          mongodb://127.0.0.1:27017/
Using MongoDB:          7.0.x
Using Mongosh:          2.1.x

test>
```

**You're connected!** Type `exit` to quit.

### Step 6: Create Database Directory (Custom Location)

If you want data in a custom location:

```powershell
# Create directory
mkdir C:\mongodb-data

# Start MongoDB with custom data path (if not using service)
mongod --dbpath "C:\mongodb-data"
```

### Step 7: Configure MongoDB (Optional)

Edit configuration file: `C:\Program Files\MongoDB\Server\7.0\bin\mongod.cfg`

```yaml
# mongod.cfg

# Where to store data
storage:
  dbPath: C:\Program Files\MongoDB\Server\7.0\data
  journal:
    enabled: true

# Network interfaces
net:
  port: 27017
  bindIp: 127.0.0.1  # Only localhost (secure)
  # bindIp: 0.0.0.0  # Allow remote connections (less secure)

# Security (enable after creating admin user)
# security:
#   authorization: enabled
```

### Step 8: Restart MongoDB Service

After configuration changes:

```powershell
# Restart service
Restart-Service MongoDB

# Or using net commands
net stop MongoDB
net start MongoDB
```

---

## VPS Server Setup (Linux)

### For Ubuntu/Debian Server

#### Step 1: Connect to Your VPS

```bash
ssh root@your-server-ip
# or
ssh username@your-server-ip
```

#### Step 2: Update System

```bash
sudo apt update
sudo apt upgrade -y
```

#### Step 3: Import MongoDB GPG Key

```bash
# Install gnupg if not present
sudo apt install gnupg curl

# Import MongoDB public GPG key
curl -fsSL https://pgp.mongodb.com/server-7.0.asc | \
   sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg \
   --dearmor
```

#### Step 4: Add MongoDB Repository

```bash
# For Ubuntu 22.04
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# Update package list
sudo apt update
```

#### Step 5: Install MongoDB

```bash
sudo apt install -y mongodb-org
```

#### Step 6: Start MongoDB Service

```bash
# Start MongoDB
sudo systemctl start mongod

# Enable auto-start on boot
sudo systemctl enable mongod

# Check status
sudo systemctl status mongod
```

**Expected output:**
```
● mongod.service - MongoDB Database Server
     Loaded: loaded (/lib/systemd/system/mongod.service; enabled)
     Active: active (running) since Mon 2024-01-15 10:30:00 UTC
```

#### Step 7: Verify Installation

```bash
# Connect to MongoDB
mongosh

# You should see:
# test>
```

#### Step 8: Configure MongoDB for VPS

Edit configuration: `/etc/mongod.conf`

```bash
sudo nano /etc/mongod.conf
```

**Important settings:**

```yaml
# mongod.conf

# Storage
storage:
  dbPath: /var/lib/mongodb
  journal:
    enabled: true

# Network
net:
  port: 27017
  bindIp: 127.0.0.1  # Only localhost initially
  # bindIp: 0.0.0.0  # Allow all IPs (configure firewall!)

# Security - IMPORTANT FOR VPS
security:
  authorization: enabled
```

#### Step 9: Create Admin User (IMPORTANT for VPS!)

```bash
# Connect to MongoDB
mongosh

# Switch to admin database
use admin

# Create admin user
db.createUser({
  user: "admin",
  pwd: "YourStrongPasswordHere123!",
  roles: [
    { role: "userAdminAnyDatabase", db: "admin" },
    { role: "readWriteAnyDatabase", db: "admin" },
    { role: "dbAdminAnyDatabase", db: "admin" }
  ]
})

# Create application database user
use colddrink_billing

db.createUser({
  user: "juicyapp",
  pwd: "AppPassword456!",
  roles: [
    { role: "readWrite", db: "colddrink_billing" }
  ]
})

# Exit
exit
```

#### Step 10: Enable Authentication

```bash
# Edit config
sudo nano /etc/mongod.conf

# Uncomment or add:
security:
  authorization: enabled

# Restart MongoDB
sudo systemctl restart mongod
```

#### Step 11: Test Authenticated Connection

```bash
# Connect with authentication
mongosh -u admin -p YourStrongPasswordHere123! --authenticationDatabase admin

# Or for application user
mongosh -u juicyapp -p AppPassword456! --authenticationDatabase colddrink_billing colddrink_billing
```

#### Step 12: Configure Firewall (UFW)

```bash
# Allow SSH (don't lock yourself out!)
sudo ufw allow ssh

# Allow MongoDB only from specific IP (your app server)
sudo ufw allow from YOUR_APP_SERVER_IP to any port 27017

# Or allow from anywhere (less secure)
# sudo ufw allow 27017

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

### For CentOS/RHEL Server

```bash
# Create repo file
sudo nano /etc/yum.repos.d/mongodb-org-7.0.repo

# Add content:
[mongodb-org-7.0]
name=MongoDB Repository
baseurl=https://repo.mongodb.org/yum/redhat/8/mongodb-org/7.0/x86_64/
gpgcheck=1
enabled=1
gpgkey=https://www.mongodb.org/static/pgp/server-7.0.asc

# Install
sudo yum install -y mongodb-org

# Start service
sudo systemctl start mongod
sudo systemctl enable mongod
```

---

## Connecting Your Application to MongoDB

### Connection String Format

```
mongodb://[username:password@]host:port/database[?options]
```

### Examples

**Local without authentication:**
```
mongodb://localhost:27017/colddrink_billing
```

**Local with authentication:**
```
mongodb://juicyapp:AppPassword456!@localhost:27017/colddrink_billing
```

**Remote VPS:**
```
mongodb://juicyapp:AppPassword456!@your-vps-ip:27017/colddrink_billing
```

**With options:**
```
mongodb://juicyapp:password@your-vps-ip:27017/colddrink_billing?retryWrites=true&w=majority
```

### Update Your .env File

**For Local Development:**
```env
MONGODB_URI=mongodb://localhost:27017/colddrink_billing
```

**For VPS Production:**
```env
MONGODB_URI=mongodb://juicyapp:AppPassword456!@your-vps-ip:27017/colddrink_billing
```

### Connection in Node.js (Your App)

Your app already has this in `backend/config/db.js`:

```javascript
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      // Options for stable connection
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
```

---

## Basic MongoDB Operations

### Connect to MongoDB Shell

```bash
# Local
mongosh

# With authentication
mongosh -u admin -p password --authenticationDatabase admin

# Remote server
mongosh "mongodb://user:password@remote-ip:27017/database"
```

### Database Operations

```javascript
// Show all databases
show dbs

// Switch to database (creates if doesn't exist)
use colddrink_billing

// Show current database
db

// Show all collections
show collections

// Get database statistics
db.stats()
```

### Collection Operations

```javascript
// Count documents in collection
db.bills.countDocuments()

// Find all documents
db.bills.find()

// Find with pretty formatting
db.bills.find().pretty()

// Find specific document
db.bills.findOne({ billNo: 1 })

// Find with condition
db.bills.find({ total: { $gt: 100 } })  // total > 100

// Find with multiple conditions
db.bills.find({
  total: { $gt: 100 },
  paymentMode: "Cash"
})

// Limit results
db.bills.find().limit(10)

// Sort results
db.bills.find().sort({ billDate: -1 })  // newest first

// Count with condition
db.bills.countDocuments({ status: "Completed" })
```

### Insert Operations

```javascript
// Insert one document
db.bills.insertOne({
  billNo: 100,
  items: [{ name: "Coke", quantity: 2, price: 50 }],
  total: 100,
  billDate: new Date()
})

// Insert multiple documents
db.bills.insertMany([
  { billNo: 101, total: 150 },
  { billNo: 102, total: 200 }
])
```

### Update Operations

```javascript
// Update one document
db.bills.updateOne(
  { billNo: 100 },           // Filter
  { $set: { total: 120 } }   // Update
)

// Update multiple documents
db.bills.updateMany(
  { status: "Pending" },
  { $set: { status: "Completed" } }
)

// Increment a value
db.bills.updateOne(
  { billNo: 100 },
  { $inc: { total: 10 } }    // Add 10 to total
)
```

### Delete Operations

```javascript
// Delete one document
db.bills.deleteOne({ billNo: 100 })

// Delete multiple documents
db.bills.deleteMany({ status: "Cancelled" })

// Delete all documents in collection (careful!)
db.bills.deleteMany({})

// Drop entire collection (careful!)
db.bills.drop()
```

---

## Checking If Data is Saved

### Method 1: Using MongoDB Shell

```bash
# Connect to MongoDB
mongosh

# Switch to your database
use colddrink_billing

# Check collections exist
show collections

# Expected output:
# bills
# businesssettings
# maincodes
# purchases
# stockledgers
# subcodes
# suppliers
# users
```

### Method 2: Count Documents

```javascript
// In mongosh
use colddrink_billing

// Count documents in each collection
print("Users:", db.users.countDocuments())
print("MainCodes:", db.maincodes.countDocuments())
print("SubCodes:", db.subcodes.countDocuments())
print("Bills:", db.bills.countDocuments())
print("Purchases:", db.purchases.countDocuments())
print("Suppliers:", db.suppliers.countDocuments())
print("Stock Ledgers:", db.stockledgers.countDocuments())
print("Settings:", db.businesssettings.countDocuments())
```

### Method 3: View Recent Data

```javascript
// View last 5 bills
db.bills.find().sort({ createdAt: -1 }).limit(5).pretty()

// View all users
db.users.find({}, { username: 1, role: 1 }).pretty()

// View specific bill
db.bills.findOne({ billNo: 1 })
```

### Method 4: Using MongoDB Compass (GUI)

1. Open MongoDB Compass
2. Connect to: `mongodb://localhost:27017`
3. Click on `colddrink_billing` database
4. Browse collections and documents visually

### Method 5: Check Data Integrity

```javascript
// Run in mongosh

// Check for orphaned bills (bills without valid user)
db.bills.aggregate([
  {
    $lookup: {
      from: "users",
      localField: "userId",
      foreignField: "_id",
      as: "user"
    }
  },
  {
    $match: { user: { $size: 0 } }
  },
  {
    $count: "orphanedBills"
  }
])
// Should return 0 or empty result

// Check for duplicate bill numbers
db.bills.aggregate([
  { $group: { _id: "$billNo", count: { $sum: 1 } } },
  { $match: { count: { $gt: 1 } } }
])
// Should return empty result

// Check for negative stock (shouldn't happen)
db.subcodes.find({ currentStock: { $lt: 0 } })
// Should return empty result

// Verify bill totals
db.bills.aggregate([
  {
    $project: {
      billNo: 1,
      calculatedTotal: {
        $subtract: [
          { $add: ["$subtotal", "$gstAmount"] },
          "$discountAmount"
        ]
      },
      storedTotal: "$grandTotal",
      match: {
        $eq: [
          { $round: [{ $subtract: [{ $add: ["$subtotal", "$gstAmount"] }, "$discountAmount"] }, 0] },
          { $round: ["$grandTotal", 0] }
        ]
      }
    }
  },
  { $match: { match: false } }
])
// Should return empty if all totals are correct
```

### Method 6: API Health Check

```javascript
// In your browser or curl
// GET http://localhost:5000/api/health

// Or check via curl
curl http://localhost:5000/api/health

// Expected response:
{
  "success": true,
  "message": "Server is running",
  "database": "connected"
}
```

### Method 7: Create a Verification Script

Create file `backend/utils/verifyData.js`:

```javascript
const mongoose = require('mongoose');
require('dotenv').config();

const Bill = require('../models/Bill');
const User = require('../models/User');
const SubCode = require('../models/SubCode');
const MainCode = require('../models/MainCode');
const Supplier = require('../models/Supplier');

const verifyData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    // Count all collections
    console.log('=== DATA VERIFICATION REPORT ===\n');

    const users = await User.countDocuments();
    const maincodes = await MainCode.countDocuments();
    const subcodes = await SubCode.countDocuments();
    const bills = await Bill.countDocuments();
    const suppliers = await Supplier.countDocuments();

    console.log('Collection Counts:');
    console.log(`  Users: ${users}`);
    console.log(`  Categories: ${maincodes}`);
    console.log(`  Products: ${subcodes}`);
    console.log(`  Bills: ${bills}`);
    console.log(`  Suppliers: ${suppliers}`);
    console.log('');

    // Check for issues
    console.log('Data Integrity Checks:');

    // Check admin exists
    const admin = await User.findOne({ role: 'admin' });
    console.log(`  Admin user exists: ${admin ? 'YES' : 'NO'}`);

    // Check for today's bills
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayBills = await Bill.countDocuments({
      billDate: { $gte: today }
    });
    console.log(`  Today's bills: ${todayBills}`);

    // Check total sales
    const totalSales = await Bill.aggregate([
      { $match: { status: 'Completed' } },
      { $group: { _id: null, total: { $sum: '$grandTotal' } } }
    ]);
    console.log(`  Total sales: ₹${totalSales[0]?.total || 0}`);

    // Low stock items
    const lowStock = await SubCode.countDocuments({
      $expr: { $lte: ['$currentStock', '$minStockAlert'] }
    });
    console.log(`  Low stock items: ${lowStock}`);

    console.log('\n=== VERIFICATION COMPLETE ===');

  } catch (error) {
    console.error('Verification failed:', error.message);
  } finally {
    await mongoose.disconnect();
  }
};

verifyData();
```

Run it:
```bash
cd backend
node utils/verifyData.js
```

---

## Backup Strategies

### Strategy 1: mongodump (Recommended)

**What it does:** Creates a binary backup of your database.

#### Full Database Backup

**Windows:**
```powershell
# Create backup folder
mkdir C:\mongodb-backups

# Backup entire database
mongodump --db colddrink_billing --out C:\mongodb-backups\backup_2024-01-15

# With compression
mongodump --db colddrink_billing --archive=C:\mongodb-backups\backup_2024-01-15.archive --gzip

# With authentication
mongodump --db colddrink_billing --username admin --password yourpass --authenticationDatabase admin --out C:\mongodb-backups\backup_2024-01-15
```

**Linux:**
```bash
# Create backup folder
mkdir -p /var/backups/mongodb

# Backup entire database
mongodump --db colddrink_billing --out /var/backups/mongodb/backup_$(date +%Y-%m-%d)

# With compression
mongodump --db colddrink_billing --archive=/var/backups/mongodb/backup_$(date +%Y-%m-%d).archive --gzip

# With authentication
mongodump --db colddrink_billing -u admin -p yourpass --authenticationDatabase admin --out /var/backups/mongodb/backup_$(date +%Y-%m-%d)
```

#### Backup Specific Collection

```bash
# Backup only bills collection
mongodump --db colddrink_billing --collection bills --out /backup/bills_only
```

### Strategy 2: mongoexport (For Readable Backups)

Exports to JSON or CSV format.

```bash
# Export collection as JSON
mongoexport --db colddrink_billing --collection bills --out bills_backup.json

# Export as CSV
mongoexport --db colddrink_billing --collection bills --type=csv --fields=billNo,grandTotal,billDate --out bills_backup.csv

# Export all collections (script)
for collection in users maincodes subcodes bills purchases suppliers stockledgers businesssettings
do
  mongoexport --db colddrink_billing --collection $collection --out ${collection}_backup.json
done
```

### Strategy 3: Automated Daily Backups

#### Windows Task Scheduler

1. Create backup script `C:\mongodb-backups\daily_backup.bat`:

```batch
@echo off
set BACKUP_PATH=C:\mongodb-backups
set DATE=%date:~-4,4%-%date:~-10,2%-%date:~-7,2%
set TIME=%time:~0,2%%time:~3,2%

echo Starting MongoDB backup...

:: Create backup directory
mkdir "%BACKUP_PATH%\%DATE%" 2>nul

:: Run mongodump
mongodump --db colddrink_billing --archive="%BACKUP_PATH%\%DATE%\colddrink_%TIME%.archive" --gzip

echo Backup completed: %BACKUP_PATH%\%DATE%\colddrink_%TIME%.archive

:: Delete backups older than 7 days
forfiles /p "%BACKUP_PATH%" /d -7 /c "cmd /c if @isdir==TRUE rmdir /s /q @path" 2>nul

echo Old backups cleaned up.
pause
```

2. Schedule in Task Scheduler:
   - Open Task Scheduler
   - Create Basic Task
   - Name: "MongoDB Daily Backup"
   - Trigger: Daily at 2:00 AM
   - Action: Start a program
   - Program: `C:\mongodb-backups\daily_backup.bat`

#### Linux Cron Job

1. Create backup script `/var/backups/mongodb/daily_backup.sh`:

```bash
#!/bin/bash

# Configuration
BACKUP_PATH="/var/backups/mongodb"
DATE=$(date +%Y-%m-%d)
TIME=$(date +%H%M)
DB_NAME="colddrink_billing"
RETENTION_DAYS=7

# MongoDB credentials (if authentication enabled)
MONGO_USER="admin"
MONGO_PASS="yourpassword"

# Create backup directory
mkdir -p "$BACKUP_PATH/$DATE"

# Run backup
mongodump --db $DB_NAME \
  -u $MONGO_USER -p $MONGO_PASS --authenticationDatabase admin \
  --archive="$BACKUP_PATH/$DATE/colddrink_$TIME.archive" \
  --gzip

# Log backup
echo "$(date): Backup created - $BACKUP_PATH/$DATE/colddrink_$TIME.archive" >> "$BACKUP_PATH/backup.log"

# Delete old backups
find $BACKUP_PATH -type d -mtime +$RETENTION_DAYS -exec rm -rf {} \; 2>/dev/null

echo "Backup completed successfully"
```

2. Make executable and schedule:

```bash
# Make executable
chmod +x /var/backups/mongodb/daily_backup.sh

# Edit crontab
crontab -e

# Add line (runs at 2 AM daily)
0 2 * * * /var/backups/mongodb/daily_backup.sh
```

### Strategy 4: Cloud Backup (Recommended for Production)

#### Option A: Backup to AWS S3

```bash
#!/bin/bash

# Backup and upload to S3
BACKUP_FILE="/tmp/mongodb_$(date +%Y%m%d).archive"

# Create backup
mongodump --db colddrink_billing --archive=$BACKUP_FILE --gzip

# Upload to S3
aws s3 cp $BACKUP_FILE s3://your-bucket-name/mongodb-backups/

# Remove local temp file
rm $BACKUP_FILE

echo "Backup uploaded to S3"
```

#### Option B: Backup to Google Drive

Use `rclone`:

```bash
# Install rclone
curl https://rclone.org/install.sh | sudo bash

# Configure Google Drive
rclone config

# Backup script
mongodump --db colddrink_billing --archive=/tmp/backup.archive --gzip
rclone copy /tmp/backup.archive gdrive:mongodb-backups/
rm /tmp/backup.archive
```

### Strategy 5: MongoDB Atlas (Cloud Database)

If you use MongoDB Atlas (cloud), backups are automatic:
- Continuous backups
- Point-in-time recovery
- Automated snapshots

---

## Restore from Backup

### Restore Full Database

**From mongodump backup:**

```bash
# Basic restore
mongorestore --db colddrink_billing /path/to/backup/colddrink_billing

# From archive
mongorestore --archive=/path/to/backup.archive --gzip

# With authentication
mongorestore --db colddrink_billing \
  -u admin -p password --authenticationDatabase admin \
  /path/to/backup/colddrink_billing

# Drop existing and restore (careful!)
mongorestore --db colddrink_billing --drop /path/to/backup/colddrink_billing
```

### Restore Specific Collection

```bash
# Restore only bills collection
mongorestore --db colddrink_billing --collection bills \
  /path/to/backup/colddrink_billing/bills.bson
```

### Restore from JSON Export

```bash
# Import from JSON
mongoimport --db colddrink_billing --collection bills --file bills_backup.json

# Import from CSV
mongoimport --db colddrink_billing --collection bills \
  --type csv --headerline --file bills_backup.csv
```

### Restore to Different Database

```bash
# Restore to a new database for testing
mongorestore --db colddrink_billing_test /path/to/backup/colddrink_billing
```

### Step-by-Step Restore Process

```bash
# 1. Stop your application
# (So no new data is written during restore)

# 2. Connect to MongoDB
mongosh

# 3. Check current data
use colddrink_billing
db.bills.countDocuments()  # Note the count

# 4. Exit mongosh
exit

# 5. Restore from backup
mongorestore --db colddrink_billing --drop /path/to/backup/colddrink_billing

# 6. Verify restore
mongosh
use colddrink_billing
db.bills.countDocuments()  # Should match backup

# 7. Start your application
```

---

## Crash Recovery

### Understanding MongoDB Crash Recovery

MongoDB has built-in crash recovery through:

1. **Journaling** - Records every write operation
2. **Write-Ahead Logging** - Writes to journal before database
3. **Checkpoints** - Periodic snapshots of data

### When MongoDB Crashes

**Automatic Recovery:**

When MongoDB restarts after a crash, it automatically:
1. Reads the journal files
2. Replays operations since last checkpoint
3. Brings database to consistent state

```bash
# Just restart MongoDB - recovery is automatic
sudo systemctl restart mongod

# Check logs for recovery information
sudo tail -100 /var/log/mongodb/mongod.log
```

### Manual Recovery Steps

#### Step 1: Check MongoDB Status

```bash
# Check if MongoDB is running
sudo systemctl status mongod

# If not running, try to start
sudo systemctl start mongod

# Check logs for errors
sudo tail -f /var/log/mongodb/mongod.log
```

#### Step 2: If MongoDB Won't Start

**Check for lock file:**
```bash
# Remove lock file (if it exists after crash)
sudo rm /var/lib/mongodb/mongod.lock

# Repair database
mongod --repair --dbpath /var/lib/mongodb

# Start MongoDB
sudo systemctl start mongod
```

**Check disk space:**
```bash
# Check available space
df -h

# MongoDB needs space for journal files
# Clear old logs if needed
sudo rm /var/log/mongodb/mongod.log.*
```

**Check permissions:**
```bash
# Fix ownership
sudo chown -R mongodb:mongodb /var/lib/mongodb
sudo chown -R mongodb:mongodb /var/log/mongodb
```

#### Step 3: If Data is Corrupted

```bash
# 1. Stop MongoDB
sudo systemctl stop mongod

# 2. Backup current data (even if corrupted)
sudo cp -r /var/lib/mongodb /var/lib/mongodb_corrupted_backup

# 3. Try repair
mongod --repair --dbpath /var/lib/mongodb

# 4. Start MongoDB
sudo systemctl start mongod

# 5. If repair fails, restore from backup
mongorestore --db colddrink_billing --drop /path/to/last/good/backup
```

### Preventing Data Loss

#### 1. Enable Journaling (Default in modern MongoDB)

Check in config file:
```yaml
storage:
  journal:
    enabled: true
```

#### 2. Set Write Concern

In your application:
```javascript
// Ensure writes are acknowledged
mongoose.connect(uri, {
  w: 'majority',      // Wait for majority of replicas
  j: true,            // Wait for journal write
  wtimeout: 5000      // Timeout in milliseconds
});
```

#### 3. Use Replica Sets (Production)

Replica sets provide:
- Automatic failover
- Data redundancy
- No single point of failure

```bash
# Replica set configuration (advanced)
# Requires multiple servers
```

#### 4. Regular Backups

**Most important protection!**

- Daily automated backups
- Keep 7-30 days of backups
- Store backups off-site (cloud)
- Test restore process regularly

### Recovery Scenarios

#### Scenario 1: Server Reboot/Crash

```bash
# MongoDB auto-recovers
# Just restart and check
sudo systemctl start mongod
mongosh
use colddrink_billing
db.bills.countDocuments()  # Verify data
```

#### Scenario 2: Disk Full

```bash
# Free up space
sudo du -sh /var/log/*  # Find large files
sudo rm /var/log/mongodb/mongod.log.*  # Remove old logs

# Restart MongoDB
sudo systemctl restart mongod
```

#### Scenario 3: Data File Corruption

```bash
# 1. Stop MongoDB
sudo systemctl stop mongod

# 2. Try repair
mongod --repair --dbpath /var/lib/mongodb

# 3. If repair fails, restore from backup
# First, remove corrupted data
sudo rm -rf /var/lib/mongodb/*

# Then restore
mongorestore --db colddrink_billing /backup/latest/colddrink_billing

# 4. Start MongoDB
sudo systemctl start mongod
```

#### Scenario 4: Accidental Data Deletion

```bash
# If you accidentally deleted data:

# 1. Stop application immediately (prevent more changes)

# 2. Restore from most recent backup
mongorestore --db colddrink_billing --drop /backup/latest/colddrink_billing

# 3. If using replica set, restore from secondary
# (advanced)
```

---

## Security Best Practices

### 1. Enable Authentication

```javascript
// In mongosh
use admin

// Create admin user
db.createUser({
  user: "admin",
  pwd: "VeryStr0ngP@ssw0rd!",
  roles: ["root"]
})
```

Enable in config:
```yaml
security:
  authorization: enabled
```

### 2. Use Strong Passwords

```bash
# Generate strong password
openssl rand -base64 24
# Example: K9fJ2mXp8vLqN3wR5yT7uI0o
```

### 3. Bind to Localhost Only (Unless Needed)

```yaml
net:
  bindIp: 127.0.0.1
```

### 4. Use TLS/SSL (Production)

```yaml
net:
  ssl:
    mode: requireSSL
    PEMKeyFile: /etc/ssl/mongodb.pem
```

### 5. Configure Firewall

```bash
# UFW (Linux)
sudo ufw allow from YOUR_APP_IP to any port 27017

# iptables
sudo iptables -A INPUT -s YOUR_APP_IP -p tcp --dport 27017 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 27017 -j DROP
```

### 6. Regular Security Updates

```bash
# Update MongoDB
sudo apt update
sudo apt upgrade mongodb-org
```

### 7. Audit Logging (Enterprise)

```yaml
auditLog:
  destination: file
  format: JSON
  path: /var/log/mongodb/audit.json
```

---

## Monitoring & Maintenance

### Monitor MongoDB Status

```javascript
// In mongosh
db.serverStatus()

// Connection info
db.serverStatus().connections

// Memory usage
db.serverStatus().mem

// Operations stats
db.serverStatus().opcounters
```

### Monitor Database Size

```javascript
// Database stats
use colddrink_billing
db.stats()

// Collection stats
db.bills.stats()

// Index sizes
db.bills.totalIndexSize()
```

### Maintenance Tasks

#### 1. Compact Collections

```javascript
// Remove fragmentation
db.runCommand({ compact: "bills" })
```

#### 2. Rebuild Indexes

```javascript
// Rebuild all indexes
db.bills.reIndex()
```

#### 3. Validate Collections

```javascript
// Check collection integrity
db.runCommand({ validate: "bills" })
```

### Log Rotation

**Linux (logrotate):**

Create `/etc/logrotate.d/mongodb`:
```
/var/log/mongodb/*.log {
  daily
  rotate 7
  compress
  delaycompress
  missingok
  notifempty
  create 640 mongodb mongodb
  sharedscripts
  postrotate
    /bin/kill -SIGUSR1 $(cat /var/lib/mongodb/mongod.lock 2>/dev/null) 2>/dev/null || true
  endscript
}
```

---

## Troubleshooting Common Issues

### Issue 1: Cannot Connect to MongoDB

**Symptoms:** Connection refused, timeout

**Solutions:**

```bash
# Check if MongoDB is running
sudo systemctl status mongod

# Check if port is open
netstat -tlnp | grep 27017

# Check bindIp in config
grep bindIp /etc/mongod.conf

# Check firewall
sudo ufw status
```

### Issue 2: Authentication Failed

**Symptoms:** "Authentication failed" error

**Solutions:**

```bash
# Connect without auth first
mongosh --noauth

# Check user exists
use admin
db.getUsers()

# Create user if missing
db.createUser({...})

# Check authentication database
# Connection string must include authSource
mongodb://user:pass@host:27017/db?authSource=admin
```

### Issue 3: Disk Space Full

**Symptoms:** Write errors, database hangs

**Solutions:**

```bash
# Check disk space
df -h

# Find large files
du -sh /var/lib/mongodb/*

# Remove old journals (careful!)
# Stop MongoDB first
sudo systemctl stop mongod
sudo rm /var/lib/mongodb/journal/*
sudo systemctl start mongod

# Clean old logs
sudo rm /var/log/mongodb/mongod.log.*
```

### Issue 4: Slow Queries

**Symptoms:** Application is slow

**Solutions:**

```javascript
// Enable profiling
db.setProfilingLevel(1, { slowms: 100 })

// View slow queries
db.system.profile.find().sort({ ts: -1 }).limit(5)

// Add indexes
db.bills.createIndex({ billDate: -1 })
db.bills.createIndex({ userId: 1 })

// Explain query
db.bills.find({ status: "Completed" }).explain("executionStats")
```

### Issue 5: Cannot Start After Crash

**Symptoms:** MongoDB won't start

**Solutions:**

```bash
# Check logs
sudo tail -100 /var/log/mongodb/mongod.log

# Remove lock file
sudo rm /var/lib/mongodb/mongod.lock

# Repair database
mongod --repair --dbpath /var/lib/mongodb

# Fix permissions
sudo chown -R mongodb:mongodb /var/lib/mongodb

# Start MongoDB
sudo systemctl start mongod
```

### Issue 6: Memory Issues

**Symptoms:** High memory usage, OOM killer

**Solutions:**

```yaml
# Limit WiredTiger cache in mongod.conf
storage:
  wiredTiger:
    engineConfig:
      cacheSizeGB: 1  # Adjust based on available RAM
```

---

## Quick Reference Commands

### Backup Commands

| Task | Command |
|------|---------|
| Full backup | `mongodump --db colddrink_billing --out /backup` |
| Compressed backup | `mongodump --db colddrink_billing --archive=/backup/db.archive --gzip` |
| Single collection | `mongodump --db colddrink_billing --collection bills --out /backup` |
| Export to JSON | `mongoexport --db colddrink_billing --collection bills --out bills.json` |

### Restore Commands

| Task | Command |
|------|---------|
| Full restore | `mongorestore --db colddrink_billing /backup/colddrink_billing` |
| From archive | `mongorestore --archive=/backup/db.archive --gzip` |
| Drop and restore | `mongorestore --db colddrink_billing --drop /backup/colddrink_billing` |
| Import from JSON | `mongoimport --db colddrink_billing --collection bills --file bills.json` |

### Service Commands

| Task | Windows | Linux |
|------|---------|-------|
| Start | `net start MongoDB` | `sudo systemctl start mongod` |
| Stop | `net stop MongoDB` | `sudo systemctl stop mongod` |
| Restart | `net stop MongoDB && net start MongoDB` | `sudo systemctl restart mongod` |
| Status | `Get-Service MongoDB` | `sudo systemctl status mongod` |

### Verification Commands

```javascript
// In mongosh
use colddrink_billing
show collections
db.bills.countDocuments()
db.stats()
```

---

## Summary

### Local Development Setup
1. Download MongoDB from mongodb.com
2. Install as Windows Service
3. Connect with `mongosh`
4. Data stored automatically

### VPS Production Setup
1. Install MongoDB on Linux
2. Enable authentication
3. Create database users
4. Configure firewall
5. Set up automated backups

### Key Practices
- **Always enable authentication** on VPS
- **Daily automated backups** with 7-day retention
- **Test restore process** monthly
- **Monitor disk space** and performance
- **Keep MongoDB updated** for security

### Backup Checklist
- [ ] Automated daily backups configured
- [ ] Backups stored off-site (cloud)
- [ ] Restore process tested
- [ ] Backup monitoring/alerts set up
- [ ] Old backups cleaned automatically

---

## Need Help?

- MongoDB Documentation: https://docs.mongodb.com
- MongoDB University (Free Courses): https://university.mongodb.com
- Stack Overflow: https://stackoverflow.com/questions/tagged/mongodb

**Happy Database Management!**
