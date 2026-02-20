import { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { googleLogout } from '@react-oauth/google';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Configure axios defaults
  axios.defaults.baseURL = import.meta.env.VITE_API_BASE_URL + '/api';
  axios.defaults.withCredentials = true;

  // Check if user is logged in on mount
  useEffect(() => {
    const checkLoggedIn = async () => {
      const token = localStorage.getItem('token');
      
      if (token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        try {
          const res = await axios.get('/auth/me');
          setUser({ ...res.data.user, stats: res.data.stats });
        } catch (err) {
          console.error('Session expired or invalid token');
          localStorage.removeItem('token');
          delete axios.defaults.headers.common['Authorization'];
          setUser(null);
        }
      }
      setLoading(false);
    };

    checkLoggedIn();
  }, []);

  // Register
  const register = async (name, email, password) => {
    setError(null);
    try {
      const res = await axios.post('/auth/register', { name, email, password });
      const { token, user } = res.data;
      
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(user);
      return { success: true };
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
      return { success: false, message: err.response?.data?.message };
    }
  };

  // Login
  const login = async (email, password) => {
    setError(null);
    try {
      const res = await axios.post('/auth/login', { email, password });
      const { token, user } = res.data;
      
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(user);
      return { success: true };
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
      return { success: false, message: err.response?.data?.message };
    }
  };

  // Google Login
  const googleLogin = async (credential) => {
    setError(null);
    try {
      const res = await axios.post('/auth/google-auth', { credential });
      const { token, user } = res.data;
      
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(user);
      return { success: true };
    } catch (err) {
      console.error('Google login error:', err);
      setError(err.response?.data?.message || 'Google login failed');
      return { success: false, message: err.response?.data?.message };
    }
  };

  // Logout
  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
    googleLogout();
  };

  // Update display name (cascades to subjects & topics via backend)
  const updateName = async (newName) => {
    try {
      const res = await axios.put('/auth/update-name', { name: newName });
      if (res.data.success) {
        setUser(prev => ({ ...prev, name: res.data.name }));
        return { success: true };
      }
      return { success: false, message: res.data.message };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Failed to update name' };
    }
  };

  const value = {
    user,
    loading,
    error,
    register,
    login,
    googleLogin,
    logout,
    updateName,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'superadmin',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
