-- RoomFindr Database Schema
-- Initial migration to create all core tables

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Create custom types
CREATE TYPE user_role AS ENUM ('admin', 'tenant', 'landlord');
CREATE TYPE verification_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE document_type AS ENUM ('id', 'business_permit', 'property_deed', 'other');
CREATE TYPE room_type AS ENUM ('single', 'shared', 'studio', 'apartment');
CREATE TYPE reservation_status AS ENUM ('pending', 'confirmed', 'cancelled', 'completed');
CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'refunded');
CREATE TYPE transaction_type AS ENUM ('deposit', 'payment', 'refund');
CREATE TYPE transaction_status AS ENUM ('pending', 'completed', 'failed');
CREATE TYPE notification_type AS ENUM ('reservation', 'payment', 'announcement', 'verification');

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    role user_role NOT NULL DEFAULT 'tenant',
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_verified BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- User profiles table
CREATE TABLE public.user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    phone TEXT,
    avatar TEXT,
    bio TEXT,
    preferences JSONB DEFAULT '{"notifications": true, "emailUpdates": true, "theme": "light"}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Landlord verification table
CREATE TABLE public.landlord_verifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    landlord_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    status verification_status NOT NULL DEFAULT 'pending',
    reviewed_by UUID REFERENCES public.users(id),
    reviewed_at TIMESTAMPTZ,
    feedback TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Verification documents table
CREATE TABLE public.verification_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    verification_id UUID NOT NULL REFERENCES public.landlord_verifications(id) ON DELETE CASCADE,
    document_type document_type NOT NULL,
    filename TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER,
    mime_type TEXT,
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Properties table
CREATE TABLE public.properties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    landlord_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    street TEXT NOT NULL,
    city TEXT NOT NULL,
    province TEXT NOT NULL,
    postal_code TEXT NOT NULL,
    coordinates GEOGRAPHY(POINT, 4326),
    room_type room_type NOT NULL,
    price DECIMAL(10,2) NOT NULL CHECK (price > 0),
    deposit DECIMAL(10,2) NOT NULL CHECK (deposit >= 0),
    amenities TEXT[] DEFAULT '{}',
    images TEXT[] DEFAULT '{}',
    max_occupancy INTEGER NOT NULL DEFAULT 1 CHECK (max_occupancy > 0),
    current_occupancy INTEGER NOT NULL DEFAULT 0 CHECK (current_occupancy >= 0),
    availability_start_date DATE,
    availability_end_date DATE,
    available_days TEXT[] DEFAULT '{"monday","tuesday","wednesday","thursday","friday","saturday","sunday"}',
    pet_policy TEXT DEFAULT '',
    smoking_policy TEXT DEFAULT '',
    guest_policy TEXT DEFAULT '',
    cleaning_policy TEXT DEFAULT '',
    cancellation_policy TEXT DEFAULT '',
    custom_policies TEXT[] DEFAULT '{}',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT valid_occupancy CHECK (current_occupancy <= max_occupancy)
);

-- Reservations table
CREATE TABLE public.reservations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    landlord_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE,
    status reservation_status NOT NULL DEFAULT 'pending',
    payment_status payment_status NOT NULL DEFAULT 'pending',
    total_amount DECIMAL(10,2) NOT NULL CHECK (total_amount > 0),
    deposit_amount DECIMAL(10,2) NOT NULL CHECK (deposit_amount >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT valid_date_range CHECK (end_date IS NULL OR end_date > start_date)
);

-- Transactions table
CREATE TABLE public.transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reservation_id UUID NOT NULL REFERENCES public.reservations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    transaction_type transaction_type NOT NULL,
    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    status transaction_status NOT NULL DEFAULT 'pending',
    payment_method TEXT NOT NULL,
    payment_reference TEXT,
    transaction_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Notifications table
CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    notification_type notification_type NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT false,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Reviews table
CREATE TABLE public.reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    landlord_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT NOT NULL,
    is_verified BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(property_id, tenant_id) -- One review per tenant per property
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_role ON public.users(role);
CREATE INDEX idx_user_profiles_user_id ON public.user_profiles(user_id);
CREATE INDEX idx_landlord_verifications_landlord_id ON public.landlord_verifications(landlord_id);
CREATE INDEX idx_landlord_verifications_status ON public.landlord_verifications(status);
CREATE INDEX idx_properties_landlord_id ON public.properties(landlord_id);
CREATE INDEX idx_properties_city ON public.properties(city);
CREATE INDEX idx_properties_room_type ON public.properties(room_type);
CREATE INDEX idx_properties_price ON public.properties(price);
CREATE INDEX idx_properties_is_active ON public.properties(is_active);
CREATE INDEX idx_properties_coordinates ON public.properties USING GIST(coordinates);
CREATE INDEX idx_reservations_property_id ON public.reservations(property_id);
CREATE INDEX idx_reservations_tenant_id ON public.reservations(tenant_id);
CREATE INDEX idx_reservations_landlord_id ON public.reservations(landlord_id);
CREATE INDEX idx_reservations_status ON public.reservations(status);
CREATE INDEX idx_reservations_dates ON public.reservations(start_date, end_date);
CREATE INDEX idx_transactions_reservation_id ON public.transactions(reservation_id);
CREATE INDEX idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX idx_reviews_property_id ON public.reviews(property_id);
CREATE INDEX idx_reviews_tenant_id ON public.reviews(tenant_id);
CREATE INDEX idx_reviews_rating ON public.reviews(rating);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers to relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON public.user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_landlord_verifications_updated_at BEFORE UPDATE ON public.landlord_verifications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_properties_updated_at BEFORE UPDATE ON public.properties FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reservations_updated_at BEFORE UPDATE ON public.reservations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON public.transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON public.reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();