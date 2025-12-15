-- Policy System Migration
-- This migration adds tables for custom policy management

-- Policy Templates table
CREATE TABLE IF NOT EXISTS policy_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN (
        'rental_terms', 'house_rules', 'maintenance', 'security', 
        'utilities', 'guest_policy', 'pet_policy', 'smoking_policy', 
        'cleaning_policy', 'cancellation_policy', 'custom'
    )),
    default_value TEXT DEFAULT '',
    is_system_template BOOLEAN DEFAULT FALSE,
    landlord_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Property Policies table (links properties to policy templates)
CREATE TABLE IF NOT EXISTS property_policies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    policy_id UUID NOT NULL REFERENCES policy_templates(id) ON DELETE CASCADE,
    custom_value TEXT, -- Custom value for this property, overrides template default
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(property_id, policy_id)
);

-- Policy Updates table (tracks changes to policies for notifications)
CREATE TABLE IF NOT EXISTS policy_updates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    policy_id UUID NOT NULL REFERENCES policy_templates(id) ON DELETE CASCADE,
    old_value TEXT NOT NULL,
    new_value TEXT NOT NULL,
    updated_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notification_sent BOOLEAN DEFAULT FALSE
);

-- Rental Agreements table (integrates policies into rental agreements)
CREATE TABLE IF NOT EXISTS rental_agreements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    reservation_id UUID NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    landlord_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    policies JSONB NOT NULL DEFAULT '[]',
    terms_accepted BOOLEAN DEFAULT FALSE,
    accepted_at TIMESTAMP WITH TIME ZONE,
    accepted_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(reservation_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_policy_templates_landlord_id ON policy_templates(landlord_id);
CREATE INDEX IF NOT EXISTS idx_policy_templates_category ON policy_templates(category);
CREATE INDEX IF NOT EXISTS idx_policy_templates_system ON policy_templates(is_system_template);

CREATE INDEX IF NOT EXISTS idx_property_policies_property_id ON property_policies(property_id);
CREATE INDEX IF NOT EXISTS idx_property_policies_policy_id ON property_policies(policy_id);
CREATE INDEX IF NOT EXISTS idx_property_policies_active ON property_policies(is_active);

CREATE INDEX IF NOT EXISTS idx_policy_updates_property_id ON policy_updates(property_id);
CREATE INDEX IF NOT EXISTS idx_policy_updates_updated_at ON policy_updates(updated_at);
CREATE INDEX IF NOT EXISTS idx_policy_updates_notification_sent ON policy_updates(notification_sent);

CREATE INDEX IF NOT EXISTS idx_rental_agreements_reservation_id ON rental_agreements(reservation_id);
CREATE INDEX IF NOT EXISTS idx_rental_agreements_property_id ON rental_agreements(property_id);
CREATE INDEX IF NOT EXISTS idx_rental_agreements_tenant_id ON rental_agreements(tenant_id);

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_policy_templates_updated_at 
    BEFORE UPDATE ON policy_templates 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_property_policies_updated_at 
    BEFORE UPDATE ON property_policies 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rental_agreements_updated_at 
    BEFORE UPDATE ON rental_agreements 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies
ALTER TABLE policy_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE policy_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE rental_agreements ENABLE ROW LEVEL SECURITY;

-- Policy Templates RLS
CREATE POLICY "Users can view system templates and their own templates" ON policy_templates
    FOR SELECT USING (
        is_system_template = TRUE OR 
        landlord_id = auth.uid()
    );

CREATE POLICY "Landlords can create their own templates" ON policy_templates
    FOR INSERT WITH CHECK (
        auth.uid() IN (SELECT id FROM users WHERE role = 'landlord') AND
        landlord_id = auth.uid()
    );

CREATE POLICY "Landlords can update their own templates" ON policy_templates
    FOR UPDATE USING (
        landlord_id = auth.uid() AND
        is_system_template = FALSE
    );

CREATE POLICY "Landlords can delete their own templates" ON policy_templates
    FOR DELETE USING (
        landlord_id = auth.uid() AND
        is_system_template = FALSE
    );

-- Property Policies RLS
CREATE POLICY "Users can view policies for properties they have access to" ON property_policies
    FOR SELECT USING (
        property_id IN (
            SELECT id FROM properties WHERE landlord_id = auth.uid()
        ) OR
        property_id IN (
            SELECT property_id FROM reservations WHERE tenant_id = auth.uid()
        )
    );

CREATE POLICY "Landlords can manage policies for their properties" ON property_policies
    FOR ALL USING (
        property_id IN (
            SELECT id FROM properties WHERE landlord_id = auth.uid()
        )
    );

-- Policy Updates RLS
CREATE POLICY "Users can view policy updates for relevant properties" ON policy_updates
    FOR SELECT USING (
        property_id IN (
            SELECT id FROM properties WHERE landlord_id = auth.uid()
        ) OR
        property_id IN (
            SELECT property_id FROM reservations WHERE tenant_id = auth.uid()
        )
    );

CREATE POLICY "Landlords can create policy updates for their properties" ON policy_updates
    FOR INSERT WITH CHECK (
        property_id IN (
            SELECT id FROM properties WHERE landlord_id = auth.uid()
        )
    );

-- Rental Agreements RLS
CREATE POLICY "Users can view their own rental agreements" ON rental_agreements
    FOR SELECT USING (
        tenant_id = auth.uid() OR 
        landlord_id = auth.uid()
    );

CREATE POLICY "Landlords can create rental agreements for their properties" ON rental_agreements
    FOR INSERT WITH CHECK (
        landlord_id = auth.uid() AND
        property_id IN (
            SELECT id FROM properties WHERE landlord_id = auth.uid()
        )
    );

CREATE POLICY "Tenants can update their rental agreements" ON rental_agreements
    FOR UPDATE USING (tenant_id = auth.uid());

-- Insert system policy templates
INSERT INTO policy_templates (title, description, category, default_value, is_system_template) VALUES
    ('Pet Policy', 'Rules regarding pets in the property', 'pet_policy', 'No pets allowed', TRUE),
    ('Smoking Policy', 'Rules regarding smoking in the property', 'smoking_policy', 'No smoking inside the property', TRUE),
    ('Guest Policy', 'Rules regarding guests and visitors', 'guest_policy', 'Guests allowed until 10 PM with prior notice', TRUE),
    ('Cleaning Policy', 'Cleaning responsibilities and requirements', 'cleaning_policy', 'Tenant responsible for regular cleaning, deep cleaning upon move-out', TRUE),
    ('Cancellation Policy', 'Terms for reservation cancellation', 'cancellation_policy', '48-hour notice required for cancellation', TRUE),
    ('Noise Policy', 'Rules regarding noise levels', 'house_rules', 'Quiet hours from 10 PM to 7 AM', TRUE),
    ('Utility Policy', 'Utility usage and payment terms', 'utilities', 'Utilities included up to reasonable usage limits', TRUE),
    ('Security Deposit', 'Security deposit terms and conditions', 'rental_terms', 'Security deposit equal to one month rent, refundable upon satisfactory inspection', TRUE),
    ('Maintenance Policy', 'Maintenance and repair responsibilities', 'maintenance', 'Landlord responsible for major repairs, tenant responsible for minor maintenance', TRUE),
    ('Key Policy', 'Key management and security rules', 'security', 'No duplicate keys without permission, lost keys incur replacement fee', TRUE)
ON CONFLICT DO NOTHING;