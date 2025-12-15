-- Database Functions and Triggers for RoomFindr
-- This migration creates utility functions and triggers for business logic

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, role)
    VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'role', 'tenant')::user_role);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create user record on auth.users insert
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to create user profile after user creation
CREATE OR REPLACE FUNCTION public.handle_user_profile_creation()
RETURNS TRIGGER AS $$
BEGIN
    -- Only create profile if user metadata contains profile info
    IF NEW.raw_user_meta_data ? 'firstName' AND NEW.raw_user_meta_data ? 'lastName' THEN
        INSERT INTO public.user_profiles (user_id, first_name, last_name, phone)
        VALUES (
            NEW.id,
            NEW.raw_user_meta_data->>'firstName',
            NEW.raw_user_meta_data->>'lastName',
            NEW.raw_user_meta_data->>'phone'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user profile after user record creation
CREATE TRIGGER on_user_created
    AFTER INSERT ON public.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_user_profile_creation();

-- Function to update property occupancy when reservation status changes
CREATE OR REPLACE FUNCTION public.update_property_occupancy()
RETURNS TRIGGER AS $$
BEGIN
    -- Handle reservation confirmation
    IF NEW.status = 'confirmed' AND (OLD.status IS NULL OR OLD.status != 'confirmed') THEN
        UPDATE public.properties 
        SET current_occupancy = current_occupancy + 1
        WHERE id = NEW.property_id;
    END IF;
    
    -- Handle reservation cancellation or completion
    IF OLD.status = 'confirmed' AND NEW.status IN ('cancelled', 'completed') THEN
        UPDATE public.properties 
        SET current_occupancy = GREATEST(0, current_occupancy - 1)
        WHERE id = NEW.property_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update property occupancy
CREATE TRIGGER on_reservation_status_change
    AFTER UPDATE ON public.reservations
    FOR EACH ROW EXECUTE FUNCTION public.update_property_occupancy();

-- Function to create notification
CREATE OR REPLACE FUNCTION public.create_notification(
    p_user_id UUID,
    p_type notification_type,
    p_title TEXT,
    p_message TEXT,
    p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
    notification_id UUID;
BEGIN
    INSERT INTO public.notifications (user_id, notification_type, title, message, metadata)
    VALUES (p_user_id, p_type, p_title, p_message, p_metadata)
    RETURNING id INTO notification_id;
    
    RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to notify on reservation changes
CREATE OR REPLACE FUNCTION public.notify_reservation_changes()
RETURNS TRIGGER AS $$
BEGIN
    -- Notify tenant on status change
    IF NEW.status != COALESCE(OLD.status, 'pending') THEN
        PERFORM public.create_notification(
            NEW.tenant_id,
            'reservation',
            'Reservation Status Updated',
            'Your reservation status has been updated to: ' || NEW.status,
            jsonb_build_object('reservation_id', NEW.id, 'status', NEW.status)
        );
    END IF;
    
    -- Notify landlord on new reservation
    IF OLD IS NULL THEN
        PERFORM public.create_notification(
            NEW.landlord_id,
            'reservation',
            'New Reservation Request',
            'You have received a new reservation request for your property.',
            jsonb_build_object('reservation_id', NEW.id, 'property_id', NEW.property_id)
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for reservation notifications
CREATE TRIGGER on_reservation_change
    AFTER INSERT OR UPDATE ON public.reservations
    FOR EACH ROW EXECUTE FUNCTION public.notify_reservation_changes();

-- Function to notify on verification status changes
CREATE OR REPLACE FUNCTION public.notify_verification_changes()
RETURNS TRIGGER AS $$
BEGIN
    -- Notify landlord on verification status change
    IF NEW.status != COALESCE(OLD.status, 'pending') THEN
        PERFORM public.create_notification(
            NEW.landlord_id,
            'verification',
            'Verification Status Updated',
            'Your landlord verification status has been updated to: ' || NEW.status,
            jsonb_build_object('verification_id', NEW.id, 'status', NEW.status)
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for verification notifications
CREATE TRIGGER on_verification_change
    AFTER UPDATE ON public.landlord_verifications
    FOR EACH ROW EXECUTE FUNCTION public.notify_verification_changes();

-- Function to search properties with filters
CREATE OR REPLACE FUNCTION public.search_properties(
    p_price_min DECIMAL DEFAULT NULL,
    p_price_max DECIMAL DEFAULT NULL,
    p_city TEXT DEFAULT NULL,
    p_province TEXT DEFAULT NULL,
    p_room_types room_type[] DEFAULT NULL,
    p_amenities TEXT[] DEFAULT NULL,
    p_lat DECIMAL DEFAULT NULL,
    p_lng DECIMAL DEFAULT NULL,
    p_radius_km DECIMAL DEFAULT NULL,
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    title TEXT,
    description TEXT,
    street TEXT,
    city TEXT,
    province TEXT,
    room_type room_type,
    price DECIMAL,
    deposit DECIMAL,
    amenities TEXT[],
    images TEXT[],
    max_occupancy INTEGER,
    current_occupancy INTEGER,
    distance_km DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.title,
        p.description,
        p.street,
        p.city,
        p.province,
        p.room_type,
        p.price,
        p.deposit,
        p.amenities,
        p.images,
        p.max_occupancy,
        p.current_occupancy,
        CASE 
            WHEN p_lat IS NOT NULL AND p_lng IS NOT NULL AND p.coordinates IS NOT NULL THEN
                ST_Distance(
                    p.coordinates::geometry,
                    ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geometry
                ) / 1000.0
            ELSE NULL
        END as distance_km
    FROM public.properties p
    WHERE p.is_active = true
        AND p.current_occupancy < p.max_occupancy
        AND (p_price_min IS NULL OR p.price >= p_price_min)
        AND (p_price_max IS NULL OR p.price <= p_price_max)
        AND (p_city IS NULL OR p.city ILIKE '%' || p_city || '%')
        AND (p_province IS NULL OR p.province ILIKE '%' || p_province || '%')
        AND (p_room_types IS NULL OR p.room_type = ANY(p_room_types))
        AND (p_amenities IS NULL OR p.amenities && p_amenities)
        AND (
            p_lat IS NULL OR p_lng IS NULL or p_radius_km IS NULL OR p.coordinates IS NULL OR
            ST_DWithin(
                p.coordinates::geometry,
                ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geometry,
                p_radius_km * 1000
            )
        )
    ORDER BY 
        CASE WHEN p_lat IS NOT NULL AND p_lng IS NOT NULL THEN distance_km END ASC NULLS LAST,
        p.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user dashboard stats
CREATE OR REPLACE FUNCTION public.get_user_dashboard_stats(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
    user_role_val user_role;
    stats JSONB := '{}';
BEGIN
    -- Get user role
    SELECT role INTO user_role_val FROM public.users WHERE id = p_user_id;
    
    IF user_role_val = 'tenant' THEN
        -- Tenant stats
        SELECT jsonb_build_object(
            'active_reservations', COUNT(*) FILTER (WHERE status IN ('pending', 'confirmed')),
            'completed_reservations', COUNT(*) FILTER (WHERE status = 'completed'),
            'total_spent', COALESCE(SUM(total_amount) FILTER (WHERE status = 'completed'), 0)
        ) INTO stats
        FROM public.reservations
        WHERE tenant_id = p_user_id;
        
    ELSIF user_role_val = 'landlord' THEN
        -- Landlord stats
        SELECT jsonb_build_object(
            'total_properties', COUNT(DISTINCT p.id),
            'active_properties', COUNT(DISTINCT p.id) FILTER (WHERE p.is_active = true),
            'total_reservations', COUNT(r.id),
            'pending_reservations', COUNT(r.id) FILTER (WHERE r.status = 'pending'),
            'total_earnings', COALESCE(SUM(r.total_amount) FILTER (WHERE r.status = 'completed'), 0)
        ) INTO stats
        FROM public.properties p
        LEFT JOIN public.reservations r ON p.id = r.property_id
        WHERE p.landlord_id = p_user_id;
        
    ELSIF user_role_val = 'admin' THEN
        -- Admin stats
        SELECT jsonb_build_object(
            'total_users', (SELECT COUNT(*) FROM public.users),
            'total_properties', (SELECT COUNT(*) FROM public.properties),
            'pending_verifications', (SELECT COUNT(*) FROM public.landlord_verifications WHERE status = 'pending'),
            'total_reservations', (SELECT COUNT(*) FROM public.reservations),
            'total_transactions', (SELECT COUNT(*) FROM public.transactions)
        ) INTO stats;
    END IF;
    
    RETURN stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate property rating
CREATE OR REPLACE FUNCTION public.calculate_property_rating(p_property_id UUID)
RETURNS JSONB AS $$
DECLARE
    rating_stats JSONB;
BEGIN
    SELECT jsonb_build_object(
        'average_rating', COALESCE(ROUND(AVG(rating)::numeric, 2), 0),
        'total_reviews', COUNT(*),
        'rating_distribution', jsonb_build_object(
            '5_star', COUNT(*) FILTER (WHERE rating = 5),
            '4_star', COUNT(*) FILTER (WHERE rating = 4),
            '3_star', COUNT(*) FILTER (WHERE rating = 3),
            '2_star', COUNT(*) FILTER (WHERE rating = 2),
            '1_star', COUNT(*) FILTER (WHERE rating = 1)
        )
    ) INTO rating_stats
    FROM public.reviews
    WHERE property_id = p_property_id AND is_verified = true;
    
    RETURN rating_stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user can review property
CREATE OR REPLACE FUNCTION public.can_user_review_property(p_user_id UUID, p_property_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- Check if user has completed reservation for this property and hasn't reviewed yet
    RETURN EXISTS (
        SELECT 1 FROM public.reservations r
        WHERE r.tenant_id = p_user_id 
        AND r.property_id = p_property_id 
        AND r.status = 'completed'
    ) AND NOT EXISTS (
        SELECT 1 FROM public.reviews rv
        WHERE rv.tenant_id = p_user_id 
        AND rv.property_id = p_property_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
--
 Function to increment property occupancy (used by reservation service)
CREATE OR REPLACE FUNCTION public.increment_property_occupancy(property_id UUID)
RETURNS VOID AS $
BEGIN
    UPDATE public.properties 
    SET current_occupancy = current_occupancy + 1
    WHERE id = property_id;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to decrement property occupancy
CREATE OR REPLACE FUNCTION public.decrement_property_occupancy(property_id UUID)
RETURNS VOID AS $
BEGIN
    UPDATE public.properties 
    SET current_occupancy = GREATEST(0, current_occupancy - 1)
    WHERE id = property_id;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;