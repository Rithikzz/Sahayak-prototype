import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navGroups = [
    {
      label: 'Overview',
      items: [
        { name: 'Dashboard', path: '/dashboard', icon: '📊' },
        { name: 'Reports', path: '/reports', icon: '📈' },
      ],
    },
    {
      label: 'Kiosk Management',
      items: [
        { name: 'Kiosks', path: '/kiosks', icon: '🖥️' },
        { name: 'Staff Users', path: '/staff', icon: '🪪' },
        { name: 'OTA Updates', path: '/updates', icon: '🔄' },
      ],
    },
    {
      label: 'Forms',
      items: [
        { name: 'Forms & Templates', path: '/forms', icon: '📝' },
        { name: 'Submissions', path: '/submissions', icon: '📥' },
      ],
    },
    {
      label: 'Administration',
      items: [
        { name: 'Admin Users', path: '/users', icon: '👥' },
        { name: 'Settings', path: '/settings', icon: '⚙️' },
      ],
    },
  ];

  const roleColor = {
    'Super Admin': 'bg-red-100 text-red-700',
    'Regional Admin': 'bg-blue-100 text-blue-700',
    'Read-Only': 'bg-gray-100 text-gray-600',
  };

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-white border-r border-gray-200 flex flex-col overflow-hidden">
      {/* Logo */}
      <div className="px-5 py-4 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
            S
          </div>
          <div>
            <h1 className="text-base font-bold text-gray-900 leading-tight">Sahayak</h1>
            <p className="text-xs text-gray-500">Admin Portal</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-3">
        {navGroups.map((group) => (
          <div key={group.label} className="mb-4">
            <p className="px-3 mb-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              {group.label}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((item) => (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    className={({ isActive }) =>
                      `flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors text-sm ${
                        isActive
                          ? 'bg-blue-50 text-blue-700 font-medium'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`
                    }
                  >
                    <span className="text-base w-5 text-center">{item.icon}</span>
                    <span>{item.name}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      {/* User Info + Logout */}
      <div className="flex-shrink-0 border-t border-gray-200 p-3">
        <div className="bg-gray-50 rounded-lg p-3 mb-2">
          <div className="flex items-center space-x-2 mb-1.5">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
              {(user?.name || 'A').charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{user?.name || 'Admin'}</p>
              <p className="text-xs text-gray-500 truncate">{user?.email || ''}</p>
            </div>
          </div>
          {user?.role && (
            <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${roleColor[user.role] || 'bg-gray-100 text-gray-600'}`}>
              {user.role}
            </span>
          )}
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center space-x-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <span>🚪</span>
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
