import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../api/authApi';

const AuthContext = createContext(null);

// Helper to decode JWT token payload safely
function decodeJwt(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1]));
    return {
      email: payload.sub,
      role: payload.role,
      userId: payload.userId,
      exp: payload.exp,
    };
  } catch (e) {
    console.error('Failed to parse JWT token', e);
    return null;
  }
}

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem('starlight_token'));
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('starlight_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    const existingToken = localStorage.getItem('starlight_token');
    if (existingToken) {
      return decodeJwt(existingToken);
    }
    return null;
  });
  const [loading, setLoading] = useState(true);

  // Check token expiration on mount and refresh
  useEffect(() => {
    const existingToken = localStorage.getItem('starlight_token');
    if (existingToken) {
      const decoded = decodeJwt(existingToken);
      if (decoded && decoded.exp * 1000 > Date.now()) {
        setToken(existingToken);
        setUser(decoded);
      } else {
        // Expired
        logout();
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const rawToken = await authApi.login({ email, password });
    // In Spring, return string may sometimes be wrapped or raw
    const cleanToken = typeof rawToken === 'string' ? rawToken.trim() : rawToken.token || String(rawToken);

    const decoded = decodeJwt(cleanToken);
    if (!decoded) {
      throw new Error('Received invalid token from authentication server');
    }

    localStorage.setItem('starlight_token', cleanToken);
    localStorage.setItem('starlight_user', JSON.stringify(decoded));

    setToken(cleanToken);
    setUser(decoded);
    return decoded;
  };

  const register = async (userData) => {
    return await authApi.register(userData);
  };

  const logout = () => {
    localStorage.removeItem('starlight_token');
    localStorage.removeItem('starlight_user');
    setToken(null);
    setUser(null);
  };

  const isAuthenticated = !!token && !!user;
  const isAdmin = user?.role === 'ADMIN';
  const isCustomer = user?.role === 'CUSTOMER' || user?.role === 'USER';

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        loading,
        isAuthenticated,
        isAdmin,
        isCustomer,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
