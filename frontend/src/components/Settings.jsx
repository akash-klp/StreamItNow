import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const Settings = () => {
  const [settings, setSettings] = useState({
    photography_name: '',
    email: '',
    instagram_link: '',
    youtube_link: '',
    whatsapp_number: '',
    location_link: '',
    bride_name: '',
    groom_name: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/settings`);
      setSettings(response.data);
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('session_token');
      await axios.post(
        `${BACKEND_URL}/api/settings`,
        settings,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      toast.success('Settings saved successfully!');
    } catch (error) {
      console.error('Save failed:', error);
      toast.error('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Card className="p-8 shadow-gold-soft">
      <h2 className="text-3xl font-heading text-foreground mb-6">Profile Settings</h2>
      
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="photography_name" className="font-body">Photography Business Name</Label>
            <Input
              id="photography_name"
              value={settings.photography_name}
              onChange={(e) => handleChange('photography_name', e.target.value)}
              placeholder="Wedding Clickz Photography"
            />
          </div>

          <div>
            <Label htmlFor="email" className="font-body">Email</Label>
            <Input
              id="email"
              type="email"
              value={settings.email}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder="info@weddingclickz.com"
            />
          </div>

          <div>
            <Label htmlFor="instagram_link" className="font-body">Instagram Link</Label>
            <Input
              id="instagram_link"
              value={settings.instagram_link}
              onChange={(e) => handleChange('instagram_link', e.target.value)}
              placeholder="https://instagram.com/yourhandle"
            />
          </div>

          <div>
            <Label htmlFor="youtube_link" className="font-body">YouTube Link</Label>
            <Input
              id="youtube_link"
              value={settings.youtube_link}
              onChange={(e) => handleChange('youtube_link', e.target.value)}
              placeholder="https://youtube.com/@yourhandle"
            />
          </div>

          <div>
            <Label htmlFor="whatsapp_number" className="font-body">WhatsApp Number</Label>
            <Input
              id="whatsapp_number"
              value={settings.whatsapp_number}
              onChange={(e) => handleChange('whatsapp_number', e.target.value)}
              placeholder="1234567890"
            />
          </div>

          <div>
            <Label htmlFor="location_link" className="font-body">Location Link</Label>
            <Input
              id="location_link"
              value={settings.location_link}
              onChange={(e) => handleChange('location_link', e.target.value)}
              placeholder="https://maps.google.com/?q=YourCity"
            />
          </div>

          <div>
            <Label htmlFor="bride_name" className="font-body">Bride Name</Label>
            <Input
              id="bride_name"
              value={settings.bride_name}
              onChange={(e) => handleChange('bride_name', e.target.value)}
              placeholder="Prarthana"
            />
          </div>

          <div>
            <Label htmlFor="groom_name" className="font-body">Groom Name</Label>
            <Input
              id="groom_name"
              value={settings.groom_name}
              onChange={(e) => handleChange('groom_name', e.target.value)}
              placeholder="Santosh"
            />
          </div>
        </div>

        <Button
          onClick={handleSave}
          disabled={loading}
          className="w-full bg-gold hover:bg-gold/90 text-white font-body font-medium py-6 text-lg"
        >
          {loading ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </Card>
  );
};

export default Settings;
