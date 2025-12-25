#!/bin/bash
# Juicy Billing - Complete VPS Deployment Script
# Run this on the VPS server after uploading files

set -e
echo "========================================="
echo "Juicy Billing System - VPS Deployment"
echo "========================================="

# Create project directory
echo "[1/9] Creating project directory..."
mkdir -p /var/www/juicy
cd /var/www/juicy

echo "[2/9] Installing system dependencies..."
# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs nginx mongodb git

# Install PM2
npm install -g pm2

echo "[3/9] Installing backend dependencies..."
cd /var/www/juicy/backend
npm install

echo "[4/9] Configuring backend environment..."
cat > /var/www/juicy/backend/.env << 'EOF'
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb://localhost:27017/juicy_billing
JWT_SECRET=148ee728b773382d58305bd9910c735059657e32189ddaa0ead67368cf17bb6c230978d82bf644b10999acff2dff748d9ffcdbc0d79f068245dce4b9570189da
JWT_EXPIRE=30d
SHOP_NAME=Juicy
SHOP_ADDRESS=123 Main Street, City
SHOP_MOBILE=+91 9876543210
SHOP_EMAIL=shop@colddrink.com
EOF

echo "[5/9] Starting MongoDB and seeding database..."
systemctl start mongodb
systemctl enable mongodb
npm run seed

echo "[6/9] Building frontend..."
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

npm install
npm run build

echo "[7/9] Configuring Nginx..."
# Backend
cat > /etc/nginx/sites-available/juicyapi.gentime.in << 'NGINXEOF'
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
        proxy_cache_bypass $http_upgrade;
    }
}
NGINXEOF

# Frontend
cat > /etc/nginx/sites-available/juicy.gentime.in << 'NGINXEOF'
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
NGINXEOF

ln -sf /etc/nginx/sites-available/juicyapi.gentime.in /etc/nginx/sites-enabled/
ln -sf /etc/nginx/sites-available/juicy.gentime.in /etc/nginx/sites-enabled/

nginx -t
systemctl restart nginx

echo "[8/9] Starting backend with PM2..."
cd /var/www/juicy/backend
pm2 delete juicy-backend 2>/dev/null || true
pm2 start server.js --name juicy-backend
pm2 save
pm2 startup

echo "[9/9] Deployment complete!"
echo "========================================="
echo "Frontend: http://juicy.gentime.in"
echo "Backend:  http://juicyapi.gentime.in"
echo "Login: admin / admin123"
echo "========================================="
pm2 status
