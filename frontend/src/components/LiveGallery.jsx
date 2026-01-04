import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

// Sample streaming photos with varied aspect ratios
const samplePhotos = [
  { url: 'https://images.pexels.com/photos/15841148/pexels-photo-15841148.jpeg?auto=compress&cs=tinysrgb&w=800', alt: 'Couple portrait', aspect: 'tall' },
  { url: 'https://images.pexels.com/photos/4456473/pexels-photo-4456473.jpeg?auto=compress&cs=tinysrgb&w=800', alt: 'Bride close-up', aspect: 'portrait' },
  { url: 'https://images.pexels.com/photos/9428788/pexels-photo-9428788.jpeg?auto=compress&cs=tinysrgb&w=800', alt: 'Wedding details', aspect: 'square' },
  { url: 'https://images.pexels.com/photos/27014711/pexels-photo-27014711.jpeg?auto=compress&cs=tinysrgb&w=800', alt: 'Floral decor', aspect: 'landscape' },
  { url: 'https://images.pexels.com/photos/7301283/pexels-photo-7301283.jpeg?auto=compress&cs=tinysrgb&w=800', alt: 'Ring ceremony', aspect: 'portrait' },
  { url: 'https://images.pexels.com/photos/15582310/pexels-photo-15582310.jpeg?auto=compress&cs=tinysrgb&w=800', alt: 'Traditional rituals', aspect: 'tall' },
  { url: 'https://images.pexels.com/photos/2253870/pexels-photo-2253870.jpeg?auto=compress&cs=tinysrgb&w=800', alt: 'Couple dancing', aspect: 'landscape' },
  { url: 'https://images.pexels.com/photos/1616403/pexels-photo-1616403.jpeg?auto=compress&cs=tinysrgb&w=800', alt: 'Bridal makeup', aspect: 'portrait' },
  { url: 'https://images.pexels.com/photos/3014856/pexels-photo-3014856.jpeg?auto=compress&cs=tinysrgb&w=800', alt: 'Wedding venue', aspect: 'landscape' },
  { url: 'https://images.pexels.com/photos/5778899/pexels-photo-5778899.jpeg?auto=compress&cs=tinysrgb&w=800', alt: 'Ceremony moments', aspect: 'square' },
  { url: 'https://images.pexels.com/photos/11193337/pexels-photo-11193337.jpeg?auto=compress&cs=tinysrgb&w=800', alt: 'Bride preparation', aspect: 'portrait' },
  { url: 'https://images.pexels.com/photos/8960464/pexels-photo-8960464.jpeg?auto=compress&cs=tinysrgb&w=800', alt: 'Couple together', aspect: 'tall' },
  { url: 'https://images.pexels.com/photos/8960462/pexels-photo-8960462.jpeg?auto=compress&cs=tinysrgb&w=800', alt: 'Wedding celebration', aspect: 'landscape' },
  { url: 'https://images.pexels.com/photos/11100472/pexels-photo-11100472.jpeg?auto=compress&cs=tinysrgb&w=800', alt: 'Traditional attire', aspect: 'portrait' },
  { url: 'https://images.pexels.com/photos/3014856/pexels-photo-3014856.jpeg?auto=compress&cs=tinysrgb&w=800', alt: 'Decoration details', aspect: 'square' },
  { url: 'https://images.pexels.com/photos/1616403/pexels-photo-1616403.jpeg?auto=compress&cs=tinysrgb&w=800', alt: 'Bridal jewelry', aspect: 'portrait' },
  { url: 'https://images.pexels.com/photos/7165802/pexels-photo-7165802.jpeg?auto=compress&cs=tinysrgb&w=800', alt: 'Couple romantic', aspect: 'landscape' },
  { url: 'https://images.pexels.com/photos/11024130/pexels-photo-11024130.jpeg?auto=compress&cs=tinysrgb&w=800', alt: 'Wedding rings', aspect: 'square' },
  { url: 'https://images.pexels.com/photos/2253870/pexels-photo-2253870.jpeg?auto=compress&cs=tinysrgb&w=800', alt: 'Reception party', aspect: 'landscape' },
  { url: 'https://images.pexels.com/photos/8960456/pexels-photo-8960456.jpeg?auto=compress&cs=tinysrgb&w=800', alt: 'Candid moments', aspect: 'tall' },
  { url: 'https://images.pexels.com/photos/5778899/pexels-photo-5778899.jpeg?auto=compress&cs=tinysrgb&w=800', alt: 'Beautiful couple', aspect: 'portrait' },
  { url: 'https://images.pexels.com/photos/11193337/pexels-photo-11193337.jpeg?auto=compress&cs=tinysrgb&w=800', alt: 'Traditional ceremony', aspect: 'landscape' },
  { url: 'https://images.pexels.com/photos/7165802/pexels-photo-7165802.jpeg?auto=compress&cs=tinysrgb&w=800', alt: 'Love moments', aspect: 'square' },
  { url: 'https://images.pexels.com/photos/11024130/pexels-photo-11024130.jpeg?auto=compress&cs=tinysrgb&w=800', alt: 'Wedding day', aspect: 'portrait' },
  { url: 'https://images.pexels.com/photos/8960464/pexels-photo-8960464.jpeg?auto=compress&cs=tinysrgb&w=800', alt: 'Special moments', aspect: 'tall' },
];

const LiveGallery = () => {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSamples, setShowSamples] = useState(false);

  const fetchPhotos = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/photos/guest`);
      if (response.data.length > 0) {
        setPhotos(response.data);
        setShowSamples(false);
      } else {
        setShowSamples(true);
      }
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch photos:', error);
      setShowSamples(true);
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

  const displayPhotos = showSamples ? samplePhotos : photos;

  if (displayPhotos.length === 0) {
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
      <h3 className="text-4xl font-heading text-center mb-4 text-foreground">
        Live Wedding Gallery
      </h3>
      <p className="text-center text-foreground/60 font-body mb-12">
        {showSamples ? 'Sample Wedding Moments' : 'Real-time Photo Stream'}
      </p>

      <div
        className="columns-1 md:columns-3 lg:columns-4 gap-4 space-y-4"
        data-testid="live-gallery-grid"
      >
        {displayPhotos.map((photo, index) => {
          const aspectClass = showSamples
            ? photo.aspect === 'tall'
              ? 'h-96'
              : photo.aspect === 'portrait'
              ? 'h-80'
              : photo.aspect === 'square'
              ? 'h-64'
              : 'h-56'
            : 'h-auto';

          return (
            <motion.div
              key={showSamples ? index : photo.photo_id}
              className="break-inside-avoid mb-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05, duration: 0.5 }}
            >
              <div className="relative group overflow-hidden rounded-lg border-2 border-white shadow-lg hover:shadow-2xl transition-all duration-300">
                <img
                  src={showSamples ? photo.url : photo.image_data}
                  alt={showSamples ? photo.alt : photo.filename}
                  className={`w-full ${aspectClass} object-cover group-hover:scale-110 transition-transform duration-700`}
                />
                {!showSamples && photo.photographer_notes && (
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <p className="text-white text-sm font-body">
                      {photo.photographer_notes}
                    </p>
                  </div>
                )}
                {showSamples && (
                  <div className="absolute top-2 right-2 bg-gold/90 text-white text-xs font-body px-2 py-1 rounded">
                    Sample
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default LiveGallery;