import React from 'react';
import { motion } from 'framer-motion';

const portfolioImages = [
  {
    url: 'https://images.pexels.com/photos/4456473/pexels-photo-4456473.jpeg',
    alt: 'Artistic bride portrait'
  },
  {
    url: 'https://images.pexels.com/photos/9428788/pexels-photo-9428788.jpeg',
    alt: 'Wedding details'
  },
  {
    url: 'https://images.pexels.com/photos/27014711/pexels-photo-27014711.jpeg',
    alt: 'Floral arrangement'
  },
  {
    url: 'https://images.pexels.com/photos/7301283/pexels-photo-7301283.jpeg',
    alt: 'Ring details'
  },
  {
    url: 'https://images.pexels.com/photos/15841148/pexels-photo-15841148.jpeg',
    alt: 'Couple candid moment'
  },
  {
    url: 'https://images.pexels.com/photos/15582310/pexels-photo-15582310.jpeg',
    alt: 'Ceremony ritual'
  }
];

const PortfolioMarquee = () => {
  const doubledImages = [...portfolioImages, ...portfolioImages];

  return (
    <div
      className="relative h-[400px] w-full overflow-hidden bg-secondary/30 flex items-center"
      data-testid="portfolio-marquee"
    >
      <div className="flex gap-6 animate-marquee hover:pause">
        {doubledImages.map((image, index) => (
          <div
            key={index}
            className="flex-shrink-0 w-[350px] h-[350px] rounded-lg overflow-hidden shadow-gold-soft"
          >
            <img
              src={image.url}
              alt={image.alt}
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default PortfolioMarquee;