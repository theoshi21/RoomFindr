# 🚨 CRITICAL DEVELOPMENT GUIDE - MUST READ 🚨

## ⚠️ **READ THIS BEFORE MAKING ANY DATABASE CHANGES** ⚠️

This document contains **CRITICAL** information to prevent common mistakes that will break your development workflow. **EVERY DEVELOPER** must read this before working on the project.

---

## 🛑 **RULE #1: NEVER USE exec_sql - IT DOESN'T EXIST**

### ❌ **THIS WILL ALWAYS FAIL:**
```javascript
// DON'T DO THIS - exec_sql DOES NOT EXIST IN SUPABASE
const { data, error } = await supabase.rpc('exec_sql', {
  sql: 'ALTER TABLE users ADD COLUMN new_field TEXT;'
})
// Error: Could not find the function public.exec_sql(sql) in the schema cache
```

### ✅ **DO THIS INSTEAD:**

#### **Option 1: Supabase Dashboard SQL Editor (Easiest)**
```javascript
// Go to: Dashboard → SQL Editor → Paste SQL → Run
```

#### **Option 2: Direct SQL with Service Role Key (Programmatic)**
```javascript
// Create a custom function to execute raw SQL
async function executeSQL(sql) {
  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
  
  // Use rpc to call a custom function that executes SQL
  const { data, error } = await adminClient.rpc('execute_sql', { 
    query: sql 
  })
  
  return { data, error }
}

// Usage:
await executeSQL('ALTER TABLE users ADD COLUMN new_field TEXT;')
```

#### **Option 3: PostgreSQL Client with Connection String**
```javascript
// Using pg library directly
import { Client } from 'pg'

const client = new Client({
  connectionString: process.env.DATABASE_URL, // From Supabase settings
  ssl: { rejectUnauthorized: false }
})

await client.connect()
await client.query('ALTER TABLE users ADD COLUMN new_field TEXT;')
await client.end()
```

---

## 🛑 **RULE #2: USE THE RIGHT TOOL FOR THE RIGHT JOB**

| **Task Type** | **Correct Method** | **Wrong Method** |
|---------------|-------------------|------------------|
| **Schema Changes** (CREATE TABLE, ALTER TABLE, etc.) | 1. Dashboard SQL Editor<br>2. Custom execute_sql function<br>3. Direct PostgreSQL client | exec_sql (doesn't exist) |
| **RLS Policies** | 1. Dashboard SQL Editor<br>2. Custom execute_sql function | exec_sql, regular API routes |
| **Data Operations** (INSERT, UPDATE, SELECT) | API routes with service role | Direct client calls with RLS issues |
| **Admin Operations** | Service role key in API routes | Regular user permissions |

---

## 🛑 **RULE #2.1: CREATING A CUSTOM execute_sql FUNCTION**

If you want to execute SQL programmatically, you need to create your own function in Supabase:

### **Step 1: Create the Function in Supabase Dashboard**
```sql
-- Go to Dashboard → SQL Editor and run this:
CREATE OR REPLACE FUNCTION execute_sql(query text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result json;
BEGIN
    EXECUTE query;
    GET DIAGNOSTICS result = ROW_COUNT;
    RETURN json_build_object('rows_affected', result);
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object('error', SQLERRM);
END;
$$;

-- Grant execute permission to service role
GRANT EXECUTE ON FUNCTION execute_sql(text) TO service_role;
```

### **Step 2: Use it in Your Code**
```javascript
// Now you can use it programmatically
const { data, error } = await adminClient.rpc('execute_sql', {
  query: 'ALTER TABLE users ADD COLUMN new_field TEXT;'
})
```

### **⚠️ Security Warning:**
- Only use this with **service role key**
- **Never** expose this function to client-side code
- **Always** validate SQL inputs to prevent injection

---

## 🛑 **RULE #3: ENVIRONMENT VARIABLES ARE CRITICAL**

### **Required Variables in .env.local:**
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key  # CRITICAL for admin operations
```

### **⚠️ Security Rules:**
- **NEVER** expose service role key in client-side code
- **ALWAYS** use service role key only in API routes
- **NEVER** commit real keys to git

---

## 🛑 **RULE #4: RLS POLICY TROUBLESHOOTING**

### **Common Error:**
```
Error: new row violates row-level security policy
```

### **Quick Fix:**
1. Go to Supabase Dashboard → SQL Editor
2. Run this SQL:
```sql
-- Check current policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public';

-- Create permissive policy for development
DROP POLICY IF EXISTS "restrictive_policy" ON public.your_table;
CREATE POLICY "dev_allow_all" ON public.your_table 
FOR ALL USING (true) WITH CHECK (true);
```

---

## 🛑 **RULE #5: CORRECT API ROUTE PATTERN**

### **✅ Correct Pattern for Admin Operations:**
```typescript
// src/app/api/admin/some-operation/route.ts
import { createClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
  // Use service role key to bypass RLS
  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!, // Service role key
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )

  // Now you can perform admin operations
  const { data, error } = await adminClient
    .from('users')
    .insert({ /* data */ })

  return Response.json({ data, error })
}
```

---

## 🛑 **RULE #6: COMMON MISTAKES TO AVOID**

### ❌ **Don't Do These:**
```javascript
// 1. Don't use exec_sql
await supabase.rpc('exec_sql', { sql: '...' })

// 2. Don't run DDL through client
await supabase.from('information_schema').select('*')

// 3. Don't use anon key for admin operations
const client = createClient(url, ANON_KEY) // Wrong for admin tasks

// 4. Don't ignore RLS errors
// Just hoping RLS errors will go away

// 5. Don't hardcode credentials
const url = 'https://abc123.supabase.co' // Use env vars
```

### ✅ **Do These Instead:**
```javascript
// 1. Use Dashboard SQL Editor for schema changes
// 2. Use proper Supabase client methods
// 3. Use service role key for admin operations
// 4. Fix RLS policies properly
// 5. Use environment variables
```

---

## 🛑 **RULE #7: DEVELOPMENT WORKFLOW**

### **Step 1: Environment Setup**
```bash
# Copy and configure environment
cp .env.example .env.local
# Edit .env.local with your Supabase credentials
```

### **Step 2: Database Setup**
```bash
# Create admin account
node create-admin-account.js

# Create test accounts
node create-test-accounts.js
```

### **Step 3: Schema Changes**
- **ALWAYS** use Supabase Dashboard SQL Editor
- **NEVER** use exec_sql or client libraries for DDL

### **Step 4: Test Your Changes**
```bash
# Test database connection
node test-supabase-connection.js

# Check test accounts
node check-test-accounts.js

# Test SQL execution (if you created the execute_sql function)
node test-sql-execution.js
```

---

## 🛑 **RULE #8: EMERGENCY FIXES**

### **If You Get "exec_sql not found":**
1. **STOP** trying to use exec_sql
2. Go to Supabase Dashboard → SQL Editor
3. Run your SQL there instead

### **If You Get RLS Policy Errors:**
1. Go to Supabase Dashboard → SQL Editor
2. Run: `SELECT * FROM pg_policies WHERE schemaname = 'public';`
3. Create permissive policies for development
4. Use service role key in API routes

### **If Authentication Fails:**
1. Check environment variables
2. Verify Supabase project URL and keys
3. Check RLS policies on auth-related tables

### **If You Get Timeout Errors:**
1. **STOP** - This is usually RLS policies blocking queries
2. Run the diagnostic: `node debug-timeout-issue.js`
3. If anon client times out but service role works, disable RLS temporarily:
   ```sql
   -- Run in Supabase Dashboard SQL Editor
   ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
   ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;
   -- (repeat for other tables causing issues)
   ```
4. Use the provided `fix-timeout-rls.sql` script

---

## 🛑 **RULE #9: TESTING CHECKLIST**

Before committing any database-related changes:

- [ ] ✅ Did NOT use exec_sql anywhere
- [ ] ✅ Used Supabase Dashboard for schema changes
- [ ] ✅ Used service role key for admin operations
- [ ] ✅ Tested with `node test-supabase-connection.js`
- [ ] ✅ Verified RLS policies don't block legitimate operations
- [ ] ✅ Environment variables are properly set
- [ ] ✅ No hardcoded credentials in code

---

## 🛑 **RULE #10: WHEN IN DOUBT**

### **For Schema Changes:**
→ Use Supabase Dashboard SQL Editor

### **For Data Operations:**
→ Use API routes with proper client setup

### **For Admin Tasks:**
→ Use service role key in API routes

### **For RLS Issues:**
→ Check and fix policies in Dashboard

### **For Authentication Issues:**
→ Verify environment variables and RLS policies

---

## 📞 **EMERGENCY CONTACTS**

If you're stuck and need help:

1. **Check this guide first**
2. **Check existing scripts:** `create-admin-account.js`, `test-supabase-connection.js`
3. **Check error logs** in browser console and server logs
4. **Review Supabase Dashboard** for policy and schema issues

---

## 🔒 **SECURITY REMINDERS**

- **Service role key** = Admin access, use only in API routes
- **Anon key** = Public access, safe for client-side
- **Never commit** real credentials to git
- **Always use** environment variables
- **Test RLS policies** thoroughly before production

---

**🚨 REMEMBER: This guide exists because these mistakes have been made before. Following these rules will save you hours of debugging time. 🚨**
---


## 🎉 **DASHBOARD FEATURES WORKING**

### **✅ Personalized Welcome Messages:**
All dashboards now show personalized greetings with the user's profile name:
- **Time-based greetings**: "Good morning/afternoon/evening, [Name]! 👋"
- **Profile integration**: Uses first name from user profile
- **Fallback handling**: Shows "User" if name is not available

### **🚀 Role-Based Dashboards:**
- **admin@roomfindr.com / admin123** → `/admin/dashboard` ✅ "Good morning, System! 👋"
- **tenant@test.com / password123** → `/tenant/dashboard` ✅ "Good morning, John! 👋"
- **landlord@test.com / password123** → `/landlord/dashboard` ✅ "Good morning, Jane! 👋"

### **📋 Dashboard Navigation:**
- **Admin Dashboard**: User Management, Verifications, Analytics, etc.
- **Landlord Dashboard**: Properties, Reservations, Verification, etc.
- **Tenant Dashboard**: Find Rooms, Reservations, Roommate Matching, etc.

### **🔄 Auto-Redirect:**
- `/dashboard` automatically redirects users to their role-specific dashboard
- Handles authentication and role detection seamlessly

**🚨 REMEMBER: All dashboards now show personalized welcome messages using the user's profile name from auth metadata! 🚨**