import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiChevronLeft, FiChevronRight, FiDownload } from 'react-icons/fi';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const samplePhotos = [
  { url: 'https://images.pexels.com/photos/15841148/pexels-photo-15841148.jpeg?auto=compress&cs=tinysrgb&w=1200', alt: 'Couple portrait' },
  { url: 'https://images.pexels.com/photos/4456473/pexels-photo-4456473.jpeg?auto=compress&cs=tinysrgb&w=1200', alt: 'Bride close-up' },
  { url: 'https://images.pexels.com/photos/9428788/pexels-photo-9428788.jpeg?auto=compress&cs=tinysrgb&w=1200', alt: 'Wedding details' },
  { url: 'https://images.pexels.com/photos/27014711/pexels-photo-27014711.jpeg?auto=compress&cs=tinysrgb&w=1200', alt: 'Floral decor' },
  { url: 'https://images.pexels.com/photos/7301283/pexels-photo-7301283.jpeg?auto=compress&cs=tinysrgb&w=1200', alt: 'Ring ceremony' },
  { url: 'https://images.pexels.com/photos/15582310/pexels-photo-15582310.jpeg?auto=compress&cs=tinysrgb&w=1200', alt: 'Traditional rituals' },
  { url: 'https://images.pexels.com/photos/2253870/pexels-photo-2253870.jpeg?auto=compress&cs=tinysrgb&w=1200', alt: 'Couple dancing' },
  { url: 'https://images.pexels.com/photos/1616403/pexels-photo-1616403.jpeg?auto=compress&cs=tinysrgb&w=1200', alt: 'Bridal makeup' },
  { url: 'https://images.pexels.com/photos/3014856/pexels-photo-3014856.jpeg?auto=compress&cs=tinysrgb&w=1200', alt: 'Wedding venue' },
  { url: 'https://images.pexels.com/photos/5778899/pexels-photo-5778899.jpeg?auto=compress&cs=tinysrgb&w=1200', alt: 'Ceremony moments' },
  { url: 'https://images.pexels.com/photos/11193337/pexels-photo-11193337.jpeg?auto=compress&cs=tinysrgb&w=1200', alt: 'Bride preparation' },
  { url: 'https://images.pexels.com/photos/8960464/pexels-photo-8960464.jpeg?auto=compress&cs=tinysrgb&w=1200', alt: 'Couple together' },
  { url: 'https://images.pexels.com/photos/8960462/pexels-photo-8960462.jpeg?auto=compress&cs=tinysrgb&w=1200', alt: 'Wedding celebration' },
  { url: 'https://images.pexels.com/photos/11100472/pexels-photo-11100472.jpeg?auto=compress&cs=tinysrgb&w=1200', alt: 'Traditional attire' },
  { url: 'https://images.pexels.com/photos/1616403/pexels-photo-1616403.jpeg?auto=compress&cs=tinysrgb&w=1200', alt: 'Bridal jewelry' },
  { url: 'https://images.pexels.com/photos/7165802/pexels-photo-7165802.jpeg?auto=compress&cs=tinysrgb&w=1200', alt: 'Couple romantic' },
  { url: 'https://images.pexels.com/photos/11024130/pexels-photo-11024130.jpeg?auto=compress&cs=tinysrgb&w=1200', alt: 'Wedding rings' },
  { url: 'https://images.pexels.com/photos/2253870/pexels-photo-2253870.jpeg?auto=compress&cs=tinysrgb&w=1200', alt: 'Reception party' },
  { url: 'https://images.pexels.com/photos/8960456/pexels-photo-8960456.jpeg?auto=compress&cs=tinysrgb&w=1200', alt: 'Candid moments' },
  { url: 'https://images.pexels.com/photos/5778899/pexels-photo-5778899.jpeg?auto=compress&cs=tinysrgb&w=1200', alt: 'Beautiful couple' },
  { url: 'https://images.pexels.com/photos/11193337/pexels-photo-11193337.jpeg?auto=compress&cs=tinysrgb&w=1200', alt: 'Traditional ceremony' },
  { url: 'https://images.pexels.com/photos/7165802/pexels-photo-7165802.jpeg?auto=compress&cs=tinysrgb&w=1200', alt: 'Love moments' },
  { url: 'https://images.pexels.com/photos/11024130/pexels-photo-11024130.jpeg?auto=compress&cs=tinysrgb&w=1200', alt: 'Wedding day' },
  { url: 'https://images.pexels.com/photos/8960464/pexels-photo-8960464.jpeg?auto=compress&cs=tinysrgb&w=1200', alt: 'Special moments' },
];

const LiveGallery = () => {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSamples, setShowSamples] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

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

  const displayPhotos = showSamples ? samplePhotos : photos;

  const openLightbox = (index) => {
    setCurrentImageIndex(index);
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
  };

  const goToNext = () => {
    setCurrentImageIndex((prev) => (prev + 1) % displayPhotos.length);
  };

  const goToPrev = () => {
    setCurrentImageIndex((prev) => (prev - 1 + displayPhotos.length) % displayPhotos.length);
  };

  const downloadImage = () => {
    const currentPhoto = displayPhotos[currentImageIndex];
    const imageUrl = showSamples ? currentPhoto.url : currentPhoto.image_data;
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = showSamples ? `wedding-photo-${currentImageIndex + 1}.jpg` : currentPhoto.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!lightboxOpen) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowRight') goToNext();
      if (e.key === 'ArrowLeft') goToPrev();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxOpen]);

  if (loading) {
    return (
      <div className="py-20 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold mx-auto mb-4"></div>
        <p className="text-foreground/60 font-body">Loading gallery...</p>
      </div>
    );
  }

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
    <div className="py-12 px-4 md:px-8">
      <h3 className="text-4xl font-heading text-center mb-4 text-foreground">
        Live Gallery
      </h3>
      <p className="text-center text-foreground/60 font-body mb-12">
        {showSamples ? 'Sample Wedding Moments' : 'Real-time Photo Stream'}
      </p>

      {/* Optimized Grid Layout - Maintains Aspect Ratio */}
      <div
        className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 md:gap-3"
        data-testid="live-gallery-grid"
      >
        {displayPhotos.map((photo, index) => (
          <motion.div
            key={showSamples ? index : photo.photo_id}
            className="relative cursor-pointer group overflow-hidden rounded-lg"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: Math.min(index * 0.03, 0.3), duration: 0.4 }}
            onClick={() => openLightbox(index)}
          >
            <img
              src={showSamples ? photo.url : photo.image_data}
              alt={showSamples ? photo.alt : photo.filename}
              loading="lazy"
              decoding="async"
              className="w-full h-auto object-contain group-hover:scale-110 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="absolute bottom-2 left-2 right-2">
                <p className="text-white text-xs font-body truncate">
                  {showSamples ? photo.alt : (photo.photographer_notes || 'Click to view')}
                </p>
              </div>
            </div>
            {showSamples && (
              <div className="absolute top-2 right-2 bg-gold/90 text-white text-xs font-body px-2 py-1 rounded">
                Sample
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {lightboxOpen && (
          <motion.div
            className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeLightbox}
          >
            {/* Close Button */}
            <button
              onClick={closeLightbox}
              className="absolute top-4 right-4 text-white p-2 hover:bg-white/10 rounded-full transition-colors z-10"
              data-testid="lightbox-close"
            >
              <FiX size={32} />
            </button>

            {/* Download Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                downloadImage();
              }}
              className="absolute top-4 right-20 text-white p-2 hover:bg-white/10 rounded-full transition-colors z-10"
              data-testid="lightbox-download"
            >
              <FiDownload size={28} />
            </button>

            {/* Previous Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                goToPrev();
              }}
              className="absolute left-4 text-white p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors z-10"
              data-testid="lightbox-prev"
            >
              <FiChevronLeft size={32} />
            </button>

            {/* Next Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                goToNext();
              }}
              className="absolute right-4 text-white p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors z-10"
              data-testid="lightbox-next"
            >
              <FiChevronRight size={32} />
            </button>

            {/* Image */}
            <motion.div
              className="relative"
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <img
                src={showSamples ? displayPhotos[currentImageIndex].url : displayPhotos[currentImageIndex].image_data}
                alt={showSamples ? displayPhotos[currentImageIndex].alt : displayPhotos[currentImageIndex].filename}
                className="max-h-[85vh] max-w-[90vw] w-auto h-auto object-contain rounded-lg shadow-2xl"
              />
            </motion.div>

            {/* Image Counter */}
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-white bg-black/50 px-4 py-2 rounded-full">
              <span className="font-body text-sm">
                {currentImageIndex + 1} / {displayPhotos.length}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LiveGallery;