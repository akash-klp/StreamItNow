import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { FiDownload, FiX, FiChevronLeft, FiChevronRight, FiImage, FiCalendar, FiMapPin } from 'react-icons/fi';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const EventGuestPage = () => {
  const { slug } = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxPhotos, setLightboxPhotos] = useState([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [activeSection, setActiveSection] = useState('all');

  useEffect(() => {
    fetchEventData();
  }, [slug]);

  const fetchEventData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${BACKEND_URL}/api/public/event/${slug}`);
      setEvent(response.data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch event:', err);
      setError(err.response?.data?.detail || 'Event not found or not available');
    } finally {
      setLoading(false);
    }
  };

  // Auto-slide for cover photos
  useEffect(() => {
    if (!event?.cover_photos?.length) return;
    
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % event.cover_photos.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [event?.cover_photos?.length]);

  const openLightbox = (photos, index) => {
    setLightboxPhotos(photos);
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const handleDownload = async (photo) => {
    try {
      const response = await axios.get(
        `${BACKEND_URL}/api/public/event/${slug}/download/${photo.photo_id}`
      );
      window.open(response.data.download_url, '_blank');
    } catch (err) {
      // Fallback to direct URL
      window.open(photo.original_url, '_blank');
    }
  };

  const getAllGalleryPhotos = useCallback(() => {
    if (!event) return [];
    
    let photos = [...(event.main_gallery || [])];
    
    if (activeSection === 'all') {
      Object.values(event.sections || {}).forEach(sectionPhotos => {
        photos = [...photos, ...sectionPhotos];
      });
    } else if (event.sections?.[activeSection]) {
      photos = event.sections[activeSection];
    }
    
    return photos;
  }, [event, activeSection]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white/60">Loading event...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <FiX className="w-10 h-10 text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">Event Not Found</h1>
          <p className="text-white/60">{error}</p>
        </div>
      </div>
    );
  }

  if (!event) return null;

  const galleryPhotos = getAllGalleryPhotos();
  const sectionNames = Object.keys(event.sections || {});

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero Section with Cover Photos Slideshow */}
      <div className="relative h-screen">
        {/* Cover Photos Slideshow */}
        {event.cover_photos?.length > 0 ? (
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1 }}
              className="absolute inset-0"
            >
              <img
                src={event.cover_photos[currentSlide]?.medium_url || event.cover_photos[currentSlide]?.original_url}
                alt="Cover"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black"></div>
            </motion.div>
          </AnimatePresence>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-b from-zinc-900 to-black"></div>
        )}

        {/* Slide Indicators */}
        {event.cover_photos?.length > 1 && (
          <div className="absolute bottom-32 left-1/2 -translate-x-1/2 flex gap-2 z-10">
            {event.cover_photos.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                className={`w-2 h-2 rounded-full transition-all ${
                  idx === currentSlide ? 'bg-white w-6' : 'bg-white/40'
                }`}
              />
            ))}
          </div>
        )}

        {/* Event Info Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-8 md:p-16 z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            {event.bride_name && event.groom_name && (
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-light text-white mb-4 tracking-wide">
                {event.bride_name} <span className="text-white/60">&</span> {event.groom_name}
              </h1>
            )}
            <h2 className="text-2xl md:text-3xl font-light text-white/80 mb-6">{event.event_name}</h2>
            <div className="flex flex-wrap gap-6 text-white/60">
              <div className="flex items-center gap-2">
                <FiCalendar className="w-5 h-5" />
                <span>{new Date(event.event_date).toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}</span>
              </div>
              {event.venue && (
                <div className="flex items-center gap-2">
                  <FiMapPin className="w-5 h-5" />
                  <span>{event.venue}</span>
                </div>
              )}
            </div>
            <p className="mt-4 text-white/40 text-sm">📸 Photography by {event.photographer_name}</p>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center pt-2">
            <div className="w-1 h-3 bg-white/50 rounded-full"></div>
          </div>
        </motion.div>
      </div>

      {/* Wall Section - Marquee Style */}
      {event.wall_photos?.length > 0 && (
        <section className="py-16 bg-zinc-950 overflow-hidden">
          <h3 className="text-center text-xl font-light text-white/60 mb-8 tracking-widest uppercase">
            Highlights
          </h3>
          <div className="relative">
            <motion.div
              className="flex gap-4"
              animate={{ x: [0, -50 * event.wall_photos.length] }}
              transition={{ 
                repeat: Infinity, 
                duration: event.wall_photos.length * 3,
                ease: "linear"
              }}
            >
              {[...event.wall_photos, ...event.wall_photos].map((photo, idx) => (
                <div
                  key={idx}
                  className="flex-shrink-0 w-64 h-80 rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => openLightbox(event.wall_photos, idx % event.wall_photos.length)}
                >
                  <img
                    src={photo.thumbnail_url || photo.original_url}
                    alt={`Wall ${idx}`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
              ))}
            </motion.div>
          </div>
        </section>
      )}

      {/* Main Gallery */}
      <section className="py-16 px-4 md:px-8 lg:px-16 bg-black">
        <div className="max-w-7xl mx-auto">
          <h3 className="text-center text-3xl font-light text-white mb-4">Gallery</h3>
          <p className="text-center text-white/40 mb-8">Click on any photo to view full size and download</p>

          {/* Section Tabs */}
          {sectionNames.length > 0 && (
            <div className="flex justify-center gap-2 mb-8 flex-wrap">
              <button
                onClick={() => setActiveSection('all')}
                className={`px-4 py-2 rounded-full text-sm transition-all ${
                  activeSection === 'all'
                    ? 'bg-white text-black'
                    : 'bg-zinc-800 text-white/70 hover:bg-zinc-700'
                }`}
              >
                All Photos
              </button>
              {sectionNames.map((section) => (
                <button
                  key={section}
                  onClick={() => setActiveSection(section)}
                  className={`px-4 py-2 rounded-full text-sm transition-all capitalize ${
                    activeSection === section
                      ? 'bg-white text-black'
                      : 'bg-zinc-800 text-white/70 hover:bg-zinc-700'
                  }`}
                >
                  {section.replace(/-/g, ' ')}
                </button>
              ))}
            </div>
          )}

          {/* Photo Grid */}
          {galleryPhotos.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
              {galleryPhotos.map((photo, idx) => (
                <motion.div
                  key={photo.photo_id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.05 }}
                  className="aspect-square rounded-lg overflow-hidden cursor-pointer group relative"
                  onClick={() => openLightbox(galleryPhotos, idx)}
                >
                  <img
                    src={photo.thumbnail_url || photo.original_url}
                    alt={photo.filename}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                    <FiImage className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <FiImage className="w-16 h-16 text-white/20 mx-auto mb-4" />
              <p className="text-white/40">No photos in the gallery yet</p>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-zinc-950 text-center">
        <p className="text-white/30 text-sm">
          📸 {event.photographer_name} • {event.event_name}
        </p>
        <p className="text-white/20 text-xs mt-2">
          © {new Date().getFullYear()} All rights reserved
        </p>
      </footer>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxOpen && lightboxPhotos.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center"
            onClick={() => setLightboxOpen(false)}
          >
            {/* Close Button */}
            <button
              onClick={() => setLightboxOpen(false)}
              className="absolute top-4 right-4 text-white/70 hover:text-white p-2 z-50"
            >
              <FiX className="w-8 h-8" />
            </button>

            {/* Navigation */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setLightboxIndex((prev) => (prev - 1 + lightboxPhotos.length) % lightboxPhotos.length);
              }}
              className="absolute left-4 text-white/70 hover:text-white p-2 z-50"
            >
              <FiChevronLeft className="w-10 h-10" />
            </button>

            {/* Image */}
            <motion.img
              key={lightboxIndex}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              src={lightboxPhotos[lightboxIndex]?.medium_url || lightboxPhotos[lightboxIndex]?.original_url}
              alt="Preview"
              className="max-h-[85vh] max-w-[90vw] object-contain"
              onClick={(e) => e.stopPropagation()}
            />

            <button
              onClick={(e) => {
                e.stopPropagation();
                setLightboxIndex((prev) => (prev + 1) % lightboxPhotos.length);
              }}
              className="absolute right-4 text-white/70 hover:text-white p-2 z-50"
            >
              <FiChevronRight className="w-10 h-10" />
            </button>

            {/* Bottom Bar */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-6 bg-black/50 px-6 py-3 rounded-full">
              <span className="text-white/70">
                {lightboxIndex + 1} / {lightboxPhotos.length}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDownload(lightboxPhotos[lightboxIndex]);
                }}
                className="flex items-center gap-2 text-white bg-white/20 hover:bg-white/30 px-4 py-2 rounded-full transition-colors"
              >
                <FiDownload className="w-4 h-4" /> Download
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EventGuestPage;
