import { supabase } from '@/lib/supabase';
import type { Property, PropertyListing, PropertyUpdate, SearchFilters } from '@/types/property';

export interface PropertyAPI {
  createListing(listing: PropertyListing): Promise<Property>;
  updateListing(id: string, updates: PropertyUpdate): Promise<Property>;
  searchProperties(filters: SearchFilters): Promise<Property[]>;
  getProperty(id: string): Promise<Property>;
  getLandlordProperties(landlordId: string): Promise<Property[]>;
  deleteProperty(id: string): Promise<void>;
  uploadPropertyImages(propertyId: string, images: File[]): Promise<string[]>;
  deletePropertyImage(propertyId: string, imageUrl: string): Promise<void>;
}

export class PropertyService implements PropertyAPI {
  async createListing(listing: PropertyListing): Promise<Property> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Check if user is a verified landlord
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role, is_verified')
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      throw new Error('User not found');
    }

    const userInfo = userData as { role: string; is_verified: boolean };
    if (userInfo.role !== 'landlord' || !userInfo.is_verified) {
      throw new Error('Only verified landlords can create listings');
    }

    const propertyData = {
      landlord_id: user.id,
      title: listing.title,
      description: listing.description,
      street: listing.address.street,
      city: listing.address.city,
      province: listing.address.province,
      postal_code: listing.address.postalCode,
      coordinates: listing.address.coordinates 
        ? `POINT(${listing.address.coordinates.lng} ${listing.address.coordinates.lat})`
        : null,
      room_type: listing.roomType,
      price: listing.price,
      deposit: listing.deposit,
      amenities: listing.amenities,
      max_occupancy: listing.availability.maxOccupancy,
      current_occupancy: listing.availability.currentOccupancy,
      availability_start_date: listing.availability.startDate.toISOString().split('T')[0],
      availability_end_date: listing.availability.endDate?.toISOString().split('T')[0],
      available_days: listing.availability.availableDays,
      pet_policy: listing.policies.petPolicy,
      smoking_policy: listing.policies.smokingPolicy,
      guest_policy: listing.policies.guestPolicy,
      cleaning_policy: listing.policies.cleaningPolicy,
      cancellation_policy: listing.policies.cancellationPolicy,
      custom_policies: listing.policies.customPolicies,
      is_active: true
    };

    const { data, error } = await (supabase as any)
      .from('properties')
      .insert(propertyData)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create listing: ${error.message}`);
    }

    return this.mapDatabaseToProperty(data);
  }

  async updateListing(id: string, updates: PropertyUpdate): Promise<Property> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Check if user owns this property
    const { data: property, error: propertyError } = await supabase
      .from('properties')
      .select('landlord_id')
      .eq('id', id)
      .single();

    if (propertyError || !property || (property as any).landlord_id !== user.id) {
      throw new Error('Property not found or access denied');
    }

    const updateData: any = {};
    
    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.price !== undefined) updateData.price = updates.price;
    if (updates.deposit !== undefined) updateData.deposit = updates.deposit;
    if (updates.amenities !== undefined) updateData.amenities = updates.amenities;
    if (updates.isActive !== undefined) updateData.is_active = updates.isActive;
    
    if (updates.policies) {
      if (updates.policies.petPolicy !== undefined) updateData.pet_policy = updates.policies.petPolicy;
      if (updates.policies.smokingPolicy !== undefined) updateData.smoking_policy = updates.policies.smokingPolicy;
      if (updates.policies.guestPolicy !== undefined) updateData.guest_policy = updates.policies.guestPolicy;
      if (updates.policies.cleaningPolicy !== undefined) updateData.cleaning_policy = updates.policies.cleaningPolicy;
      if (updates.policies.cancellationPolicy !== undefined) updateData.cancellation_policy = updates.policies.cancellationPolicy;
      if (updates.policies.customPolicies !== undefined) updateData.custom_policies = updates.policies.customPolicies;
    }
    
    if (updates.availability) {
      if (updates.availability.maxOccupancy !== undefined) updateData.max_occupancy = updates.availability.maxOccupancy;
      if (updates.availability.currentOccupancy !== undefined) updateData.current_occupancy = updates.availability.currentOccupancy;
      if (updates.availability.startDate !== undefined) updateData.availability_start_date = updates.availability.startDate.toISOString().split('T')[0];
      if (updates.availability.endDate !== undefined) updateData.availability_end_date = updates.availability.endDate?.toISOString().split('T')[0];
      if (updates.availability.availableDays !== undefined) updateData.available_days = updates.availability.availableDays;
    }

    const { data, error } = await (supabase as any)
      .from('properties')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update listing: ${error.message}`);
    }

    return this.mapDatabaseToProperty(data);
  }

  async searchProperties(filters: SearchFilters): Promise<Property[]> {
    let query = supabase
      .from('properties')
      .select('*')
      .eq('is_active', true);

    // Apply price range filter
    if (filters.priceRange) {
      if (filters.priceRange.min !== undefined) {
        query = query.gte('price', filters.priceRange.min);
      }
      if (filters.priceRange.max !== undefined) {
        query = query.lte('price', filters.priceRange.max);
      }
    }

    // Apply location filter
    if (filters.location) {
      if (filters.location.city) {
        query = query.ilike('city', `%${filters.location.city}%`);
      }
      if (filters.location.province) {
        query = query.ilike('province', `%${filters.location.province}%`);
      }
    }

    // Apply room type filter
    if (filters.roomType && filters.roomType.length > 0) {
      query = query.in('room_type', filters.roomType);
    }

    // Apply amenities filter
    if (filters.amenities && filters.amenities.length > 0) {
      query = query.contains('amenities', filters.amenities);
    }

    // Apply availability filter
    if (filters.availability) {
      if (filters.availability.startDate) {
        query = query.gte('availability_start_date', filters.availability.startDate.toISOString().split('T')[0]);
      }
      if (filters.availability.endDate) {
        query = query.lte('availability_end_date', filters.availability.endDate.toISOString().split('T')[0]);
      }
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to search properties: ${error.message}`);
    }

    return (data || []).map(this.mapDatabaseToProperty);
  }

  async getProperty(id: string): Promise<Property> {
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw new Error(`Failed to get property: ${error.message}`);
    }

    return this.mapDatabaseToProperty(data);
  }

  async getLandlordProperties(landlordId: string): Promise<Property[]> {
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .eq('landlord_id', landlordId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to get landlord properties: ${error.message}`);
    }

    return (data || []).map(this.mapDatabaseToProperty);
  }

  async deleteProperty(id: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Check if user owns this property
    const { data: property, error: propertyError } = await supabase
      .from('properties')
      .select('landlord_id')
      .eq('id', id)
      .single();

    if (propertyError || !property || (property as any).landlord_id !== user.id) {
      throw new Error('Property not found or access denied');
    }

    const { error } = await supabase
      .from('properties')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete property: ${error.message}`);
    }
  }

  async uploadPropertyImages(propertyId: string, images: File[]): Promise<string[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const uploadedUrls: string[] = [];

    for (const image of images) {
      const fileExt = image.name.split('.').pop();
      const fileName = `${propertyId}/${Date.now()}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('property-images')
        .upload(fileName, image);

      if (error) {
        throw new Error(`Failed to upload image: ${error.message}`);
      }

      const { data: { publicUrl } } = supabase.storage
        .from('property-images')
        .getPublicUrl(fileName);

      uploadedUrls.push(publicUrl);
    }

    // Update property with new image URLs
    const { data: property } = await supabase
      .from('properties')
      .select('images')
      .eq('id', propertyId)
      .single();

    if (property) {
      const currentImages = (property as any).images || [];
      const updatedImages = [...currentImages, ...uploadedUrls];
      
      await (supabase as any)
        .from('properties')
        .update({ images: updatedImages })
        .eq('id', propertyId);
    }

    return uploadedUrls;
  }

  async deletePropertyImage(propertyId: string, imageUrl: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Check if user owns this property
    const { data: property, error: propertyError } = await supabase
      .from('properties')
      .select('landlord_id, images')
      .eq('id', propertyId)
      .single();

    if (propertyError || !property || (property as any).landlord_id !== user.id) {
      throw new Error('Property not found or access denied');
    }

    // Remove image URL from property
    const currentImages = (property as any).images || [];
    const updatedImages = currentImages.filter((url: string) => url !== imageUrl);
    
    await (supabase as any)
      .from('properties')
      .update({ images: updatedImages })
      .eq('id', propertyId);

    // Extract file path from URL and delete from storage
    try {
      const urlParts = imageUrl.split('/');
      const fileName = urlParts[urlParts.length - 1];
      const filePath = `${propertyId}/${fileName}`;
      
      await supabase.storage
        .from('property-images')
        .remove([filePath]);
    } catch (error) {
      // Log error but don't throw - image URL was already removed from property
      console.error('Failed to delete image from storage:', error);
    }
  }

  private mapDatabaseToProperty(data: any): Property {
    return {
      id: data.id,
      landlordId: data.landlord_id,
      title: data.title,
      description: data.description,
      address: {
        street: data.street,
        city: data.city,
        province: data.province,
        postalCode: data.postal_code,
        coordinates: data.coordinates ? {
          lat: data.coordinates.coordinates[1],
          lng: data.coordinates.coordinates[0]
        } : undefined
      },
      roomType: data.room_type,
      price: parseFloat(data.price),
      deposit: parseFloat(data.deposit),
      amenities: data.amenities || [],
      images: data.images || [],
      availability: {
        startDate: new Date(data.availability_start_date),
        endDate: data.availability_end_date ? new Date(data.availability_end_date) : undefined,
        availableDays: data.available_days || [],
        maxOccupancy: data.max_occupancy,
        currentOccupancy: data.current_occupancy
      },
      policies: {
        petPolicy: data.pet_policy || '',
        smokingPolicy: data.smoking_policy || '',
        guestPolicy: data.guest_policy || '',
        cleaningPolicy: data.cleaning_policy || '',
        cancellationPolicy: data.cancellation_policy || '',
        customPolicies: data.custom_policies || []
      },
      isActive: data.is_active,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  }
}

export const propertyService = new PropertyService();