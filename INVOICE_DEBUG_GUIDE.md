# 🔍 Invoice Debug Guide - "Invoice Tidak Ditemukan"

## ⚠️ Problem Report
User mendapat halaman **"Invoice Tidak Ditemukan"** saat mengakses invoice setelah upgrade premium.

## 🧩 Possible Root Causes

### **1. Transaction ID Mismatch**
- PilihPaket navigate ke `/invoice/123` tapi data tidak ada di backend
- Type mismatch (string vs number) dalam pencarian
- Wrong endpoint atau response structure

### **2. Backend API Issues**
- `/membership/membership-history` tidak return data yang benar
- Authentication issues
- Database tidak punya data untuk transaction ID tersebut

### **3. Frontend Search Logic Issues**  
- Invoice.jsx tidak bisa find data di response
- Array/object structure tidak sesuai ekspektasi
- Search conditions tidak match

## 🔍 Enhanced Debug Logging

### **PilihPaket.jsx Console Logs**
Saat upgrade premium, cek logs ini:
```javascript
"✅ Found transaction ID, navigating to invoice: 123"
"🔗 Navigation URL will be: /invoice/123" 
"🔍 Transaction ID type: number Value: 123"
```

### **Invoice.jsx Console Logs**
Saat akses `/invoice/123`, cek logs ini:
```javascript
"🔍 Invoice.jsx - Searching for ID: 123"
"📋 Orders response: [...]"
"🏆 Membership response: [...]"
"🔎 Searching in orders for ID: 123"
"📋 Available order IDs: [{id: 1, ref: 'INV-001'}, ...]"
"🔎 Searching in memberships for ID: 123" 
"🏆 Available membership IDs: [{id: 123, ref: 'MEMBER-123'}, ...]"
"🏆 Found in memberships: {id: 123, package: 'premium', ...}"
"🔄 Transforming membership to order format"
"✅ Final order found: {id: 123, package_name: 'premium', ...}"
```

## 🧪 Debugging Steps

### **Step 1: Check Navigation URL**
1. Open browser DevTools → Console
2. Upgrade premium di PilihPaket
3. **Expected Log**: `"🔗 Navigation URL will be: /invoice/123"`
4. **Verify**: URL di browser = `/invoice/123`

### **Step 2: Check API Responses**
1. Navigate ke `/invoice/123` 
2. **Expected Logs**:
   ```
   "📋 Orders response: []" (probably empty)
   "🏆 Membership response: [{id: 123, ...}]" (should have data)
   ```
3. **If Empty**: API endpoint issue or no data

### **Step 3: Check ID Matching**
1. **Expected Log**: `"🏆 Available membership IDs: [{id: 123, ...}]"`
2. **Check**: Apakah ID yang dicari (123) ada di array available IDs?
3. **If Not Match**: Type mismatch atau ID generation issue

### **Step 4: Check Data Transformation**
1. **Expected**: `"🏆 Found in memberships: {...}"`
2. **Expected**: `"🔄 Transforming membership to order format"`
3. **Expected**: `"✅ Final order found: {...}"`

## 🛠️ Quick Fixes

### **Fix 1: Manual Test Data (Temporary)**
If all else fails, Invoice.jsx now has fallback:
```javascript
// Creates temporary test data for any ID
found = {
  id: parseInt(id) || id,
  order_number: `TEMP-${id}`,
  package_name: 'Premium Membership (Test)',
  amount: 250000,
  status: 'pending'
};
```

### **Fix 2: Direct Database Check**
```sql
-- Check if membership transaction exists
SELECT * FROM membership_transactions 
WHERE user_id = YOUR_USER_ID 
ORDER BY created_at DESC LIMIT 5;

-- Check transaction ID
SELECT id, package, total_price, payment_status 
FROM membership_transactions 
WHERE id = 123;  -- Replace with actual ID
```

### **Fix 3: API Direct Test**
```bash
# Test membership history endpoint
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8000/api/membership/membership-history

# Should return array of membership transactions
```

## 🔧 Troubleshooting Scenarios

### **Scenario A: No Console Logs**
**Problem**: JavaScript errors preventing execution
**Solution**: Check browser console for red errors

### **Scenario B: API Returns Empty Array**
```javascript
"🏆 Membership response: []"
```
**Problem**: No membership transactions for user
**Solution**: Check database, verify upgrade was successful

### **Scenario C: ID Type Mismatch**
```javascript
"🔍 Search ID: '123' (string)"
"🏆 Available IDs: [{id: 123 (number), ...}]"
```
**Problem**: String vs Number comparison
**Solution**: Use `String(id) === String(searchId)` comparison

### **Scenario D: API Authentication Error**
```javascript
"❌ Error loading membership/membership-history: 401 Unauthorized"
```
**Problem**: User not authenticated
**Solution**: Check login status, refresh token

### **Scenario E: Backend Endpoint Missing**
```javascript  
"❌ Error loading membership/membership-history: 404 Not Found"
```
**Problem**: Route not configured
**Solution**: Check `routes/api.php` has membership routes

## 🎯 Expected Success Flow

### **Complete Working Flow**
```javascript
// 1. PilihPaket upgrade
"✅ Found transaction ID, navigating to invoice: 123"

// 2. Navigate to /invoice/123
"🔍 Invoice.jsx - Searching for ID: 123"

// 3. Load API data  
"🏆 Membership response: [{id: 123, package: 'premium', total_price: 250000}]"

// 4. Find matching transaction
"🏆 Available membership IDs: [{id: 123, ref: 'MEMBER-123'}]"
"🏆 Found in memberships: {id: 123, package: 'premium'}"

// 5. Transform data
"🔄 Transforming membership to order format"
"✅ Final order found: {id: 123, package_name: 'premium', amount: 250000}"

// 6. Show invoice page (NOT "Invoice Tidak Ditemukan")
```

## 📋 Debug Checklist

### Before Testing
- [ ] Check browser console is open
- [ ] Check network tab for API calls
- [ ] Ensure user is logged in
- [ ] Clear localStorage if needed

### During Premium Upgrade
- [ ] PilihPaket logs show transaction_id found
- [ ] Navigation URL is correct format `/invoice/{id}`
- [ ] Browser navigates to correct URL

### On Invoice Page
- [ ] Console shows "🔍 Invoice.jsx - Searching for ID: X"
- [ ] API calls return data (not empty arrays)
- [ ] ID is found in available IDs array
- [ ] "✅ Final order found" shows complete data
- [ ] Page shows invoice details (NOT "Invoice Tidak Ditemukan")

### If Still Failing
- [ ] Check database directly for membership_transactions
- [ ] Test API endpoints with Postman/curl
- [ ] Verify backend logs for errors
- [ ] Check if temp fallback data appears

---

## 🎯 Next Steps

1. **Test the upgrade flow** dengan console terbuka
2. **Copy paste semua console logs** yang muncul  
3. **Screenshot halaman** yang muncul
4. **Share logs** untuk debug lebih lanjut jika masih error

**Expected Result**: Console akan show detailed logs yang membantu identify exactly where the problem occurs!