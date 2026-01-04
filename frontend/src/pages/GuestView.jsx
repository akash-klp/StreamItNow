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
    <div className="min-h-screen bg-[#e8e8e8]">
      <PhotographerHeader />
      
      <DecorativeDivider />
      
      <PortfolioMarquee />
      
      <DecorativeDivider />
      
      <CoupleShowcase />
      
      <DecorativeDivider />
      
      <LiveGallery />
      
      <footer className="py-12 text-center border-t-2 border-gold/30 mt-20 bg-white/50">
        <p className="text-foreground/70 font-body text-sm">
          © 2026 SteamIt. All rights reserved.
        </p>
      </footer>
    </div>
  );
};

export default GuestView;