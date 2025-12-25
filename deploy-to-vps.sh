#!/bin/bash

# Juicy Billing System - VPS Deployment Script
# Server: 72.61.238.39
# Frontend: juicy.gentime.in
# Backend: juicyapi.gentime.in

set -e

echo "========================================="
echo "Juicy Billing System - VPS Deployment"
echo "========================================="

# Configuration
FRONTEND_DOMAIN="juicy.gentime.in"
BACKEND_DOMAIN="juicyapi.gentime.in"
PROJECT_DIR="/var/www/juicy"
BACKEND_PORT=5000
FRONTEND_PORT=3000

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}[1/10] Checking system and installing dependencies...${NC}"
# Update system
apt update
apt install -y nginx nodejs npm mongodb git curl

# Install PM2 for process management
npm install -g pm2

# Install n (Node version manager) to get latest Node.js
npm install -g n
n latest

echo -e "${GREEN}✓ System updated and dependencies installed${NC}"

echo -e "${YELLOW}[2/10] Creating project directory...${NC}"
mkdir -p $PROJECT_DIR
cd $PROJECT_DIR

echo -e "${GREEN}✓ Project directory created${NC}"

echo -e "${YELLOW}[3/10] Setting up MongoDB...${NC}"
# Start MongoDB service
systemctl start mongodb
systemctl enable mongodb

# Create database user (if needed)
mongo juicy_billing --eval 'db.createUser({user: "juicy_user", pwd: "juicy_pass_2024", roles: [{role: "readWrite", db: "juicy_billing"}]})'

echo -e "${GREEN}✓ MongoDB configured${NC}"

echo -e "${YELLOW}[4/10] Installing backend dependencies...${NC}"
cd $PROJECT_DIR/backend
npm install

echo -e "${GREEN}✓ Backend dependencies installed${NC}"

echo -e "${YELLOW}[5/10] Configuring backend environment...${NC}"
cat > $PROJECT_DIR/backend/.env << EOF
NODE_ENV=production
PORT=$BACKEND_PORT

# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/juicy_billing

# JWT Secret Keys
JWT_SECRET=148ee728b773382d58305bd9910c735059657e32189ddaa0ead67368cf17bb6c230978d82bf644b10999acff2dff748d9ffcdbc0d79f068245dce4b9570189da
JWT_EXPIRE=30d

# Business Settings
SHOP_NAME=Juicy
SHOP_ADDRESS=123 Main Street, City
SHOP_MOBILE=+91 9876543210
SHOP_EMAIL=shop@colddrink.com

# Thermal Printer Settings
PRINTER_NAME=ThermalPrinter
PRINTER_WIDTH=48
EOF

echo -e "${GREEN}✓ Backend environment configured${NC}"

echo -e "${YELLOW}[6/10] Seeding database with initial data...${NC}"
cd $PROJECT_DIR/backend
npm run seed

echo -e "${GREEN}✓ Database seeded${NC}"

echo -e "${YELLOW}[7/10] Building frontend...${NC}"
cd $PROJECT_DIR/frontend

# Update API URL in frontend
cat > $PROJECT_DIR/frontend/src/services/api.js << 'EOF'
import axios from 'axios';

const API_URL = 'https://juicyapi.gentime.in/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
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
EOF

npm install
npm run build

echo -e "${GREEN}✓ Frontend built${NC}"

echo -e "${YELLOW}[8/10] Configuring Nginx...${NC}"

# Backend Nginx configuration
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

# Frontend Nginx configuration
cat > /etc/nginx/sites-available/juicy.gentime.in << EOF
server {
    listen 80;
    server_name juicy.gentime.in;

    root $PROJECT_DIR/frontend/dist;
    index index.html;

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:$BACKEND_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}
EOF

# Enable sites
ln -sf /etc/nginx/sites-available/juicyapi.gentime.in /etc/nginx/sites-enabled/
ln -sf /etc/nginx/sites-available/juicy.gentime.in /etc/nginx/sites-enabled/

# Test and reload Nginx
nginx -t
systemctl reload nginx

echo -e "${GREEN}✓ Nginx configured${NC}"

echo -e "${YELLOW}[9/10] Starting backend with PM2...${NC}"
cd $PROJECT_DIR/backend
pm2 delete juicy-backend 2>/dev/null || true
pm2 start server.js --name juicy-backend
pm2 save
pm2 startup

echo -e "${GREEN}✓ Backend started with PM2${NC}"

echo -e "${YELLOW}[10/10] Setting up SSL with Certbot (optional)...${NC}"
echo "To enable HTTPS, run these commands manually:"
echo "  apt install certbot python3-certbot-nginx"
echo "  certbot --nginx -d juicy.gentime.in -d juicyapi.gentime.in"

echo ""
echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}Deployment completed successfully!${NC}"
echo -e "${GREEN}=========================================${NC}"
echo ""
echo "Frontend URL: http://juicy.gentime.in"
echo "Backend URL: http://juicyapi.gentime.in"
echo ""
echo "Default Login Credentials:"
echo "  Admin: admin / admin123"
echo "  Cashier: cashier / cashier123"
echo ""
echo "PM2 Commands:"
echo "  pm2 status          - View running processes"
echo "  pm2 logs juicy-backend - View backend logs"
echo "  pm2 restart juicy-backend - Restart backend"
echo ""
