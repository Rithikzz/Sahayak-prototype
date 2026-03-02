import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

/**
 * Sidebar Component
 * Persistent left navigation for the admin portal
 * Contains all main navigation items as per requirements
 * Now includes user info and logout functionality
 */
const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: '📊' },
    { name: 'Forms & Templates', path: '/forms', icon: '📝' },
    { name: 'Kiosks', path: '/kiosks', icon: '🖥️' },
    { name: 'Updates', path: '/updates', icon: '🔄' },
    { name: 'Reports', path: '/reports', icon: '📈' },
    { name: 'Users', path: '/users', icon: '👥' },
    { name: 'Settings', path: '/settings', icon: '⚙️' }
  ];

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      logout();
      navigate('/login');
    }
  };

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-white border-r border-gray-200 overflow-y-auto flex flex-col">
      {/* Logo and Header */}
      <div className="px-6 py-5 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
            S
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">Sahayak</h1>
            <p className="text-xs text-gray-500">Admin Portal</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="px-3 py-4 flex-1">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors duration-150 ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`
                }
              >
                <span className="text-xl">{item.icon}</span>
                <span className="text-sm">{item.name}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* User Info Section */}
      <div className="border-t border-gray-200 p-4">
        {user && (
          <div className="mb-3">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium text-sm">
                {user.avatar}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user.name}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {user.role}
                </p>
              </div>
            </div>
            
            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors duration-150 text-sm font-medium"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Logout</span>
            </button>
          </div>
        )}
        
        {/* System Status */}
        <div className="text-xs text-gray-600 bg-gray-50 rounded-lg p-2">
          <div className="flex items-center justify-between mb-1">
            <span>System Status</span>
            <span className="inline-flex items-center">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-1.5"></span>
              <span className="text-green-600 font-medium">Online</span>
            </span>
          </div>
          <div className="text-gray-500">
            Last sync: 2 min ago
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
