import React, { useRef, useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const PortfolioMarquee = () => {
  const scrollContainerRef = useRef(null);
  const [wallPhotos, setWallPhotos] = useState([]);

  useEffect(() => {
    fetchWallPhotos();
  }, []);

  const fetchWallPhotos = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/wall-photos`);
      setWallPhotos(response.data);
    } catch (error) {
      console.error('Failed to fetch wall photos:', error);
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

  if (wallPhotos.length === 0) {
    return null;
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
              className="flex-shrink-0 w-64 h-64 rounded-lg overflow-hidden shadow-lg border-2 border-white"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.3 }}
            >
              <img
                src={photo.image_data}
                alt={photo.filename}
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
