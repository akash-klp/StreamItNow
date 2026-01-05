import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { FaWhatsapp, FaInstagram, FaYoutube, FaEnvelope, FaMapMarkerAlt } from 'react-icons/fa';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const PhotographerHeader = () => {
  const [animate, setAnimate] = useState(false);
  const [settings, setSettings] = useState(null);
  const [flowers, setFlowers] = useState([]);

  useEffect(() => {
    setAnimate(true);
    fetchSettings();
    
    const flowerInterval = setInterval(() => {
      const flowerEmojis = ['🌸', '🌺', '🌼', '🌻', '🌷', '🏵️', '💐', '🌹'];
      const newFlowers = Array.from({ length: 10 }, (_, i) => ({
        id: Date.now() + i,
        x: Math.random() * 100,
        emoji: flowerEmojis[Math.floor(Math.random() * flowerEmojis.length)],
        delay: Math.random() * 0.5,
        duration: 3 + Math.random() * 2,
      }));
      setFlowers(newFlowers);
      setTimeout(() => setFlowers([]), 5000);
    }, 8000);

    return () => clearInterval(flowerInterval);
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/settings`);
      setSettings(response.data);
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    }
  };

  const displayName = settings?.photography_name || 'Wedding Clickz Photography';
  const email = settings?.email || 'info@weddingclickz.com';
  const instagram = settings?.instagram_link || 'https://instagram.com/weddingclickz';
  const youtube = settings?.youtube_link || 'https://youtube.com/@weddingclickz';
  const whatsapp = settings?.whatsapp_number || '1234567890';
  const location = settings?.location_link || 'https://maps.google.com/?q=Bangalore';

  return (
    <div className="relative">
      <AnimatePresence>
        {flowers.map((flower) => (
          <motion.div
            key={flower.id}
            className="fixed pointer-events-none z-40"
            style={{
              left: `${flower.x}%`,
              top: `${flower.y}%`,
            }}
            initial={{ scale: 0, opacity: 0, rotate: 0 }}
            animate={{ 
              scale: [0, 1.5, 1], 
              opacity: [0, 1, 0], 
              rotate: [0, 180, 360],
              y: [0, -50, -100]
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 3, ease: 'easeOut' }}
          >
            <span className="text-4xl">🌸</span>
          </motion.div>
        ))}
      </AnimatePresence>

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

      <div className="absolute top-0 left-0 right-0 h-32 rangoli-pattern opacity-10"></div>
      
      <div className="absolute top-8 left-8 w-24 h-24 border-t-2 border-l-2 border-gold opacity-30"></div>
      <div className="absolute top-8 right-8 w-24 h-24 border-t-2 border-r-2 border-gold opacity-30"></div>

      <div className="py-12 md:py-20 text-center relative z-10">
        <motion.div
          className="mb-6"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={animate ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          <div className="relative inline-block">
            <div className="w-32 h-32 mx-auto">
              <svg viewBox="0 0 100 100" className="w-full h-full">
                <defs>
                  <linearGradient id="shutterGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style={{ stopColor: '#D4AF37', stopOpacity: 1 }} />
                    <stop offset="50%" style={{ stopColor: '#FFD700', stopOpacity: 1 }} />
                    <stop offset="100%" style={{ stopColor: '#5D001E', stopOpacity: 1 }} />
                  </linearGradient>
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                    <feMerge>
                      <feMergeNode in="coloredBlur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                </defs>
                
                <circle cx="50" cy="50" r="45" fill="url(#shutterGradient)" filter="url(#glow)" />
                
                {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
                  <motion.path
                    key={i}
                    d={`M 50 50 L ${50 + 35 * Math.cos((angle * Math.PI) / 180)} ${50 + 35 * Math.sin((angle * Math.PI) / 180)} L ${50 + 35 * Math.cos(((angle + 45) * Math.PI) / 180)} ${50 + 35 * Math.sin(((angle + 45) * Math.PI) / 180)} Z`}
                    fill="white"
                    opacity="0.9"
                    animate={{ 
                      scale: [1, 0.8, 1],
                      opacity: [0.9, 0.3, 0.9]
                    }}
                    transition={{ 
                      duration: 2, 
                      repeat: Infinity, 
                      delay: i * 0.1,
                      ease: 'easeInOut'
                    }}
                  />
                ))}
                
                <circle cx="50" cy="50" r="15" fill="#2C2C2C" />
              </svg>
            </div>
            <motion.div
              className="absolute inset-0 pointer-events-none"
              animate={{ 
                background: [
                  'radial-gradient(circle at 0% 0%, rgba(255,255,255,0.6) 0%, transparent 50%)',
                  'radial-gradient(circle at 100% 100%, rgba(255,255,255,0.6) 0%, transparent 50%)',
                  'radial-gradient(circle at 0% 0%, rgba(255,255,255,0.6) 0%, transparent 50%)'
                ]
              }}
              transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
            />
          </div>
        </motion.div>

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
              <span className="relative z-10">{displayName}</span>
              <span className="absolute inset-0 shine-effect"></span>
            </span>
          </h1>
        </motion.div>

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

        <motion.div
          className="flex flex-wrap justify-center gap-4 text-xl px-4"
          data-testid="contact-social-links"
          initial={{ opacity: 0 }}
          animate={animate ? { opacity: 1 } : {}}
          transition={{ delay: 0.8, duration: 0.8 }}
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

      <div className="absolute bottom-8 left-8 w-24 h-24 border-b-2 border-l-2 border-gold opacity-30"></div>
      <div className="absolute bottom-8 right-8 w-24 h-24 border-b-2 border-r-2 border-gold opacity-30"></div>
    </div>
  );
};

export default PhotographerHeader;
