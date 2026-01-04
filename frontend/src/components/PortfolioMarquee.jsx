import React, { useRef } from 'react';
import { motion } from 'framer-motion';

const portfolioImages = [
  { url: 'https://images.pexels.com/photos/4456473/pexels-photo-4456473.jpeg', alt: 'Artistic bride portrait' },
  { url: 'https://images.pexels.com/photos/9428788/pexels-photo-9428788.jpeg', alt: 'Wedding details' },
  { url: 'https://images.pexels.com/photos/27014711/pexels-photo-27014711.jpeg', alt: 'Floral arrangement' },
  { url: 'https://images.pexels.com/photos/7301283/pexels-photo-7301283.jpeg', alt: 'Ring details' },
  { url: 'https://images.pexels.com/photos/15841148/pexels-photo-15841148.jpeg', alt: 'Couple candid moment' },
  { url: 'https://images.pexels.com/photos/15582310/pexels-photo-15582310.jpeg', alt: 'Ceremony ritual' },
];

const PortfolioMarquee = () => {
  const scrollContainerRef = useRef(null);

  const scroll = (direction) => {
    if (scrollContainerRef.current) {
      const scrollAmount = 300;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="relative py-8" data-testid="portfolio-marquee">
      <h3 className="text-3xl font-heading text-center mb-6 text-foreground">Our Portfolio</h3>
      
      <div className="relative group">
        {/* Manual Scroll Buttons */}
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

        {/* Scrollable Container */}
        <div
          ref={scrollContainerRef}
          className="overflow-x-auto scrollbar-hide flex gap-4 px-4 scroll-smooth"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {portfolioImages.map((image, index) => (
            <motion.div
              key={index}
              className="flex-shrink-0 w-64 h-64 rounded-lg overflow-hidden shadow-lg border-2 border-white"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.3 }}
            >
              <img
                src={image.url}
                alt={image.alt}
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