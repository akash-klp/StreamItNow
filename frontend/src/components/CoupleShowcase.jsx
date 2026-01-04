import React from 'react';
import { motion } from 'framer-motion';

const CoupleShowcase = () => {
  return (
    <div className="py-20 text-center" data-testid="couple-names">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        whileInView={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1 }}
        viewport={{ once: true }}
      >
        <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8">
          <h2 className="text-6xl md:text-8xl font-script text-accent">
            Prarthana
          </h2>
          <span className="text-sm uppercase tracking-widest font-body text-foreground/60">
            Weds
          </span>
          <h2 className="text-6xl md:text-8xl font-script text-accent">
            Santosh
          </h2>
        </div>
      </motion.div>
    </div>
  );
};

export default CoupleShowcase;