import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const LiveGallery = () => {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPhotos = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/photos/guest`);
      setPhotos(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch photos:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPhotos();

    const interval = setInterval(() => {
      fetchPhotos();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="py-20 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold mx-auto mb-4"></div>
        <p className="text-foreground/60 font-body">Loading gallery...</p>
      </div>
    );
  }

  if (photos.length === 0) {
    return (
      <div className="py-20 text-center" data-testid="live-gallery-grid">
        <p className="text-2xl font-heading text-foreground/60">
          Capturing moments... Photos appearing soon.
        </p>
      </div>
    );
  }

  return (
    <div className="py-12 px-4 md:px-12">
      <h3 className="text-4xl font-heading text-center mb-12 text-foreground">
        Live Gallery
      </h3>
      <div
        className="columns-1 md:columns-3 gap-4 space-y-4"
        data-testid="live-gallery-grid"
      >
        {photos.map((photo, index) => (
          <motion.div
            key={photo.photo_id}
            className="break-inside-avoid mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.5 }}
          >
            <div className="relative group overflow-hidden rounded-lg border border-warmgrey shadow-gold-soft hover:shadow-xl transition-all duration-300">
              <img
                src={photo.image_data}
                alt={photo.filename}
                className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-500"
              />
              {photo.photographer_notes && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <p className="text-white text-sm font-body">
                    {photo.photographer_notes}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default LiveGallery;