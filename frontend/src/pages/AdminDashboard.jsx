import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { 
  FiUsers, FiImage, FiCalendar, FiLogOut, FiCheck, FiX, 
  FiUserPlus, FiTrash2, FiClock, FiActivity, FiEye
} from 'react-icons/fi';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [photographers, setPhotographers] = useState([]);
  const [registeredEmails, setRegisteredEmails] = useState([]);
  const [events, setEvents] = useState([]);
  const [pendingEvents, setPendingEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Register photographer form
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [registering, setRegistering] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      if (parsedUser.role !== 'admin') {
        navigate('/dashboard');
        return;
      }
      setUser(parsedUser);
    }
    fetchData();
  }, [navigate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchStats(),
        fetchPhotographers(),
        fetchRegisteredEmails(),
        fetchEvents(),
        fetchPendingEvents()
      ]);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAuthHeaders = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('session_token')}` }
  });

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/admin/stats`, getAuthHeaders());
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const fetchPhotographers = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/admin/photographers`, getAuthHeaders());
      setPhotographers(response.data);
    } catch (error) {
      console.error('Failed to fetch photographers:', error);
    }
  };

  const fetchRegisteredEmails = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/admin/registered-photographers`, getAuthHeaders());
      setRegisteredEmails(response.data);
    } catch (error) {
      console.error('Failed to fetch registered emails:', error);
    }
  };

  const fetchEvents = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/admin/events`, getAuthHeaders());
      setEvents(response.data);
    } catch (error) {
      console.error('Failed to fetch events:', error);
    }
  };

  const fetchPendingEvents = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/admin/events/pending`, getAuthHeaders());
      setPendingEvents(response.data);
    } catch (error) {
      console.error('Failed to fetch pending events:', error);
    }
  };

  const handleRegisterPhotographer = async (e) => {
    e.preventDefault();
    if (!newEmail) {
      toast.error('Please enter an email');
      return;
    }

    setRegistering(true);
    try {
      await axios.post(
        `${BACKEND_URL}/api/admin/photographers/register`,
        { email: newEmail, name: newName },
        getAuthHeaders()
      );
      toast.success(`Photographer ${newEmail} registered successfully!`);
      setNewEmail('');
      setNewName('');
      fetchRegisteredEmails();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to register photographer');
    } finally {
      setRegistering(false);
    }
  };

  const handleRemoveRegistration = async (email) => {
    if (!window.confirm(`Remove registration for ${email}?`)) return;

    try {
      await axios.delete(
        `${BACKEND_URL}/api/admin/registered-photographers/${encodeURIComponent(email)}`,
        getAuthHeaders()
      );
      toast.success('Registration removed');
      fetchRegisteredEmails();
    } catch (error) {
      toast.error('Failed to remove registration');
    }
  };

  const handleUpdatePhotographerStatus = async (userId, newStatus) => {
    try {
      await axios.put(
        `${BACKEND_URL}/api/admin/photographers/${userId}/status`,
        { status: newStatus },
        getAuthHeaders()
      );
      toast.success(`Photographer status updated to ${newStatus}`);
      fetchPhotographers();
      fetchStats();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleDeletePhotographer = async (userId, name) => {
    if (!window.confirm(`Are you sure you want to delete ${name}? This action cannot be undone.`)) return;

    try {
      await axios.delete(`${BACKEND_URL}/api/admin/photographers/${userId}`, getAuthHeaders());
      toast.success('Photographer deleted');
      fetchPhotographers();
      fetchStats();
    } catch (error) {
      toast.error('Failed to delete photographer');
    }
  };

  const handleUpdateEventStatus = async (eventId, newStatus) => {
    try {
      await axios.put(
        `${BACKEND_URL}/api/admin/events/${eventId}/status`,
        { status: newStatus },
        getAuthHeaders()
      );
      toast.success(`Event ${newStatus === 'active' ? 'approved' : 'status updated'}`);
      fetchEvents();
      fetchPendingEvents();
      fetchStats();
    } catch (error) {
      toast.error('Failed to update event status');
    }
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
      active: 'bg-green-100 text-green-800 border-green-200',
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      inactive: 'bg-gray-100 text-gray-800 border-gray-200',
      completed: 'bg-blue-100 text-blue-800 border-blue-200',
      cancelled: 'bg-red-100 text-red-800 border-red-200'
    };
    return badges[status] || badges.pending;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white" data-testid="admin-dashboard">
      {/* Header */}
      <div className="border-b border-warmgrey glass-header sticky top-0 z-10">
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
              <p className="text-sm text-foreground/60 font-body">Admin Dashboard</p>
            </div>
          </div>
          <div className="flex gap-4">
            <Button variant="outline" onClick={() => navigate('/')} className="font-body">
              <FiEye className="mr-2" /> View Site
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
            Admin Dashboard
          </h1>
          <p className="text-foreground/70 font-body mb-8">
            Manage photographers and events
          </p>

          {/* Tab Navigation */}
          <div className="flex space-x-1 mb-8 glass-panel p-1 rounded-lg">
            {[
              { id: 'overview', label: 'Overview', icon: FiActivity },
              { id: 'photographers', label: 'Photographers', icon: FiUsers },
              { id: 'events', label: 'Events', icon: FiCalendar },
              { id: 'register', label: 'Register New', icon: FiUserPlus }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-md font-body transition-all ${
                  activeTab === tab.id
                    ? 'bg-gold text-white shadow-md'
                    : 'text-foreground/70 hover:text-foreground hover:bg-white/50'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
                {tab.id === 'events' && pendingEvents.length > 0 && (
                  <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                    {pendingEvents.length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Overview Tab */}
          {activeTab === 'overview' && stats && (
            <div className="space-y-8">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="p-6 shadow-gold-soft">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-gold/10 rounded-lg">
                      <FiUsers className="w-6 h-6 text-gold" />
                    </div>
                    <div>
                      <p className="text-sm text-foreground/60 font-body">Total Photographers</p>
                      <p className="text-3xl font-heading text-foreground">{stats.total_photographers}</p>
                    </div>
                  </div>
                </Card>

                <Card className="p-6 shadow-gold-soft">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-green-100 rounded-lg">
                      <FiCheck className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-foreground/60 font-body">Active Photographers</p>
                      <p className="text-3xl font-heading text-green-600">{stats.active_photographers}</p>
                    </div>
                  </div>
                </Card>

                <Card className="p-6 shadow-gold-soft">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-yellow-100 rounded-lg">
                      <FiClock className="w-6 h-6 text-yellow-600" />
                    </div>
                    <div>
                      <p className="text-sm text-foreground/60 font-body">Pending Approval</p>
                      <p className="text-3xl font-heading text-yellow-600">{stats.pending_photographers}</p>
                    </div>
                  </div>
                </Card>

                <Card className="p-6 shadow-gold-soft">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <FiImage className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-foreground/60 font-body">Total Photos</p>
                      <p className="text-3xl font-heading text-blue-600">{stats.total_photos}</p>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Event Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="p-6 shadow-gold-soft">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-purple-100 rounded-lg">
                      <FiCalendar className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-foreground/60 font-body">Total Events</p>
                      <p className="text-3xl font-heading text-purple-600">{stats.total_events}</p>
                    </div>
                  </div>
                </Card>

                <Card className="p-6 shadow-gold-soft">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-green-100 rounded-lg">
                      <FiCheck className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-foreground/60 font-body">Active Events</p>
                      <p className="text-3xl font-heading text-green-600">{stats.active_events}</p>
                    </div>
                  </div>
                </Card>

                <Card className="p-6 shadow-gold-soft">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-yellow-100 rounded-lg">
                      <FiClock className="w-6 h-6 text-yellow-600" />
                    </div>
                    <div>
                      <p className="text-sm text-foreground/60 font-body">Pending Events</p>
                      <p className="text-3xl font-heading text-yellow-600">{stats.pending_events}</p>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Pending Events Alert */}
              {pendingEvents.length > 0 && (
                <Card className="p-6 border-yellow-300 bg-yellow-50 shadow-gold-soft">
                  <h3 className="text-lg font-heading text-yellow-800 mb-4 flex items-center gap-2">
                    <FiClock className="w-5 h-5" />
                    Events Awaiting Approval ({pendingEvents.length})
                  </h3>
                  <div className="space-y-3">
                    {pendingEvents.slice(0, 3).map((event) => (
                      <div key={event.event_id} className="flex justify-between items-center bg-white p-4 rounded-lg">
                        <div>
                          <p className="font-body font-medium">{event.event_name}</p>
                          <p className="text-sm text-foreground/60">
                            by {event.photographer_name} • {new Date(event.event_date).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleUpdateEventStatus(event.event_id, 'active')}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <FiCheck className="mr-1" /> Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUpdateEventStatus(event.event_id, 'cancelled')}
                            className="text-red-600 border-red-300 hover:bg-red-50"
                          >
                            <FiX className="mr-1" /> Reject
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  {pendingEvents.length > 3 && (
                    <Button
                      variant="outline"
                      onClick={() => setActiveTab('events')}
                      className="mt-4 w-full"
                    >
                      View All Pending Events
                    </Button>
                  )}
                </Card>
              )}
            </div>
          )}

          {/* Photographers Tab */}
          {activeTab === 'photographers' && (
            <div className="space-y-6">
              <Card className="overflow-hidden shadow-gold-soft">
                <div className="p-6 border-b border-warmgrey">
                  <h2 className="text-2xl font-heading text-foreground">
                    All Photographers ({photographers.length})
                  </h2>
                </div>
                
                {photographers.length === 0 ? (
                  <div className="p-12 text-center">
                    <FiUsers className="w-12 h-12 text-foreground/30 mx-auto mb-4" />
                    <p className="text-foreground/60 font-body">
                      No photographers registered yet. Use the "Register New" tab to add photographers.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-cream">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-body font-semibold text-foreground/70 uppercase tracking-wider">
                            Photographer
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-body font-semibold text-foreground/70 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-body font-semibold text-foreground/70 uppercase tracking-wider">
                            Photos
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-body font-semibold text-foreground/70 uppercase tracking-wider">
                            Events
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-body font-semibold text-foreground/70 uppercase tracking-wider">
                            Joined
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-body font-semibold text-foreground/70 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-warmgrey">
                        {photographers.map((photographer) => (
                          <tr key={photographer.user_id} className="hover:bg-cream/50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-3">
                                {photographer.picture ? (
                                  <img
                                    src={photographer.picture}
                                    alt={photographer.name}
                                    className="w-10 h-10 rounded-full border border-warmgrey"
                                  />
                                ) : (
                                  <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center">
                                    <FiUsers className="w-5 h-5 text-gold" />
                                  </div>
                                )}
                                <div>
                                  <p className="font-body font-medium text-foreground">{photographer.name}</p>
                                  <p className="text-sm text-foreground/60">{photographer.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-3 py-1 rounded-full text-xs font-body border ${getStatusBadge(photographer.status)}`}>
                                {photographer.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap font-body text-foreground">
                              {photographer.photo_count || 0}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap font-body text-foreground">
                              {photographer.event_count || 0}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap font-body text-foreground/70">
                              {photographer.created_at ? new Date(photographer.created_at).toLocaleDateString() : 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                              <div className="flex gap-2 justify-end">
                                {photographer.status !== 'active' && (
                                  <Button
                                    size="sm"
                                    onClick={() => handleUpdatePhotographerStatus(photographer.user_id, 'active')}
                                    className="bg-green-600 hover:bg-green-700"
                                  >
                                    <FiCheck className="w-4 h-4" />
                                  </Button>
                                )}
                                {photographer.status === 'active' && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleUpdatePhotographerStatus(photographer.user_id, 'inactive')}
                                    className="text-yellow-600 border-yellow-300"
                                  >
                                    <FiX className="w-4 h-4" />
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDeletePhotographer(photographer.user_id, photographer.name)}
                                  className="text-red-600 border-red-300 hover:bg-red-50"
                                >
                                  <FiTrash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>

              {/* Registered Emails (pending signup) */}
              {registeredEmails.length > 0 && (
                <Card className="overflow-hidden shadow-gold-soft">
                  <div className="p-6 border-b border-warmgrey">
                    <h2 className="text-xl font-heading text-foreground">
                      Pending Signups ({registeredEmails.length})
                    </h2>
                    <p className="text-sm text-foreground/60 font-body mt-1">
                      These emails are registered but haven't logged in yet
                    </p>
                  </div>
                  <div className="p-6">
                    <div className="space-y-3">
                      {registeredEmails.map((reg) => (
                        <div key={reg.registration_id} className="flex justify-between items-center bg-cream p-4 rounded-lg">
                          <div>
                            <p className="font-body font-medium">{reg.email}</p>
                            {reg.name && <p className="text-sm text-foreground/60">{reg.name}</p>}
                            <p className="text-xs text-foreground/40">
                              Registered on {new Date(reg.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRemoveRegistration(reg.email)}
                            className="text-red-600 border-red-300 hover:bg-red-50"
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              )}
            </div>
          )}

          {/* Events Tab */}
          {activeTab === 'events' && (
            <div className="space-y-6">
              {/* Pending Events */}
              {pendingEvents.length > 0 && (
                <Card className="overflow-hidden shadow-gold-soft border-yellow-300">
                  <div className="p-6 border-b border-yellow-300 bg-yellow-50">
                    <h2 className="text-xl font-heading text-yellow-800 flex items-center gap-2">
                      <FiClock className="w-5 h-5" />
                      Pending Approval ({pendingEvents.length})
                    </h2>
                  </div>
                  <div className="divide-y divide-warmgrey">
                    {pendingEvents.map((event) => (
                      <div key={event.event_id} className="p-6 hover:bg-cream/50 transition-colors">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-heading text-lg text-foreground">{event.event_name}</h3>
                            <p className="text-sm text-foreground/60 font-body">
                              {event.bride_name && event.groom_name 
                                ? `${event.bride_name} & ${event.groom_name}` 
                                : 'Couple names not set'}
                            </p>
                            <div className="mt-2 text-sm text-foreground/70 font-body">
                              <p>📅 {new Date(event.event_date).toLocaleDateString()}</p>
                              {event.venue && <p>📍 {event.venue}</p>}
                              <p>📸 by {event.photographer_name}</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              onClick={() => handleUpdateEventStatus(event.event_id, 'active')}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <FiCheck className="mr-1" /> Approve
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => handleUpdateEventStatus(event.event_id, 'cancelled')}
                              className="text-red-600 border-red-300 hover:bg-red-50"
                            >
                              <FiX className="mr-1" /> Reject
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* All Events */}
              <Card className="overflow-hidden shadow-gold-soft">
                <div className="p-6 border-b border-warmgrey">
                  <h2 className="text-xl font-heading text-foreground">
                    All Events ({events.length})
                  </h2>
                </div>
                
                {events.length === 0 ? (
                  <div className="p-12 text-center">
                    <FiCalendar className="w-12 h-12 text-foreground/30 mx-auto mb-4" />
                    <p className="text-foreground/60 font-body">No events created yet.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-cream">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-body font-semibold text-foreground/70 uppercase tracking-wider">
                            Event
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-body font-semibold text-foreground/70 uppercase tracking-wider">
                            Photographer
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-body font-semibold text-foreground/70 uppercase tracking-wider">
                            Date
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-body font-semibold text-foreground/70 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-body font-semibold text-foreground/70 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-warmgrey">
                        {events.map((event) => (
                          <tr key={event.event_id} className="hover:bg-cream/50 transition-colors">
                            <td className="px-6 py-4">
                              <p className="font-body font-medium text-foreground">{event.event_name}</p>
                              {event.bride_name && event.groom_name && (
                                <p className="text-sm text-foreground/60">
                                  {event.bride_name} & {event.groom_name}
                                </p>
                              )}
                            </td>
                            <td className="px-6 py-4 font-body text-foreground/70">
                              {event.photographer_name}
                            </td>
                            <td className="px-6 py-4 font-body text-foreground/70">
                              {new Date(event.event_date).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4">
                              <span className={`px-3 py-1 rounded-full text-xs font-body border ${getStatusBadge(event.status)}`}>
                                {event.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex gap-2 justify-end">
                                {event.status === 'pending' && (
                                  <>
                                    <Button
                                      size="sm"
                                      onClick={() => handleUpdateEventStatus(event.event_id, 'active')}
                                      className="bg-green-600 hover:bg-green-700"
                                    >
                                      <FiCheck className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleUpdateEventStatus(event.event_id, 'cancelled')}
                                      className="text-red-600 border-red-300"
                                    >
                                      <FiX className="w-4 h-4" />
                                    </Button>
                                  </>
                                )}
                                {event.status === 'active' && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleUpdateEventStatus(event.event_id, 'completed')}
                                    className="text-blue-600 border-blue-300"
                                  >
                                    Complete
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            </div>
          )}

          {/* Register New Tab */}
          {activeTab === 'register' && (
            <div className="max-w-xl mx-auto">
              <Card className="p-8 shadow-gold-soft">
                <h2 className="text-2xl font-heading text-foreground mb-2">
                  Register New Photographer
                </h2>
                <p className="text-foreground/60 font-body mb-6">
                  Add a photographer's email to allow them to sign in. They will need to use Google login with this email.
                </p>

                <form onSubmit={handleRegisterPhotographer} className="space-y-6">
                  <div>
                    <Label htmlFor="email" className="font-body text-foreground mb-2 block">
                      Email Address *
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="photographer@example.com"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      required
                      disabled={registering}
                    />
                  </div>

                  <div>
                    <Label htmlFor="name" className="font-body text-foreground mb-2 block">
                      Name (Optional)
                    </Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="John Doe"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      disabled={registering}
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={registering || !newEmail}
                    className="w-full bg-gold hover:bg-gold/90 text-white font-body font-medium py-6 text-lg"
                  >
                    {registering ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Registering...
                      </>
                    ) : (
                      <>
                        <FiUserPlus className="mr-2" /> Register Photographer
                      </>
                    )}
                  </Button>
                </form>
              </Card>

              {/* Info Card */}
              <Card className="mt-6 p-6 bg-blue-50 border-blue-200">
                <h3 className="font-heading text-blue-800 mb-2">How it works</h3>
                <ol className="list-decimal list-inside space-y-2 text-sm text-blue-700 font-body">
                  <li>Register the photographer's email here</li>
                  <li>Share the login link with the photographer</li>
                  <li>They sign in using Google with the registered email</li>
                  <li>Their account starts with "pending" status</li>
                  <li>You can activate them from the Photographers tab</li>
                </ol>
              </Card>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default AdminDashboard;
