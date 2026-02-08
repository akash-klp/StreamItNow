import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const AuthCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const hasProcessed = useRef(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const processSession = async () => {
      try {
        const hash = location.hash;
        const params = new URLSearchParams(hash.substring(1));
        const sessionId = params.get('session_id');

        if (!sessionId) {
          navigate('/login');
          return;
        }

        const response = await axios.post(
          `${BACKEND_URL}/api/auth/session`,
          {},
          {
            headers: {
              'X-Session-ID': sessionId
            }
          }
        );

        const { user, session_token } = response.data;

        localStorage.setItem('session_token', session_token);
        localStorage.setItem('user', JSON.stringify(user));

        // Redirect based on role
        if (user.role === 'admin') {
          navigate('/admin', { state: { user }, replace: true });
        } else {
          navigate('/dashboard', { state: { user }, replace: true });
        }
      } catch (error) {
        console.error('Session processing failed:', error);
        const errorMessage = error.response?.data?.detail || 'Authentication failed';
        setError(errorMessage);
        toast.error(errorMessage);
        
        // Redirect to login after showing error
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      }
    };

    processSession();
  }, [location, navigate]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-champagne">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-xl font-heading text-foreground mb-2">Access Denied</h2>
          <p className="text-foreground/60 font-body mb-4">{error}</p>
          <p className="text-sm text-foreground/40 font-body">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-champagne">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold mx-auto mb-4"></div>
        <p className="text-foreground/60 font-body">Authenticating...</p>
      </div>
    </div>
  );
};

export default AuthCallback;