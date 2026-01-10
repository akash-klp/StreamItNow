import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { FiUpload, FiLogOut, FiTrash2, FiSettings, FiImage } from 'react-icons/fi';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';
import Settings from '../components/Settings';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const Dashboard = ({ user: initialUser }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(initialUser);
  const [activeTab, setActiveTab] = useState('gallery');
  const [photos, setPhotos] = useState([]);
  const [wallPhotos, setWallPhotos] = useState([]);
  const [backgroundImages, setBackgroundImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [notes, setNotes] = useState('');
  const [wallSelectedFile, setWallSelectedFile] = useState(null);
  const [wallPreviewUrl, setWallPreviewUrl] = useState(null);
  const [bgSelectedFile, setBgSelectedFile] = useState(null);
  const [bgPreviewUrl, setBgPreviewUrl] = useState(null);
  const [selectedPhotos, setSelectedPhotos] = useState([]);
  const [selectionMode, setSelectionMode] = useState(false);
  const [uploadingWall, setUploadingWall] = useState(false);
  const [uploadingBg, setUploadingBg] = useState(false);

  useEffect(() => {
    if (!user) {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    }
    fetchPhotos();
    fetchWallPhotos();
  }, [user]);

  const fetchPhotos = async () => {
    try {
      const token = localStorage.getItem('session_token');
      const response = await axios.get(`${BACKEND_URL}/api/photos/list`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPhotos(response.data);
    } catch (error) {
      console.error('Failed to fetch photos:', error);
    }
  };

  const fetchWallPhotos = async () => {
    try {
      const token = localStorage.getItem('session_token');
      const response = await axios.get(`${BACKEND_URL}/api/wall-photos`);
      setWallPhotos(response.data);
    } catch (error) {
      console.error('Failed to fetch wall photos:', error);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        toast.error('File must be JPEG, PNG, or WebP');
        return;
      }

      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Please select a photo');
      return;
    }

    setUploading(true);

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Data = reader.result;

        const token = localStorage.getItem('session_token');
        await axios.post(
          `${BACKEND_URL}/api/photos/upload`,
          {
            filename: selectedFile.name,
            image_data: base64Data,
            wedding_date: new Date().toISOString().split('T')[0],
            photographer_notes: notes
          },
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );

        toast.success('Photo uploaded successfully!');
        setSelectedFile(null);
        setPreviewUrl(null);
        setNotes('');
        fetchPhotos();
      };
      reader.readAsDataURL(selectedFile);
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleWallFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        toast.error('File must be JPEG, PNG, or WebP');
        return;
      }

      setWallSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setWallPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleWallUpload = async () => {
    if (!wallSelectedFile) {
      toast.error('Please select a photo');
      return;
    }

    setUploadingWall(true);

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Data = reader.result;

        const token = localStorage.getItem('session_token');
        await axios.post(
          `${BACKEND_URL}/api/wall-photos/upload`,
          {
            filename: wallSelectedFile.name,
            image_data: base64Data
          },
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );

        toast.success('Wall photo uploaded successfully!');
        setWallSelectedFile(null);
        setWallPreviewUrl(null);
        fetchWallPhotos();
      };
      reader.readAsDataURL(wallSelectedFile);
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error('Upload failed. Please try again.');
    } finally {
      setUploadingWall(false);
    }
  };

  const togglePhotoSelection = (photoId) => {
    setSelectedPhotos(prev => 
      prev.includes(photoId) 
        ? prev.filter(id => id !== photoId)
        : [...prev, photoId]
    );
  };

  const handleDelete = async (photoId) => {
    if (!window.confirm('Are you sure you want to delete this photo?')) return;

    try {
      const token = localStorage.getItem('session_token');
      await axios.delete(`${BACKEND_URL}/api/photos/${photoId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Photo deleted successfully');
      fetchPhotos();
    } catch (error) {
      console.error('Delete failed:', error);
      toast.error('Failed to delete photo');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedPhotos.length === 0) {
      toast.error('No photos selected');
      return;
    }

    if (!window.confirm(`Delete ${selectedPhotos.length} selected photos?`)) return;

    try {
      const token = localStorage.getItem('session_token');
      await Promise.all(
        selectedPhotos.map(photoId =>
          axios.delete(`${BACKEND_URL}/api/photos/${photoId}`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        )
      );
      toast.success(`${selectedPhotos.length} photos deleted successfully`);
      setSelectedPhotos([]);
      setSelectionMode(false);
      fetchPhotos();
    } catch (error) {
      console.error('Bulk delete failed:', error);
      toast.error('Failed to delete some photos');
    }
  };

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('session_token');
      await axios.post(
        `${BACKEND_URL}/api/auth/logout`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      localStorage.removeItem('session_token');
      localStorage.removeItem('user');
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen bg-champagne" data-testid="photographer-dashboard">
      {/* Header */}
      <div className="border-b border-warmgrey bg-white/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            {user?.picture && (
              <img
                src={user.picture}
                alt={user.name}
                className="w-10 h-10 rounded-full border-2 border-gold"
              />
            )}
            <div>
              <h2 className="font-heading text-xl text-foreground">{user?.name}</h2>
              <p className="text-sm text-foreground/60 font-body">Photographer Dashboard</p>
            </div>
          </div>
          <div className="flex gap-4">
            <Button
              variant="outline"
              onClick={() => navigate('/')}
              className="font-body"
            >
              View Guest Page
            </Button>
            <Button
              variant="outline"
              onClick={handleLogout}
              className="font-body"
              data-testid="logout-button"
            >
              <FiLogOut className="mr-2" /> Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl md:text-5xl font-heading italic text-foreground mb-2">
            Photographer Dashboard
          </h1>
          <p className="text-foreground/60 font-body mb-8">
            Manage your wedding photos and settings
          </p>

          {/* Tab Navigation */}
          <div className="flex space-x-1 mb-8 bg-white/50 p-1 rounded-lg border border-warmgrey">
            <button
              onClick={() => setActiveTab('gallery')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-md font-body transition-all ${
                activeTab === 'gallery'
                  ? 'bg-gold text-white shadow-md'
                  : 'text-foreground/70 hover:text-foreground hover:bg-white/50'
              }`}
            >
              <FiImage className="w-4 h-4" />
              Photo Gallery
            </button>
            <button
              onClick={() => setActiveTab('wall')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-md font-body transition-all ${
                activeTab === 'wall'
                  ? 'bg-gold text-white shadow-md'
                  : 'text-foreground/70 hover:text-foreground hover:bg-white/50'
              }`}
            >
              <FiImage className="w-4 h-4" />
              Wall Display
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-md font-body transition-all ${
                activeTab === 'settings'
                  ? 'bg-gold text-white shadow-md'
                  : 'text-foreground/70 hover:text-foreground hover:bg-white/50'
              }`}
            >
              <FiSettings className="w-4 h-4" />
              Settings
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'gallery' && (
            <>
              {/* Upload Card */}
              <Card className="p-8 mb-12 shadow-gold-soft border-warmgrey">
                <h2 className="text-2xl font-heading text-foreground mb-6">Upload New Photo</h2>
            <div className="space-y-6">
              <div>
                <Label htmlFor="photo" className="font-body text-foreground mb-2 block">
                  Select Photo
                </Label>
                <Input
                  id="photo"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileChange}
                  disabled={uploading}
                  className="cursor-pointer"
                  data-testid="file-input"
                />
                <p className="text-sm text-foreground/60 font-body mt-1">
                  JPEG, PNG, or WebP format. Max 10MB.
                </p>
              </div>

              {previewUrl && (
                <div className="rounded-lg overflow-hidden border border-warmgrey">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full h-64 object-cover"
                  />
                </div>
              )}

              <div>
                <Label htmlFor="notes" className="font-body text-foreground mb-2 block">
                  Photographer Notes (Optional)
                </Label>
                <Input
                  id="notes"
                  placeholder="e.g., Ceremony details, special moments..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  disabled={uploading}
                  data-testid="notes-input"
                />
              </div>

              <Button
                onClick={handleUpload}
                disabled={uploading || !selectedFile}
                className="w-full bg-gold hover:bg-gold/90 text-white font-body font-medium py-6 text-lg"
                data-testid="upload-button"
              >
                {uploading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Uploading...
                  </>
                ) : (
                  <>
                    <FiUpload className="mr-2" /> Upload Photo
                  </>
                )}
              </Button>
            </div>
          </Card>

          {/* Uploaded Photos */}
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-heading text-foreground">
                Your Uploaded Photos ({photos.length})
              </h2>
              <div className="flex gap-2">
                <Button
                  variant={selectionMode ? "default" : "outline"}
                  onClick={() => {
                    setSelectionMode(!selectionMode);
                    setSelectedPhotos([]);
                  }}
                  className="font-body"
                >
                  {selectionMode ? 'Cancel Selection' : 'Select Multiple'}
                </Button>
                {selectionMode && selectedPhotos.length > 0 && (
                  <Button
                    variant="destructive"
                    onClick={handleBulkDelete}
                    className="font-body"
                  >
                    Delete Selected ({selectedPhotos.length})
                  </Button>
                )}
              </div>
            </div>

            {photos.length === 0 ? (
              <Card className="p-12 text-center shadow-gold-soft">
                <p className="text-foreground/60 font-body">
                  No photos uploaded yet. Start uploading to share beautiful moments!
                </p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {photos.map((photo) => (
                  <motion.div
                    key={photo.photo_id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card className={`overflow-hidden shadow-gold-soft hover:shadow-xl transition-all group ${
                      selectedPhotos.includes(photo.photo_id) ? 'ring-4 ring-gold' : ''
                    }`}>
                      <div className="relative">
                        <img
                          src={photo.image_data}
                          alt={photo.filename}
                          className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        {selectionMode ? (
                          <button
                            onClick={() => togglePhotoSelection(photo.photo_id)}
                            className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                              selectedPhotos.includes(photo.photo_id)
                                ? 'bg-gold text-white'
                                : 'bg-white/90 text-foreground'
                            }`}
                            data-testid="select-photo-checkbox"
                          >
                            {selectedPhotos.includes(photo.photo_id) && '\u2713'}
                          </button>
                        ) : (
                          <button
                            onClick={() => handleDelete(photo.photo_id)}
                            className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            data-testid="delete-photo-button"
                          >
                            <FiTrash2 />
                          </button>
                        )}
                      </div>
                      <div className="p-4">
                        <p className="text-sm font-body text-foreground/80">
                          {new Date(photo.upload_timestamp).toLocaleDateString()}
                        </p>
                        {photo.photographer_notes && (
                          <p className="text-sm font-body text-foreground/60 mt-1">
                            {photo.photographer_notes}
                          </p>
                        )}
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
          </>
          )}

          {activeTab === 'wall' && (
            <div>
              {/* Wall Photo Upload Card */}
              <Card className="p-8 mb-12 shadow-gold-soft border-warmgrey">
                <h2 className="text-2xl font-heading text-foreground mb-6">Upload to Wall Display</h2>
                <div className="space-y-6">
                  <div>
                    <Label htmlFor="wall-photo" className="font-body text-foreground mb-2 block">
                      Select Photo for Wall Display
                    </Label>
                    <Input
                      id="wall-photo"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleWallFileChange}
                      disabled={uploadingWall}
                      className="cursor-pointer"
                      data-testid="wall-file-input"
                    />
                    <p className="text-sm text-foreground/60 font-body mt-1">
                      JPEG, PNG, or WebP format. Max 10MB.
                    </p>
                  </div>

                  {wallPreviewUrl && (
                    <div className="rounded-lg overflow-hidden border border-warmgrey">
                      <img
                        src={wallPreviewUrl}
                        alt="Preview"
                        className="w-full h-64 object-cover"
                      />
                    </div>
                  )}

                  <Button
                    onClick={handleWallUpload}
                    disabled={uploadingWall || !wallSelectedFile}
                    className="w-full bg-gold hover:bg-gold/90 text-white font-body font-medium py-6 text-lg"
                    data-testid="wall-upload-button"
                  >
                    {uploadingWall ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Uploading...
                      </>
                    ) : (
                      <>
                        <FiUpload className="mr-2" /> Upload to Wall
                      </>
                    )}
                  </Button>
                </div>
              </Card>

              <h2 className="text-3xl font-heading text-foreground mb-6">
                Wall Display Photos ({wallPhotos.length})
              </h2>
              {wallPhotos.length === 0 ? (
                <Card className="p-12 text-center shadow-gold-soft">
                  <p className="text-foreground/60 font-body">
                    No photos on the wall display yet. Upload your best showcase photos above!
                  </p>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {wallPhotos.map((photo) => (
                    <motion.div
                      key={photo.photo_id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Card className="overflow-hidden shadow-gold-soft hover:shadow-xl transition-all group">
                        <div className="relative">
                          <img
                            src={photo.image_data}
                            alt={photo.filename}
                            className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        </div>
                        <div className="p-4">
                          <p className="text-sm font-body text-foreground/80">
                            {new Date(photo.upload_timestamp).toLocaleDateString()}
                          </p>
                          <p className="text-sm font-body text-foreground/60 mt-1">
                            {photo.filename}
                          </p>
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'settings' && (
            <Settings user={user} />
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;