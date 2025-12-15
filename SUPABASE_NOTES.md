# Supabase Important Notes

## ❌ NEVER USE THESE RPC CALLS:

**CRITICAL:** These functions DO NOT exist in Supabase:
- `supabase.rpc('exec_sql', { sql: query })`
- `supabase.rpc('exec', { sql: query })`
- `supabase.rpc('execute', { sql: query })`

**These will ALWAYS fail with "Could not find the function" error.**

### ✅ Correct Approaches for SQL Execution:

1. **Database Migrations** (Recommended)
   - Create `.sql` files in `supabase/migrations/`
   - Run `supabase db push` or apply via Supabase Dashboard
   - Use for schema changes, policies, functions

2. **Direct SQL via Supabase Client** (Limited)
   - Only for simple queries that return data
   - Cannot execute DDL (CREATE, ALTER, DROP) statements
   - Use `.from()`, `.select()`, `.insert()`, etc.

3. **Custom RPC Functions**
   - Create PostgreSQL functions in migrations
   - Call via `supabase.rpc('function_name', params)`
   - Must be defined in database first

### Storage Policies Setup:
- ✅ Use migration files: `007_storage_policies.sql`
- ❌ Never try to execute CREATE POLICY via RPC
- ✅ Apply via `npm run db:migrate` or Supabase Dashboard

### Remember:
- RLS policies = Database migrations
- Bucket creation = Supabase client API
- Data queries = Supabase client methods
- Custom logic = PostgreSQL functions + RPC calls