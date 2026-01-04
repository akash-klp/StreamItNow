import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FaWhatsapp, FaInstagram, FaYoutube } from 'react-icons/fa';

const PhotographerHeader = () => {
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    setAnimate(true);
  }, []);

  return (
    <div className="py-16 md:py-24 text-center">
      <motion.h1
        className="text-5xl md:text-7xl font-heading italic text-foreground mb-8"
        data-testid="photographer-brand-name"
        initial={{ opacity: 0, y: 30 }}
        animate={animate ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 1, ease: 'easeOut' }}
      >
        Wedding Clickz Photography
      </motion.h1>

      <motion.div
        className="flex justify-center gap-8 text-xl text-foreground/80"
        data-testid="contact-social-links"
        initial={{ opacity: 0 }}
        animate={animate ? { opacity: 1 } : {}}
        transition={{ delay: 0.5, duration: 0.8 }}
      >
        <a
          href="https://wa.me/1234567890"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 hover:text-gold transition-colors"
          data-testid="whatsapp-link"
        >
          <FaWhatsapp className="text-2xl" style={{ color: '#25D366' }} />
          <span className="hidden md:inline">WhatsApp</span>
        </a>

        <a
          href="https://instagram.com/weddingclickz"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 hover:text-gold transition-colors"
          data-testid="instagram-link"
        >
          <FaInstagram className="text-2xl" />
          <span className="hidden md:inline">Instagram</span>
        </a>

        <a
          href="https://youtube.com/@weddingclickz"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 hover:text-gold transition-colors"
          data-testid="youtube-link"
        >
          <FaYoutube className="text-2xl" />
          <span className="hidden md:inline">YouTube</span>
        </a>
      </motion.div>
    </div>
  );
};

export default PhotographerHeader;