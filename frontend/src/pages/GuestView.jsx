import React from 'react';
import PhotographerHeader from '../components/PhotographerHeader';
import PortfolioMarquee from '../components/PortfolioMarquee';
import CoupleShowcase from '../components/CoupleShowcase';
import LiveGallery from '../components/LiveGallery';

const ElegantDivider = () => (
  <div className="elegant-divider my-12">
    <svg 
      className="mx-4 text-gold opacity-60" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="currentColor"
    >
      <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" />
    </svg>
  </div>
);

const GuestView = () => {
  return (
    <div className="min-h-screen">
      <PhotographerHeader />
      
      <ElegantDivider />
      
      <div className="glass-panel mx-4 md:mx-8 my-8 rounded-2xl p-4">
        <PortfolioMarquee />
      </div>
      
      <ElegantDivider />
      
      <CoupleShowcase />
      
      <ElegantDivider />
      
      <div className="glass-panel mx-4 md:mx-8 my-8 rounded-2xl p-6">
        <LiveGallery />
      </div>
      
      <footer className="py-12 text-center border-t-2 border-warmgrey mt-20 bg-white">
        <p className="text-foreground/70 font-body text-sm">
          © 2026 SteamIt. All rights reserved.
        </p>
      </footer>
    </div>
  );
};

export default GuestView;