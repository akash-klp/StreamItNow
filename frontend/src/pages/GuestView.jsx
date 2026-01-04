import React from 'react';
import PhotographerHeader from '../components/PhotographerHeader';
import PortfolioMarquee from '../components/PortfolioMarquee';
import CoupleShowcase from '../components/CoupleShowcase';
import LiveGallery from '../components/LiveGallery';

const GuestView = () => {
  return (
    <div className="min-h-screen bg-champagne">
      <PhotographerHeader />
      <PortfolioMarquee />
      <CoupleShowcase />
      <LiveGallery />
      
      <footer className="py-12 text-center border-t border-warmgrey mt-20">
        <p className="text-foreground/60 font-body">
          © 2024 Wedding Clickz Photography. All rights reserved.
        </p>
      </footer>
    </div>
  );
};

export default GuestView;