"use client";

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';

interface Slide {
  id: string;
  title: string;
  headline: string;
  description: string | null;
  image_url: string;
  is_active: boolean;
  display_order: number;
}

export default function HeroSlideshow() {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [shouldAnimate, setShouldAnimate] = useState(false);

  const fetchSlides = useCallback(async () => {
    try {
      const response = await fetch('/api/hero-slides/public');
      const data = await response.json();
      if (response.ok && data.slides && data.slides.length > 0) {
        setSlides(data.slides);
        // Trigger animation after slides load
        setTimeout(() => setShouldAnimate(true), 100);
      }
    } catch (error) {
      console.error('Error fetching slides:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSlides();
  }, [fetchSlides]);

  useEffect(() => {
    if (slides.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, 10000); // Change slide every 10 seconds (matches video length)

    return () => clearInterval(interval);
  }, [slides.length]);

  if (loading) {
    return (
      <section className="hero-video-section">
        <div
          className="hero-video"
          style={{
            background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #552627 100%)',
          }}
        />
        <div className="hero-overlay"></div>
      </section>
    );
  }

  // Ken Burns effect: simple zoom in from 100% to 120%
  const getKenBurnsStyle = (isActive: boolean) => {
    const scale = 1; // No zoom effect
    return {
      position: 'absolute' as const,
      top: '50%',
      left: '50%',
      transform: `translate(-50%, -50%) scale(${scale})`,
      minWidth: '100%',
      minHeight: '100%',
      width: 'auto',
      height: 'auto',
      objectFit: 'cover' as const,
      transition: isActive ? 'transform 8s ease-out' : 'transform 0.3s ease-out',
    };
  };

  // Parse headline to handle colors
  const parseHeadline = (headline: string) => {
    const parts = headline.split(/(\[yellow\].*?\[\/yellow\]|\[white\].*?\[\/white\])/gi);
    return parts.map((part, index) => {
      if (part.match(/\[yellow\](.*?)\[\/yellow\]/i)) {
        const text = part.replace(/\[yellow\]|\[\/yellow\]/gi, '');
        return <span key={index} className="text-yellow-400">{text}</span>;
      }
      if (part.match(/\[white\](.*?)\[\/white\]/i)) {
        const text = part.replace(/\[white\]|\[\/white\]/gi, '');
        return <span key={index} className="text-white">{text}</span>;
      }
      return part;
    });
  };

  if (slides.length === 0) {
    return null;
  }

  const currentSlide = slides[currentIndex];

  return (
    <section className="hero-video-section relative overflow-hidden">
      {/* Slide Images/Video */}
      <div className="absolute inset-0">
        {slides.map((slide, index) => {
          const isActive = index === currentIndex;
          const showAnimation = shouldAnimate && isActive;
          const isFirstSlide = index === 0;

          return (
            <div
              key={slide.id}
              className="absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out"
              style={{
                opacity: isActive ? 1 : 0,
                zIndex: isActive ? 1 : 0,
              }}
            >
              {isFirstSlide ? (
                // First slide uses hero.mp4 video
                <video
                  key="hero-video"
                  autoPlay
                  muted
                  loop
                  playsInline
                  className="hero-video"
                  style={{
                    position: 'absolute' as const,
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    minWidth: '100%',
                    minHeight: '100%',
                    width: 'auto',
                    height: 'auto',
                    objectFit: 'cover' as const,
                  }}
                >
                  <source src="/hero.mp4?v=2" type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              ) : (
                // Other slides use images
                <img
                  src={slide.image_url}
                  alt={slide.title}
                  className="hero-video"
                  style={{
                    ...getKenBurnsStyle(showAnimation),
                    objectFit: 'cover',
                    objectPosition: 'center',
                  } as any}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Dark Overlay */}
      <div className="hero-overlay relative z-10"></div>

      {/* Hero Content */}
      <div
        className="hero-content relative z-10 transition-opacity duration-500 ease-in-out"
        key={currentIndex}
      >
        <h1 className="hero-video-title">
          {parseHeadline(currentSlide.headline)}
        </h1>
        {currentSlide.description && (
          <p
            className="opacity-90 text-sm sm:text-base md:text-[20px]"
            style={{
              fontWeight: '300',
              color: 'white',
              marginBottom: '0.25rem',
            }}
          >
            {currentSlide.description}
          </p>
        )}
        <Link
          href="/order"
          className="btn-primary inline-block mt-6 scale-110 hover:bg-white hover:text-gray-900 transition-all"
        >
          Order Now
        </Link>
      </div>

      {/* Slide Indicators */}
      {slides.length > 1 && (
        <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 flex gap-3 z-[150] md:bottom-32">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`transition-all duration-300 rounded-full ${
                index === currentIndex
                  ? 'w-8 h-2 bg-[#F7C400]'
                  : 'w-2 h-2 bg-white/50 hover:bg-white/75'
              }`}
              style={{ cursor: 'pointer' }}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}

    </section>
  );
}
