import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiUsers, FiImage, FiCalendar, FiLogOut, FiCheck, FiX, 
  FiUserPlus, FiTrash2, FiClock, FiActivity, FiEye, FiAlertCircle,
  FiCheckCircle, FiUserCheck, FiFolder
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

  // S3 Status
  const [s3Status, setS3Status] = useState(null);

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
    testS3Connection();
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

  const testS3Connection = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/admin/test-s3`, getAuthHeaders());
      setS3Status(response.data);
    } catch (error) {
      setS3Status({ status: 'error', message: 'Failed to test S3' });
    }
  };

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
      fetchStats();
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
      active: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      pending: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      inactive: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30',
      completed: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      cancelled: 'bg-red-500/20 text-red-400 border-red-500/30'
    };
    return badges[status] || badges.pending;
  };

  // Get active photographers with their event counts
  const activePhotographers = photographers.filter(p => p.status === 'active');
  const pendingPhotographers = photographers.filter(p => p.status === 'pending');

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white" data-testid="admin-dashboard">
      {/* Header */}
      <div className="bg-zinc-900 border-b border-zinc-800 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            {user?.picture && (
              <img
                src={user.picture}
                alt={user.name}
                className="w-10 h-10 rounded-full border-2 border-zinc-700"
              />
            )}
            <div>
              <h2 className="font-semibold text-lg text-white">{user?.name}</h2>
              <p className="text-sm text-zinc-400">Admin Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {/* S3 Status Indicator */}
            {s3Status && (
              <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs ${
                s3Status.status === 'connected' 
                  ? 'bg-emerald-500/20 text-emerald-400' 
                  : 'bg-red-500/20 text-red-400'
              }`}>
                <div className={`w-2 h-2 rounded-full ${
                  s3Status.status === 'connected' ? 'bg-emerald-400' : 'bg-red-400'
                }`}></div>
                S3 {s3Status.status === 'connected' ? 'Connected' : 'Disconnected'}
              </div>
            )}
            <Button
              variant="outline"
              onClick={() => navigate('/')}
              className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white"
            >
              <FiEye className="mr-2" /> View Site
            </Button>
            <Button
              variant="outline"
              onClick={handleLogout}
              className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white"
              data-testid="logout-button"
            >
              <FiLogOut className="mr-2" /> Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl font-bold text-white mb-2">Admin Control Panel</h1>
          <p className="text-zinc-400 mb-8">Manage photographers, events, and platform settings</p>

          {/* Tab Navigation */}
          <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
            {[
              { id: 'overview', label: 'Overview', icon: FiActivity },
              { id: 'register', label: 'Register Photographer', icon: FiUserPlus },
              { id: 'active', label: 'Active Photographers', icon: FiUserCheck, count: activePhotographers.length },
              { id: 'approve-events', label: 'Approve Events', icon: FiCalendar, count: pendingEvents.length },
              { id: 'approve-registrations', label: 'Approve Registrations', icon: FiUsers, count: pendingPhotographers.length + registeredEmails.length }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 rounded-lg whitespace-nowrap transition-all ${
                  activeTab === tab.id
                    ? 'bg-white text-black font-medium'
                    : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-white border border-zinc-800'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
                {tab.count > 0 && (
                  <span className={`px-2 py-0.5 rounded-full text-xs ${
                    activeTab === tab.id 
                      ? 'bg-black text-white' 
                      : 'bg-amber-500/20 text-amber-400'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Overview Tab */}
          {activeTab === 'overview' && stats && (
            <div className="space-y-8">
              {/* Main Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-zinc-900 border-zinc-800 p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-500/20 rounded-xl">
                      <FiUsers className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm text-zinc-500">Total Photographers</p>
                      <p className="text-3xl font-bold text-white">{stats.total_photographers}</p>
                    </div>
                  </div>
                </Card>

                <Card className="bg-zinc-900 border-zinc-800 p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-emerald-500/20 rounded-xl">
                      <FiCheckCircle className="w-6 h-6 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-sm text-zinc-500">Active Photographers</p>
                      <p className="text-3xl font-bold text-emerald-400">{stats.active_photographers}</p>
                    </div>
                  </div>
                </Card>

                <Card className="bg-zinc-900 border-zinc-800 p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-amber-500/20 rounded-xl">
                      <FiClock className="w-6 h-6 text-amber-400" />
                    </div>
                    <div>
                      <p className="text-sm text-zinc-500">Pending Approvals</p>
                      <p className="text-3xl font-bold text-amber-400">
                        {stats.pending_photographers + stats.pending_events}
                      </p>
                    </div>
                  </div>
                </Card>

                <Card className="bg-zinc-900 border-zinc-800 p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-purple-500/20 rounded-xl">
                      <FiCalendar className="w-6 h-6 text-purple-400" />
                    </div>
                    <div>
                      <p className="text-sm text-zinc-500">Active Events</p>
                      <p className="text-3xl font-bold text-purple-400">{stats.active_events}</p>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Pending Events Alert */}
                {pendingEvents.length > 0 && (
                  <Card className="bg-amber-500/10 border-amber-500/30 p-6">
                    <h3 className="text-lg font-semibold text-amber-400 mb-4 flex items-center gap-2">
                      <FiAlertCircle className="w-5 h-5" />
                      {pendingEvents.length} Event(s) Awaiting Approval
                    </h3>
                    <div className="space-y-3">
                      {pendingEvents.slice(0, 3).map((event) => (
                        <div key={event.event_id} className="flex justify-between items-center bg-zinc-900 p-3 rounded-lg">
                          <div>
                            <p className="font-medium text-white">{event.event_name}</p>
                            <p className="text-xs text-zinc-400">by {event.photographer_name}</p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleUpdateEventStatus(event.event_id, 'active')}
                              className="bg-emerald-600 hover:bg-emerald-500 text-white"
                            >
                              <FiCheck className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUpdateEventStatus(event.event_id, 'cancelled')}
                              className="border-red-500/50 text-red-400 hover:bg-red-500/20"
                            >
                              <FiX className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                    {pendingEvents.length > 3 && (
                      <Button
                        variant="outline"
                        onClick={() => setActiveTab('approve-events')}
                        className="mt-4 w-full border-amber-500/30 text-amber-400 hover:bg-amber-500/20"
                      >
                        View All Pending Events
                      </Button>
                    )}
                  </Card>
                )}

                {/* Pending Registrations Alert */}
                {(pendingPhotographers.length > 0 || registeredEmails.length > 0) && (
                  <Card className="bg-blue-500/10 border-blue-500/30 p-6">
                    <h3 className="text-lg font-semibold text-blue-400 mb-4 flex items-center gap-2">
                      <FiUserPlus className="w-5 h-5" />
                      {pendingPhotographers.length + registeredEmails.length} Registration(s) Pending
                    </h3>
                    <div className="space-y-3">
                      {pendingPhotographers.slice(0, 2).map((photographer) => (
                        <div key={photographer.user_id} className="flex justify-between items-center bg-zinc-900 p-3 rounded-lg">
                          <div className="flex items-center gap-3">
                            {photographer.picture ? (
                              <img src={photographer.picture} alt="" className="w-8 h-8 rounded-full" />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center">
                                <FiUsers className="w-4 h-4 text-zinc-400" />
                              </div>
                            )}
                            <div>
                              <p className="font-medium text-white">{photographer.name}</p>
                              <p className="text-xs text-zinc-400">{photographer.email}</p>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => handleUpdatePhotographerStatus(photographer.user_id, 'active')}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white"
                          >
                            Approve
                          </Button>
                        </div>
                      ))}
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => setActiveTab('approve-registrations')}
                      className="mt-4 w-full border-blue-500/30 text-blue-400 hover:bg-blue-500/20"
                    >
                      View All Registrations
                    </Button>
                  </Card>
                )}
              </div>

              {/* Platform Stats */}
              <Card className="bg-zinc-900 border-zinc-800 p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Platform Statistics</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-zinc-800 rounded-lg p-4">
                    <p className="text-zinc-400 text-sm">Total Events</p>
                    <p className="text-2xl font-bold text-white">{stats.total_events}</p>
                  </div>
                  <div className="bg-zinc-800 rounded-lg p-4">
                    <p className="text-zinc-400 text-sm">Active Events</p>
                    <p className="text-2xl font-bold text-emerald-400">{stats.active_events}</p>
                  </div>
                  <div className="bg-zinc-800 rounded-lg p-4">
                    <p className="text-zinc-400 text-sm">Pending Events</p>
                    <p className="text-2xl font-bold text-amber-400">{stats.pending_events}</p>
                  </div>
                  <div className="bg-zinc-800 rounded-lg p-4">
                    <p className="text-zinc-400 text-sm">Total Photos</p>
                    <p className="text-2xl font-bold text-purple-400">{stats.total_photos}</p>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Register New Photographer Tab */}
          {activeTab === 'register' && (
            <div className="max-w-xl">
              <Card className="bg-zinc-900 border-zinc-800 p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-blue-500/20 rounded-xl">
                    <FiUserPlus className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-white">Register New Photographer</h2>
                    <p className="text-sm text-zinc-400">Add photographer email to allow login</p>
                  </div>
                </div>

                <form onSubmit={handleRegisterPhotographer} className="space-y-6">
                  <div>
                    <Label className="text-zinc-300 mb-2 block">Email Address *</Label>
                    <Input
                      type="email"
                      placeholder="photographer@example.com"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      required
                      disabled={registering}
                      className="bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500"
                    />
                  </div>

                  <div>
                    <Label className="text-zinc-300 mb-2 block">Name (Optional)</Label>
                    <Input
                      type="text"
                      placeholder="John Doe"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      disabled={registering}
                      className="bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={registering || !newEmail}
                    className="w-full bg-white text-black hover:bg-zinc-200 font-medium py-6"
                  >
                    {registering ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black mr-2"></div>
                        Registering...
                      </>
                    ) : (
                      <>
                        <FiUserPlus className="mr-2" /> Register Photographer
                      </>
                    )}
                  </Button>
                </form>

                {/* How it works */}
                <div className="mt-8 pt-6 border-t border-zinc-800">
                  <h4 className="text-sm font-medium text-zinc-300 mb-3">How it works:</h4>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-zinc-500">
                    <li>Register the photographer's email here</li>
                    <li>Share the login link with them</li>
                    <li>They sign in with Google using the registered email</li>
                    <li>Approve their account from "Approve Registrations"</li>
                    <li>They can then create events (which need your approval)</li>
                  </ol>
                </div>
              </Card>
            </div>
          )}

          {/* Active Photographers Tab */}
          {activeTab === 'active' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-white">
                  Active Photographers ({activePhotographers.length})
                </h2>
              </div>

              {activePhotographers.length === 0 ? (
                <Card className="bg-zinc-900 border-zinc-800 p-12 text-center">
                  <FiUsers className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
                  <p className="text-zinc-400">No active photographers yet</p>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {activePhotographers.map((photographer) => (
                    <Card key={photographer.user_id} className="bg-zinc-900 border-zinc-800 p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          {photographer.picture ? (
                            <img
                              src={photographer.picture}
                              alt={photographer.name}
                              className="w-12 h-12 rounded-full border border-zinc-700"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center">
                              <FiUsers className="w-6 h-6 text-zinc-500" />
                            </div>
                          )}
                          <div>
                            <h3 className="font-semibold text-white">{photographer.name}</h3>
                            <p className="text-sm text-zinc-400">{photographer.email}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-6">
                          {/* Stats */}
                          <div className="flex gap-4 text-center">
                            <div className="px-4 py-2 bg-zinc-800 rounded-lg">
                              <p className="text-lg font-bold text-purple-400">{photographer.event_count || 0}</p>
                              <p className="text-xs text-zinc-500">Events</p>
                            </div>
                            <div className="px-4 py-2 bg-zinc-800 rounded-lg">
                              <p className="text-lg font-bold text-blue-400">{photographer.photo_count || 0}</p>
                              <p className="text-xs text-zinc-500">Photos</p>
                            </div>
                          </div>
                          
                          {/* Actions */}
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUpdatePhotographerStatus(photographer.user_id, 'inactive')}
                              className="border-amber-500/50 text-amber-400 hover:bg-amber-500/20"
                            >
                              Deactivate
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeletePhotographer(photographer.user_id, photographer.name)}
                              className="border-red-500/50 text-red-400 hover:bg-red-500/20"
                            >
                              <FiTrash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Approve Events Tab */}
          {activeTab === 'approve-events' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-white">
                Event Approval Requests ({pendingEvents.length})
              </h2>

              {pendingEvents.length === 0 ? (
                <Card className="bg-zinc-900 border-zinc-800 p-12 text-center">
                  <FiCheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
                  <p className="text-zinc-400">All events have been reviewed!</p>
                </Card>
              ) : (
                <div className="space-y-4">
                  {pendingEvents.map((event) => (
                    <Card key={event.event_id} className="bg-zinc-900 border-zinc-800 p-6">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-white">{event.event_name}</h3>
                            <span className={`px-2 py-0.5 rounded-full text-xs border ${getStatusBadge(event.status)}`}>
                              {event.status}
                            </span>
                          </div>
                          
                          {event.bride_name && event.groom_name && (
                            <p className="text-zinc-400 text-sm mb-1">
                              💍 {event.bride_name} & {event.groom_name}
                            </p>
                          )}
                          
                          <div className="flex flex-wrap gap-4 text-sm text-zinc-500">
                            <span>📅 {new Date(event.event_date).toLocaleDateString()}</span>
                            {event.venue && <span>📍 {event.venue}</span>}
                            <span>📸 by {event.photographer_name}</span>
                          </div>
                        </div>
                        
                        <div className="flex gap-3">
                          <Button
                            onClick={() => handleUpdateEventStatus(event.event_id, 'active')}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white"
                          >
                            <FiCheck className="mr-2" /> Approve
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => handleUpdateEventStatus(event.event_id, 'cancelled')}
                            className="border-red-500/50 text-red-400 hover:bg-red-500/20"
                          >
                            <FiX className="mr-2" /> Reject
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}

              {/* All Events Section */}
              <div className="mt-12">
                <h3 className="text-lg font-semibold text-white mb-4">All Events ({events.length})</h3>
                {events.length === 0 ? (
                  <Card className="bg-zinc-900 border-zinc-800 p-8 text-center">
                    <p className="text-zinc-400">No events created yet</p>
                  </Card>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-zinc-800">
                          <th className="text-left py-3 px-4 text-sm font-medium text-zinc-400">Event</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-zinc-400">Photographer</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-zinc-400">Date</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-zinc-400">Status</th>
                          <th className="text-right py-3 px-4 text-sm font-medium text-zinc-400">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {events.map((event) => (
                          <tr key={event.event_id} className="border-b border-zinc-800/50 hover:bg-zinc-900/50">
                            <td className="py-4 px-4">
                              <p className="font-medium text-white">{event.event_name}</p>
                              {event.bride_name && event.groom_name && (
                                <p className="text-xs text-zinc-500">{event.bride_name} & {event.groom_name}</p>
                              )}
                            </td>
                            <td className="py-4 px-4 text-zinc-400">{event.photographer_name}</td>
                            <td className="py-4 px-4 text-zinc-400">{new Date(event.event_date).toLocaleDateString()}</td>
                            <td className="py-4 px-4">
                              <span className={`px-2 py-1 rounded-full text-xs border ${getStatusBadge(event.status)}`}>
                                {event.status}
                              </span>
                            </td>
                            <td className="py-4 px-4 text-right">
                              {event.status === 'pending' && (
                                <div className="flex gap-2 justify-end">
                                  <Button
                                    size="sm"
                                    onClick={() => handleUpdateEventStatus(event.event_id, 'active')}
                                    className="bg-emerald-600 hover:bg-emerald-500"
                                  >
                                    <FiCheck className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleUpdateEventStatus(event.event_id, 'cancelled')}
                                    className="border-red-500/50 text-red-400"
                                  >
                                    <FiX className="w-4 h-4" />
                                  </Button>
                                </div>
                              )}
                              {event.status === 'active' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleUpdateEventStatus(event.event_id, 'completed')}
                                  className="border-blue-500/50 text-blue-400"
                                >
                                  Complete
                                </Button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Approve Registrations Tab */}
          {activeTab === 'approve-registrations' && (
            <div className="space-y-8">
              {/* Pending Photographer Approvals */}
              <div>
                <h2 className="text-xl font-semibold text-white mb-4">
                  Photographers Awaiting Approval ({pendingPhotographers.length})
                </h2>

                {pendingPhotographers.length === 0 ? (
                  <Card className="bg-zinc-900 border-zinc-800 p-8 text-center">
                    <FiCheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
                    <p className="text-zinc-400">No photographers waiting for approval</p>
                  </Card>
                ) : (
                  <div className="grid gap-4">
                    {pendingPhotographers.map((photographer) => (
                      <Card key={photographer.user_id} className="bg-zinc-900 border-zinc-800 p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            {photographer.picture ? (
                              <img
                                src={photographer.picture}
                                alt={photographer.name}
                                className="w-12 h-12 rounded-full border border-zinc-700"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center">
                                <FiUsers className="w-6 h-6 text-zinc-500" />
                              </div>
                            )}
                            <div>
                              <h3 className="font-semibold text-white">{photographer.name}</h3>
                              <p className="text-sm text-zinc-400">{photographer.email}</p>
                              <p className="text-xs text-zinc-500">
                                Signed up: {photographer.created_at ? new Date(photographer.created_at).toLocaleDateString() : 'N/A'}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex gap-3">
                            <Button
                              onClick={() => handleUpdatePhotographerStatus(photographer.user_id, 'active')}
                              className="bg-emerald-600 hover:bg-emerald-500 text-white"
                            >
                              <FiCheck className="mr-2" /> Approve
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => handleDeletePhotographer(photographer.user_id, photographer.name)}
                              className="border-red-500/50 text-red-400 hover:bg-red-500/20"
                            >
                              <FiX className="mr-2" /> Reject
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>

              {/* Pre-registered Emails (awaiting signup) */}
              <div>
                <h2 className="text-xl font-semibold text-white mb-4">
                  Registered Emails (Awaiting Signup) ({registeredEmails.length})
                </h2>

                {registeredEmails.length === 0 ? (
                  <Card className="bg-zinc-900 border-zinc-800 p-8 text-center">
                    <p className="text-zinc-400">No pending email registrations</p>
                    <Button
                      onClick={() => setActiveTab('register')}
                      className="mt-4 bg-white text-black hover:bg-zinc-200"
                    >
                      <FiUserPlus className="mr-2" /> Register a Photographer
                    </Button>
                  </Card>
                ) : (
                  <div className="grid gap-3">
                    {registeredEmails.map((reg) => (
                      <Card key={reg.registration_id} className="bg-zinc-900 border-zinc-800 p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-white">{reg.email}</p>
                            {reg.name && <p className="text-sm text-zinc-400">{reg.name}</p>}
                            <p className="text-xs text-zinc-500">
                              Registered on {new Date(reg.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRemoveRegistration(reg.email)}
                            className="border-red-500/50 text-red-400 hover:bg-red-500/20"
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default AdminDashboard;
