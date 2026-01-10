import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { FaWhatsapp, FaInstagram, FaYoutube, FaEnvelope, FaMapMarkerAlt } from 'react-icons/fa';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const PhotographerHeader = () => {
  const [animate, setAnimate] = useState(false);
  const [settings, setSettings] = useState(null);
  const [backgroundImages, setBackgroundImages] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    setAnimate(true);
    fetchSettings();
    fetchBackgroundImages();
  }, []);

  useEffect(() => {
    if (backgroundImages.length === 0) return;

    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % backgroundImages.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [backgroundImages]);

  const fetchSettings = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/settings`);
      setSettings(response.data);
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    }
  };

  const fetchBackgroundImages = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/background-images`);
      setBackgroundImages(response.data);
    } catch (error) {
      console.error('Failed to fetch background images:', error);
    }
  };

  const displayName = settings?.photography_name || 'Wedding Clickz Photography';
  const email = settings?.email || 'info@weddingclickz.com';
  const instagram = settings?.instagram_link || 'https://instagram.com/weddingclickz';
  const youtube = settings?.youtube_link || 'https://youtube.com/@weddingclickz';
  const whatsapp = settings?.whatsapp_number || '1234567890';
  const location = settings?.location_link || 'https://maps.google.com/?q=Bangalore';

  return (
    <div className="relative overflow-hidden">
      {/* Background Slideshow */}
      {backgroundImages.length > 0 && (
        <div className="absolute inset-0 z-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentImageIndex}
              className="absolute inset-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1 }}
            >
              <img
                src={backgroundImages[currentImageIndex].image_data}
                alt="Background"
                className="w-full h-full object-cover"
              />
              {/* Dark overlay for text readability */}
              <div className="absolute inset-0 bg-black/40"></div>
            </motion.div>
          </AnimatePresence>
        </div>
      )}

      {/* SMILE Indicator */}
      <div className="fixed top-4 right-4 z-50" data-testid="smile-indicator">
        <div className="relative">
          <div className="absolute inset-0 bg-green-400 rounded-full blur-xl opacity-60 animate-pulse"></div>
          <div className="relative flex items-center gap-2 bg-gradient-to-r from-green-500 to-green-600 text-white px-5 py-2.5 rounded-full shadow-2xl border-2 border-green-300">
            <div className="relative">
              <div className="w-3 h-3 bg-white rounded-full animate-ping absolute"></div>
              <div className="w-3 h-3 bg-white rounded-full"></div>
            </div>
            <span className="font-body font-bold text-sm tracking-wide">SMILE</span>
          </div>
        </div>
      </div>

      {/* Decorative Corner Elements */}
      <div className="absolute top-8 left-8 w-24 h-24 border-t-2 border-l-2 border-gold opacity-30 z-10"></div>
      <div className="absolute top-8 right-8 w-24 h-24 border-t-2 border-r-2 border-gold opacity-30 z-10"></div>

      <div className="py-16 md:py-24 text-center relative z-10">
        {/* Brand Name with Shine Effect */}
        <motion.div
          className="relative inline-block"
          initial={{ opacity: 0, y: 30 }}
          animate={animate ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 1, ease: 'easeOut' }}
        >
          <h1
            className="text-5xl md:text-7xl font-heading italic text-white mb-2 relative drop-shadow-lg"
            data-testid="photographer-brand-name"
          >
            <span className="relative inline-block">
              <span className="relative z-10">{displayName}</span>
              <span className="absolute inset-0 shine-effect"></span>
            </span>
          </h1>
        </motion.div>

        {/* Tagline/Bio */}
        <motion.div
          className="max-w-2xl mx-auto px-4 mb-8"
          initial={{ opacity: 0 }}
          animate={animate ? { opacity: 1 } : {}}
          transition={{ delay: 0.3, duration: 0.8 }}
        >
          <p className="text-xl md:text-2xl font-body text-white drop-shadow-md mb-3">
            Wedding Photography In a Artistic Style
          </p>
          <p className="text-base md:text-lg font-body text-white/90 drop-shadow-md">
            Candid • Cinematic • Story-Driven
          </p>
          <p className="text-sm md:text-base font-body text-white/80 drop-shadow-md mt-2">
            Bangalore | Destination Weddings
          </p>
        </motion.div>

        {/* Social Links */}
        <motion.div
          className="flex flex-wrap justify-center gap-4 text-xl px-4"
          data-testid="contact-social-links"
          initial={{ opacity: 0 }}
          animate={animate ? { opacity: 1 } : {}}
          transition={{ delay: 0.5, duration: 0.8 }}
        >
          <a
            href={`mailto:${email}`}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white shadow-md hover:shadow-xl transition-all transform hover:scale-105"
            data-testid="email-link"
          >
            <FaEnvelope className="text-2xl text-blue-600" />
            <span className="hidden md:inline font-body text-foreground/80">Email</span>
          </a>

          <a
            href={instagram}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white shadow-md hover:shadow-xl transition-all transform hover:scale-105"
            data-testid="instagram-link"
          >
            <FaInstagram className="text-2xl text-burgundy" />
            <span className="hidden md:inline font-body text-foreground/80">Instagram</span>
          </a>

          <a
            href={youtube}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white shadow-md hover:shadow-xl transition-all transform hover:scale-105"
            data-testid="youtube-link"
          >
            <FaYoutube className="text-2xl text-red-600" />
            <span className="hidden md:inline font-body text-foreground/80">YouTube</span>
          </a>

          <a
            href={`https://wa.me/${whatsapp}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white shadow-md hover:shadow-xl transition-all transform hover:scale-105"
            data-testid="whatsapp-link"
          >
            <FaWhatsapp className="text-2xl" style={{ color: '#25D366' }} />
            <span className="hidden md:inline font-body text-foreground/80">WhatsApp</span>
          </a>

          <a
            href={location}
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
      <div className="absolute bottom-8 left-8 w-24 h-24 border-b-2 border-l-2 border-gold opacity-30 z-10"></div>
      <div className="absolute bottom-8 right-8 w-24 h-24 border-b-2 border-r-2 border-gold opacity-30 z-10"></div>
    </div>
  );
};

export default PhotographerHeader;
