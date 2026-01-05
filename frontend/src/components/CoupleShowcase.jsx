import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const CoupleShowcase = () => {
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/settings`);
      setSettings(response.data);
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    }
  };

  const brideName = settings?.bride_name || '';
  const groomName = settings?.groom_name || '';
  const showWelcome = !brideName && !groomName;

  return (
    <div className="py-20 text-center" data-testid="couple-names">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        whileInView={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1 }}
        viewport={{ once: true }}
      >
        {showWelcome ? (
          <h2 className="text-6xl md:text-8xl font-script text-accent">
            Welcome
          </h2>
        ) : (
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8">
            {brideName && (
              <h2 className="text-6xl md:text-8xl font-script text-accent">
                {brideName}
              </h2>
            )}
            {brideName && groomName && (
              <span className="text-sm uppercase tracking-widest font-body text-foreground/60">
                Weds
              </span>
            )}
            {groomName && (
              <h2 className="text-6xl md:text-8xl font-script text-accent">
                {groomName}
              </h2>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default CoupleShowcase;
