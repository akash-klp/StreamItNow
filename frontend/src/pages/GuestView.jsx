import React from 'react';
import PhotographerHeader from '../components/PhotographerHeader';
import PortfolioMarquee from '../components/PortfolioMarquee';
import CoupleShowcase from '../components/CoupleShowcase';
import LiveGallery from '../components/LiveGallery';

const DecorativeDivider = () => (
  <div className="decorative-line-fancy my-16"></div>
);

const GuestView = () => {
  return (
    <div className="min-h-screen">
      <PhotographerHeader />
      
      <DecorativeDivider />
      
      <div className="glass-panel mx-4 md:mx-8 my-8 rounded-2xl p-4">
        <PortfolioMarquee />
      </div>
      
      <DecorativeDivider />
      
      <CoupleShowcase />
      
      <DecorativeDivider />
      
      <div className="glass-panel mx-4 md:mx-8 my-8 rounded-2xl p-6">
        <LiveGallery />
      </div>
      
      <footer className="py-12 text-center border-t-2 border-white/20 mt-20 glass-header">
        <p className="text-white/90 font-body text-sm drop-shadow-md">
          © 2026 SteamIt. All rights reserved.
        </p>
      </footer>
    </div>
  );
};

export default GuestView;