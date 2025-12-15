# RoomFindr Test Accounts

## 🎯 Quick Start

Your test accounts are ready! You can now login to your RoomFindr application using these credentials:

### 🏠 Tenant Account
- **Email:** `tenant@test.com`
- **Password:** `password123`
- **Role:** Tenant
- **Status:** ✅ Ready to use
- **Features:** Can search rooms, make reservations, view profiles

### 🏢 Landlord Account
- **Email:** `landlord@test.com`
- **Password:** `password123`
- **Role:** Landlord
- **Status:** ✅ Ready to use (may need verification for listing)
- **Features:** Can manage properties, view reservations, handle verification

## 🚀 How to Use

1. **Start your development server:**
   ```bash
   npm run dev
   ```

2. **Visit your application:**
   ```
   http://localhost:3000
   ```

3. **Login with either account** using the credentials above

4. **Test different user flows:**
   - As a tenant: Browse properties, make reservations
   - As a landlord: Create listings, manage properties

## 🛠️ Management Scripts

### Check Account Status
```bash
node check-test-accounts.js
```
This script verifies that both accounts can login successfully and have proper profiles.

### Fix Account Profiles
```bash
node fix-test-profiles.js
```
If profiles are missing or corrupted, this script will recreate them.

### Create Additional Demo Data
```bash
node create-demo-data.js
```
Creates additional test accounts and sample properties for more comprehensive testing.

## 📋 Account Details

### Tenant Account (John Doe)
- **User ID:** `7917b6a9-8a11-4315-b2f8-ae7727e072a5`
- **Phone:** `+639171234567`
- **Bio:** "Looking for a comfortable and affordable room."
- **Verification Status:** ✅ Verified
- **Permissions:** 
  - Search and view properties
  - Make reservations
  - View roommate profiles
  - Leave reviews

### Landlord Account (Jane Smith)
- **User ID:** `36811e09-60b6-475c-babf-9ff0b0fc040c`
- **Phone:** `+639187654321`
- **Bio:** "Experienced landlord with quality properties."
- **Verification Status:** ✅ Verified
- **Permissions:**
  - Create and manage property listings
  - View and manage reservations
  - Access landlord dashboard
  - Manage verification documents

## 🔧 Troubleshooting

### If login fails:
1. Check that your development server is running
2. Verify environment variables are set correctly
3. Run the account check script: `node check-test-accounts.js`

### If profiles are missing:
1. Run the profile fix script: `node fix-test-profiles.js`
2. Check the database connection
3. Verify the user_profiles table exists

### If you need to reset accounts:
1. Delete the users from Supabase Auth dashboard
2. Run `node create-test-accounts.js` again
3. Run `node fix-test-profiles.js` if needed

## 🎨 Testing Scenarios

### Tenant Flow
1. Login as tenant
2. Browse available properties
3. View property details and roommate profiles
4. Make a reservation
5. View reservation status
6. Leave a review

### Landlord Flow
1. Login as landlord
2. Complete verification (if needed)
3. Create a property listing
4. Upload property images
5. Set rental policies
6. Manage incoming reservations
7. View analytics

### Admin Flow (if admin account exists)
1. Login as admin
2. Review landlord verifications
3. Moderate content and reviews
4. Manage user accounts
5. View system analytics

## 📞 Support

If you encounter any issues with the test accounts:

1. **Check the logs** in your terminal for error messages
2. **Verify database connection** - ensure Supabase is accessible
3. **Run diagnostic scripts** - use the provided check and fix scripts
4. **Check environment variables** - ensure all required vars are set

## 🔐 Security Notes

- These are **development accounts only**
- Passwords are simple for testing purposes
- **Never use these credentials in production**
- The accounts bypass email verification for development convenience
- Service role key is used for account creation (keep it secure)

---

**Happy Testing! 🎉**

Your RoomFindr application now has fully functional test accounts ready for development and testing.