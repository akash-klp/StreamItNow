import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const ProtectedRoute = ({ children }) => {
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(
    location.state?.user ? true : null
  );
  const [user, setUser] = useState(location.state?.user || null);

  useEffect(() => {
    if (location.state?.user) {
      // Check if admin should be redirected
      if (location.state.user.role === 'admin') {
        setUser(location.state.user);
        setIsAuthenticated('redirect_admin');
      }
      return;
    }

    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('session_token');
        if (!token) {
          setIsAuthenticated(false);
          return;
        }

        const response = await axios.get(`${BACKEND_URL}/api/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        const userData = response.data;
        setUser(userData);
        
        // Check role and update localStorage with latest data
        localStorage.setItem('user', JSON.stringify(userData));
        
        if (userData.role === 'admin') {
          setIsAuthenticated('redirect_admin');
        } else {
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        setIsAuthenticated(false);
      }
    };

    checkAuth();
  }, [location.state]);

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-champagne">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold mx-auto mb-4"></div>
          <p className="text-foreground/60 font-body">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Redirect admin to admin dashboard
  if (isAuthenticated === 'redirect_admin') {
    return <Navigate to="/admin" replace />;
  }

  return React.cloneElement(children, { user });
};

export default ProtectedRoute;