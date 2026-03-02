import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import FormsTemplates from './pages/FormsTemplates';
import Kiosks from './pages/Kiosks';
import Updates from './pages/Updates';
import Reports from './pages/Reports';
import Users from './pages/Users';
import Settings from './pages/Settings';
import Staff from './pages/Staff';
import Submissions from './pages/Submissions';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="forms" element={<FormsTemplates />} />
            <Route path="kiosks" element={<Kiosks />} />
            <Route path="staff" element={<Staff />} />
            <Route path="updates" element={<Updates />} />
            <Route path="reports" element={<Reports />} />
            <Route path="submissions" element={<Submissions />} />
            <Route path="users" element={<Users />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
