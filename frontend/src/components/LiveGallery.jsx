import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiDownload } from 'react-icons/fi';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const CACHE_KEY = 'wedding_gallery_photos';

const LiveGallery = () => {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  
  // Touch/swipe handling
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  // Load cached photos on mount
  useEffect(() => {
    const cachedPhotos = localStorage.getItem(CACHE_KEY);
    if (cachedPhotos) {
      try {
        const parsed = JSON.parse(cachedPhotos);
        if (parsed && parsed.length > 0) {
          setPhotos(parsed);
          setLoading(false);
        }
      } catch (e) {
        console.error('Failed to parse cached gallery photos:', e);
      }
    }
    fetchPhotos();
    
    // Refresh every 15 seconds
    const interval = setInterval(fetchPhotos, 15000);
    return () => clearInterval(interval);
  }, []);

  const fetchPhotos = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/photos/guest`, {
        timeout: 30000 // 30 second timeout for slow server wake-up
      });
      
      if (response.data && response.data.length > 0) {
        setPhotos(response.data);
        // Cache the photos in localStorage
        localStorage.setItem(CACHE_KEY, JSON.stringify(response.data));
      }
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch photos:', error);
      // Keep showing cached photos, just stop loading
      setLoading(false);
    }
  };

  const openLightbox = (index) => {
    setCurrentImageIndex(index);
    setDirection(0);
    setLightboxOpen(true);
    document.body.style.overflow = 'hidden';
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
    document.body.style.overflow = 'auto';
  };

  const goToNext = () => {
    setDirection(1);
    setCurrentImageIndex((prev) => (prev + 1) % photos.length);
  };

  const goToPrev = () => {
    setDirection(-1);
    setCurrentImageIndex((prev) => (prev - 1 + photos.length) % photos.length);
  };

  // Touch handlers for swipe
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const swipeDistance = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 50;

    if (Math.abs(swipeDistance) > minSwipeDistance) {
      if (swipeDistance > 0) {
        goToNext();
      } else {
        goToPrev();
      }
    }
  };

  // Mouse drag handlers for desktop swipe
  const handleDragEnd = (event, info) => {
    const swipeThreshold = 50;
    if (info.offset.x < -swipeThreshold) {
      goToNext();
    } else if (info.offset.x > swipeThreshold) {
      goToPrev();
    }
  };

  const downloadImage = () => {
    const currentPhoto = photos[currentImageIndex];
    const link = document.createElement('a');
    link.href = currentPhoto.image_data;
    link.download = currentPhoto.filename;
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
  }, [lightboxOpen, photos.length]);

  // Slide animation variants
  const slideVariants = {
    enter: (direction) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction) => ({
      x: direction < 0 ? 300 : -300,
      opacity: 0,
    }),
  };

  // Show loading only if we have no cached photos
  if (loading && photos.length === 0) {
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
    <div className="py-12">
      <h3 className="text-4xl font-heading text-center mb-4 text-foreground">
        Live Gallery
      </h3>
      <p className="text-center text-foreground/60 font-body mb-12">
        Real-time Photo Stream
      </p>

      {/* Grid Layout */}
      <div
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4"
        data-testid="live-gallery-grid"
      >
        {photos.map((photo, index) => (
          <motion.div
            key={photo.photo_id}
            className="relative cursor-pointer group overflow-hidden rounded-xl aspect-square bg-gray-100"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(index * 0.05, 0.4), duration: 0.5 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => openLightbox(index)}
          >
            <img
              src={photo.image_data}
              alt={photo.filename}
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </motion.div>
        ))}
      </div>

      {/* Instagram-style Lightbox Modal */}
      <AnimatePresence>
        {lightboxOpen && photos.length > 0 && (
          <motion.div
            className="fixed inset-0 bg-black z-50 flex flex-col"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* Top Bar */}
            <div className="flex justify-between items-center p-4 z-20">
              <button
                onClick={closeLightbox}
                className="text-white p-2 hover:bg-white/10 rounded-full transition-colors"
                data-testid="lightbox-close"
              >
                <FiX size={28} />
              </button>
              
              <div className="text-white font-body text-sm">
                {currentImageIndex + 1} / {photos.length}
              </div>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  downloadImage();
                }}
                className="text-white p-2 hover:bg-white/10 rounded-full transition-colors"
                data-testid="lightbox-download"
              >
                <FiDownload size={24} />
              </button>
            </div>

            {/* Swipeable Image Container */}
            <div 
              className="flex-1 flex items-center justify-center overflow-hidden relative"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                  key={currentImageIndex}
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ 
                    x: { type: "spring", stiffness: 300, damping: 30 },
                    opacity: { duration: 0.2 }
                  }}
                  drag="x"
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.2}
                  onDragEnd={handleDragEnd}
                  className="absolute w-full h-full flex items-center justify-center px-4 cursor-grab active:cursor-grabbing"
                >
                  <img
                    src={photos[currentImageIndex].image_data}
                    alt={photos[currentImageIndex].filename}
                    className="max-h-[80vh] max-w-full w-auto h-auto object-contain rounded-lg select-none"
                    draggable="false"
                  />
                </motion.div>
              </AnimatePresence>

              {/* Swipe hint for mobile */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/50 text-xs font-body md:hidden">
                Swipe to navigate
              </div>
            </div>

            {/* Progress Dots */}
            <div className="flex justify-center gap-1.5 pb-6 pt-2">
              {photos.slice(0, Math.min(photos.length, 10)).map((_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setDirection(index > currentImageIndex ? 1 : -1);
                    setCurrentImageIndex(index);
                  }}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    index === currentImageIndex 
                      ? 'bg-white w-6' 
                      : 'bg-white/40 hover:bg-white/60'
                  }`}
                  aria-label={`Go to image ${index + 1}`}
                />
              ))}
              {photos.length > 10 && (
                <span className="text-white/40 text-xs ml-2">+{photos.length - 10}</span>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LiveGallery;
