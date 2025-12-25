# MongoDB Quick Reference - Juicy Billing System

## Quick Access Commands

### Connect to MongoDB on VPS
```bash
ssh root@72.61.238.39
mongosh juicy_billing
```

---

## Common Operations

### 1. View All Data

#### See all users
```javascript
db.users.find().pretty()
```

#### See all orders (latest first)
```javascript
db.orders.find().sort({ createdAt: -1 }).limit(20).pretty()
```

#### See all bills (latest first)
```javascript
db.bills.find().sort({ createdAt: -1 }).limit(20).pretty()
```

#### See all products/items
```javascript
db.subcodes.find().pretty()
```

#### See all tables
```javascript
db.tables.find().pretty()
```

#### Count documents
```javascript
db.users.countDocuments()
db.orders.countDocuments()
db.bills.countDocuments()
```

---

### 2. Search/Filter Data

#### Find by username
```javascript
db.users.findOne({ username: "admin" })
```

#### Find by bill number
```javascript
db.bills.findOne({ billNo: "BILL-001" })
```

#### Find orders by table
```javascript
db.orders.find({ tableName: "T-01" }).pretty()
```

#### Find pending orders
```javascript
db.orders.find({ status: "pending" }).pretty()
```

#### Find low stock items (less than 10)
```javascript
db.subcodes.find({ stock: { $lt: 10 } }).pretty()
```

#### Find products by price range
```javascript
db.subcodes.find({
  price: { $gte: 50, $lte: 200 }
}).pretty()
```

#### Find bills by date range
```javascript
db.bills.find({
  createdAt: {
    $gte: new Date("2025-12-01"),
    $lte: new Date("2025-12-31")
  }
}).pretty()
```

#### Find bills above certain amount
```javascript
db.bills.find({ grandTotal: { $gte: 1000 } }).pretty()
```

---

### 3. Update Data

#### Update user email
```javascript
db.users.updateOne(
  { username: "admin" },
  { $set: { email: "newemail@example.com" } }
)
```

#### Update shop name
```javascript
db.businesssettings.updateOne(
  {},
  { $set: {
    shopName: "New Shop Name",
    shopMobile: "+91 9999999999",
    shopAddress: "New Address"
  }}
)
```

#### Update product price and stock
```javascript
db.subcodes.updateOne(
  { subCode: "COKE500" },
  { $set: {
    price: 60,
    stock: 150
  }}
)
```

#### Update product name
```javascript
db.subcodes.updateOne(
  { subCode: "PEPSI500" },
  { $set: { itemName: "Pepsi 500ml Premium" } }
)
```

#### Increase stock (add to existing)
```javascript
db.subcodes.updateOne(
  { subCode: "COKE500" },
  { $inc: { stock: 50 } }  // Adds 50 to current stock
)
```

#### Decrease stock
```javascript
db.subcodes.updateOne(
  { subCode: "COKE500" },
  { $inc: { stock: -10 } }  // Subtracts 10 from current stock
)
```

#### Update table status
```javascript
db.tables.updateOne(
  { tableNumber: "T-01" },
  { $set: { status: "available" } }
)
```

#### Set all tables to available
```javascript
db.tables.updateMany(
  {},
  { $set: { status: "available" } }
)
```

#### Update order status
```javascript
db.orders.updateOne(
  { _id: ObjectId("6759e4f0123456789abcdef0") },
  { $set: { status: "completed" } }
)
```

---

### 4. Delete Data

#### Delete specific user
```javascript
db.users.deleteOne({ username: "testuser" })
```

#### Delete specific order
```javascript
db.orders.deleteOne({ _id: ObjectId("6759e4f0123456789abcdef0") })
```

#### Delete all pending orders
```javascript
db.orders.deleteMany({ status: "pending" })
```

#### Delete old orders (before specific date)
```javascript
db.orders.deleteMany({
  createdAt: { $lt: new Date("2025-01-01") }
})
```

#### Delete all orders (clear table)
```javascript
db.orders.deleteMany({})
```

#### Delete all bills
```javascript
db.bills.deleteMany({})
```

#### Delete products with zero stock
```javascript
db.subcodes.deleteMany({ stock: 0 })
```

#### Delete cancelled orders
```javascript
db.orders.deleteMany({ status: "cancelled" })
```

---

### 5. Reports & Analytics

#### Total sales today
```javascript
db.bills.aggregate([
  {
    $match: {
      createdAt: {
        $gte: new Date(new Date().setHours(0,0,0,0))
      }
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
```

#### Sales by date
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

#### Top 10 selling products
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

#### Daily sales for last 7 days
```javascript
db.bills.aggregate([
  {
    $match: {
      createdAt: {
        $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      }
    }
  },
  {
    $group: {
      _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
      totalSales: { $sum: "$grandTotal" },
      billCount: { $sum: 1 },
      avgBillAmount: { $avg: "$grandTotal" }
    }
  },
  { $sort: { _id: 1 } }
])
```

#### Revenue by payment method
```javascript
db.bills.aggregate([
  {
    $group: {
      _id: "$paymentMethod",
      totalAmount: { $sum: "$grandTotal" },
      count: { $sum: 1 }
    }
  }
])
```

#### Average order value
```javascript
db.bills.aggregate([
  {
    $group: {
      _id: null,
      avgOrderValue: { $avg: "$grandTotal" },
      minOrderValue: { $min: "$grandTotal" },
      maxOrderValue: { $max: "$grandTotal" }
    }
  }
])
```

---

### 6. User Management

#### Create new admin user
```javascript
// Note: Password needs to be hashed with bcrypt
// Use backend seed script instead: npm run seed
```

#### Reset user password (use backend)
```bash
ssh root@72.61.238.39
cd /root/juicy/backend
npm run seed  # This will reset admin/cashier passwords
```

#### Change user role
```javascript
db.users.updateOne(
  { username: "cashier" },
  { $set: { role: "admin" } }
)
```

#### List all users
```javascript
db.users.find({}, { username: 1, email: 1, role: 1 }).pretty()
```

---

### 7. Inventory Management

#### View all items with stock
```javascript
db.subcodes.find({}, {
  subCode: 1,
  itemName: 1,
  stock: 1,
  price: 1
}).sort({ stock: -1 }).pretty()
```

#### Low stock alert (less than 10)
```javascript
db.subcodes.find(
  { stock: { $lt: 10 } },
  { subCode: 1, itemName: 1, stock: 1 }
).pretty()
```

#### Out of stock items
```javascript
db.subcodes.find(
  { stock: { $lte: 0 } },
  { subCode: 1, itemName: 1, stock: 1 }
).pretty()
```

#### Most expensive items
```javascript
db.subcodes.find()
  .sort({ price: -1 })
  .limit(10)
  .pretty()
```

#### Update multiple product prices (increase by 10%)
```javascript
db.subcodes.updateMany(
  {},
  [{ $set: { price: { $multiply: ["$price", 1.10] } } }]
)
```

---

### 8. Backup & Restore

#### Backup database
```bash
# On VPS server
mongodump --db juicy_billing --out /root/mongo-backups/backup-$(date +%Y%m%d)/
```

#### Backup with compression
```bash
mongodump --db juicy_billing --archive=/root/juicy_backup.gz --gzip
```

#### Restore database
```bash
mongorestore --db juicy_billing /root/mongo-backups/backup-20251210/juicy_billing/
```

#### Restore from compressed archive
```bash
mongorestore --db juicy_billing --archive=/root/juicy_backup.gz --gzip
```

#### Export collection to JSON
```bash
mongoexport --db juicy_billing --collection bills --out /root/bills.json --jsonArray
```

#### Import collection from JSON
```bash
mongoimport --db juicy_billing --collection bills --file /root/bills.json --jsonArray
```

---

### 9. Maintenance

#### Reset all tables to available
```javascript
db.tables.updateMany({}, { $set: { status: "available" } })
```

#### Clear old orders (older than 30 days)
```javascript
db.orders.deleteMany({
  createdAt: {
    $lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  }
})
```

#### Get database size
```javascript
db.stats()
```

#### Get collection size
```javascript
db.bills.stats()
```

#### Index information
```javascript
db.bills.getIndexes()
```

#### Rebuild indexes
```javascript
db.bills.reIndex()
```

---

### 10. Useful One-Liners

#### Today's sales summary
```javascript
db.bills.aggregate([{$match:{createdAt:{$gte:new Date(new Date().setHours(0,0,0,0))}}},{$group:{_id:null,total:{$sum:"$grandTotal"},count:{$sum:1}}}])
```

#### This month's sales
```javascript
db.bills.aggregate([{$match:{createdAt:{$gte:new Date(new Date().getFullYear(),new Date().getMonth(),1)}}},{$group:{_id:null,total:{$sum:"$grandTotal"},count:{$sum:1}}}])
```

#### Count by status
```javascript
db.orders.aggregate([{$group:{_id:"$status",count:{$sum:1}}}])
```

#### Recent 5 bills with customer names
```javascript
db.bills.find({},{billNo:1,customerName:1,grandTotal:1,createdAt:1}).sort({createdAt:-1}).limit(5)
```

---

## Emergency Commands

### Reset Everything (DANGER!)

#### Reset admin password
```bash
cd /root/juicy/backend
npm run seed
```

#### Clear all orders and bills
```javascript
db.orders.deleteMany({})
db.bills.deleteMany({})
```

#### Reset tables
```javascript
db.tables.deleteMany({})
# Then run: cd /root/juicy/backend && npm run seed-tables
```

#### Drop and recreate database
```javascript
use juicy_billing
db.dropDatabase()
```
Then SSH to server:
```bash
cd /root/juicy/backend
npm run seed
npm run seed-tables
```

---

## Tips & Tricks

1. **Use .pretty() for readable output**
   ```javascript
   db.bills.find().pretty()
   ```

2. **Limit results to avoid overwhelming output**
   ```javascript
   db.bills.find().limit(10)
   ```

3. **Sort results**
   ```javascript
   db.bills.find().sort({ createdAt: -1 })  // Newest first
   db.bills.find().sort({ createdAt: 1 })   // Oldest first
   ```

4. **Select specific fields only**
   ```javascript
   db.bills.find({}, { billNo: 1, grandTotal: 1, _id: 0 })
   ```

5. **Count matching documents**
   ```javascript
   db.bills.countDocuments({ grandTotal: { $gt: 500 } })
   ```

6. **Check if document exists**
   ```javascript
   db.users.findOne({ username: "admin" }) != null
   ```

---

## MongoDB Shell Shortcuts

- `show dbs` - List all databases
- `show collections` - List all collections
- `use juicy_billing` - Switch to database
- `db` - Show current database
- `exit` or `quit()` - Exit mongosh
- `cls` or `Ctrl+L` - Clear screen
- `Ctrl+C` - Cancel current command

---

## Access from GUI (MongoDB Compass)

1. **Create SSH tunnel from your local machine:**
   ```bash
   ssh -L 27017:localhost:27017 root@72.61.238.39 -N
   ```

2. **In MongoDB Compass, connect to:**
   ```
   mongodb://localhost:27017/juicy_billing
   ```

---

## Connection Strings

### Local Connection (on VPS)
```
mongodb://localhost:27017/juicy_billing
```

### Via SSH Tunnel (from your machine)
```
mongodb://localhost:27017/juicy_billing
```
(After creating SSH tunnel)

---

## Quick Problem Solvers

### "Database locked" error
```bash
sudo systemctl restart mongod
```

### "Connection refused"
```bash
sudo systemctl start mongod
```

### Check MongoDB is running
```bash
sudo systemctl status mongod
```

### View MongoDB logs
```bash
sudo tail -f /var/log/mongodb/mongod.log
```
