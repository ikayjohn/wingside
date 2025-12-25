/**
 * OptimizedImage Component
 * Wraps Next.js Image with optimized settings for Wingside
 * Improves performance with lazy loading, blur placeholders, and responsive sizing
 */

'use client';

import Image from 'next/image';
import { useState } from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  fill?: boolean;
  sizes?: string;
  quality?: number;
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  className = '',
  priority = false,
  fill = false,
  sizes,
  quality = 75,
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  // Handle image load error
  const handleError = () => {
    setError(true);
    setIsLoading(false);
  };

  // Fallback placeholder image
  if (error) {
    return (
      <div
        className={`bg-gray-200 flex items-center justify-center ${className}`}
        style={{ width: fill ? '100%' : width, height: fill ? '100%' : height }}
      >
        <span className="text-gray-400 text-sm">Image not available</span>
      </div>
    );
  }

  return (
    <div className={`relative ${isLoading ? 'animate-pulse bg-gray-200' : ''} ${className}`}>
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        fill={fill}
        sizes={sizes || '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'}
        quality={quality}
        priority={priority}
        loading={priority ? 'eager' : 'lazy'}
        onLoad={() => setIsLoading(false)}
        onError={handleError}
        className={`transition-opacity duration-300 ${
          isLoading ? 'opacity-0' : 'opacity-100'
        }`}
        // Unoptimized because we're using external URLs that might not be configured
        unoptimized={process.env.NODE_ENV === 'development'}
      />
    </div>
  );
}

/**
 * FlavorImage - Specialized component for flavor images
 */
interface FlavorImageProps {
  flavorName: string;
  imageUrl: string;
  className?: string;
  priority?: boolean;
}

export function FlavorImage({ flavorName, imageUrl, className, priority }: FlavorImageProps) {
  return (
    <OptimizedImage
      src={imageUrl}
      alt={`${flavorName} wings flavor`}
      width={400}
      height={400}
      className={className}
      priority={priority}
      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
    />
  );
}

/**
 * ProductImage - Specialized component for product images
 */
interface ProductImageProps {
  productName: string;
  imageUrl: string;
  className?: string;
  priority?: boolean;
}

export function ProductImage({ productName, imageUrl, className, priority }: ProductImageProps) {
  return (
    <OptimizedImage
      src={imageUrl}
      alt={`${productName} - Wingside`}
      width={600}
      height={400}
      className={className}
      priority={priority}
      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
    />
  );
}
