import { supabase, createAdminClient } from './supabase';

// Storage bucket names
export const STORAGE_BUCKETS = {
  PROPERTY_IMAGES: 'property-images',
  AVATARS: 'avatars',
  VERIFICATION_DOCUMENTS: 'verification-documents',
  ANNOUNCEMENTS: 'announcements',
} as const;

// File size limits (in bytes)
export const FILE_SIZE_LIMITS = {
  IMAGE: 10 * 1024 * 1024, // 10MB
  DOCUMENT: 25 * 1024 * 1024, // 25MB
  AVATAR: 5 * 1024 * 1024, // 5MB
} as const;

// Allowed file types
export const ALLOWED_FILE_TYPES = {
  IMAGES: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'],
  DOCUMENTS: ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'],
  AVATARS: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
} as const;

export interface UploadOptions {
  bucket: string;
  path: string;
  file: File;
  upsert?: boolean;
  cacheControl?: string;
}

export interface UploadResult {
  path: string;
  fullPath: string;
  publicUrl: string;
}

class StorageService {
  /**
   * Upload a file to Supabase Storage
   */
  async uploadFile({
    bucket,
    path,
    file,
    upsert = false,
    cacheControl = '3600'
  }: UploadOptions): Promise<UploadResult> {
    try {
      // Validate file size
      this.validateFileSize(file, bucket);
      
      // Validate file type
      this.validateFileType(file, bucket);

      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(path, file, {
          upsert,
          cacheControl,
        });

      if (error) {
        throw new Error(`Upload failed: ${error.message}`);
      }

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path);

      return {
        path: data.path,
        fullPath: data.fullPath,
        publicUrl,
      };
    } catch (error) {
      console.error('Storage upload error:', error);
      throw error;
    }
  }

  /**
   * Upload multiple files
   */
  async uploadMultipleFiles(
    bucket: string,
    files: File[],
    pathPrefix: string = ''
  ): Promise<UploadResult[]> {
    const uploadPromises = files.map((file, index) => {
      const timestamp = Date.now();
      const fileName = `${timestamp}-${index}-${file.name}`;
      const path = pathPrefix ? `${pathPrefix}/${fileName}` : fileName;
      
      return this.uploadFile({
        bucket,
        path,
        file,
      });
    });

    return Promise.all(uploadPromises);
  }

  /**
   * Delete a file from storage
   */
  async deleteFile(bucket: string, path: string): Promise<void> {
    try {
      const { error } = await supabase.storage
        .from(bucket)
        .remove([path]);

      if (error) {
        throw new Error(`Delete failed: ${error.message}`);
      }
    } catch (error) {
      console.error('Storage delete error:', error);
      throw error;
    }
  }

  /**
   * Delete multiple files
   */
  async deleteMultipleFiles(bucket: string, paths: string[]): Promise<void> {
    try {
      const { error } = await supabase.storage
        .from(bucket)
        .remove(paths);

      if (error) {
        throw new Error(`Bulk delete failed: ${error.message}`);
      }
    } catch (error) {
      console.error('Storage bulk delete error:', error);
      throw error;
    }
  }

  /**
   * Get public URL for a file
   */
  getPublicUrl(bucket: string, path: string): string {
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);
    
    return data.publicUrl;
  }

  /**
   * Get signed URL for private files
   */
  async getSignedUrl(
    bucket: string,
    path: string,
    expiresIn: number = 3600
  ): Promise<string> {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(path, expiresIn);

      if (error) {
        throw new Error(`Signed URL creation failed: ${error.message}`);
      }

      return data.signedUrl;
    } catch (error) {
      console.error('Signed URL error:', error);
      throw error;
    }
  }

  /**
   * List files in a bucket
   */
  async listFiles(
    bucket: string,
    path: string = '',
    options?: {
      limit?: number;
      offset?: number;
      sortBy?: { column: string; order: 'asc' | 'desc' };
    }
  ) {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .list(path, options);

      if (error) {
        throw new Error(`List files failed: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Storage list error:', error);
      throw error;
    }
  }

  /**
   * Create storage buckets (admin only)
   */
  async createBuckets(): Promise<void> {
    const adminClient = createAdminClient();
    
    const buckets = [
      {
        id: STORAGE_BUCKETS.PROPERTY_IMAGES,
        name: STORAGE_BUCKETS.PROPERTY_IMAGES,
        public: true,
        file_size_limit: FILE_SIZE_LIMITS.IMAGE,
        allowed_mime_types: ALLOWED_FILE_TYPES.IMAGES,
      },
      {
        id: STORAGE_BUCKETS.AVATARS,
        name: STORAGE_BUCKETS.AVATARS,
        public: true,
        file_size_limit: FILE_SIZE_LIMITS.AVATAR,
        allowed_mime_types: ALLOWED_FILE_TYPES.AVATARS,
      },
      {
        id: STORAGE_BUCKETS.VERIFICATION_DOCUMENTS,
        name: STORAGE_BUCKETS.VERIFICATION_DOCUMENTS,
        public: false,
        file_size_limit: FILE_SIZE_LIMITS.DOCUMENT,
        allowed_mime_types: ALLOWED_FILE_TYPES.DOCUMENTS,
      },
      {
        id: STORAGE_BUCKETS.ANNOUNCEMENTS,
        name: STORAGE_BUCKETS.ANNOUNCEMENTS,
        public: true,
        file_size_limit: FILE_SIZE_LIMITS.IMAGE,
        allowed_mime_types: ALLOWED_FILE_TYPES.IMAGES,
      },
    ];

    for (const bucket of buckets) {
      try {
        const { error } = await adminClient.storage.createBucket(bucket.id, {
          public: bucket.public,
          fileSizeLimit: bucket.file_size_limit,
          allowedMimeTypes: [...bucket.allowed_mime_types], // Convert readonly array to mutable array
        });

        if (error && !error.message.includes('already exists')) {
          console.error(`Failed to create bucket ${bucket.id}:`, error);
        } else {
          console.log(`Bucket ${bucket.id} created or already exists`);
        }
      } catch (error) {
        console.error(`Error creating bucket ${bucket.id}:`, error);
      }
    }
  }

  /**
   * Validate file size
   */
  private validateFileSize(file: File, bucket: string): void {
    let maxSize: number;
    
    switch (bucket) {
      case STORAGE_BUCKETS.PROPERTY_IMAGES:
      case STORAGE_BUCKETS.ANNOUNCEMENTS:
        maxSize = FILE_SIZE_LIMITS.IMAGE;
        break;
      case STORAGE_BUCKETS.AVATARS:
        maxSize = FILE_SIZE_LIMITS.AVATAR;
        break;
      case STORAGE_BUCKETS.VERIFICATION_DOCUMENTS:
        maxSize = FILE_SIZE_LIMITS.DOCUMENT;
        break;
      default:
        maxSize = FILE_SIZE_LIMITS.IMAGE;
    }

    if (file.size > maxSize) {
      throw new Error(`File size exceeds limit of ${maxSize / (1024 * 1024)}MB`);
    }
  }

  /**
   * Validate file type
   */
  private validateFileType(file: File, bucket: string): void {
    let allowedTypes: readonly string[];
    
    switch (bucket) {
      case STORAGE_BUCKETS.PROPERTY_IMAGES:
      case STORAGE_BUCKETS.ANNOUNCEMENTS:
        allowedTypes = ALLOWED_FILE_TYPES.IMAGES;
        break;
      case STORAGE_BUCKETS.AVATARS:
        allowedTypes = ALLOWED_FILE_TYPES.AVATARS;
        break;
      case STORAGE_BUCKETS.VERIFICATION_DOCUMENTS:
        allowedTypes = ALLOWED_FILE_TYPES.DOCUMENTS;
        break;
      default:
        allowedTypes = ALLOWED_FILE_TYPES.IMAGES;
    }

    if (!allowedTypes.includes(file.type)) {
      throw new Error(`File type ${file.type} is not allowed for this bucket`);
    }
  }

  /**
   * Generate optimized image URL with transformations
   */
  getOptimizedImageUrl(
    bucket: string,
    path: string,
    options?: {
      width?: number;
      height?: number;
      quality?: number;
      format?: 'webp' | 'avif' | 'auto';
    }
  ): string {
    const baseUrl = this.getPublicUrl(bucket, path);
    
    if (!options) return baseUrl;
    
    const params = new URLSearchParams();
    
    if (options.width) params.append('width', options.width.toString());
    if (options.height) params.append('height', options.height.toString());
    if (options.quality) params.append('quality', options.quality.toString());
    if (options.format) params.append('format', options.format);
    
    return `${baseUrl}?${params.toString()}`;
  }
}

export const storageService = new StorageService();

// Helper functions for specific use cases
export const uploadPropertyImage = (propertyId: string, file: File) => {
  const timestamp = Date.now();
  const fileName = `${timestamp}-${file.name}`;
  const path = `${propertyId}/${fileName}`;
  
  return storageService.uploadFile({
    bucket: STORAGE_BUCKETS.PROPERTY_IMAGES,
    path,
    file,
  });
};

export const uploadAvatar = (userId: string, file: File) => {
  const timestamp = Date.now();
  const fileName = `${timestamp}-${file.name}`;
  const path = `${userId}/${fileName}`;
  
  return storageService.uploadFile({
    bucket: STORAGE_BUCKETS.AVATARS,
    path,
    file,
    upsert: true, // Allow overwriting existing avatars
  });
};

export const uploadVerificationDocument = (landlordId: string, file: File) => {
  const timestamp = Date.now();
  const fileName = `${timestamp}-${file.name}`;
  const path = `${landlordId}/${fileName}`;
  
  return storageService.uploadFile({
    bucket: STORAGE_BUCKETS.VERIFICATION_DOCUMENTS,
    path,
    file,
  });
};