import React, { useRef, useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const CACHE_KEY = 'wedding_wall_photos';

const PortfolioMarquee = () => {
  const scrollContainerRef = useRef(null);
  const [wallPhotos, setWallPhotos] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load cached photos on mount
  useEffect(() => {
    const cachedPhotos = localStorage.getItem(CACHE_KEY);
    if (cachedPhotos) {
      try {
        const parsed = JSON.parse(cachedPhotos);
        if (parsed && parsed.length > 0) {
          setWallPhotos(parsed);
          setLoading(false);
        }
      } catch (e) {
        console.error('Failed to parse cached wall photos:', e);
      }
    }
    fetchWallPhotos();
  }, []);

  const fetchWallPhotos = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/wall-photos`, {
        timeout: 30000 // 30 second timeout for slow server wake-up
      });
      
      if (response.data && response.data.length > 0) {
        setWallPhotos(response.data);
        // Cache the photos in localStorage
        localStorage.setItem(CACHE_KEY, JSON.stringify(response.data));
      }
      // Only set loading to false if we don't have cached data
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch wall photos:', error);
      // If we have cached photos, keep showing them
      // Only set loading to false, don't clear existing photos
      setLoading(false);
    }
  };

  const scroll = (direction) => {
    if (scrollContainerRef.current) {
      const scrollAmount = 300;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  // Show loading only if we have no cached photos
  if (loading && wallPhotos.length === 0) {
    return (
      <div className="py-8 text-center" data-testid="portfolio-marquee">
        <h3 className="text-3xl font-heading text-center mb-6 text-foreground">Our Wall</h3>
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gold mx-auto"></div>
        <p className="text-foreground/60 mt-4">Loading portfolio...</p>
      </div>
    );
  }

  if (wallPhotos.length === 0) {
    return (
      <div className="py-8 text-center" data-testid="portfolio-marquee">
        <h3 className="text-3xl font-heading text-center mb-6 text-foreground">Our Wall</h3>
        <p className="text-foreground/60">No portfolio photos yet.</p>
      </div>
    );
  }

  return (
    <div className="relative py-8" data-testid="portfolio-marquee">
      <h3 className="text-3xl font-heading text-center mb-6 text-foreground">Our Wall</h3>
      
      <div className="relative group">
        <button
          onClick={() => scroll('left')}
          className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white text-foreground p-3 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
          aria-label="Scroll left"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <button
          onClick={() => scroll('right')}
          className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white text-foreground p-3 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
          aria-label="Scroll right"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        <div
          ref={scrollContainerRef}
          className="overflow-x-auto scrollbar-hide flex gap-4 px-4 scroll-smooth"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {wallPhotos.map((photo, index) => (
            <motion.div
              key={photo.photo_id}
              className="flex-shrink-0 w-64 h-64 rounded-xl overflow-hidden shadow-md"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1, duration: 0.4 }}
              whileHover={{ scale: 1.05, y: -5 }}
            >
              <img
                src={photo.image_data}
                alt={photo.filename}
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover"
              />
            </motion.div>
          ))}
        </div>
      </div>

      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
};

export default PortfolioMarquee;
