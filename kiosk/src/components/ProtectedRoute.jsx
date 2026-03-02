import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAppState } from '../context/AppStateContext';

/**
 * ProtectedRoute - Guards routes that require authentication
 * 
 * Prevents access to service flows unless user has completed auth + OTP.
 * Redirects to authentication screen if not authenticated.
 * 
 * Usage:
 * <Route path="/mode-selection" element={<ProtectedRoute><ModeSelectionScreen /></ProtectedRoute>} />
 */
const ProtectedRoute = ({ children }) => {
  const { authPassed } = useAppState();

  if (!authPassed) {
    // Redirect to authentication if not logged in
    return <Navigate to="/authentication" replace />;
  }

  return children;
};

export default ProtectedRoute;
