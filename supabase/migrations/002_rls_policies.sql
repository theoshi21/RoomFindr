-- Row Level Security (RLS) Policies for RoomFindr
-- This migration sets up comprehensive RLS policies for all tables

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.landlord_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Users table policies
-- Users can read their own record and admins can read all
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can view all users" ON public.users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Users can update their own record
CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- Admins can update any user
CREATE POLICY "Admins can update any user" ON public.users
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- New users can insert their own record (handled by trigger)
CREATE POLICY "Users can insert own record" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- User profiles table policies
-- Users can view their own profile and admins can view all
CREATE POLICY "Users can view own user profile" ON public.user_profiles
    FOR SELECT USING (
        user_id = auth.uid() OR 
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Users can insert their own profile
CREATE POLICY "Users can insert own user profile" ON public.user_profiles
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Users can update their own profile
CREATE POLICY "Users can update own user profile" ON public.user_profiles
    FOR UPDATE USING (user_id = auth.uid());

-- Landlord verifications table policies
-- Landlords can view their own verification, admins can view all
CREATE POLICY "Landlords can view own verification" ON public.landlord_verifications
    FOR SELECT USING (
        landlord_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Landlords can insert their own verification
CREATE POLICY "Landlords can insert own verification" ON public.landlord_verifications
    FOR INSERT WITH CHECK (
        landlord_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'landlord'
        )
    );

-- Only admins can update verifications (approve/reject)
CREATE POLICY "Admins can update verifications" ON public.landlord_verifications
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Verification documents table policies
-- Landlords can view their own documents, admins can view all
CREATE POLICY "Landlords can view own verification documents" ON public.verification_documents
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.landlord_verifications lv
            WHERE lv.id = verification_id AND lv.landlord_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Landlords can insert documents for their own verification
CREATE POLICY "Landlords can insert own verification documents" ON public.verification_documents
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.landlord_verifications lv
            WHERE lv.id = verification_id AND lv.landlord_id = auth.uid()
        )
    );

-- Properties table policies
-- Everyone can view active properties
CREATE POLICY "Anyone can view active properties" ON public.properties
    FOR SELECT USING (is_active = true);

-- Landlords can view their own properties (including inactive)
CREATE POLICY "Landlords can view own properties" ON public.properties
    FOR SELECT USING (landlord_id = auth.uid());

-- Admins can view all properties
CREATE POLICY "Admins can view all properties" ON public.properties
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Verified landlords can insert properties
CREATE POLICY "Verified landlords can insert properties" ON public.properties
    FOR INSERT WITH CHECK (
        landlord_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM public.users u
            JOIN public.landlord_verifications lv ON u.id = lv.landlord_id
            WHERE u.id = auth.uid() AND u.role = 'landlord' AND lv.status = 'approved'
        )
    );

-- Landlords can update their own properties
CREATE POLICY "Landlords can update own properties" ON public.properties
    FOR UPDATE USING (landlord_id = auth.uid());

-- Admins can update any property
CREATE POLICY "Admins can update any property" ON public.properties
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Reservations table policies
-- Users can view reservations they're involved in
CREATE POLICY "Users can view own reservations" ON public.reservations
    FOR SELECT USING (
        tenant_id = auth.uid() OR 
        landlord_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Tenants can insert reservations
CREATE POLICY "Tenants can insert reservations" ON public.reservations
    FOR INSERT WITH CHECK (
        tenant_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role IN ('tenant', 'landlord')
        )
    );

-- Landlords can update reservations for their properties
CREATE POLICY "Landlords can update own property reservations" ON public.reservations
    FOR UPDATE USING (landlord_id = auth.uid());

-- Tenants can update their own reservations (for cancellation)
CREATE POLICY "Tenants can update own reservations" ON public.reservations
    FOR UPDATE USING (tenant_id = auth.uid());

-- Admins can update any reservation
CREATE POLICY "Admins can update any reservation" ON public.reservations
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Transactions table policies
-- Users can view their own transactions
CREATE POLICY "Users can view own transactions" ON public.transactions
    FOR SELECT USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.reservations r
            WHERE r.id = reservation_id AND (r.tenant_id = auth.uid() OR r.landlord_id = auth.uid())
        ) OR
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- System can insert transactions (handled by functions)
CREATE POLICY "System can insert transactions" ON public.transactions
    FOR INSERT WITH CHECK (true);

-- Only admins can update transactions
CREATE POLICY "Admins can update transactions" ON public.transactions
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Notifications table policies
-- Users can view their own notifications
CREATE POLICY "Users can view own notifications" ON public.notifications
    FOR SELECT USING (user_id = auth.uid());

-- System can insert notifications (handled by functions)
CREATE POLICY "System can insert notifications" ON public.notifications
    FOR INSERT WITH CHECK (true);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications" ON public.notifications
    FOR UPDATE USING (user_id = auth.uid());

-- Reviews table policies
-- Everyone can view verified reviews
CREATE POLICY "Anyone can view verified reviews" ON public.reviews
    FOR SELECT USING (is_verified = true);

-- Users can view their own reviews (verified or not)
CREATE POLICY "Users can view own reviews" ON public.reviews
    FOR SELECT USING (
        tenant_id = auth.uid() OR 
        landlord_id = auth.uid()
    );

-- Admins can view all reviews
CREATE POLICY "Admins can view all reviews" ON public.reviews
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Tenants can insert reviews for properties they've reserved
CREATE POLICY "Tenants can insert reviews for reserved properties" ON public.reviews
    FOR INSERT WITH CHECK (
        tenant_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM public.reservations r
            WHERE r.property_id = property_id 
            AND r.tenant_id = auth.uid() 
            AND r.status = 'completed'
        )
    );

-- Tenants can update their own reviews
CREATE POLICY "Tenants can update own reviews" ON public.reviews
    FOR UPDATE USING (tenant_id = auth.uid());

-- Admins can update any review (for moderation)
CREATE POLICY "Admins can update any review" ON public.reviews
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );