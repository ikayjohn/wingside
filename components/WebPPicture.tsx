'use client'

import React, { useState } from 'react'

interface WebPPictureProps {
  src: string
  alt: string
  className?: string
  width?: number
  height?: number
  priority?: boolean
  style?: React.CSSProperties
  [key: string]: any
}

export default function WebPPicture({
  src,
  alt,
  className = '',
  width,
  height,
  priority = false,
  style,
  ...props
}: WebPPictureProps) {
  const [isLoaded, setIsLoaded] = useState(false)

  // Generate WebP path
  const webpSrc = src.replace(/\.(png|jpg|jpeg)$/i, '.webp')

  // Check if browser supports WebP
  const supportsWebP = typeof document !== 'undefined' &&
    document.createElement('picture').toString().indexOf('HTMLPictureElement') > -1

  // Determine loading strategy
  const loadingStrategy = priority ? 'eager' : 'lazy'

  // Default dimensions
  const defaultWidth = width || 400
  const defaultHeight = height || 400

  return (
    <div style={{ position: 'relative' }}>
      {/* Placeholder */}
      {!isLoaded && (
        <div
          style={{
            ...style,
            width: style?.width || '100%',
            height: style?.height || (width && height ? height : width || 400),
            aspectRatio: style?.aspectRatio || (width && height ? `${width}/${height}` : '1/1'),
            backgroundColor: '#f3f4f6',
            display: 'block',
          }}
          className={className}
          aria-hidden="true"
        />
      )}

      {/* Picture element with WebP source and fallback */}
      <picture>
        <source srcSet={webpSrc} type="image/webp" />
        <img
          src={src}
          alt={alt}
          className={className}
          width={width || defaultWidth}
          height={height || defaultHeight}
          loading={loadingStrategy}
          decoding="async"
          style={{
            ...style,
            position: isLoaded ? 'relative' : 'absolute',
            top: 0,
            left: 0,
            opacity: isLoaded ? 1 : 0,
            transition: 'opacity 0.3s ease-in',
            contentVisibility: 'auto',
          }}
          onLoad={() => setIsLoaded(true)}
          {...props}
        />
      </picture>
    </div>
  )
}
