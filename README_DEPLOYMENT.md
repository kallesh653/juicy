# Juicy Billing System - Deployment Guide

## Your Deployed Application

**Frontend:** https://juicy.gentime.in
**Backend API:** https://juicyapi.gentime.in
**Server IP:** 72.61.238.39

**Login Credentials:**
- Admin: `admin` / `admin123`
- Cashier: `cashier` / `cashier123`

---

## Quick Start - Redeploy After Code Changes

### Method 1: Use the Batch File (Easiest)

Just double-click: `redeploy.bat`

This will automatically:
1. Create archive of your updated code
2. Upload to VPS
3. Deploy backend and frontend
4. Restart services

### Method 2: Manual Deployment

```bash
# 1. Create archive
tar -czf juicy-update.tar.gz --exclude=node_modules --exclude=.git backend frontend package.json

# 2. Upload to VPS
scp juicy-update.tar.gz root@72.61.238.39:/root/

# 3. SSH to server
ssh root@72.61.238.39

# 4. Extract and deploy
cd /root/juicy
tar -xzf /root/juicy-update.tar.gz
rm /root/juicy-update.tar.gz

# 5. Update backend
cd /root/juicy/backend
npm install
pm2 restart juicy-backend

# 6. Update frontend
cd /root/juicy/frontend
npm install
npm run build
cp -r dist/* /var/www/juicy/
```

---

## MongoDB - Quick Commands

### Connect to Database
```bash
ssh root@72.61.238.39
mongosh juicy_billing
```

### View Data
```javascript
// See all users
db.users.find().pretty()

// See recent bills
db.bills.find().sort({ createdAt: -1 }).limit(10).pretty()

// See all products
db.subcodes.find().pretty()

// See all tables
db.tables.find().pretty()

// Count documents
db.bills.countDocuments()
```

### Update Data
```javascript
// Update product price
db.subcodes.updateOne(
  { subCode: "COKE500" },
  { $set: { price: 60, stock: 100 } }
)

// Update shop name
db.businesssettings.updateOne(
  {},
  { $set: { shopName: "New Name" } }
)

// Set all tables to available
db.tables.updateMany({}, { $set: { status: "available" } })
```

### Delete Data
```javascript
// Delete specific order
db.orders.deleteOne({ _id: ObjectId("...") })

// Delete all old orders
db.orders.deleteMany({
  createdAt: { $lt: new Date("2025-01-01") }
})

// Clear all pending orders
db.orders.deleteMany({ status: "pending" })
```

### Sales Reports
```javascript
// Today's sales
db.bills.aggregate([
  {
    $match: {
      createdAt: { $gte: new Date(new Date().setHours(0,0,0,0)) }
    }
  },
  {
    $group: {
      _id: null,
      totalSales: { $sum: "$grandTotal" },
      totalBills: { $sum: 1 }
    }
  }
])

// Top selling products
db.bills.aggregate([
  { $unwind: "$items" },
  {
    $group: {
      _id: "$items.itemName",
      totalQuantity: { $sum: "$items.quantity" },
      totalRevenue: { $sum: "$items.total" }
    }
  },
  { $sort: { totalQuantity: -1 } },
  { $limit: 10 }
])
```

---

## Server Management

### Check Application Status
```bash
ssh root@72.61.238.39
pm2 list
```

### View Logs
```bash
pm2 logs juicy-backend
pm2 logs juicy-backend --lines 100
```

### Restart Application
```bash
pm2 restart juicy-backend
```

### Check Services
```bash
# Check PM2
pm2 list

# Check Nginx
systemctl status nginx

# Check MongoDB
systemctl status mongod
```

---

## Backup Database

```bash
# SSH to server
ssh root@72.61.238.39

# Create backup
mongodump --db juicy_billing --out /root/mongo-backups/backup-$(date +%Y%m%d)/

# Or compressed backup
mongodump --db juicy_billing --archive=/root/juicy_backup.gz --gzip
```

### Restore Database
```bash
# Restore from backup
mongorestore --db juicy_billing /root/mongo-backups/backup-20251210/juicy_billing/

# Or from compressed
mongorestore --db juicy_billing --archive=/root/juicy_backup.gz --gzip
```

---

## Common Tasks

### 1. Change Code and Redeploy
```bash
# On Windows: Double-click redeploy.bat
# Or run manually (see Quick Start above)
```

### 2. Reset Admin Password
```bash
ssh root@72.61.238.39
cd /root/juicy/backend
npm run seed
```

### 3. Add Sample Tables
```bash
ssh root@72.61.238.39
cd /root/juicy/backend
npm run seed-tables
```

### 4. View Today's Sales
```bash
ssh root@72.61.238.39
mongosh juicy_billing --eval 'db.bills.aggregate([{$match:{createdAt:{$gte:new Date(new Date().setHours(0,0,0,0))}}},{$group:{_id:null,total:{$sum:"$grandTotal"},count:{$sum:1}}}])'
```

### 5. Clear All Orders
```bash
ssh root@72.61.238.39
mongosh juicy_billing --eval 'db.orders.deleteMany({})'
```

---

## Troubleshooting

### Application Not Working

1. **Check if backend is running:**
```bash
ssh root@72.61.238.39
pm2 list
```

2. **Check logs for errors:**
```bash
pm2 logs juicy-backend --lines 50
```

3. **Restart backend:**
```bash
pm2 restart juicy-backend
```

4. **Test backend API:**
```bash
curl https://juicyapi.gentime.in/api/health
```

### Frontend Not Loading

1. **Check Nginx:**
```bash
ssh root@72.61.238.39
systemctl status nginx
nginx -t
```

2. **Check files exist:**
```bash
ls -la /var/www/juicy/
```

3. **Rebuild and redeploy frontend:**
```bash
cd /root/juicy/frontend
npm run build
cp -r dist/* /var/www/juicy/
```

### MongoDB Issues

1. **Check MongoDB status:**
```bash
ssh root@72.61.238.39
systemctl status mongod
```

2. **Restart MongoDB:**
```bash
systemctl restart mongod
```

3. **View MongoDB logs:**
```bash
tail -f /var/log/mongodb/mongod.log
```

---

## File Locations on Server

```
/root/juicy/backend/          - Backend source code
/root/juicy/frontend/         - Frontend source code
/var/www/juicy/               - Deployed frontend (production)
/etc/nginx/sites-available/   - Nginx configurations
/var/log/nginx/               - Nginx logs
/var/log/mongodb/             - MongoDB logs
/root/.pm2/logs/              - PM2 application logs
```

---

## Important Commands Reference

### PM2 Commands
```bash
pm2 list                      # List all processes
pm2 logs juicy-backend        # View logs
pm2 restart juicy-backend     # Restart app
pm2 stop juicy-backend        # Stop app
pm2 start juicy-backend       # Start app
pm2 monit                     # Monitor resources
pm2 save                      # Save process list
```

### MongoDB Commands
```bash
mongosh                       # Connect to MongoDB
mongosh juicy_billing         # Connect to specific database
show dbs                      # List databases
show collections              # List collections
db.bills.find().pretty()      # View bills
exit                          # Exit MongoDB shell
```

### Nginx Commands
```bash
nginx -t                      # Test configuration
systemctl reload nginx        # Reload Nginx
systemctl restart nginx       # Restart Nginx
systemctl status nginx        # Check status
```

---

## SSL Certificates

Your SSL certificates are automatically renewed by Certbot.

**Check certificate expiry:**
```bash
ssh root@72.61.238.39
certbot certificates
```

**Manual renewal (if needed):**
```bash
certbot renew
```

---

## Project Structure

```
colddrink1.2/
├── backend/                  # Node.js Express API
│   ├── server.js            # Main server file
│   ├── models/              # MongoDB models
│   ├── routes/              # API routes
│   ├── controllers/         # Business logic
│   ├── middleware/          # Auth & validation
│   └── .env                 # Environment variables
├── frontend/                # React Frontend
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── services/        # API services
│   │   │   └── api.js       # API configuration
│   │   └── App.jsx          # Main app component
│   └── vite.config.js       # Vite build config
└── redeploy.bat             # Quick redeploy script
```

---

## Support & Documentation

For detailed guides, refer to:
- **VPS_DEPLOYMENT_GUIDE.md** - Complete deployment documentation
- **MONGODB_QUICK_REFERENCE.md** - MongoDB command reference

---

## Quick Links

- Frontend: https://juicy.gentime.in
- Backend API: https://juicyapi.gentime.in
- API Health: https://juicyapi.gentime.in/api/health

---

**Need Help?**

1. Check logs: `pm2 logs juicy-backend`
2. Check status: `pm2 list`
3. Restart: `pm2 restart juicy-backend`
4. View MongoDB: `mongosh juicy_billing`
