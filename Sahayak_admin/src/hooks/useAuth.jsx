import { createContext, useContext, useState, useEffect } from 'react';
import api, { setToken, clearToken, getToken } from '../utils/apiClient';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore session from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('sahayak_user');
    const token = getToken();
    if (storedUser && token) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem('sahayak_user');
        clearToken();
      }
    }
    setLoading(false);
  }, []);

  /** Login using real backend — POST /api/admin/auth/login */
  const login = async (email, password) => {
    try {
      const data = await api.post('/admin/auth/login', { email, password });
      if (!data) return false;
      setToken(data.access_token);
      setUser(data.user);
      localStorage.setItem('sahayak_user', JSON.stringify(data.user));
      return true;
    } catch (err) {
      console.error('Login failed:', err.message);
      return false;
    }
  };

  /** Logout — POST /api/admin/auth/logout */
  const logout = async () => {
    try {
      await api.post('/admin/auth/logout', {});
    } catch (_) {}
    clearToken();
    setUser(null);
    localStorage.removeItem('sahayak_user');
  };

  /** Update local user profile data */
  const updateProfile = (updates) => {
    const updated = { ...user, ...updates };
    setUser(updated);
    localStorage.setItem('sahayak_user', JSON.stringify(updated));
  };

  const hasPermission = (permission) => {
    if (!user) return false;
    if (user.permissions?.includes('All')) return true;
    return user.permissions?.includes(permission) ?? false;
  };

  const value = {
    user,
    loading,
    login,
    logout,
    updateProfile,
    hasPermission,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

export default AuthContext;
