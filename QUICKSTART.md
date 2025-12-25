# 🚀 Quick Start Guide

## Prerequisites Check
Before starting, ensure you have:
- ✅ Node.js installed (v16+)
- ✅ MongoDB installed and running
- ✅ npm installed

## Quick Setup (Windows)

### Option 1: Automated Setup
Simply double-click **SETUP.bat** file and wait for installation to complete.

### Option 2: Manual Setup

**Step 1: Install Backend**
```bash
cd backend
npm install
npm run seed
npm run dev
```
✅ Backend running on http://localhost:5000

**Step 2: Install Frontend (New Terminal)**
```bash
cd frontend
npm install
npm run dev
```
✅ Frontend running on http://localhost:3000

## 🔐 Login

Open browser and go to: **http://localhost:3000**

**Admin Login:**
- Username: `admin`
- Password: `admin123`

## 📋 First Steps After Login

### For Admin:
1. ✅ Go to **Masters → Main Codes** and create categories:
   - Example: `01` - Juices, `02` - Soda, `03` - Ice Cream

2. ✅ Go to **Masters → Sub Codes** and add items:
   - Example under Juices: `01-01` - Lemon Juice (₹40)
   - Example under Soda: `02-01` - Coca Cola (₹20)

3. ✅ Go to **Masters → Users** and create a billing user (optional)

4. ✅ Go to **Take Order** and create your first bill!

### For User (Billing Staff):
1. ✅ Click **Take Order**
2. ✅ Select Main Code (Category)
3. ✅ Select Items
4. ✅ Generate Bill

## 🔧 Troubleshooting

### MongoDB not running?
```bash
# Start MongoDB
mongod
```

### Port already in use?
- Backend: Change PORT in `backend/.env`
- Frontend: Change port in `frontend/vite.config.js`

### Can't login?
- Run seed script again: `cd backend && npm run seed`
- Clear browser cache/localStorage

## 📞 Common Commands

### Backend:
```bash
npm run dev     # Start development server
npm run seed    # Create admin user
npm start       # Start production server
```

### Frontend:
```bash
npm run dev     # Start development server
npm run build   # Build for production
npm run preview # Preview production build
```

## 🎯 Testing the System

1. **Create a Main Code**: Masters → Main Codes → Add "Juices"
2. **Add Items**: Masters → Sub Codes → Add "Lemon Juice - ₹40"
3. **Take Order**: Billing → Take Order → Select items
4. **View Reports**: Reports → Sales Report

## 📊 Sample Data

You can quickly test by creating these items:

**Main Codes:**
- 01 - Juices
- 02 - Cold Drinks
- 03 - Ice Cream

**Sub Codes:**
- 01-01 - Lemon Juice - ₹40
- 01-02 - Orange Juice - ₹50
- 02-01 - Coke - ₹20
- 02-02 - Pepsi - ₹20
- 03-01 - Vanilla Cone - ₹30

## ✨ Features to Explore

- 📊 Dashboard with real-time stats
- 🛒 Quick order taking
- 📦 Automatic stock management
- 📈 9 types of comprehensive reports
- 👥 Multi-user support with permissions
- 🖨️ Thermal printing support

## 🎉 You're All Set!

Start billing and enjoy the system!

For detailed documentation, check **README.md**
