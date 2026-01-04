import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FaWhatsapp, FaInstagram, FaYoutube, FaCamera, FaEnvelope, FaMapMarkerAlt } from 'react-icons/fa';

const PhotographerHeader = () => {
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    setAnimate(true);
  }, []);

  return (
    <div className="relative">
      {/* Enhanced LIVE Indicator - Green & Vibey */}
      <div className="fixed top-4 right-4 z-50" data-testid="live-indicator">
        <div className="relative">
          <div className="absolute inset-0 bg-green-400 rounded-full blur-xl opacity-60 animate-pulse"></div>
          <div className="relative flex items-center gap-2 bg-gradient-to-r from-green-500 to-green-600 text-white px-5 py-2.5 rounded-full shadow-2xl border-2 border-green-300">
            <div className="relative">
              <div className="w-3 h-3 bg-white rounded-full animate-ping absolute"></div>
              <div className="w-3 h-3 bg-white rounded-full"></div>
            </div>
            <span className="font-body font-bold text-sm tracking-wide">LIVE</span>
          </div>
        </div>
      </div>

      {/* Rangoli Decoration Background */}
      <div className="absolute top-0 left-0 right-0 h-32 rangoli-pattern opacity-10"></div>
      
      {/* Decorative Corner Elements */}
      <div className="absolute top-8 left-8 w-24 h-24 border-t-2 border-l-2 border-gold opacity-30"></div>
      <div className="absolute top-8 right-8 w-24 h-24 border-t-2 border-r-2 border-gold opacity-30"></div>

      <div className="py-12 md:py-20 text-center relative z-10">
        {/* Logo */}
        <motion.div
          className="mb-6"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={animate ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          <div className="inline-flex items-center justify-center w-32 h-32 bg-gradient-to-br from-gold to-burgundy rounded-full shadow-gold-soft border-4 border-white">
            <FaCamera className="text-5xl text-white" />
          </div>
        </motion.div>

        {/* Brand Name with Shine Effect */}
        <motion.div
          className="relative inline-block"
          initial={{ opacity: 0, y: 30 }}
          animate={animate ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
        >
          <h1
            className="text-5xl md:text-7xl font-heading italic text-foreground mb-2 relative"
            data-testid="photographer-brand-name"
          >
            <span className="relative inline-block">
              <span className="relative z-10">Wedding Clickz Photography</span>
              <span className="absolute inset-0 shine-effect"></span>
            </span>
          </h1>
        </motion.div>

        {/* Tagline/Bio */}
        <motion.div
          className="max-w-2xl mx-auto px-4 mb-8"
          initial={{ opacity: 0 }}
          animate={animate ? { opacity: 1 } : {}}
          transition={{ delay: 0.6, duration: 0.8 }}
        >
          <p className="text-xl md:text-2xl font-body text-accent mb-3">
            Wedding Photography In a Artistic Style
          </p>
          <p className="text-base md:text-lg font-body text-foreground/70">
            Candid • Cinematic • Story-Driven
          </p>
          <p className="text-sm md:text-base font-body text-foreground/60 mt-2">
            Bangalore | Destination Weddings
          </p>
        </motion.div>

        {/* Social Links - Ordered: Email, Instagram, YouTube, WhatsApp, Location */}
        <motion.div
          className="flex flex-wrap justify-center gap-4 text-xl px-4"
          data-testid="contact-social-links"
          initial={{ opacity: 0 }}
          animate={animate ? { opacity: 1 } : {}}
          transition={{ delay: 0.8, duration: 0.8 }}
        >
          <a
            href="mailto:info@weddingclickz.com"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white shadow-md hover:shadow-xl transition-all transform hover:scale-105"
            data-testid="email-link"
          >
            <FaEnvelope className="text-2xl text-blue-600" />
            <span className="hidden md:inline font-body text-foreground/80">Email</span>
          </a>

          <a
            href="https://instagram.com/weddingclickz"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white shadow-md hover:shadow-xl transition-all transform hover:scale-105"
            data-testid="instagram-link"
          >
            <FaInstagram className="text-2xl text-burgundy" />
            <span className="hidden md:inline font-body text-foreground/80">Instagram</span>
          </a>

          <a
            href="https://youtube.com/@weddingclickz"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white shadow-md hover:shadow-xl transition-all transform hover:scale-105"
            data-testid="youtube-link"
          >
            <FaYoutube className="text-2xl text-red-600" />
            <span className="hidden md:inline font-body text-foreground/80">YouTube</span>
          </a>

          <a
            href="https://wa.me/1234567890"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white shadow-md hover:shadow-xl transition-all transform hover:scale-105"
            data-testid="whatsapp-link"
          >
            <FaWhatsapp className="text-2xl" style={{ color: '#25D366' }} />
            <span className="hidden md:inline font-body text-foreground/80">WhatsApp</span>
          </a>

          <a
            href="https://maps.google.com/?q=Bangalore"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white shadow-md hover:shadow-xl transition-all transform hover:scale-105"
            data-testid="location-link"
          >
            <FaMapMarkerAlt className="text-2xl text-orange-600" />
            <span className="hidden md:inline font-body text-foreground/80">Location</span>
          </a>
        </motion.div>
      </div>

      {/* Bottom Decorative Corners */}
      <div className="absolute bottom-8 left-8 w-24 h-24 border-b-2 border-l-2 border-gold opacity-30"></div>
      <div className="absolute bottom-8 right-8 w-24 h-24 border-b-2 border-r-2 border-gold opacity-30"></div>
    </div>
  );
};

export default PhotographerHeader;