-- Roommate Profiles Migration
-- Add roommate_profiles table for shared room functionality

-- Create roommate_profiles table
CREATE TABLE public.roommate_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    avatar TEXT,
    bio TEXT,
    age INTEGER CHECK (age >= 18 AND age <= 100),
    occupation TEXT,
    lifestyle JSONB NOT NULL DEFAULT '{}',
    compatibility JSONB NOT NULL DEFAULT '{}',
    privacy_settings JSONB NOT NULL DEFAULT '{"showFullName": true, "showAge": true, "showOccupation": true, "showBio": true, "showLifestyle": true, "showCompatibility": false, "showContactInfo": false}',
    move_in_date DATE NOT NULL DEFAULT CURRENT_DATE,
    move_out_date DATE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT valid_move_dates CHECK (move_out_date IS NULL OR move_out_date > move_in_date),
    UNIQUE(user_id, property_id, is_active) -- One active profile per user per property
);

-- Create indexes for roommate_profiles
CREATE INDEX idx_roommate_profiles_user_id ON public.roommate_profiles(user_id);
CREATE INDEX idx_roommate_profiles_property_id ON public.roommate_profiles(property_id);
CREATE INDEX idx_roommate_profiles_is_active ON public.roommate_profiles(is_active);
CREATE INDEX idx_roommate_profiles_age ON public.roommate_profiles(age);
CREATE INDEX idx_roommate_profiles_move_in_date ON public.roommate_profiles(move_in_date);

-- Add updated_at trigger to roommate_profiles
CREATE TRIGGER update_roommate_profiles_updated_at 
    BEFORE UPDATE ON public.roommate_profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to update property occupancy when roommate profiles change
CREATE OR REPLACE FUNCTION update_property_occupancy()
RETURNS TRIGGER AS $$
BEGIN
    -- Update current_occupancy based on active roommate profiles
    UPDATE public.properties 
    SET current_occupancy = (
        SELECT COUNT(*) 
        FROM public.roommate_profiles 
        WHERE property_id = COALESCE(NEW.property_id, OLD.property_id) 
        AND is_active = true
    )
    WHERE id = COALESCE(NEW.property_id, OLD.property_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create triggers to automatically update property occupancy
CREATE TRIGGER update_occupancy_on_insert
    AFTER INSERT ON public.roommate_profiles
    FOR EACH ROW EXECUTE FUNCTION update_property_occupancy();

CREATE TRIGGER update_occupancy_on_update
    AFTER UPDATE ON public.roommate_profiles
    FOR EACH ROW EXECUTE FUNCTION update_property_occupancy();

CREATE TRIGGER update_occupancy_on_delete
    AFTER DELETE ON public.roommate_profiles
    FOR EACH ROW EXECUTE FUNCTION update_property_occupancy();

-- Add RLS policies for roommate_profiles
ALTER TABLE public.roommate_profiles ENABLE ROW LEVEL SECURITY;

-- Users can view their own profiles
CREATE POLICY "Users can view own roommate profiles" ON public.roommate_profiles
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own profiles
CREATE POLICY "Users can create own roommate profiles" ON public.roommate_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own profiles
CREATE POLICY "Users can update own roommate profiles" ON public.roommate_profiles
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own profiles
CREATE POLICY "Users can delete own roommate profiles" ON public.roommate_profiles
    FOR DELETE USING (auth.uid() = user_id);

-- Users can view other active roommate profiles for properties they have access to
CREATE POLICY "Users can view roommate profiles for accessible properties" ON public.roommate_profiles
    FOR SELECT USING (
        is_active = true AND (
            -- Property is public and active
            EXISTS (
                SELECT 1 FROM public.properties 
                WHERE id = property_id 
                AND is_active = true
            )
            OR
            -- User is the landlord of the property
            EXISTS (
                SELECT 1 FROM public.properties 
                WHERE id = property_id 
                AND landlord_id = auth.uid()
            )
            OR
            -- User has an active reservation for the property
            EXISTS (
                SELECT 1 FROM public.reservations 
                WHERE property_id = roommate_profiles.property_id 
                AND tenant_id = auth.uid()
                AND status IN ('confirmed', 'pending')
            )
        )
    );

-- Admins can view all roommate profiles
CREATE POLICY "Admins can view all roommate profiles" ON public.roommate_profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Admins can update any roommate profile
CREATE POLICY "Admins can update any roommate profile" ON public.roommate_profiles
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );