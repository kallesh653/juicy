# ColdDrink Billing System - Complete Step-by-Step Deployment Guide

---

## PART 1: PREREQUISITES (One-Time Installation)

### Step 1.1: Install Node.js

1. **Open browser and go to:** https://nodejs.org
2. **Download:** Click "LTS" version (e.g., 20.x.x LTS)
3. **Run installer:** Double-click downloaded file
4. **Installation options:**
   - Click "Next"
   - Accept license → Next
   - Keep default path → Next
   - Keep default features → Next
   - CHECK "Automatically install necessary tools" → Next
   - Click "Install"
5. **Verify installation:**
   - Open Command Prompt (Win + R → type `cmd` → Enter)
   - Type: `node --version`
   - Should show: `v20.x.x`
   - Type: `npm --version`
   - Should show: `10.x.x`

---

## PART 2: APPLICATION INSTALLATION

### Step 2.1: Open Command Prompt

1. Press `Win + R`
2. Type `cmd`
3. Press Enter

### Step 2.2: Navigate to Project Folder

```cmd
cd C:\Users\LEN0VO\Desktop\colddrink1.2
```

### Step 2.3: Install Backend Dependencies

```cmd
cd backend
npm install
```

**What happens:**
- Downloads all required packages
- Creates `node_modules` folder
- Takes 2-5 minutes

**Expected output:**
```
added 337 packages in 2m
```

### Step 2.4: Install Frontend Dependencies

```cmd
cd ..\frontend
npm install
```

**What happens:**
- Downloads React, Ant Design, and other UI packages
- Takes 2-3 minutes

**Expected output:**
```
added 285 packages in 1m
```

### Step 2.5: Go Back to Root Folder

```cmd
cd ..
```

---

## PART 3: CREATE DEFAULT USERS

### Step 3.1: Run Seed Command

```cmd
cd backend
npm run seed
```

**What happens:**
- Creates Admin user: `admin` / `admin123`
- Creates Cashier user: `cashier` / `cashier123`
- Creates default business settings

**Expected output:**
```
✅ MongoDB Connected
✅ Admin user created
✅ Cashier user created
✅ Business settings created
Seeding completed!
```

### Step 3.2: Go Back to Root

```cmd
cd ..
```

---

## PART 4: RUNNING THE APPLICATION

### Method A: Using One-Click Launcher (Easiest)

1. Open File Explorer
2. Go to `C:\Users\LEN0VO\Desktop\colddrink1.2`
3. Double-click `ColdDrink-Billing.bat`
4. Wait 15-20 seconds
5. Browser opens automatically at `http://localhost:3000`

### Method B: Using Command Prompt (Manual)

**Terminal 1 - Start Backend:**
```cmd
cd C:\Users\LEN0VO\Desktop\colddrink1.2\backend
npm run dev
```

**Expected output:**
```
╔═══════════════════════════════════════════════════════╗
║   🍹 Juicy Billing System API                        ║
║   Server running in development mode                  ║
║   Port: 5000                                         ║
╚═══════════════════════════════════════════════════════╝

⚠️  External MongoDB not found, starting embedded MongoDB...
✅ Embedded MongoDB Started
📁 Data stored at: C:\Users\LEN0VO\ColdDrinkBilling\database
📊 Database: colddrink_billing
```

**Terminal 2 - Start Frontend:**
Open new Command Prompt window:
```cmd
cd C:\Users\LEN0VO\Desktop\colddrink1.2\frontend
npm run dev
```

**Expected output:**
```
  VITE v5.0.8  ready in 1234 ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: http://192.168.1.100:3000/
```

### Step 4.1: Open Application

1. Open browser (Chrome/Edge/Firefox)
2. Go to: `http://localhost:3000`
3. You should see the login page

---

## PART 5: LOGGING IN

### Step 5.1: Admin Login

1. Click "Admin" tab
2. Username: `admin`
3. Password: `admin123`
4. Click "Login as Admin"

**Admin can:**
- Manage products (Main Codes, Sub Codes)
- Manage suppliers
- Create users
- View all reports
- Change settings
- Make purchases
- Create bills

### Step 5.2: Cashier Login

1. Click "Cashier" tab
2. Username: `cashier`
3. Password: `cashier123`
4. Click "Login as Cashier"

**Cashier can:**
- Create bills (Take Order)
- View their own bills
- View daily collection

---

## PART 6: INITIAL SETUP (First Time Only)

### Step 6.1: Add Product Categories (Main Codes)

1. Login as Admin
2. Go to: Masters → Main Codes
3. Click "Add Main Code"
4. Fill:
   - Code: `01`
   - Name: `Cold Drinks`
   - Description: `All cold beverages`
5. Click "Save"
6. Add more categories:
   - `02` - Juices
   - `03` - Water
   - `04` - Snacks

### Step 6.2: Add Products (Sub Codes)

1. Go to: Masters → Sub Codes
2. Click "Add Sub Code"
3. Fill:
   - Main Code: Select `Cold Drinks`
   - Sub Code: `001`
   - Name: `Coca Cola 500ml`
   - Price: `40`
   - Cost Price: `35`
   - Unit: `Piece`
   - Current Stock: `100`
4. Click "Save"
5. Add more products

### Step 6.3: Add Suppliers (Optional)

1. Go to: Masters → Suppliers
2. Click "Add Supplier"
3. Fill supplier details
4. Click "Save"

### Step 6.4: Configure Business Settings

1. Go to: Settings
2. Update:
   - Shop Name
   - Address
   - Mobile
   - GST Number (if applicable)
3. Click "Save"

---

## PART 7: CREATING A BILL

### Step 7.1: Take Order

1. Click "Take Order" in sidebar
2. Select Main Code (e.g., Cold Drinks)
3. Click on products to add to cart
4. Adjust quantities using +/- buttons
5. Enter customer name (optional)
6. Select payment mode (Cash/UPI/Card)
7. Click "Generate Bill"

### Step 7.2: Print/Save Bill

- Bill number is auto-generated
- Bill is saved to database
- Stock is automatically reduced
- Can print using thermal printer or regular printer

---

## PART 8: ACCESSING FROM MOBILE/TABLET

### Step 8.1: Find Computer's IP Address

1. Open Command Prompt
2. Type: `ipconfig`
3. Look for `IPv4 Address`
4. Note it down (e.g., `192.168.1.100`)

### Step 8.2: Connect from Mobile

1. Ensure mobile is on same WiFi as computer
2. Open mobile browser
3. Type: `http://192.168.1.100:3000`
4. Login and use normally

### Step 8.3: Troubleshooting Mobile Access

**If can't connect:**

1. **Check Windows Firewall:**
   - Open "Windows Defender Firewall"
   - Click "Allow an app through firewall"
   - Click "Change settings"
   - Click "Allow another app"
   - Browse to `C:\Program Files\nodejs\node.exe`
   - Add it

2. **Or disable firewall temporarily:**
   - Control Panel → Windows Defender Firewall
   - Turn off firewall (for testing only)

3. **Check both devices are on same network**

---

## PART 9: VIEWING DATA IN MONGODB

### Method 1: Using MongoDB Compass (Recommended)

#### Step 9.1: Install MongoDB Compass

1. Go to: https://www.mongodb.com/try/download/compass
2. Download Windows version
3. Install with default options

#### Step 9.2: Connect to Database

1. Open MongoDB Compass
2. In connection string, enter: `mongodb://localhost:27017`
3. Click "Connect"

#### Step 9.3: Browse Data

1. Click on `colddrink_billing` database
2. You'll see collections:
   - `users` - All user accounts
   - `maincodes` - Product categories
   - `subcodes` - Individual products
   - `bills` - All sales transactions
   - `purchases` - Purchase records
   - `suppliers` - Supplier information
   - `stockledgers` - Stock history
   - `businesssettings` - Shop settings

3. Click any collection to see data
4. Can filter, sort, and search data

### Method 2: Using Command Line

```cmd
mongosh
```

Then:
```javascript
// Switch to database
use colddrink_billing

// Show all collections
show collections

// View all bills
db.bills.find().pretty()

// View today's bills
db.bills.find({
  billDate: { $gte: new Date().setHours(0,0,0,0) }
}).pretty()

// Count total bills
db.bills.countDocuments()

// View all products
db.subcodes.find().pretty()

// View all users
db.users.find({}, {password: 0}).pretty()

// Total sales amount
db.bills.aggregate([
  { $group: { _id: null, total: { $sum: "$grandTotal" } } }
])
```

---

## PART 10: DATA BACKUP

### Step 10.1: Locate Data Folder

Your database files are at:
```
C:\Users\LEN0VO\ColdDrinkBilling\database\
```

### Step 10.2: Manual Backup

1. Close the application
2. Copy the entire `database` folder
3. Paste to backup location (USB drive, external HDD)

### Step 10.3: Restore from Backup

1. Close the application
2. Delete current `database` folder
3. Paste backup `database` folder
4. Start application

---

## PART 11: DAILY OPERATIONS

### Morning Routine:
1. Double-click `ColdDrink-Billing.bat`
2. Login
3. Start billing

### Evening Routine:
1. Check Daily Collection report
2. Backup data (weekly recommended)
3. Close application (close the black window)

### Weekly Tasks:
1. Check Stock Report for low items
2. Add purchases for restocking
3. Backup database folder

---

## PART 12: TROUBLESHOOTING

### Problem: "Cannot connect to database"

**Solution:**
```cmd
# Close all windows and restart
cd C:\Users\LEN0VO\Desktop\colddrink1.2\backend
npm run dev
```

### Problem: "Port 3000 already in use"

**Solution:**
```cmd
# Find and kill process
netstat -ano | findstr :3000
taskkill /PID <number> /F
```

### Problem: "Login failed"

**Solution:**
```cmd
# Re-run seed
cd backend
npm run seed
```

### Problem: "Page not loading"

**Solution:**
1. Check backend is running (should see server messages)
2. Check frontend is running (should show VITE ready)
3. Clear browser cache: Ctrl + Shift + Delete

### Problem: "Stock not updating"

**Solution:**
- This happens automatically
- Check SubCode master for current stock
- Check Stock Ledger in reports

---

## PART 13: COMPLETE FILE STRUCTURE

```
colddrink1.2/
├── ColdDrink-Billing.bat    ← ONE-CLICK LAUNCHER
├── INSTALL.bat              ← First-time setup
├── README_USER.txt          ← Simple instructions
│
├── backend/                 ← Server code
│   ├── server.js           ← Main server file
│   ├── config/db.js        ← Database connection
│   ├── models/             ← Data structures
│   ├── controllers/        ← Business logic
│   ├── routes/             ← API endpoints
│   └── package.json        ← Dependencies
│
├── frontend/               ← User interface
│   ├── src/
│   │   ├── components/    ← All pages
│   │   ├── services/      ← API calls
│   │   └── App.jsx        ← Main app
│   └── package.json       ← Dependencies
│
└── electron/              ← Desktop app (optional)
```

---

## PART 14: GIVING TO END USER

### What to Give:
1. The entire `colddrink1.2` folder

### User Instructions:

**Step 1:** Install Node.js from https://nodejs.org

**Step 2:** Open the folder, double-click `INSTALL.bat`

**Step 3:** Open Command Prompt in the folder:
```cmd
cd backend
npm run seed
```

**Step 4:** Double-click `ColdDrink-Billing.bat` to start

**Step 5:** Login with `admin` / `admin123`

---

## QUICK REFERENCE CARD

| Action | Command/Step |
|--------|-------------|
| Install | `INSTALL.bat` |
| Create Users | `cd backend && npm run seed` |
| Start App | `ColdDrink-Billing.bat` |
| Admin Login | admin / admin123 |
| Cashier Login | cashier / cashier123 |
| Frontend URL | http://localhost:3000 |
| Backend URL | http://localhost:5000 |
| Mobile Access | http://YOUR-IP:3000 |
| Data Location | C:\Users\...\ColdDrinkBilling\database |
| View Data | MongoDB Compass → localhost:27017 |

---

## SUMMARY

### First Time Setup (5-10 minutes):
1. Install Node.js
2. Run INSTALL.bat
3. Run `npm run seed` in backend
4. Add products in Masters

### Daily Use (One Click):
1. Double-click `ColdDrink-Billing.bat`
2. Done!

### Data is:
- Stored locally on your computer
- No internet required
- No monthly fees
- 100% private

---

**ColdDrink Billing System v1.0.0**
Professional POS Software
