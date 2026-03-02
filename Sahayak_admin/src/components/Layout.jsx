import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

/**
 * Layout Component
 * Main layout wrapper with persistent sidebar
 * All pages are rendered in the main content area
 */
const Layout = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      
      {/* Main Content Area */}
      <main className="ml-64 min-h-screen">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
