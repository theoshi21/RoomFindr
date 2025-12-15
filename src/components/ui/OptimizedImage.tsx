'use client';

import React, { useState, useRef, useEffect } from 'react';
import { storageService } from '@/lib/storage';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'avif' | 'auto';
  className?: string;
  priority?: boolean;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  onLoad?: () => void;
  onError?: () => void;
  bucket?: string;
  path?: string;
}

export default function OptimizedImage({
  src,
  alt,
  width,
  height,
  quality = 80,
  format = 'webp',
  className = '',
  priority = false,
  placeholder = 'empty',
  blurDataURL,
  onLoad,
  onError,
  bucket,
  path,
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Generate optimized URL if bucket and path are provided
  const optimizedSrc = bucket && path 
    ? storageService.getOptimizedImageUrl(bucket, path, { width, height, quality, format })
    : src;

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (priority || isInView) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observerRef.current?.disconnect();
          }
        });
      },
      {
        rootMargin: '50px',
        threshold: 0.1,
      }
    );

    if (imgRef.current) {
      observerRef.current.observe(imgRef.current);
    }

    return () => {
      observerRef.current?.disconnect();
    };
  }, [priority, isInView]);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  // Generate blur placeholder
  const generateBlurDataURL = (w: number = 10, h: number = 10) => {
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#f3f4f6';
      ctx.fillRect(0, 0, w, h);
    }
    return canvas.toDataURL();
  };

  const defaultBlurDataURL = blurDataURL || generateBlurDataURL();

  if (hasError) {
    return (
      <div 
        className={`bg-gray-200 flex items-center justify-center ${className}`}
        style={{ width, height }}
      >
        <svg 
          className="w-8 h-8 text-gray-400" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" 
          />
        </svg>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Placeholder */}
      {placeholder === 'blur' && !isLoaded && (
        <img
          src={defaultBlurDataURL}
          alt=""
          className="absolute inset-0 w-full h-full object-cover filter blur-sm scale-110"
          aria-hidden="true"
        />
      )}
      
      {/* Loading skeleton */}
      {!isLoaded && placeholder === 'empty' && (
        <div 
          className="absolute inset-0 bg-gray-200 animate-pulse"
          style={{ width, height }}
        />
      )}

      {/* Main image */}
      <img
        ref={imgRef}
        src={isInView ? optimizedSrc : undefined}
        alt={alt}
        width={width}
        height={height}
        className={`
          transition-opacity duration-300
          ${isLoaded ? 'opacity-100' : 'opacity-0'}
          ${className}
        `}
        onLoad={handleLoad}
        onError={handleError}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
      />
    </div>
  );
}

// Hook for preloading images
export function useImagePreloader(urls: string[]) {
  useEffect(() => {
    urls.forEach((url) => {
      const img = new Image();
      img.src = url;
    });
  }, [urls]);
}

// Component for image with multiple sources (responsive)
interface ResponsiveImageProps extends Omit<OptimizedImageProps, 'src'> {
  sources: {
    src: string;
    media?: string;
    width?: number;
    height?: number;
  }[];
  fallbackSrc: string;
}

export function ResponsiveImage({ 
  sources, 
  fallbackSrc, 
  ...props 
}: ResponsiveImageProps) {
  return (
    <picture>
      {sources.map((source, index) => (
        <source
          key={index}
          srcSet={source.src}
          media={source.media}
          width={source.width}
          height={source.height}
        />
      ))}
      <OptimizedImage src={fallbackSrc} {...props} />
    </picture>
  );
}