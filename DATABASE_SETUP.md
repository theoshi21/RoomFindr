# RoomFindr Database Setup Guide

This guide provides step-by-step instructions for setting up the RoomFindr database schema in Supabase.

## Overview

The RoomFindr database is designed with:
- **PostgreSQL** as the core database
- **Supabase** for authentication, real-time features, and hosting
- **Row Level Security (RLS)** for data protection
- **PostGIS** for geospatial features
- **Comprehensive triggers and functions** for business logic

## Prerequisites

1. **Supabase Account**: Create an account at [supabase.com](https://supabase.com)
2. **Supabase CLI**: Install the Supabase CLI for local development
3. **Node.js**: Version 18+ for running setup scripts

## Setup Steps

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Choose a project name (e.g., "roomfindr-production")
3. Set a strong database password
4. Select your preferred region
5. Wait for the project to be created

### 2. Configure Environment Variables

Create a `.env.local` file in your project root:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Next.js Configuration  
NEXTAUTH_SECRET=your-nextauth-secret
NEXTAUTH_URL=http://localhost:3000
```

### 3. Apply Database Schema

#### Option A: Using Supabase Dashboard (Recommended for Production)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of each migration file in order:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_rls_policies.sql`
   - `supabase/migrations/003_functions_and_triggers.sql`
4. Execute each migration by clicking **Run**

#### Option B: Using Supabase CLI (Recommended for Development)

```bash
# Install Supabase CLI
npm install -g supabase

# Initialize Supabase in your project
supabase init

# Link to your remote project
supabase link --project-ref your-project-ref

# Apply migrations
supabase db push

# Load seed data (optional)
supabase db seed
```

### 4. Configure Authentication

1. In your Supabase dashboard, go to **Authentication > Settings**
2. Configure the following settings:

#### Site URL
```
http://localhost:3000
```

#### Additional Redirect URLs
```
https://localhost:3000
https://your-production-domain.com
```

#### Email Templates
1. Go to **Authentication > Email Templates**
2. Upload the custom templates from `supabase/templates/`:
   - `confirmation.html`
   - `recovery.html`
   - `invite.html`

### 5. Set Up Storage

1. Go to **Storage** in your Supabase dashboard
2. Create the following buckets:

#### Property Images Bucket
- **Name**: `property-images`
- **Public**: Yes
- **File size limit**: 50MB
- **Allowed MIME types**: `image/jpeg, image/png, image/webp`

#### Verification Documents Bucket
- **Name**: `verification-documents`
- **Public**: No (Private)
- **File size limit**: 10MB
- **Allowed MIME types**: `image/jpeg, image/png, application/pdf`

#### User Avatars Bucket
- **Name**: `avatars`
- **Public**: Yes
- **File size limit**: 5MB
- **Allowed MIME types**: `image/jpeg, image/png, image/webp`

### 6. Configure Storage Policies

Apply these RLS policies for storage buckets:

```sql
-- Property Images Policies
CREATE POLICY "Anyone can view property images" ON storage.objects
  FOR SELECT USING (bucket_id = 'property-images');

CREATE POLICY "Landlords can upload property images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'property-images' AND
    auth.role() = 'authenticated'
  );

-- Verification Documents Policies  
CREATE POLICY "Users can view own verification documents" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'verification-documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can upload own verification documents" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'verification-documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Avatar Policies
CREATE POLICY "Anyone can view avatars" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload own avatar" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );
```

### 7. Test Database Connection

Run the database test to verify everything is working:

```bash
npm run db:test
```

Or use the test function in your application:

```typescript
import { testDatabaseConnection, checkDatabaseTables } from '@/lib/database-test';

// Test connection
const connectionResult = await testDatabaseConnection();
console.log('Connection:', connectionResult);

// Check tables
const tablesResult = await checkDatabaseTables();
console.log('Tables:', tablesResult);
```

## Database Schema Overview

### Core Tables

1. **users** - User accounts (extends Supabase auth.users)
2. **user_profiles** - User profile information
3. **landlord_verifications** - Landlord verification workflow
4. **verification_documents** - Document storage references
5. **properties** - Property listings with geospatial data
6. **reservations** - Booking and reservation management
7. **transactions** - Payment and financial records
8. **notifications** - Real-time notification system
9. **reviews** - Property and landlord reviews

### Key Features

- **Geospatial Support**: PostGIS for location-based searches
- **Real-time Updates**: Triggers for live notifications
- **Audit Trails**: Automatic timestamp tracking
- **Data Integrity**: Comprehensive constraints and validation
- **Security**: Row Level Security on all tables

## Troubleshooting

### Common Issues

#### 1. Connection Errors
- Verify environment variables are correct
- Check if your IP is whitelisted in Supabase
- Ensure the project is not paused

#### 2. Migration Errors
- Run migrations in the correct order
- Check for syntax errors in SQL
- Verify PostGIS extension is enabled

#### 3. RLS Policy Issues
- Ensure user is authenticated
- Check policy conditions match your use case
- Verify user roles are set correctly

#### 4. Function Errors
- Check function parameters match the schema
- Verify function permissions
- Look for typos in function names

### Getting Help

1. Check the Supabase documentation
2. Review the migration files for syntax
3. Use the Supabase dashboard SQL editor to test queries
4. Check the browser console for detailed error messages

## Production Considerations

### Security
- Use strong passwords for database access
- Regularly rotate API keys
- Monitor access logs
- Keep RLS policies up to date

### Performance
- Monitor query performance
- Add indexes for frequently queried columns
- Use connection pooling for high traffic
- Implement caching strategies

### Backup
- Enable automatic backups in Supabase
- Test backup restoration procedures
- Document recovery processes
- Monitor backup success

### Monitoring
- Set up alerts for errors
- Monitor database performance
- Track storage usage
- Review security logs regularly

## Next Steps

After completing the database setup:

1. **Test the Application**: Verify all features work correctly
2. **Load Sample Data**: Use the seed file for testing
3. **Configure Monitoring**: Set up alerts and logging
4. **Deploy to Production**: Apply the same setup to production
5. **Document Procedures**: Keep setup documentation updated