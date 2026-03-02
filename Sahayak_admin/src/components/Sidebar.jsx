import { NavLink } from 'react-router-dom';

/**
 * Sidebar Component
 * Persistent left navigation for the admin portal
 * Contains all main navigation items as per requirements
 */
const Sidebar = () => {
  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: '📊' },
    { name: 'Forms & Templates', path: '/forms', icon: '📝' },
    { name: 'Kiosks', path: '/kiosks', icon: '🖥️' },
    { name: 'Updates', path: '/updates', icon: '🔄' },
    { name: 'Reports', path: '/reports', icon: '📈' },
    { name: 'Users', path: '/users', icon: '👥' },
    { name: 'Settings', path: '/settings', icon: '⚙️' }
  ];

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-white border-r border-gray-200 overflow-y-auto">
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
      <nav className="px-3 py-4">
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

      {/* System Status */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-gray-50">
        <div className="text-xs text-gray-600">
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
