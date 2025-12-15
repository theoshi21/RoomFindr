# RoomFindr Database Setup

This directory contains the database schema, migrations, and configuration for the RoomFindr application using Supabase.

## Overview

The RoomFindr database is built on PostgreSQL with Supabase providing authentication, real-time features, and storage capabilities. The schema supports a three-tier user system (Admin, Tenant, Landlord) with comprehensive role-based access control.

## Database Schema

### Core Tables

1. **users** - Extends Supabase auth.users with role information
2. **user_profiles** - User profile information and preferences
3. **landlord_verifications** - Landlord verification workflow
4. **verification_documents** - Document storage for verification
5. **properties** - Property listings with geospatial support
6. **reservations** - Booking and reservation management
7. **transactions** - Payment and financial transaction records
8. **notifications** - Real-time notification system
9. **reviews** - Property and landlord review system

### Key Features

- **Row Level Security (RLS)**: Comprehensive policies for data access control
- **Geospatial Support**: PostGIS integration for location-based searches
- **Real-time Updates**: Triggers and functions for live notifications
- **Audit Trails**: Automatic timestamp tracking and change logging
- **Data Integrity**: Constraints and validation at the database level

## Setup Instructions

### 1. Local Development Setup

```bash
# Install Supabase CLI
npm install -g supabase

# Initialize Supabase in your project (if not already done)
supabase init

# Start local Supabase instance
supabase start

# Apply migrations
supabase db reset

# Load seed data
supabase db seed
```

### 2. Production Setup

1. Create a new Supabase project at https://supabase.com
2. Copy your project URL and anon key to your environment variables
3. Run migrations through the Supabase dashboard or CLI:

```bash
# Link to your remote project
supabase link --project-ref your-project-ref

# Push migrations to production
supabase db push
```

### 3. Environment Variables

Create a `.env.local` file with the following variables:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

## Migration Files

### 001_initial_schema.sql
- Creates all core tables with proper relationships
- Sets up custom types and enums
- Adds performance indexes
- Implements automatic timestamp triggers

### 002_rls_policies.sql
- Enables Row Level Security on all tables
- Implements role-based access control policies
- Ensures data privacy and security

### 003_functions_and_triggers.sql
- User registration and profile creation automation
- Property occupancy management
- Notification system functions
- Search and analytics functions

## Database Functions

### User Management
- `handle_new_user()` - Automatically creates user records on auth signup
- `handle_user_profile_creation()` - Creates user profiles from metadata
- `get_user_dashboard_stats()` - Generates role-specific dashboard statistics

### Property Management
- `search_properties()` - Advanced property search with filters and geospatial queries
- `update_property_occupancy()` - Maintains accurate occupancy counts
- `calculate_property_rating()` - Computes property ratings and statistics

### Notification System
- `create_notification()` - Creates and delivers notifications
- `notify_reservation_changes()` - Automatic reservation notifications
- `notify_verification_changes()` - Verification status notifications

### Utility Functions
- `can_user_review_property()` - Validates review permissions
- Various trigger functions for data consistency

## Row Level Security Policies

### Security Model
- **Users**: Can view/edit own data, admins can view/edit all
- **Properties**: Public read for active properties, owner/admin write
- **Reservations**: Visible to involved parties (tenant/landlord/admin)
- **Transactions**: Visible to transaction participants and admins
- **Notifications**: Users can only see their own notifications
- **Reviews**: Public read for verified reviews, owner write permissions

### Policy Examples

```sql
-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

-- Verified landlords can insert properties
CREATE POLICY "Verified landlords can insert properties" ON public.properties
    FOR INSERT WITH CHECK (
        landlord_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM public.landlord_verifications lv
            WHERE lv.landlord_id = auth.uid() AND lv.status = 'approved'
        )
    );
```

## Seed Data

The `seed.sql` file contains sample data for development and testing:
- Sample users (admin, landlords, tenants)
- User profiles with contact information
- Approved landlord verifications
- Sample properties in Metro Manila
- Test reservations and transactions
- Sample notifications and reviews

## Performance Considerations

### Indexes
- Geospatial indexes for location-based searches
- Composite indexes for common query patterns
- Foreign key indexes for join performance
- Status and date range indexes for filtering

### Query Optimization
- Use the `search_properties()` function for complex property searches
- Leverage PostGIS for efficient geospatial queries
- Implement pagination for large result sets
- Use appropriate RLS policies to minimize data access

## Security Best Practices

1. **Authentication**: All access goes through Supabase Auth
2. **Authorization**: RLS policies enforce role-based access
3. **Data Validation**: Database constraints prevent invalid data
4. **Audit Trails**: Automatic logging of changes and access
5. **Secure Storage**: File uploads go through Supabase Storage with policies

## Monitoring and Maintenance

### Regular Tasks
- Monitor query performance and optimize slow queries
- Review and update RLS policies as features evolve
- Backup critical data regularly
- Monitor storage usage for files and documents

### Troubleshooting
- Check RLS policies if users can't access expected data
- Verify user roles and verification status for permission issues
- Monitor function execution for performance bottlenecks
- Use Supabase dashboard for real-time monitoring

## Development Workflow

1. **Schema Changes**: Create new migration files for any schema modifications
2. **Testing**: Use seed data to test new features locally
3. **Deployment**: Apply migrations to staging before production
4. **Rollback**: Keep rollback scripts for critical migrations

## Support

For database-related issues:
1. Check the Supabase dashboard for error logs
2. Verify RLS policies and user permissions
3. Review function execution logs
4. Contact the development team for complex issues