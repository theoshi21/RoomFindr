'use client';

import React, { useState, useEffect } from 'react';
import { propertyService } from '@/lib/property';
import OptimizedImage from '@/components/ui/OptimizedImage';

interface ImageUploadManagerProps {
  propertyId: string;
  currentImages: string[];
}

export default function ImageUploadManager({ propertyId, currentImages }: ImageUploadManagerProps) {
  const [images, setImages] = useState<string[]>(currentImages);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    setImages(currentImages);
  }, [currentImages]);

  const handleFileUpload = async (files: FileList) => {
    if (files.length === 0) return;

    setUploading(true);
    try {
      const fileArray = Array.from(files);
      const uploadedUrls = await propertyService.uploadPropertyImages(propertyId, fileArray);
      setImages([...images, ...uploadedUrls]);
    } catch (error) {
      console.error('Failed to upload images:', error);
      alert('Failed to upload images. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFileUpload(e.target.files);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    if (e.dataTransfer.files) {
      handleFileUpload(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const removeImage = async (imageUrl: string) => {
    if (!confirm('Are you sure you want to remove this image?')) {
      return;
    }

    try {
      await propertyService.deletePropertyImage(propertyId, imageUrl);
      setImages(images.filter(url => url !== imageUrl));
    } catch (error) {
      console.error('Failed to remove image:', error);
      alert('Failed to remove image. Please try again.');
    }
  };

  const moveImage = (fromIndex: number, toIndex: number) => {
    const newImages = [...images];
    const [movedImage] = newImages.splice(fromIndex, 1);
    newImages.splice(toIndex, 0, movedImage);
    setImages(newImages);
  };

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragOver
            ? 'border-blue-400 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
          id="image-upload"
          disabled={uploading}
        />
        
        <label htmlFor="image-upload" className="cursor-pointer">
          <div className="text-gray-600">
            {uploading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
                <span>Uploading images...</span>
              </div>
            ) : (
              <>
                <svg className="mx-auto h-12 w-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="text-lg mb-2">
                  {dragOver ? 'Drop images here' : 'Click to upload or drag and drop'}
                </p>
                <p className="text-sm">PNG, JPG, GIF up to 10MB each</p>
              </>
            )}
          </div>
        </label>
      </div>

      {/* Current Images */}
      {images.length > 0 && (
        <div>
          <h4 className="text-lg font-medium text-gray-900 mb-4">
            Property Images ({images.length})
          </h4>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map((imageUrl, index) => (
              <div key={imageUrl} className="relative group">
                <div className="aspect-square bg-gray-200 rounded-lg overflow-hidden">
                  <OptimizedImage
                    src={imageUrl}
                    alt={`Property image ${index + 1}`}
                    className="w-full h-full object-cover"
                    width={300}
                    height={300}
                    quality={80}
                    placeholder="blur"
                  />
                </div>
                
                {/* Image Controls */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-200 rounded-lg flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex space-x-2">
                    {/* Move Left */}
                    {index > 0 && (
                      <button
                        onClick={() => moveImage(index, index - 1)}
                        className="bg-white text-gray-700 p-2 rounded-full hover:bg-gray-100"
                        title="Move left"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                    )}
                    
                    {/* Move Right */}
                    {index < images.length - 1 && (
                      <button
                        onClick={() => moveImage(index, index + 1)}
                        className="bg-white text-gray-700 p-2 rounded-full hover:bg-gray-100"
                        title="Move right"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    )}
                    
                    {/* Delete */}
                    <button
                      onClick={() => removeImage(imageUrl)}
                      className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600"
                      title="Remove image"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
                
                {/* Primary Image Badge */}
                {index === 0 && (
                  <div className="absolute top-2 left-2 bg-blue-600 text-white px-2 py-1 rounded text-xs font-medium">
                    Primary
                  </div>
                )}
                
                {/* Image Number */}
                <div className="absolute bottom-2 right-2 bg-black bg-opacity-60 text-white px-2 py-1 rounded text-xs">
                  {index + 1}
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-4 text-sm text-gray-600">
            <p>• The first image will be used as the primary image in listings</p>
            <p>• Use the arrow buttons to reorder images</p>
            <p>• Click the trash icon to remove an image</p>
          </div>
        </div>
      )}
    </div>
  );
}