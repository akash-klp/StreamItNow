import React from 'react';
import { motion } from 'framer-motion';

const Login = () => {
  const handleLogin = () => {
    const redirectUrl = window.location.origin + '/auth/callback';
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <motion.div
        className="max-w-md w-full text-center glass-panel p-10 rounded-2xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <h1 className="text-5xl md:text-6xl font-heading italic text-white drop-shadow-lg mb-4">
          Wedding Clickz
        </h1>
        <p className="text-xl font-script text-white drop-shadow-md mb-8">
          Photography Dashboard
        </p>
        <p className="text-white/90 font-body mb-8 drop-shadow-md">
          Upload and manage your beautiful wedding moments
        </p>
        
        <button
          onClick={handleLogin}
          data-testid="login-button"
          className="w-full bg-gold hover:bg-gold/90 text-white font-body font-medium py-4 px-8 rounded-lg shadow-gold-soft hover:shadow-xl transition-all duration-300 transform hover:scale-105"
        >
          Sign in with Google
        </button>

        <div className="mt-8 pt-8 border-t border-white/20">
          <a
            href="/"
            className="text-white/80 hover:text-white font-body text-sm transition-colors drop-shadow-md"
          >
            ← Back to Guest View
          </a>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;