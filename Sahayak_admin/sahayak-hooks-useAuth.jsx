import { createContext, useContext, useState, useEffect } from 'react';

/**
 * Authentication Context
 * Manages user authentication state across the application
 * Mock authentication - stores state in localStorage
 */

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Mock user database (in production, this would be in backend)
  const mockUsers = [
    {
      id: 'U001',
      name: 'Rajesh Kumar',
      email: 'rajesh.kumar@bank.com',
      password: 'admin123', // In production, this would be hashed
      role: 'Super Admin',
      region: 'All Regions',
      permissions: ['All'],
      avatar: 'RK'
    },
    {
      id: 'U002',
      name: 'Priya Sharma',
      email: 'priya.sharma@bank.com',
      password: 'admin123',
      role: 'Regional Admin',
      region: 'South',
      permissions: ['Kiosks', 'Forms', 'Reports'],
      avatar: 'PS'
    },
    {
      id: 'U003',
      name: 'Amit Patel',
      email: 'amit.patel@bank.com',
      password: 'admin123',
      role: 'Regional Admin',
      region: 'West',
      permissions: ['Kiosks', 'Forms', 'Reports'],
      avatar: 'AP'
    },
    {
      id: 'U004',
      name: 'Sneha Reddy',
      email: 'sneha.reddy@bank.com',
      password: 'admin123',
      role: 'Read-Only',
      region: 'South',
      permissions: ['Reports'],
      avatar: 'SR'
    },
    {
      id: 'U005',
      name: 'Vikram Singh',
      email: 'vikram.singh@bank.com',
      password: 'admin123',
      role: 'Regional Admin',
      region: 'North',
      permissions: ['Kiosks', 'Forms', 'Reports'],
      avatar: 'VS'
    }
  ];

  // Check for existing session on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('sahayak_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Failed to parse stored user:', error);
        localStorage.removeItem('sahayak_user');
      }
    }
    setLoading(false);
  }, []);

  // Login function
  const login = (email, password) => {
    const foundUser = mockUsers.find(
      u => u.email === email && u.password === password
    );

    if (foundUser) {
      // Don't store password in localStorage
      const { password: _, ...userWithoutPassword } = foundUser;
      setUser(userWithoutPassword);
      localStorage.setItem('sahayak_user', JSON.stringify(userWithoutPassword));
      
      // Log the login action (in production, send to backend)
      console.log('User logged in:', {
        user: userWithoutPassword.email,
        timestamp: new Date().toISOString()
      });
      
      return true;
    }
    
    return false;
  };

  // Logout function
  const logout = () => {
    setUser(null);
    localStorage.removeItem('sahayak_user');
    
    // Log the logout action
    console.log('User logged out:', {
      timestamp: new Date().toISOString()
    });
  };

  // Check if user has specific permission
  const hasPermission = (permission) => {
    if (!user) return false;
    if (user.permissions.includes('All')) return true;
    return user.permissions.includes(permission);
  };

  const value = {
    user,
    login,
    logout,
    hasPermission,
    loading,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
