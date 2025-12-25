# VPS Deployment Guide - Juicy Billing System

## Table of Contents
1. [Initial Deployment](#initial-deployment)
2. [Redeployment After Code Changes](#redeployment-after-code-changes)
3. [MongoDB Management](#mongodb-management)
4. [Server Management](#server-management)
5. [Troubleshooting](#troubleshooting)

---

## Initial Deployment

### Prerequisites
- VPS Server with Ubuntu/Debian
- Node.js v18+ installed
- MongoDB installed and running
- Nginx installed
- PM2 installed globally (`npm install -g pm2`)
- Domain names pointing to your VPS IP

### Step 1: Connect to VPS
```bash
ssh root@72.61.238.39
```

### Step 2: Install Required Software (if not already installed)

#### Install Node.js
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs
```

#### Install MongoDB
```bash
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor
echo "deb [ signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-7.0.list
apt-get update
apt-get install -y mongodb-org
systemctl start mongod
systemctl enable mongod
```

#### Install Nginx
```bash
apt-get install -y nginx
systemctl start nginx
systemctl enable nginx
```

#### Install PM2
```bash
npm install -g pm2
```

#### Install Certbot for SSL
```bash
apt-get install -y certbot python3-certbot-nginx
```

### Step 3: Deploy the Application

#### From Your Local Machine:

1. **Create project archive** (excluding unnecessary files):
```bash
cd "e:\colddrink application final\colddrink1.2"
tar -czf juicy-project.tar.gz --exclude=node_modules --exclude=.git --exclude=*.log --exclude=backend.pid --exclude=mongod --exclude=*.bat --exclude=*.vbs --exclude=*.ico --exclude=*.jpeg backend frontend package.json
```

2. **Upload to VPS**:
```bash
scp juicy-project.tar.gz root@72.61.238.39:/root/
```

#### On VPS Server:

3. **Extract and setup**:
```bash
ssh root@72.61.238.39
mkdir -p /root/juicy
cd /root/juicy
tar -xzf /root/juicy-project.tar.gz
rm /root/juicy-project.tar.gz
```

4. **Install Backend Dependencies**:
```bash
cd /root/juicy/backend
npm install
```

5. **Configure Backend Environment**:
```bash
cd /root/juicy/backend
nano .env
```

Update the .env file:
```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb://localhost:27017/juicy_billing
JWT_SECRET=your-secret-key-here
JWT_EXPIRE=30d
SHOP_NAME=Juicy
SHOP_ADDRESS=123 Main Street, City
SHOP_MOBILE=+91 9876543210
SHOP_EMAIL=shop@juicy.com
PRINTER_NAME=ThermalPrinter
PRINTER_WIDTH=48
```

6. **Update Frontend API Configuration**:
```bash
cd /root/juicy/frontend/src/services
nano api.js
```

Make sure it has:
```javascript
const getBaseURL = () => {
  if (window.location.hostname === 'juicy.gentime.in') {
    return 'https://juicyapi.gentime.in/api';
  }
  if (window.location.protocol === 'file:' || import.meta.env.PROD) {
    return 'http://localhost:5000/api';
  }
  return '/api';
};
```

7. **Install Frontend Dependencies and Build**:
```bash
cd /root/juicy/frontend
npm install
npm run build
```

8. **Deploy Frontend**:
```bash
mkdir -p /var/www/juicy
cp -r /root/juicy/frontend/dist/* /var/www/juicy/
```

9. **Configure Nginx for Frontend**:
```bash
nano /etc/nginx/sites-available/juicy.gentime.in
```

Add this configuration:
```nginx
server {
    listen 80;
    server_name juicy.gentime.in;

    root /var/www/juicy;
    index index.html;

    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

10. **Configure Nginx for Backend**:
```bash
nano /etc/nginx/sites-available/juicyapi.gentime.in
```

Add this configuration:
```nginx
server {
    listen 80;
    server_name juicyapi.gentime.in;

    client_max_body_size 20M;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

11. **Enable Sites and Test Nginx**:
```bash
ln -sf /etc/nginx/sites-available/juicy.gentime.in /etc/nginx/sites-enabled/
ln -sf /etc/nginx/sites-available/juicyapi.gentime.in /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

12. **Setup SSL Certificates**:
```bash
certbot --nginx -d juicy.gentime.in --non-interactive --agree-tos --email your@email.com --redirect
certbot --nginx -d juicyapi.gentime.in --non-interactive --agree-tos --email your@email.com --redirect
```

13. **Seed Database**:
```bash
cd /root/juicy/backend
npm run seed
npm run seed-tables
```

14. **Start Backend with PM2**:
```bash
cd /root/juicy/backend
pm2 start server.js --name juicy-backend
pm2 save
pm2 startup
```

15. **Verify Deployment**:
```bash
pm2 list
curl https://juicyapi.gentime.in/api/health
```

---

## Redeployment After Code Changes

### Quick Redeployment Script

When you make code changes and need to redeploy:

#### From Your Local Machine:

1. **Create new archive**:
```bash
cd "e:\colddrink application final\colddrink1.2"
tar -czf juicy-update.tar.gz --exclude=node_modules --exclude=.git --exclude=*.log --exclude=backend.pid --exclude=mongod --exclude=*.bat --exclude=*.vbs --exclude=*.ico --exclude=*.jpeg backend frontend package.json
```

2. **Upload to VPS**:
```bash
scp juicy-update.tar.gz root@72.61.238.39:/root/
```

#### On VPS Server:

3. **Backup current version** (optional but recommended):
```bash
ssh root@72.61.238.39
cd /root
tar -czf juicy-backup-$(date +%Y%m%d-%H%M%S).tar.gz juicy/
```

4. **Deploy updates**:
```bash
cd /root/juicy
tar -xzf /root/juicy-update.tar.gz
rm /root/juicy-update.tar.gz
```

5. **Update Backend**:
```bash
cd /root/juicy/backend
npm install  # Only if package.json changed
pm2 restart juicy-backend
pm2 logs juicy-backend --lines 50
```

6. **Update Frontend**:
```bash
cd /root/juicy/frontend
npm install  # Only if package.json changed
npm run build
cp -r dist/* /var/www/juicy/
```

7. **Clear browser cache or do hard refresh** (Ctrl+Shift+R)

### One-Command Redeployment Script

Create this script on your VPS for easy redeployment:

```bash
nano /root/redeploy-juicy.sh
```

Add this content:
```bash
#!/bin/bash

echo "🚀 Starting Juicy redeployment..."

# Backup
echo "📦 Creating backup..."
cd /root
tar -czf juicy-backup-$(date +%Y%m%d-%H%M%S).tar.gz juicy/

# Extract new code
echo "📥 Extracting new code..."
cd /root/juicy
tar -xzf /root/juicy-update.tar.gz

# Backend update
echo "🔧 Updating backend..."
cd /root/juicy/backend
npm install
pm2 restart juicy-backend

# Frontend update
echo "🎨 Building and deploying frontend..."
cd /root/juicy/frontend
npm install
npm run build
cp -r dist/* /var/www/juicy/

echo "✅ Deployment complete!"
echo "📊 Checking status..."
pm2 list
pm2 logs juicy-backend --lines 20 --nostream
```

Make it executable:
```bash
chmod +x /root/redeploy-juicy.sh
```

Usage:
```bash
# Upload new code from local
scp juicy-update.tar.gz root@72.61.238.39:/root/

# SSH to server and run script
ssh root@72.61.238.39
/root/redeploy-juicy.sh
```

---

## MongoDB Management

### Connect to MongoDB Shell

```bash
ssh root@72.61.238.39
mongosh
```

Or directly to your database:
```bash
mongosh juicy_billing
```

### View All Databases
```javascript
show dbs
```

### Switch to Juicy Database
```javascript
use juicy_billing
```

### View All Collections
```javascript
show collections
```

Output will show:
- users
- orders
- bills
- tables
- maincodes
- subcodes
- purchases
- suppliers
- businesssettings
- stockledgers

### View Data (Read Operations)

#### See all users:
```javascript
db.users.find().pretty()
```

#### Count users:
```javascript
db.users.countDocuments()
```

#### Find specific user:
```javascript
db.users.findOne({ username: "admin" })
```

#### See all orders:
```javascript
db.orders.find().pretty()
```

#### See orders with filters:
```javascript
// Recent orders
db.orders.find().sort({ createdAt: -1 }).limit(10).pretty()

// Orders by table
db.orders.find({ tableId: "table-001" }).pretty()

// Orders with specific status
db.orders.find({ status: "completed" }).pretty()
```

#### See all bills:
```javascript
db.bills.find().sort({ createdAt: -1 }).limit(10).pretty()
```

#### See inventory/stock:
```javascript
db.subcodes.find({ stock: { $lt: 10 } }).pretty()  // Low stock items
db.subcodes.find().sort({ stock: -1 }).pretty()     // All items sorted by stock
```

#### See tables:
```javascript
db.tables.find().pretty()
```

### Update Data

#### Update user password (need to hash with bcrypt):
```javascript
// First, get bcrypt hash for new password
// You'll need to use backend to properly hash
// Or update other user fields:
db.users.updateOne(
  { username: "admin" },
  { $set: { email: "newemail@example.com" } }
)
```

#### Update business settings:
```javascript
db.businesssettings.updateOne(
  {},
  { $set: {
    shopName: "New Shop Name",
    shopMobile: "+91 9999999999"
  }}
)
```

#### Update product stock:
```javascript
db.subcodes.updateOne(
  { subCode: "COKE500" },
  { $set: { stock: 100, price: 50 } }
)
```

#### Update table status:
```javascript
db.tables.updateOne(
  { tableNumber: "T-01" },
  { $set: { status: "available" } }
)
```

#### Update multiple documents:
```javascript
// Set all tables to available
db.tables.updateMany(
  {},
  { $set: { status: "available" } }
)
```

### Delete Data

#### Delete specific user:
```javascript
db.users.deleteOne({ username: "cashier" })
```

#### Delete all orders:
```javascript
db.orders.deleteMany({})
```

#### Delete orders older than a date:
```javascript
db.orders.deleteMany({
  createdAt: { $lt: new Date("2025-01-01") }
})
```

#### Delete specific bill:
```javascript
db.bills.deleteOne({ billNo: "BILL-001" })
```

#### Delete low stock items:
```javascript
db.subcodes.deleteMany({ stock: 0 })
```

#### Clear entire collection:
```javascript
db.orders.deleteMany({})
db.bills.deleteMany({})
```

#### Drop entire collection:
```javascript
db.orders.drop()
```

### Advanced Queries

#### Aggregation - Total sales:
```javascript
db.bills.aggregate([
  {
    $group: {
      _id: null,
      totalSales: { $sum: "$grandTotal" },
      totalBills: { $sum: 1 }
    }
  }
])
```

#### Sales by date:
```javascript
db.bills.aggregate([
  {
    $group: {
      _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
      totalSales: { $sum: "$grandTotal" },
      billCount: { $sum: 1 }
    }
  },
  { $sort: { _id: -1 } }
])
```

#### Top selling items:
```javascript
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

### Backup and Restore

#### Backup entire database:
```bash
mongodump --db juicy_billing --out /root/mongo-backups/
```

#### Backup with timestamp:
```bash
mongodump --db juicy_billing --out /root/mongo-backups/backup-$(date +%Y%m%d-%H%M%S)/
```

#### Restore database:
```bash
mongorestore --db juicy_billing /root/mongo-backups/backup-20251210/juicy_billing/
```

#### Export collection to JSON:
```bash
mongoexport --db juicy_billing --collection bills --out /root/bills.json
```

#### Import collection from JSON:
```bash
mongoimport --db juicy_billing --collection bills --file /root/bills.json
```

### MongoDB GUI Access (Optional)

#### Install MongoDB Compass on your local machine:
1. Download from: https://www.mongodb.com/products/compass
2. Create SSH tunnel:
```bash
ssh -L 27017:localhost:27017 root@72.61.238.39 -N
```
3. Connect to: `mongodb://localhost:27017/juicy_billing`

---

## Server Management

### PM2 Commands

#### View all processes:
```bash
pm2 list
```

#### View logs:
```bash
pm2 logs juicy-backend
pm2 logs juicy-backend --lines 100
pm2 logs juicy-backend --lines 50 --nostream
```

#### Restart application:
```bash
pm2 restart juicy-backend
```

#### Stop application:
```bash
pm2 stop juicy-backend
```

#### Start application:
```bash
pm2 start juicy-backend
```

#### Delete from PM2:
```bash
pm2 delete juicy-backend
```

#### Monitor resources:
```bash
pm2 monit
```

#### Application info:
```bash
pm2 info juicy-backend
```

#### Save PM2 configuration:
```bash
pm2 save
```

#### Setup PM2 startup:
```bash
pm2 startup
```

### Nginx Commands

#### Test configuration:
```bash
nginx -t
```

#### Reload Nginx:
```bash
systemctl reload nginx
```

#### Restart Nginx:
```bash
systemctl restart nginx
```

#### Check Nginx status:
```bash
systemctl status nginx
```

#### View Nginx error logs:
```bash
tail -f /var/log/nginx/error.log
```

#### View Nginx access logs:
```bash
tail -f /var/log/nginx/access.log
```

### MongoDB Commands

#### Check MongoDB status:
```bash
systemctl status mongod
```

#### Start MongoDB:
```bash
systemctl start mongod
```

#### Stop MongoDB:
```bash
systemctl stop mongod
```

#### Restart MongoDB:
```bash
systemctl restart mongod
```

#### View MongoDB logs:
```bash
tail -f /var/log/mongodb/mongod.log
```

### SSL Certificate Management

#### Renew certificates manually:
```bash
certbot renew
```

#### Test renewal:
```bash
certbot renew --dry-run
```

#### List certificates:
```bash
certbot certificates
```

#### Check auto-renewal timer:
```bash
systemctl status certbot.timer
```

---

## Troubleshooting

### Backend not starting

1. **Check PM2 logs**:
```bash
pm2 logs juicy-backend --lines 100
```

2. **Check if port is already in use**:
```bash
lsof -i :5000
netstat -tlnp | grep 5000
```

3. **Kill process on port**:
```bash
kill -9 $(lsof -t -i:5000)
pm2 restart juicy-backend
```

4. **Check environment variables**:
```bash
cd /root/juicy/backend
cat .env
```

### Frontend not loading

1. **Check Nginx error logs**:
```bash
tail -f /var/log/nginx/error.log
```

2. **Verify files exist**:
```bash
ls -la /var/www/juicy/
```

3. **Check Nginx configuration**:
```bash
nginx -t
cat /etc/nginx/sites-available/juicy.gentime.in
```

4. **Rebuild and redeploy**:
```bash
cd /root/juicy/frontend
npm run build
cp -r dist/* /var/www/juicy/
```

### MongoDB connection issues

1. **Check MongoDB status**:
```bash
systemctl status mongod
```

2. **Check MongoDB is listening**:
```bash
netstat -tlnp | grep 27017
```

3. **Try connecting**:
```bash
mongosh
```

4. **Check MongoDB logs**:
```bash
tail -f /var/log/mongodb/mongod.log
```

### API not responding

1. **Test backend directly**:
```bash
curl http://localhost:5000/api/health
curl https://juicyapi.gentime.in/api/health
```

2. **Check Nginx proxy**:
```bash
cat /etc/nginx/sites-available/juicyapi.gentime.in
```

3. **Restart everything**:
```bash
pm2 restart juicy-backend
systemctl reload nginx
```

### SSL certificate issues

1. **Check certificate expiry**:
```bash
certbot certificates
```

2. **Renew certificate**:
```bash
certbot renew --force-renewal
```

3. **Test SSL**:
```bash
curl -I https://juicy.gentime.in
curl -I https://juicyapi.gentime.in
```

### High memory usage

1. **Check PM2 status**:
```bash
pm2 list
pm2 monit
```

2. **Restart application**:
```bash
pm2 restart juicy-backend
```

3. **Check for memory leaks in logs**:
```bash
pm2 logs juicy-backend --lines 200
```

### Application crashed

1. **Check if PM2 auto-restarted**:
```bash
pm2 list
```

2. **View crash logs**:
```bash
pm2 logs juicy-backend --err --lines 100
```

3. **Manually restart**:
```bash
pm2 restart juicy-backend
```

---

## Quick Reference Commands

### Daily Operations

```bash
# SSH to server
ssh root@72.61.238.39

# Check application status
pm2 list

# View logs
pm2 logs juicy-backend

# Restart application
pm2 restart juicy-backend

# Check database
mongosh juicy_billing

# View recent bills
mongosh juicy_billing --eval "db.bills.find().sort({createdAt: -1}).limit(5).pretty()"
```

### Deployment URLs

- Frontend: https://juicy.gentime.in
- Backend API: https://juicyapi.gentime.in
- Health Check: https://juicyapi.gentime.in/api/health

### Default Credentials

- Admin: `admin` / `admin123`
- Cashier: `cashier` / `cashier123`

---

## Support

For issues or questions:
1. Check logs first: `pm2 logs juicy-backend`
2. Review Nginx logs: `tail -f /var/log/nginx/error.log`
3. Check MongoDB: `systemctl status mongod`
4. Verify all services are running: `pm2 list && systemctl status nginx && systemctl status mongod`
