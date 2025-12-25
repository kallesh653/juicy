# Juicy Billing System - VPS Deployment Guide

## Server Details
- **IP**: 72.61.238.39
- **User**: root
- **Frontend Domain**: juicy.gentime.in
- **Backend Domain**: juicyapi.gentime.in

## Quick Deployment Steps

### Option 1: Automated Deployment (Recommended)

1. **On your local machine**, run these commands:

```bash
# Install sshpass (if not installed)
# For Windows (Git Bash): Download from https://sourceforge.net/projects/sshpass/
# For Linux: sudo apt-get install sshpass
# For Mac: brew install hudson/generic/sshpass

# Create a tar archive of the project
cd "e:\colddrink application final\colddrink1.2"
tar -czf juicy-project.tar.gz backend frontend package.json .gitignore

# Upload to VPS
sshpass -p 'Kallesh717653@' scp -o StrictHostKeyChecking=no juicy-project.tar.gz root@72.61.238.39:/tmp/

# Connect and deploy
sshpass -p 'Kallesh717653@' ssh -o StrictHostKeyChecking=no root@72.61.238.39 'bash -s' < deploy-to-vps.sh
```

### Option 2: Manual Deployment

#### Step 1: Connect to VPS
```bash
ssh root@72.61.238.39
# Password: Kallesh717653@
```

#### Step 2: Check existing setup
```bash
# Check current projects
ls -la /var/www/

# Check MongoDB status
systemctl status mongodb
mongo --eval "show dbs"

# Check Nginx
nginx -t
ls -la /etc/nginx/sites-enabled/
```

#### Step 3: Create project directory
```bash
mkdir -p /var/www/juicy
cd /var/www/juicy
```

#### Step 4: Upload project files
On your **local machine** (new terminal):
```bash
cd "e:\colddrink application final\colddrink1.2"

# Upload backend
scp -r backend root@72.61.238.39:/var/www/juicy/

# Upload frontend
scp -r frontend root@72.61.238.39:/var/www/juicy/

# Upload package.json
scp package.json root@72.61.238.39:/var/www/juicy/
```

#### Step 5: Back on VPS - Install dependencies
```bash
cd /var/www/juicy

# Install Node.js if not installed
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# Install PM2
npm install -g pm2

# Install backend dependencies
cd backend
npm install

# Configure backend environment
cat > .env << 'EOF'
NODE_ENV=production
PORT=5000

# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/juicy_billing

# JWT Secret
JWT_SECRET=148ee728b773382d58305bd9910c735059657e32189ddaa0ead67368cf17bb6c230978d82bf644b10999acff2dff748d9ffcdbc0d79f068245dce4b9570189da
JWT_EXPIRE=30d

# Business Settings
SHOP_NAME=Juicy
SHOP_ADDRESS=123 Main Street, City
SHOP_MOBILE=+91 9876543210
SHOP_EMAIL=shop@colddrink.com
EOF

# Seed database
npm run seed
```

#### Step 6: Configure Frontend
```bash
cd /var/www/juicy/frontend

# Update API URL
cat > src/services/api.js << 'APIEOF'
import axios from 'axios';

const API_URL = 'https://juicyapi.gentime.in/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
APIEOF

# Install and build
npm install
npm run build
```

#### Step 7: Configure Nginx for Backend
```bash
cat > /etc/nginx/sites-available/juicyapi.gentime.in << 'EOF'
server {
    listen 80;
    server_name juicyapi.gentime.in;

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
    }
}
EOF

ln -sf /etc/nginx/sites-available/juicyapi.gentime.in /etc/nginx/sites-enabled/
```

#### Step 8: Configure Nginx for Frontend
```bash
cat > /etc/nginx/sites-available/juicy.gentime.in << 'EOF'
server {
    listen 80;
    server_name juicy.gentime.in;

    root /var/www/juicy/frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}
EOF

ln -sf /etc/nginx/sites-available/juicy.gentime.in /etc/nginx/sites-enabled/
```

#### Step 9: Test and restart Nginx
```bash
nginx -t
systemctl restart nginx
```

#### Step 10: Start backend with PM2
```bash
cd /var/www/juicy/backend
pm2 delete juicy-backend 2>/dev/null || true
pm2 start server.js --name juicy-backend
pm2 save
pm2 startup
```

#### Step 11: Enable HTTPS (Optional but recommended)
```bash
apt install certbot python3-certbot-nginx -y
certbot --nginx -d juicy.gentime.in -d juicyapi.gentime.in
```

## Verification

1. **Check Backend**:
   ```bash
   curl http://juicyapi.gentime.in/api/health
   ```

2. **Check Frontend**:
   ```bash
   curl http://juicy.gentime.in
   ```

3. **Check PM2 Status**:
   ```bash
   pm2 status
   pm2 logs juicy-backend
   ```

## Access URLs

- Frontend: http://juicy.gentime.in
- Backend API: http://juicyapi.gentime.in

## Default Login

- **Admin**: admin / admin123
- **Cashier**: cashier / cashier123

## Useful Commands

```bash
# View logs
pm2 logs juicy-backend

# Restart backend
pm2 restart juicy-backend

# Check MongoDB
mongo juicy_billing --eval "db.users.find()"

# Check Nginx
systemctl status nginx
nginx -t

# View Nginx logs
tail -f /var/log/nginx/error.log
tail -f /var/log/nginx/access.log
```

## Troubleshooting

### Backend not starting
```bash
cd /var/www/juicy/backend
pm2 logs juicy-backend
npm start  # Test manually
```

### Frontend not loading
```bash
ls -la /var/www/juicy/frontend/dist
nginx -t
systemctl status nginx
```

### MongoDB connection issues
```bash
systemctl status mongodb
mongo --eval "db.version()"
```
