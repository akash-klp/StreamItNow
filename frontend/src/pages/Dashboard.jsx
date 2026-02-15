import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiUpload, FiLogOut, FiTrash2, FiSettings, FiImage, FiPlus, 
  FiCalendar, FiEye, FiCopy, FiX, FiFolder, FiGrid, FiDownload,
  FiChevronLeft, FiChevronRight
} from 'react-icons/fi';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const Dashboard = ({ user: initialUser }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(initialUser);
  const [activeTab, setActiveTab] = useState('events');
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [activeFolder, setActiveFolder] = useState('cover-photos');
  const [photos, setPhotos] = useState([]);
  const [photoCounts, setPhotoCounts] = useState({});
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [creatingSections, setCreatingSections] = useState(false);
  
  // New event form
  const [showNewEventForm, setShowNewEventForm] = useState(false);
  const [newEvent, setNewEvent] = useState({
    event_name: '',
    bride_name: '',
    groom_name: '',
    event_date: '',
    venue: '',
    notes: ''
  });
  
  // New section form
  const [newSectionName, setNewSectionName] = useState('');

  useEffect(() => {
    if (!user) {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    }
    fetchEvents();
  }, [user]);

  const getAuthHeaders = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('session_token')}` }
  });

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${BACKEND_URL}/api/events`, getAuthHeaders());
      setEvents(response.data);
    } catch (error) {
      console.error('Failed to fetch events:', error);
      toast.error('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const fetchEventPhotos = useCallback(async (eventId, folderType) => {
    try {
      // folderType can be: cover-photos, wall-section, main-gallery, or any custom section name
      const url = `${BACKEND_URL}/api/events/${eventId}/photos?folder_type=${folderType}`;
      const response = await axios.get(url, getAuthHeaders());
      setPhotos(response.data.photos || []);
    } catch (error) {
      console.error('Failed to fetch photos:', error);
      setPhotos([]);
    }
  }, []);

  const fetchPhotoCounts = useCallback(async (eventId) => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/events/${eventId}/photo-counts`, getAuthHeaders());
      setPhotoCounts(response.data);
    } catch (error) {
      console.error('Failed to fetch photo counts:', error);
    }
  }, []);

  const fetchSections = useCallback(async (eventId) => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/events/${eventId}/sections`, getAuthHeaders());
      console.log('Fetched sections:', response.data.sections);
      setSections(response.data.sections || []);
    } catch (error) {
      console.error('Failed to fetch sections:', error);
      setSections([]);
    }
  }, []);

  useEffect(() => {
    if (selectedEvent) {
      fetchEventPhotos(selectedEvent.event_id, activeFolder);
      fetchPhotoCounts(selectedEvent.event_id);
      fetchSections(selectedEvent.event_id);
    }
  }, [selectedEvent, activeFolder, fetchEventPhotos, fetchPhotoCounts, fetchSections]);

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${BACKEND_URL}/api/events`, newEvent, getAuthHeaders());
      toast.success(response.data.message);
      setShowNewEventForm(false);
      setNewEvent({ event_name: '', bride_name: '', groom_name: '', event_date: '', venue: '', notes: '' });
      fetchEvents();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create event');
    }
  };

  const handleCreateSection = async () => {
    if (!newSectionName.trim()) {
      toast.error('Please enter a section name');
      return;
    }
    
    const sectionToCreate = newSectionName.trim();
    setNewSectionName(''); // Clear immediately for better UX
    setCreatingSections(true);
    
    try {
      const response = await axios.post(
        `${BACKEND_URL}/api/events/${selectedEvent.event_id}/sections`,
        { section_name: sectionToCreate },
        getAuthHeaders()
      );
      toast.success(`✅ Section "${response.data.section_name}" created successfully!`, {
        duration: 4000
      });
      
      // Force refresh sections list
      const sectionsResponse = await axios.get(
        `${BACKEND_URL}/api/events/${selectedEvent.event_id}/sections`,
        getAuthHeaders()
      );
      console.log('Refreshed sections after create:', sectionsResponse.data.sections);
      setSections(sectionsResponse.data.sections || []);
      
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create section');
    } finally {
      setCreatingSections(false);
    }
  };

  const handleDeleteSection = async (sectionName) => {
    if (!window.confirm(`Are you sure you want to delete the "${sectionName}" folder? All photos in this folder will be permanently deleted.`)) {
      return;
    }

    try {
      await axios.delete(
        `${BACKEND_URL}/api/events/${selectedEvent.event_id}/sections/${sectionName}`,
        getAuthHeaders()
      );
      toast.success(`✅ Section "${sectionName}" deleted successfully!`);
      
      // If we were viewing the deleted section, switch to cover-photos
      if (activeFolder === sectionName) {
        setActiveFolder('cover-photos');
      }
      
      // Refresh sections list
      await fetchSections(selectedEvent.event_id);
      await fetchPhotoCounts(selectedEvent.event_id);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to delete section');
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => {
      if (file.size > 50 * 1024 * 1024) {
        toast.error(`${file.name} is too large (max 50MB)`);
        return false;
      }
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        toast.error(`${file.name} is not a valid image type`);
        return false;
      }
      return true;
    });

    setSelectedFiles(validFiles);
    
    // Create previews
    const previews = validFiles.map(file => URL.createObjectURL(file));
    setPreviewUrls(previews);
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      toast.error('Please select files to upload');
      return;
    }

    setUploading(true);
    let successCount = 0;

    for (const file of selectedFiles) {
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder_type', activeFolder);
        if (activeFolder === 'main-gallery' && sections.length > 0) {
          // For main gallery, you might want to select a section
        }

        await axios.post(
          `${BACKEND_URL}/api/events/${selectedEvent.event_id}/photos/upload`,
          formData,
          {
            ...getAuthHeaders(),
            headers: {
              ...getAuthHeaders().headers,
              'Content-Type': 'multipart/form-data'
            }
          }
        );
        successCount++;
      } catch (error) {
        toast.error(`Failed to upload ${file.name}: ${error.response?.data?.detail || 'Unknown error'}`);
      }
    }

    if (successCount > 0) {
      toast.success(`${successCount} photo(s) uploaded successfully`);
      setSelectedFiles([]);
      setPreviewUrls([]);
      fetchEventPhotos(selectedEvent.event_id, activeFolder);
      fetchPhotoCounts(selectedEvent.event_id);
    }
    setUploading(false);
  };

  const handleDeletePhoto = async (photoId) => {
    if (!window.confirm('Are you sure you want to delete this photo?')) return;

    try {
      await axios.delete(
        `${BACKEND_URL}/api/events/${selectedEvent.event_id}/photos/${photoId}`,
        getAuthHeaders()
      );
      toast.success('Photo deleted');
      fetchEventPhotos(selectedEvent.event_id, activeFolder);
      fetchPhotoCounts(selectedEvent.event_id);
    } catch (error) {
      toast.error('Failed to delete photo');
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const handleLogout = async () => {
    try {
      await axios.post(`${BACKEND_URL}/api/auth/logout`, {}, getAuthHeaders());
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      localStorage.removeItem('session_token');
      localStorage.removeItem('user');
      navigate('/login');
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      active: 'bg-green-500/20 text-green-400 border-green-500/30',
      pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      completed: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      cancelled: 'bg-red-500/20 text-red-400 border-red-500/30'
    };
    return badges[status] || badges.pending;
  };

  const getFolderLabel = (folder) => {
    const labels = {
      'cover-photos': 'Cover Photos (Header Slideshow)',
      'wall-section': 'Wall Section (Marquee)',
      'main-gallery': 'Main Gallery'
    };
    return labels[folder] || folder;
  };

  const getFolderLimit = (folder) => {
    const limits = {
      'cover-photos': { min: 7, max: 20 },
      'wall-section': { min: 10, max: 40 },
      'main-gallery': { min: 0, max: 1000 }
    };
    return limits[folder] || { min: 0, max: 1000 };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-400"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100" data-testid="photographer-dashboard">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            {user?.picture && (
              <img
                src={user.picture}
                alt={user.name}
                className="w-10 h-10 rounded-full border-2 border-gray-600"
              />
            )}
            <div>
              <h2 className="font-semibold text-lg text-white">{user?.name}</h2>
              <p className="text-sm text-gray-400">Photographer Dashboard</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => navigate('/')}
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              <FiEye className="mr-2" /> View Site
            </Button>
            <Button
              variant="outline"
              onClick={handleLogout}
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
              data-testid="logout-button"
            >
              <FiLogOut className="mr-2" /> Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Events List or Event Detail */}
        {!selectedEvent ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">My Events</h1>
                <p className="text-gray-400">Manage your wedding events and photos</p>
              </div>
              <Button
                onClick={() => setShowNewEventForm(true)}
                className="bg-gray-700 hover:bg-gray-600 text-white"
              >
                <FiPlus className="mr-2" /> Create New Event
              </Button>
            </div>

            {/* New Event Form Modal */}
            <AnimatePresence>
              {showNewEventForm && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
                  onClick={() => setShowNewEventForm(false)}
                >
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="bg-gray-800 rounded-xl p-6 w-full max-w-lg border border-gray-700"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-xl font-semibold text-white">Create New Event</h2>
                      <button
                        onClick={() => setShowNewEventForm(false)}
                        className="text-gray-400 hover:text-white"
                      >
                        <FiX className="w-5 h-5" />
                      </button>
                    </div>

                    <form onSubmit={handleCreateEvent} className="space-y-4">
                      <div>
                        <Label className="text-gray-300">Event Name *</Label>
                        <Input
                          value={newEvent.event_name}
                          onChange={(e) => setNewEvent({ ...newEvent, event_name: e.target.value })}
                          placeholder="e.g., John & Jane's Wedding"
                          required
                          className="bg-gray-700 border-gray-600 text-white"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-gray-300">Bride's Name</Label>
                          <Input
                            value={newEvent.bride_name}
                            onChange={(e) => setNewEvent({ ...newEvent, bride_name: e.target.value })}
                            placeholder="Bride's name"
                            className="bg-gray-700 border-gray-600 text-white"
                          />
                        </div>
                        <div>
                          <Label className="text-gray-300">Groom's Name</Label>
                          <Input
                            value={newEvent.groom_name}
                            onChange={(e) => setNewEvent({ ...newEvent, groom_name: e.target.value })}
                            placeholder="Groom's name"
                            className="bg-gray-700 border-gray-600 text-white"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-gray-300">Event Date *</Label>
                          <Input
                            type="date"
                            value={newEvent.event_date}
                            onChange={(e) => setNewEvent({ ...newEvent, event_date: e.target.value })}
                            required
                            className="bg-gray-700 border-gray-600 text-white"
                          />
                        </div>
                        <div>
                          <Label className="text-gray-300">Venue</Label>
                          <Input
                            value={newEvent.venue}
                            onChange={(e) => setNewEvent({ ...newEvent, venue: e.target.value })}
                            placeholder="Venue location"
                            className="bg-gray-700 border-gray-600 text-white"
                          />
                        </div>
                      </div>
                      <div>
                        <Label className="text-gray-300">Notes</Label>
                        <Input
                          value={newEvent.notes}
                          onChange={(e) => setNewEvent({ ...newEvent, notes: e.target.value })}
                          placeholder="Any additional notes"
                          className="bg-gray-700 border-gray-600 text-white"
                        />
                      </div>
                      <Button
                        type="submit"
                        className="w-full bg-gray-600 hover:bg-gray-500 text-white"
                      >
                        Create Event
                      </Button>
                    </form>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Events Grid */}
            {events.length === 0 ? (
              <Card className="p-12 text-center bg-gray-800 border-gray-700">
                <FiCalendar className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 text-lg">No events yet. Create your first event to get started!</p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {events.map((event) => (
                  <motion.div
                    key={event.event_id}
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card
                      className="bg-gray-800 border-gray-700 overflow-hidden cursor-pointer hover:border-gray-500 transition-colors"
                      onClick={() => setSelectedEvent(event)}
                    >
                      <div className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <h3 className="text-lg font-semibold text-white">{event.event_name}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs border ${getStatusBadge(event.status)}`}>
                            {event.status}
                          </span>
                        </div>
                        
                        {event.bride_name && event.groom_name && (
                          <p className="text-gray-400 text-sm mb-2">
                            💍 {event.bride_name} & {event.groom_name}
                          </p>
                        )}
                        
                        <p className="text-gray-500 text-sm mb-2">
                          📅 {new Date(event.event_date).toLocaleDateString()}
                        </p>
                        
                        {event.venue && (
                          <p className="text-gray-500 text-sm mb-4">📍 {event.venue}</p>
                        )}

                        <div className="flex items-center justify-between pt-4 border-t border-gray-700">
                          <span className="text-xs text-gray-500">
                            Click to manage photos
                          </span>
                          <FiChevronRight className="text-gray-500" />
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        ) : (
          /* Event Detail View */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {/* Back Button & Event Header */}
            <div className="mb-6">
              <button
                onClick={() => {
                  setSelectedEvent(null);
                  setPhotos([]);
                  setActiveFolder('cover-photos');
                }}
                className="flex items-center gap-2 text-gray-400 hover:text-white mb-4"
              >
                <FiChevronLeft /> Back to Events
              </button>
              
              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h1 className="text-2xl font-bold text-white">{selectedEvent.event_name}</h1>
                      <span className={`px-2 py-1 rounded-full text-xs border ${getStatusBadge(selectedEvent.status)}`}>
                        {selectedEvent.status}
                      </span>
                    </div>
                    {selectedEvent.bride_name && selectedEvent.groom_name && (
                      <p className="text-gray-400">💍 {selectedEvent.bride_name} & {selectedEvent.groom_name}</p>
                    )}
                    <p className="text-gray-500 text-sm mt-1">
                      📅 {new Date(selectedEvent.event_date).toLocaleDateString()}
                      {selectedEvent.venue && ` • 📍 ${selectedEvent.venue}`}
                    </p>
                  </div>
                  
                  {/* QR Code & Link - Made Bigger */}
                  <div className="flex flex-col items-center bg-gray-700/50 rounded-xl p-6 min-w-[200px]">
                    {selectedEvent.qr_code && (
                      <img
                        src={selectedEvent.qr_code}
                        alt="Event QR Code"
                        className="w-40 h-40 rounded-lg mb-4 border-2 border-gray-600"
                      />
                    )}
                    <p className="text-sm font-medium text-white mb-2">Guest Access Link</p>
                    <div className="flex items-center gap-2 bg-gray-900 px-3 py-2 rounded-lg">
                      <code className="text-sm text-gray-300">
                        /event/{selectedEvent.event_slug}
                      </code>
                      <button
                        onClick={() => copyToClipboard(`${window.location.origin}/event/${selectedEvent.event_slug}`)}
                        className="text-gray-400 hover:text-white p-1"
                        title="Copy event link"
                      >
                        <FiCopy className="w-4 h-4" />
                      </button>
                    </div>
                    <a
                      href={`/event/${selectedEvent.event_slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1"
                    >
                      <FiEye className="w-4 h-4" /> Preview Guest Page
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Photo Counts Summary */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <Card className="bg-gray-800 border-gray-700 p-4">
                <p className="text-gray-400 text-sm">Cover Photos</p>
                <p className="text-2xl font-bold text-white">
                  {photoCounts.cover_photos || 0}
                  <span className="text-sm font-normal text-gray-500"> / 20</span>
                </p>
              </Card>
              <Card className="bg-gray-800 border-gray-700 p-4">
                <p className="text-gray-400 text-sm">Wall Section</p>
                <p className="text-2xl font-bold text-white">
                  {photoCounts.wall_section || 0}
                  <span className="text-sm font-normal text-gray-500"> / 40</span>
                </p>
              </Card>
              <Card className="bg-gray-800 border-gray-700 p-4">
                <p className="text-gray-400 text-sm">Main Gallery</p>
                <p className="text-2xl font-bold text-white">
                  {photoCounts.main_gallery || 0}
                </p>
              </Card>
            </div>

            {/* Folder Tabs - Default Folders */}
            <div className="mb-4">
              <p className="text-sm text-gray-400 mb-2">Default Folders</p>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {['cover-photos', 'wall-section', 'main-gallery'].map((folder) => (
                  <button
                    key={folder}
                    onClick={() => setActiveFolder(folder)}
                    className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                      activeFolder === folder
                        ? 'bg-gray-600 text-white'
                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                    }`}
                  >
                    <FiFolder className="inline mr-2" />
                    {folder.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Sections - Only show when main-gallery is selected or a custom section is active */}
            {(activeFolder === 'main-gallery' || sections.includes(activeFolder)) && (
              <div className="mb-6 bg-gray-800 rounded-xl p-6 border border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white">Custom Sections</h3>
                    <p className="text-sm text-gray-400">Create custom folders for your event photos</p>
                  </div>
                  <span className="text-sm text-gray-400 bg-gray-700 px-3 py-1 rounded-full">{sections.length} section(s)</span>
                </div>
                
                {/* Create Section Form */}
                <div className="flex gap-2 mb-4">
                  <Input
                    value={newSectionName}
                    onChange={(e) => setNewSectionName(e.target.value)}
                    placeholder="Enter section name (e.g., ceremony, reception, sangeet)"
                    className="bg-gray-700 border-gray-600 text-white flex-1"
                    disabled={creatingSections}
                    onKeyPress={(e) => e.key === 'Enter' && handleCreateSection()}
                  />
                  <Button
                    onClick={handleCreateSection}
                    disabled={creatingSections || !newSectionName.trim()}
                    className="bg-green-600 hover:bg-green-500 text-white min-w-[140px]"
                  >
                    {creatingSections ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Creating...
                      </>
                    ) : (
                      <>
                        <FiPlus className="mr-1" /> Create Folder
                      </>
                    )}
                  </Button>
                </div>
                
                {/* Custom Sections List */}
                {sections.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {sections.map((section) => (
                      <div
                        key={section}
                        className={`relative group rounded-lg overflow-hidden border transition-all cursor-pointer ${
                          activeFolder === section 
                            ? 'bg-gray-600 border-gray-500' 
                            : 'bg-gray-700/50 border-gray-700 hover:bg-gray-700 hover:border-gray-600'
                        }`}
                      >
                        <button
                          onClick={() => setActiveFolder(section)}
                          className="w-full p-4 text-left"
                        >
                          <FiFolder className={`w-8 h-8 mb-2 ${activeFolder === section ? 'text-white' : 'text-gray-400'}`} />
                          <p className="font-medium text-white capitalize truncate">{section.replace(/-/g, ' ')}</p>
                          <p className="text-xs text-gray-400">Custom folder</p>
                        </button>
                        
                        {/* Delete Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteSection(section);
                          }}
                          className="absolute top-2 right-2 p-1.5 rounded-full bg-red-500/80 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                          title="Delete folder"
                        >
                          <FiTrash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 bg-gray-700/30 rounded-lg border border-dashed border-gray-600">
                    <FiFolder className="w-10 h-10 text-gray-500 mx-auto mb-2" />
                    <p className="text-gray-400">No custom sections yet</p>
                    <p className="text-sm text-gray-500">Create a section to organize photos by event moments</p>
                  </div>
                )}
              </div>
            )}

            {/* Upload Section */}
            {selectedEvent.status === 'active' && (
              <Card className="bg-gray-800 border-gray-700 p-6 mb-6">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Upload to {getFolderLabel(activeFolder)}
                </h3>
                <p className="text-sm text-gray-400 mb-4">
                  {activeFolder === 'cover-photos' && 'Min 7, Max 20 photos for header slideshow'}
                  {activeFolder === 'wall-section' && 'Min 10, Max 40 photos for wall marquee'}
                  {activeFolder === 'main-gallery' && 'Upload photos to the main gallery'}
                </p>

                <div className="space-y-4">
                  <Input
                    type="file"
                    multiple
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleFileSelect}
                    className="bg-gray-700 border-gray-600 text-white"
                  />

                  {previewUrls.length > 0 && (
                    <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                      {previewUrls.map((url, idx) => (
                        <div key={idx} className="relative aspect-square rounded-lg overflow-hidden">
                          <img src={url} alt={`Preview ${idx}`} className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  )}

                  <Button
                    onClick={handleUpload}
                    disabled={uploading || selectedFiles.length === 0}
                    className="bg-gray-600 hover:bg-gray-500 text-white"
                  >
                    {uploading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Uploading...
                      </>
                    ) : (
                      <>
                        <FiUpload className="mr-2" /> Upload {selectedFiles.length} Photo(s)
                      </>
                    )}
                  </Button>
                </div>
              </Card>
            )}

            {/* Photos Grid */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">
                Photos ({photos.length})
              </h3>
              
              {photos.length === 0 ? (
                <Card className="bg-gray-800 border-gray-700 p-12 text-center">
                  <FiImage className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">No photos in this folder yet</p>
                </Card>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {photos.map((photo, index) => (
                    <motion.div
                      key={photo.photo_id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="group relative aspect-square rounded-lg overflow-hidden bg-gray-800"
                    >
                      <img
                        src={photo.thumbnail_url || photo.original_url}
                        alt={photo.filename}
                        className="w-full h-full object-cover cursor-pointer"
                        onClick={() => {
                          setLightboxIndex(index);
                          setLightboxOpen(true);
                        }}
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button
                          onClick={() => {
                            setLightboxIndex(index);
                            setLightboxOpen(true);
                          }}
                          className="p-2 bg-white/20 rounded-full hover:bg-white/30"
                          title="View"
                        >
                          <FiEye className="w-4 h-4 text-white" />
                        </button>
                        <button
                          onClick={() => handleDeletePhoto(photo.photo_id)}
                          className="p-2 bg-red-500/80 rounded-full hover:bg-red-600"
                          title="Delete"
                        >
                          <FiTrash2 className="w-4 h-4 text-white" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxOpen && photos.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center"
            onClick={() => setLightboxOpen(false)}
          >
            <button
              onClick={() => setLightboxOpen(false)}
              className="absolute top-4 right-4 text-white/70 hover:text-white"
            >
              <FiX className="w-8 h-8" />
            </button>
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                setLightboxIndex((prev) => (prev - 1 + photos.length) % photos.length);
              }}
              className="absolute left-4 text-white/70 hover:text-white p-2"
            >
              <FiChevronLeft className="w-8 h-8" />
            </button>
            
            <img
              src={photos[lightboxIndex]?.medium_url || photos[lightboxIndex]?.original_url}
              alt="Preview"
              className="max-h-[90vh] max-w-[90vw] object-contain"
              onClick={(e) => e.stopPropagation()}
            />
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                setLightboxIndex((prev) => (prev + 1) % photos.length);
              }}
              className="absolute right-4 text-white/70 hover:text-white p-2"
            >
              <FiChevronRight className="w-8 h-8" />
            </button>
            
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-4">
              <span className="text-white/70">
                {lightboxIndex + 1} / {photos.length}
              </span>
              <a
                href={photos[lightboxIndex]?.original_url}
                download
                onClick={(e) => e.stopPropagation()}
                className="text-white/70 hover:text-white"
              >
                <FiDownload className="w-5 h-5" />
              </a>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeletePhoto(photos[lightboxIndex]?.photo_id);
                  setLightboxOpen(false);
                }}
                className="text-red-400 hover:text-red-300"
              >
                <FiTrash2 className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Dashboard;
