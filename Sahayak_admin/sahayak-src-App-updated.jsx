import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import FormsTemplates from './pages/FormsTemplates';
import Kiosks from './pages/Kiosks';
import Updates from './pages/Updates';
import Reports from './pages/Reports';
import Users from './pages/Users';
import Settings from './pages/Settings';

/**
 * Main App Component
 * Handles routing and authentication
 * Wraps protected routes with authentication check
 */
function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Route - Login */}
          <Route path="/login" element={<Login />} />

          {/* Protected Routes - Require Authentication */}
          <Route path="/" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="forms" element={<FormsTemplates />} />
            <Route path="kiosks" element={<Kiosks />} />
            <Route path="updates" element={<Updates />} />
            <Route path="reports" element={<Reports />} />
            <Route path="users" element={<Users />} />
            <Route path="settings" element={<Settings />} />
          </Route>

          {/* Catch all - redirect to dashboard if authenticated, login if not */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
