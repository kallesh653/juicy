# Table Order System - Debugging Guide

## How to Test and Find Issues

### Step 1: Open Browser Developer Console
1. Open your application in Chrome/Firefox: http://localhost:3000
2. Press F12 to open Developer Tools
3. Go to the "Console" tab
4. Keep it open while testing

### Step 2: Test Table Order Flow

#### Test A: Navigate to Tables Page
1. Login as admin (admin/admin123)
2. Click on "Tables" in the sidebar
3. **Check Console**: Should see:
   ```
   Tables fetched: {...}
   Stats fetched: {...}
   ```
4. **Check Screen**: Should see table cards (green for available, red for occupied)

**If you see white page here:**
- Check console for errors
- TablesView component has an issue

#### Test B: Click on a Green (Available) Table
1. Click on any GREEN table card
2. **Check URL**: Should change to `/tables/:tableId/order` (e.g., `/tables/69248fc55e35ea077784a9c6/order`)
3. **Check Console**: Should see:
   ```
   TakeTableOrder component loaded
   Table ID from params: 69248fc55e35ea077784a9c6
   useEffect running, fetching data...
   Table fetched: {...}
   ```
4. **Check Screen**: Should see:
   - "Take Order - [Table Name]" header
   - Category dropdown
   - Search bar
   - Cart section (empty)

**If you see white page here:**
- Check console for errors
- Look for "TakeTableOrder component loaded" message
- If message appears, component is loading but crashing during render
- If message doesn't appear, routing issue

#### Test C: Select Category and Add Items
1. Select a category from dropdown
2. You should see item cards appear
3. Click on an item card to add to cart
4. **Check Screen**: Item should appear in cart on the right

**If white page appears here:**
- Check console for errors
- Item selection or cart update has an issue

#### Test D: Generate Order
1. Add at least 1 item to cart
2. Click "Generate Order & Lock Table" button
3. Confirm in modal
4. **Check Console**: Should see:
   ```
   Creating order: {...}
   Order created successfully: {...}
   ```
5. **Check Screen**:
   - Success message "Order created successfully! Table is now occupied."
   - After 0.5 seconds, should navigate to `/tables`
   - Table should now be RED (Occupied)

**If white page appears here:**
- Check console for errors
- Look for "Order creation error" or "Error response"
- API call might be failing

### Step 3: Common Issues and Solutions

#### Issue 1: "401 Unauthorized" Error
**Symptom**: Console shows 401 errors
**Solution**: Your session expired, login again

#### Issue 2: "Table not found"
**Symptom**: Error message or white page when clicking table
**Solution**: Table ID might be invalid, check MongoDB for valid tables

#### Issue 3: "Failed to fetch table details"
**Symptom**: Error message then redirects back to tables
**Solution**: Backend might be down or table doesn't exist

#### Issue 4: Items not loading
**Symptom**: No items appear after selecting category
**Solution**:
- Check if subcodes exist in database
- Check console for "Failed to load items"
- Verify mainCodes and subCodes API calls succeed

#### Issue 5: Order creation fails
**Symptom**: Error message when generating order
**Possible Reasons**:
- Insufficient stock
- Table already occupied (by another user)
- Missing required fields
- Backend validation error

**Check Console**: Look for error message with details

#### Issue 6: White page with no errors
**Symptom**: Page is white but no console errors
**Solution**:
- Check if component is rendering: Look for "TakeTableOrder component loaded"
- If message appears, check for render errors (null/undefined access)
- Check Network tab for failed API calls

### Step 4: Backend Debugging

Open the backend terminal and check for:
1. `POST /api/orders` request
2. Response status (200 = success, 4xx/5xx = error)
3. Any error messages

Example successful output:
```
POST /api/orders [32m201[0m 125.775 ms - 864
```

Example error output:
```
POST /api/orders [31m400[0m 25.123 ms - 78
```

### Step 5: Database Check

If orders aren't saving:
1. Open MongoDB Compass or terminal
2. Connect to: `mongodb://localhost:27017`
3. Select database: `colddrink_billing`
4. Check `orders` collection
5. Verify new order document exists with:
   - orderNo (e.g., "ORD00001")
   - table reference
   - items array
   - orderType: "Dine-In"

### Step 6: Network Tab Debugging

1. Open Network tab in Developer Tools
2. Click on table to take order
3. Watch for these API calls:
   - `GET /api/tables/:id` - Should return 200
   - `GET /api/maincodes?isActive=true` - Should return 200
   - `GET /api/subcodes?isActive=true` - Should return 200

4. After generating order:
   - `POST /api/orders` - Should return 201
   - If it returns 400/500, click on it to see error details

### Step 7: Report the Issue

When reporting the issue, please provide:

1. **Exact Step Where It Fails**:
   - "White page appears after clicking table"
   - OR "White page after clicking Generate Order"
   - OR "White page after selecting items"

2. **Console Errors** (if any):
   ```
   Copy and paste any red error messages from console
   ```

3. **Network Errors** (if any):
   - Which API call failed?
   - What was the status code?
   - What was the error message?

4. **Backend Logs**:
   ```
   Copy the last 10-20 lines from backend terminal
   ```

5. **What You See**:
   - Completely white page?
   - Blank page with header/sidebar?
   - Loading spinner stuck?

---

## Quick Fix Commands

### Restart Everything
```bash
# Kill all processes
Ctrl+C in all terminals

# Backend
cd c:\Users\LEN0VO\Desktop\colddrink1.2\backend
npm start

# Frontend
cd c:\Users\LEN0VO\Desktop\colddrink1.2\frontend
npm run dev
```

### Clear Browser Cache
1. Press Ctrl+Shift+Delete
2. Select "Cached images and files"
3. Click "Clear data"
4. Refresh page (Ctrl+F5)

### Reset Database (if needed)
```bash
mongosh
use colddrink_billing
db.orders.deleteMany({})
db.tables.updateMany({}, {$set: {status: 'Available', currentOrder: null}})
exit
```

---

## Expected Console Output (Normal Flow)

### When clicking table:
```
TakeTableOrder component loaded
Table ID from params: 69248fc55e35ea077784a9c6
useEffect running, fetching data...
Table fetched: {table: {...}}
```

### When generating order:
```
Creating order: {orderType: 'Dine-In', tableId: '...', items: [...], ...}
Order created successfully: {success: true, order: {...}}
```

### When navigating back:
```
Tables fetched: {tables: [...]}
Stats fetched: {stats: {...}}
```

---

**Remember**: Keep the browser console open at all times to see what's happening!
