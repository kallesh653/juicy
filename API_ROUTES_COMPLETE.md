# 📡 Complete API Routes & Endpoints Documentation

## ✅ Server Configuration

### Backend Server
- **Port:** 5000
- **URL:** http://localhost:5000
- **API Base:** http://localhost:5000/api

### Frontend Server
- **Port:** 3000
- **URL:** http://localhost:3000
- **Proxy:** All `/api/*` requests → `http://localhost:5000/api/*`

---

## 🔌 All API Endpoints

### 1. **Authentication** (`/api/auth`)
```
POST   /api/auth/register          Register new user (Admin only)
POST   /api/auth/login             Login user
GET    /api/auth/profile           Get user profile
PUT    /api/auth/profile           Update user profile
GET    /api/auth/users             Get all users (Admin only)
```

### 2. **Main Codes** (Categories) (`/api/maincodes`)
```
GET    /api/maincodes              Get all main codes
GET    /api/maincodes/:id          Get single main code
POST   /api/maincodes              Create main code
PUT    /api/maincodes/:id          Update main code
DELETE /api/maincodes/:id          Delete main code (Admin only)
```

### 3. **Sub Codes** (Items) (`/api/subcodes`)
```
GET    /api/subcodes               Get all sub codes
GET    /api/subcodes/:id           Get single sub code
POST   /api/subcodes               Create sub code
PUT    /api/subcodes/:id           Update sub code
DELETE /api/subcodes/:id           Delete sub code (Admin only)
GET    /api/subcodes/alerts/low-stock  Get low stock items
```

### 4. **Tables** (`/api/tables`)
```
GET    /api/tables                 Get all tables
GET    /api/tables/:id             Get single table
POST   /api/tables                 Create table
PUT    /api/tables/:id             Update table
DELETE /api/tables/:id             Delete table (Admin only)
PUT    /api/tables/:id/status      Update table status
GET    /api/tables/stats/summary   Get table statistics
```

### 5. **Orders** (`/api/orders`) ⭐ **MAIN FEATURE**
```
GET    /api/orders                 Get all orders
GET    /api/orders/:id             Get single order
POST   /api/orders                 ⭐ Create new order (locks table)
PUT    /api/orders/:id             Update order
PUT    /api/orders/:id/status      Update order status
POST   /api/orders/:id/convert-to-bill  ⭐ Convert to bill (unlocks table)
PUT    /api/orders/:id/cancel      Cancel order (unlocks table, restores stock)
DELETE /api/orders/:id             Delete order (Admin only)
GET    /api/orders/stats/summary   Get order statistics
```

### 6. **Bills** (`/api/bills`)
```
GET    /api/bills                  Get all bills
GET    /api/bills/:id              Get single bill
POST   /api/bills                  Create bill (for parcel orders)
PUT    /api/bills/:id              Update bill
DELETE /api/bills/:id              Delete bill (Admin only)
GET    /api/bills/summary/today    Get today's summary
```

### 7. **Purchases** (`/api/purchases`)
```
GET    /api/purchases              Get all purchases
GET    /api/purchases/:id          Get single purchase
POST   /api/purchases              Create purchase
PUT    /api/purchases/:id          Update purchase
DELETE /api/purchases/:id          Delete purchase (Admin only)
```

### 8. **Suppliers** (`/api/suppliers`)
```
GET    /api/suppliers              Get all suppliers
GET    /api/suppliers/:id          Get single supplier
POST   /api/suppliers              Create supplier
PUT    /api/suppliers/:id          Update supplier
DELETE /api/suppliers/:id          Delete supplier (Admin only)
```

### 9. **Reports** (`/api/reports`)
```
GET    /api/reports/stock          Get stock report
GET    /api/reports/stock-ledger   Get stock ledger
GET    /api/reports/itemwise-sales Get itemwise sales
GET    /api/reports/userwise-sales Get userwise sales
GET    /api/reports/daily-collection Get daily collection
GET    /api/reports/purchase-summary Get purchase summary
GET    /api/reports/profit         Get profit report
```

### 10. **Settings** (`/api/settings`)
```
GET    /api/settings               Get business settings
PUT    /api/settings               Update business settings
```

### 11. **Health Check**
```
GET    /api/health                 Check if API is running
```

---

## 🎯 Table Order Flow - Complete API Sequence

### **Flow 1: Create Order & Lock Table**

```javascript
// Step 1: Get table details
GET /api/tables/69248fc55e35ea077784a9c6

// Step 2: Get categories
GET /api/maincodes?isActive=true

// Step 3: Get items
GET /api/subcodes?isActive=true

// Step 4: Create order
POST /api/orders
{
  "orderType": "Dine-In",
  "tableId": "69248fc55e35ea077784a9c6",
  "customerName": "Walk-in Customer",
  "customerMobile": "",
  "guestCount": 1,
  "items": [
    {
      "subCode": "692497c1d8e15600fb2dadc6",
      "itemName": "Coca Cola",
      "quantity": 2,
      "unit": "Piece",
      "price": 50,
      "itemTotal": 100
    }
  ],
  "subtotal": 100,
  "discountPercent": 0,
  "discountAmount": 0,
  "gstAmount": 0,
  "totalAmount": 100,
  "roundOff": 0,
  "grandTotal": 100,
  "remarks": "",
  "specialInstructions": ""
}

// Backend Response:
{
  "success": true,
  "message": "Order created successfully",
  "order": {
    "_id": "692498a1d8e15600fb2dadcc",
    "orderNo": "ORD00001",
    "orderType": "Dine-In",
    "table": {
      "_id": "69248fc55e35ea077784a9c6",
      "tableNumber": "T1",
      "tableName": "Table 1"
    },
    "items": [...],
    "grandTotal": 100,
    "orderStatus": "Active",
    ...
  }
}

// Step 5: Table is now locked
// Backend automatically updated:
// - table.status = "Occupied"
// - table.currentOrder = order._id
```

---

### **Flow 2: View Order & Convert to Bill**

```javascript
// Step 1: Get all tables (to see red tables)
GET /api/tables

// Response includes:
{
  "tables": [
    {
      "_id": "69248fc55e35ea077784a9c6",
      "tableNumber": "T1",
      "tableName": "Table 1",
      "status": "Occupied",  // ← RED
      "currentOrder": {
        "_id": "692498a1d8e15600fb2dadcc",
        "orderNo": "ORD00001",
        "grandTotal": 100
      }
    }
  ]
}

// Step 2: Click red table → Get order details
GET /api/orders/692498a1d8e15600fb2dadcc

// Response:
{
  "success": true,
  "order": {
    "_id": "692498a1d8e15600fb2dadcc",
    "orderNo": "ORD00001",
    "table": {...},
    "items": [...],
    "grandTotal": 100,
    "orderStatus": "Active",
    "startTime": "2025-11-25T12:00:00.000Z"
  }
}

// Step 3: Convert to bill
POST /api/orders/692498a1d8e15600fb2dadcc/convert-to-bill
{
  "paymentMode": "Cash",
  "paymentDetails": ""
}

// Backend Response:
{
  "success": true,
  "message": "Order converted to bill successfully",
  "order": {
    "orderStatus": "Completed",
    "isPaid": true,
    "billId": "692499a1d8e15600fb2dadcd"
  },
  "bill": {
    "_id": "692499a1d8e15600fb2dadcd",
    "billNo": "BILL00001",
    "grandTotal": 100,
    ...
  }
}

// Backend automatically updated:
// - order.orderStatus = "Completed"
// - order.billId = bill._id
// - table.status = "Available"  ← GREEN AGAIN
// - table.currentOrder = null
// - Created new Bill document
```

---

## 🧪 Testing API Endpoints

### **Method 1: Using Browser Console**

```javascript
// Test order creation
const testOrder = async () => {
  const orderData = {
    orderType: 'Dine-In',
    tableId: '69248fc55e35ea077784a9c6', // Replace with actual table ID
    customerName: 'Test Customer',
    guestCount: 1,
    items: [{
      subCode: '692497c1d8e15600fb2dadc6', // Replace with actual item ID
      itemName: 'Test Item',
      quantity: 1,
      unit: 'Piece',
      price: 50,
      itemTotal: 50
    }],
    subtotal: 50,
    discountPercent: 0,
    discountAmount: 0,
    gstAmount: 0,
    totalAmount: 50,
    roundOff: 0,
    grandTotal: 50,
    remarks: '',
    specialInstructions: ''
  };

  try {
    const response = await fetch('http://localhost:3000/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sessionStorage.getItem('token')}`
      },
      body: JSON.stringify(orderData)
    });

    const data = await response.json();
    console.log('Response:', data);
  } catch (error) {
    console.error('Error:', error);
  }
};

// Run test
testOrder();
```

---

### **Method 2: Using Postman/Thunder Client**

**1. Login First:**
```
POST http://localhost:5000/api/auth/login
Body (JSON):
{
  "username": "admin",
  "password": "admin123"
}

Response:
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {...}
}

Copy the token!
```

**2. Test Create Order:**
```
POST http://localhost:5000/api/orders
Headers:
  Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
  Content-Type: application/json

Body (JSON):
{
  "orderType": "Dine-In",
  "tableId": "69248fc55e35ea077784a9c6",
  "customerName": "Test",
  "guestCount": 1,
  "items": [{
    "subCode": "692497c1d8e15600fb2dadc6",
    "itemName": "Test Item",
    "quantity": 1,
    "unit": "Piece",
    "price": 50,
    "itemTotal": 50
  }],
  "subtotal": 50,
  "discountPercent": 0,
  "discountAmount": 0,
  "gstAmount": 0,
  "totalAmount": 50,
  "roundOff": 0,
  "grandTotal": 50,
  "remarks": "",
  "specialInstructions": ""
}
```

**Expected Response: 201 Created**
```json
{
  "success": true,
  "message": "Order created successfully",
  "order": {...}
}
```

---

## 🔍 Debugging API Issues

### Check 1: Backend Running?
```bash
# Terminal should show:
POST /api/orders [32m201[0m XXX.XXX ms - XXX
```
- Green `201` = Success
- Red `400/500` = Error

### Check 2: Frontend Proxy Working?
Open browser console and check Network tab:
```
Request URL: http://localhost:3000/api/orders
Status: 201 Created
```

If shows `http://localhost:5000/api/orders` → Proxy NOT working, but direct call IS working

### Check 3: CORS Errors?
Backend terminal should show:
```javascript
app.use(cors());  // Line 20 in server.js
```
If CORS error in browser, backend not allowing requests.

### Check 4: Authentication?
Check token in request headers:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
If missing, login again.

### Check 5: Route Exists?
Backend terminal should NOT show:
```
Route not found
```

If it does, check server.js line 48:
```javascript
app.use('/api/orders', require('./routes/orderRoutes'));
```

---

## ✅ Verification Checklist

### Backend Checklist:
- [✓] MongoDB connected
- [✓] Server running on port 5000
- [✓] All routes registered in server.js
- [✓] CORS enabled
- [✓] Authentication middleware working
- [✓] Order routes exist: /api/orders
- [✓] Order controller has createOrder function
- [✓] Order model has orderType field
- [✓] Table model has currentOrder field

### Frontend Checklist:
- [✓] Vite server running on port 3000
- [✓] Proxy configured in vite.config.js
- [✓] API service using correct base URL
- [✓] Token stored in sessionStorage
- [✓] Authorization header added to requests
- [✓] TakeTableOrder component exists
- [✓] OrderView component exists
- [✓] Routes defined in App.jsx

### Data Flow Checklist:
- [✓] Tables → Click table → TakeTableOrder
- [✓] Add items → Cart updates
- [✓] Generate order → POST /api/orders
- [✓] Order created → Table locked
- [✓] Tables → Click red table → OrderView
- [✓] Convert to bill → POST /api/orders/:id/convert-to-bill
- [✓] Bill created → Table unlocked

---

## 🚀 Quick Start Commands

### Terminal 1: Backend
```bash
cd c:\Users\LEN0VO\Desktop\colddrink1.2\backend
npm start
```

### Terminal 2: Frontend
```bash
cd c:\Users\LEN0VO\Desktop\colddrink1.2\frontend
npm run dev
```

### Browser
```
http://localhost:3000
Login: admin / admin123
Click Tables → Click green table → Add items → Generate order
```

---

## 📊 Expected Backend Logs (Successful Order Creation)

```
POST /api/auth/login [32m200[0m 248.724 ms - 482
GET /api/tables [32m200[0m 16.714 ms - 3991
GET /api/tables/stats/summary [32m200[0m 22.895 ms - 137
GET /api/tables/69248fc55e35ea077784a9c6 [32m200[0m 15.349 ms - 341
GET /api/maincodes?isActive=true [32m200[0m 21.321 ms - 296
GET /api/subcodes?isActive=true [32m200[0m 23.195 ms - 453
POST /api/orders [32m201[0m 125.775 ms - 864  ← ⭐ SUCCESS!
GET /api/tables [32m200[0m 17.719 ms - 1939
GET /api/tables/stats/summary [32m200[0m 62.737 ms - 135
```

All green `[32m200[0m` or `[32m201[0m` = Everything working! 🎉

---

**API Routes are properly configured and working!** ✅
