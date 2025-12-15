import { supabase } from '@/lib/supabase';
import { notificationService } from '@/lib/notification';
import type { 
  CustomPolicy, 
  PropertyPolicy, 
  PolicyTemplate, 
  PolicyUpdate,
  PolicyFormData,
  PropertyPolicyFormData,
  PolicyCategory,
  RentalAgreement,
  RentalAgreementPolicy
} from '@/types/policy';

export interface PolicyAPI {
  // Policy Template Management
  createPolicyTemplate(data: PolicyFormData): Promise<PolicyTemplate>;
  updatePolicyTemplate(id: string, data: Partial<PolicyFormData>): Promise<PolicyTemplate>;
  deletePolicyTemplate(id: string): Promise<void>;
  getPolicyTemplates(landlordId?: string): Promise<PolicyTemplate[]>;
  getSystemPolicyTemplates(): Promise<PolicyTemplate[]>;

  // Property Policy Management
  addPolicyToProperty(propertyId: string, data: PropertyPolicyFormData): Promise<PropertyPolicy>;
  updatePropertyPolicy(id: string, data: Partial<PropertyPolicyFormData>): Promise<PropertyPolicy>;
  removePropertyPolicy(id: string): Promise<void>;
  getPropertyPolicies(propertyId: string): Promise<PropertyPolicy[]>;

  // Policy Updates and Notifications
  updatePolicyValue(policyId: string, newValue: string): Promise<PolicyUpdate>;
  getPolicyUpdates(propertyId: string): Promise<PolicyUpdate[]>;
  notifyTenantsOfPolicyUpdate(propertyId: string, policyUpdate: PolicyUpdate): Promise<void>;

  // Rental Agreement Integration
  createRentalAgreement(reservationId: string): Promise<RentalAgreement>;
  acceptRentalAgreement(agreementId: string): Promise<RentalAgreement>;
  getRentalAgreement(reservationId: string): Promise<RentalAgreement | null>;
}

export class PolicyService implements PolicyAPI {
  // Policy Template Management
  async createPolicyTemplate(data: PolicyFormData): Promise<PolicyTemplate> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Check if user is a landlord
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userError || !userData || userData.role !== 'landlord') {
      throw new Error('Only landlords can create policy templates');
    }

    const templateData = {
      title: data.title,
      description: data.description,
      category: data.category,
      default_value: data.defaultValue || '',
      is_system_template: false,
      landlord_id: user.id
    };

    const { data: template, error } = await supabase
      .from('policy_templates')
      .insert(templateData)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create policy template: ${error.message}`);
    }

    return this.mapDatabaseToPolicyTemplate(template);
  }

  async updatePolicyTemplate(id: string, data: Partial<PolicyFormData>): Promise<PolicyTemplate> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Check ownership
    const { data: template, error: templateError } = await supabase
      .from('policy_templates')
      .select('landlord_id, is_system_template')
      .eq('id', id)
      .single();

    if (templateError || !template) {
      throw new Error('Policy template not found');
    }

    if (template.is_system_template || template.landlord_id !== user.id) {
      throw new Error('Cannot modify this policy template');
    }

    const updateData: any = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.defaultValue !== undefined) updateData.default_value = data.defaultValue;

    const { data: updatedTemplate, error } = await supabase
      .from('policy_templates')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update policy template: ${error.message}`);
    }

    return this.mapDatabaseToPolicyTemplate(updatedTemplate);
  }

  async deletePolicyTemplate(id: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Check ownership
    const { data: template, error: templateError } = await supabase
      .from('policy_templates')
      .select('landlord_id, is_system_template')
      .eq('id', id)
      .single();

    if (templateError || !template) {
      throw new Error('Policy template not found');
    }

    if (template.is_system_template || template.landlord_id !== user.id) {
      throw new Error('Cannot delete this policy template');
    }

    const { error } = await supabase
      .from('policy_templates')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete policy template: ${error.message}`);
    }
  }

  async getPolicyTemplates(landlordId?: string): Promise<PolicyTemplate[]> {
    let query = supabase
      .from('policy_templates')
      .select('*');

    if (landlordId) {
      query = query.or(`landlord_id.eq.${landlordId},is_system_template.eq.true`);
    } else {
      query = query.eq('is_system_template', true);
    }

    const { data, error } = await query.order('category', { ascending: true });

    if (error) {
      throw new Error(`Failed to get policy templates: ${error.message}`);
    }

    return (data || []).map(this.mapDatabaseToPolicyTemplate);
  }

  async getSystemPolicyTemplates(): Promise<PolicyTemplate[]> {
    const { data, error } = await supabase
      .from('policy_templates')
      .select('*')
      .eq('is_system_template', true)
      .order('category', { ascending: true });

    if (error) {
      throw new Error(`Failed to get system policy templates: ${error.message}`);
    }

    return (data || []).map(this.mapDatabaseToPolicyTemplate);
  }

  // Property Policy Management
  async addPolicyToProperty(propertyId: string, data: PropertyPolicyFormData): Promise<PropertyPolicy> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Check if user owns the property
    const { data: property, error: propertyError } = await supabase
      .from('properties')
      .select('landlord_id')
      .eq('id', propertyId)
      .single();

    if (propertyError || !property || property.landlord_id !== user.id) {
      throw new Error('Property not found or access denied');
    }

    const policyData = {
      property_id: propertyId,
      policy_id: data.policyId,
      custom_value: data.customValue,
      is_active: data.isActive
    };

    const { data: propertyPolicy, error } = await supabase
      .from('property_policies')
      .insert(policyData)
      .select(`
        *,
        policy_templates (*)
      `)
      .single();

    if (error) {
      throw new Error(`Failed to add policy to property: ${error.message}`);
    }

    return this.mapDatabaseToPropertyPolicy(propertyPolicy);
  }

  async updatePropertyPolicy(id: string, data: Partial<PropertyPolicyFormData>): Promise<PropertyPolicy> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Check ownership through property
    const { data: propertyPolicy, error: policyError } = await supabase
      .from('property_policies')
      .select(`
        *,
        properties!inner(landlord_id)
      `)
      .eq('id', id)
      .single();

    if (policyError || !propertyPolicy || propertyPolicy.properties.landlord_id !== user.id) {
      throw new Error('Property policy not found or access denied');
    }

    const updateData: any = {};
    if (data.customValue !== undefined) updateData.custom_value = data.customValue;
    if (data.isActive !== undefined) updateData.is_active = data.isActive;

    // Track policy update for notifications
    if (data.customValue !== undefined && data.customValue !== propertyPolicy.custom_value) {
      await this.createPolicyUpdate(
        propertyPolicy.property_id,
        propertyPolicy.policy_id,
        propertyPolicy.custom_value || '',
        data.customValue,
        user.id
      );
    }

    const { data: updatedPolicy, error } = await supabase
      .from('property_policies')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        policy_templates (*)
      `)
      .single();

    if (error) {
      throw new Error(`Failed to update property policy: ${error.message}`);
    }

    return this.mapDatabaseToPropertyPolicy(updatedPolicy);
  }

  async removePropertyPolicy(id: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Check ownership through property
    const { data: propertyPolicy, error: policyError } = await supabase
      .from('property_policies')
      .select(`
        *,
        properties!inner(landlord_id)
      `)
      .eq('id', id)
      .single();

    if (policyError || !propertyPolicy || propertyPolicy.properties.landlord_id !== user.id) {
      throw new Error('Property policy not found or access denied');
    }

    const { error } = await supabase
      .from('property_policies')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to remove property policy: ${error.message}`);
    }
  }

  async getPropertyPolicies(propertyId: string): Promise<PropertyPolicy[]> {
    const { data, error } = await supabase
      .from('property_policies')
      .select(`
        *,
        policy_templates (*)
      `)
      .eq('property_id', propertyId)
      .eq('is_active', true)
      .order('created_at', { ascending: true });

    if (error) {
      throw new Error(`Failed to get property policies: ${error.message}`);
    }

    return (data || []).map(this.mapDatabaseToPropertyPolicy);
  }

  // Policy Updates and Notifications
  async updatePolicyValue(policyId: string, newValue: string): Promise<PolicyUpdate> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Get current policy value
    const { data: propertyPolicy, error: policyError } = await supabase
      .from('property_policies')
      .select(`
        *,
        properties!inner(landlord_id)
      `)
      .eq('id', policyId)
      .single();

    if (policyError || !propertyPolicy || propertyPolicy.properties.landlord_id !== user.id) {
      throw new Error('Property policy not found or access denied');
    }

    const oldValue = propertyPolicy.custom_value || '';
    
    // Update the policy
    await this.updatePropertyPolicy(policyId, { customValue: newValue });

    // Create policy update record
    return this.createPolicyUpdate(
      propertyPolicy.property_id,
      propertyPolicy.policy_id,
      oldValue,
      newValue,
      user.id
    );
  }

  async getPolicyUpdates(propertyId: string): Promise<PolicyUpdate[]> {
    const { data, error } = await supabase
      .from('policy_updates')
      .select('*')
      .eq('property_id', propertyId)
      .order('updated_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to get policy updates: ${error.message}`);
    }

    return (data || []).map(this.mapDatabaseToPolicyUpdate);
  }

  async notifyTenantsOfPolicyUpdate(propertyId: string, policyUpdate: PolicyUpdate): Promise<void> {
    // Get all current tenants for this property
    const { data: reservations, error } = await supabase
      .from('reservations')
      .select('tenant_id')
      .eq('property_id', propertyId)
      .in('status', ['confirmed', 'pending']);

    if (error) {
      throw new Error(`Failed to get tenants for notification: ${error.message}`);
    }

    const tenantIds = [...new Set(reservations?.map(r => r.tenant_id) || [])];

    // Send notifications to all tenants
    for (const tenantId of tenantIds) {
      await notificationService.createNotification({
        userId: tenantId,
        type: 'announcement',
        title: 'Property Policy Updated',
        message: `A policy has been updated for your rental property. Please review the changes.`,
        metadata: {
          propertyId,
          policyUpdateId: policyUpdate.id,
          policyId: policyUpdate.policyId
        }
      });
    }

    // Mark notification as sent
    await supabase
      .from('policy_updates')
      .update({ notification_sent: true })
      .eq('id', policyUpdate.id);
  }

  // Rental Agreement Integration
  async createRentalAgreement(reservationId: string): Promise<RentalAgreement> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Get reservation details
    const { data: reservation, error: reservationError } = await supabase
      .from('reservations')
      .select('*')
      .eq('id', reservationId)
      .single();

    if (reservationError || !reservation) {
      throw new Error('Reservation not found');
    }

    // Get property policies
    const propertyPolicies = await this.getPropertyPolicies(reservation.property_id);

    // Create rental agreement policies
    const agreementPolicies: RentalAgreementPolicy[] = propertyPolicies.map(pp => ({
      policyId: pp.policyId,
      title: pp.policy?.title || '',
      description: pp.policy?.description || '',
      category: pp.policy?.category || 'custom',
      value: pp.customValue || pp.policy?.description || '',
      isRequired: pp.policy?.isRequired || false
    }));

    const agreementData = {
      reservation_id: reservationId,
      property_id: reservation.property_id,
      tenant_id: reservation.tenant_id,
      landlord_id: reservation.landlord_id,
      policies: JSON.parse(JSON.stringify(agreementPolicies)) as any,
      terms_accepted: false
    };

    const { data: agreement, error } = await supabase
      .from('rental_agreements')
      .insert(agreementData)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create rental agreement: ${error.message}`);
    }

    return this.mapDatabaseToRentalAgreement(agreement);
  }

  async acceptRentalAgreement(agreementId: string): Promise<RentalAgreement> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Check if user is the tenant
    const { data: agreement, error: agreementError } = await supabase
      .from('rental_agreements')
      .select('tenant_id')
      .eq('id', agreementId)
      .single();

    if (agreementError || !agreement || agreement.tenant_id !== user.id) {
      throw new Error('Rental agreement not found or access denied');
    }

    const { data: updatedAgreement, error } = await supabase
      .from('rental_agreements')
      .update({
        terms_accepted: true,
        accepted_at: new Date().toISOString(),
        accepted_by: user.id
      })
      .eq('id', agreementId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to accept rental agreement: ${error.message}`);
    }

    return this.mapDatabaseToRentalAgreement(updatedAgreement);
  }

  async getRentalAgreement(reservationId: string): Promise<RentalAgreement | null> {
    const { data, error } = await supabase
      .from('rental_agreements')
      .select('*')
      .eq('reservation_id', reservationId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // No agreement found
      }
      throw new Error(`Failed to get rental agreement: ${error.message}`);
    }

    return this.mapDatabaseToRentalAgreement(data);
  }

  // Private helper methods
  private async createPolicyUpdate(
    propertyId: string,
    policyId: string,
    oldValue: string,
    newValue: string,
    updatedBy: string
  ): Promise<PolicyUpdate> {
    const updateData = {
      property_id: propertyId,
      policy_id: policyId,
      old_value: oldValue,
      new_value: newValue,
      updated_by: updatedBy,
      notification_sent: false
    };

    const { data, error } = await supabase
      .from('policy_updates')
      .insert(updateData)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create policy update: ${error.message}`);
    }

    const policyUpdate = this.mapDatabaseToPolicyUpdate(data);

    // Send notifications asynchronously
    this.notifyTenantsOfPolicyUpdate(propertyId, policyUpdate).catch(console.error);

    return policyUpdate;
  }

  private mapDatabaseToPolicyTemplate(data: any): PolicyTemplate {
    return {
      id: data.id,
      title: data.title,
      description: data.description,
      category: data.category,
      defaultValue: data.default_value,
      isSystemTemplate: data.is_system_template,
      landlordId: data.landlord_id,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  }

  private mapPolicyTemplateToCustomPolicy(data: any): CustomPolicy {
    return {
      id: data.id,
      title: data.title,
      description: data.description,
      category: data.category,
      isRequired: false, // Templates don't have isRequired
      isActive: true, // Default to active
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  }

  private mapDatabaseToPropertyPolicy(data: any): PropertyPolicy {
    return {
      id: data.id,
      propertyId: data.property_id,
      policyId: data.policy_id,
      customValue: data.custom_value,
      isActive: data.is_active,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      policy: data.policy_templates ? this.mapPolicyTemplateToCustomPolicy(data.policy_templates) : undefined
    };
  }

  private mapDatabaseToPolicyUpdate(data: any): PolicyUpdate {
    return {
      id: data.id,
      propertyId: data.property_id,
      policyId: data.policy_id,
      oldValue: data.old_value,
      newValue: data.new_value,
      updatedBy: data.updated_by,
      updatedAt: new Date(data.updated_at),
      notificationSent: data.notification_sent
    };
  }

  private mapDatabaseToRentalAgreement(data: any): RentalAgreement {
    return {
      id: data.id,
      reservationId: data.reservation_id,
      propertyId: data.property_id,
      tenantId: data.tenant_id,
      landlordId: data.landlord_id,
      policies: data.policies || [],
      termsAccepted: data.terms_accepted,
      acceptedAt: data.accepted_at ? new Date(data.accepted_at) : undefined,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  }
}

export const policyService = new PolicyService();