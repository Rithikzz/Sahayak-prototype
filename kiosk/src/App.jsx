import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppStateProvider, useAppState } from './context/AppStateContext';

// Import screen components
import WelcomeScreen from './components/WelcomeScreen';
import AuthenticationScreen from './components/AuthenticationScreen';
import OTPVerificationScreen from './components/OTPVerificationScreen';
import AuthSuccessScreen from './components/AuthSuccessScreen';
import ModeSelectionScreen from './components/ModeSelectionScreen';
import ServiceSelectionScreen from './components/ServiceSelectionScreen';
import InputController from './components/InputController';
import FieldConfirmationScreen from './components/FieldConfirmationScreen';
import FormPreviewScreen from './components/FormPreviewScreen';
import VoiceVerificationScreen from './components/VoiceVerificationScreen';
import HumanVerificationScreen from './components/HumanVerificationScreen';
import SuccessScreen from './components/SuccessScreen';
import FormTemplatePicker from './components/FormTemplatePicker';
import ProtectedRoute from './components/ProtectedRoute';

import './App.css';

// OTA update notification banner (shown when a new version is available)
const OtaBanner = () => {
  const { pendingUpdate, setPendingUpdate } = useAppState();
  if (!pendingUpdate) return null;
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999,
      background: '#1e40af', color: '#fff', padding: '10px 20px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      fontSize: '14px',
    }}>
      <span>
        🔔 Update available: <strong>{pendingUpdate.update_name}</strong> (v{pendingUpdate.version}).
        This device will update on next restart.
      </span>
      <button
        onClick={() => setPendingUpdate(null)}
        style={{ background: 'none', border: '1px solid #fff', color: '#fff', borderRadius: '4px', padding: '2px 10px', cursor: 'pointer' }}
      >
        Dismiss
      </button>
    </div>
  );
};

/**
 * Main App Component - SAHAYAK Banking Kiosk System
 * 
 * Architecture:
 * - Uses React Router for navigation between screens
 * - Central state management via AppStateContext
 * - Protected routes requiring staff authentication
 * - Multi-language support: English, Hindi, Tamil
 * - Voice and touch input modes
 * 
 * Authentication Flow:
 * 1. Language Selection (Welcome Screen)
 * 2. User Authentication (Account + PIN)
 * 3. OTP Verification
 * 3. Mode Selection (Voice/Touch/Assisted) - PROTECTED
 * 4. Service Selection (Deposit/Withdrawal/etc) - PROTECTED
 * 5. Data Input & Confirmation - PROTECTED
 * 6. Verification & Success - PROTECTED
 * 
 * Key Features:
 * - Auth gating: User must complete account + OTP after language selection
 * - Voice mode simulation with listening states
 * - Form templates for different services
 * - Auto-reset after completion (clears auth state)
 * - One task per screen principle
 * - Large touch-friendly buttons (80px+)
 * - Bank-grade professional UI
 */
function App() {
  return (
    <AppStateProvider>
      <OtaBanner />
      <Router>
        <Routes>
          {/* Welcome screen - language selection (PUBLIC) */}
          <Route path="/" element={<WelcomeScreen />} />
          
          {/* User authentication - account + PIN (PUBLIC) */}
          <Route path="/authentication" element={<AuthenticationScreen />} />
          
          {/* Mode selection - voice/touch/assisted (PROTECTED) */}
          <Route 
            path="/mode-selection" 
            element={
              <ProtectedRoute>
                <ModeSelectionScreen />
              </ProtectedRoute>
            } 
          />
          
          {/* Service selection - deposit/withdrawal/etc (PROTECTED) */}
          <Route 
            path="/service-selection" 
            element={
              <ProtectedRoute>
                <ServiceSelectionScreen />
              </ProtectedRoute>
            } 
          />

          {/* Template picker - when category has multiple forms (PROTECTED) */}
          <Route 
            path="/template-picker" 
            element={
              <ProtectedRoute>
                <FormTemplatePicker />
              </ProtectedRoute>
            } 
          />

          {/* Input flow - one task per screen (PROTECTED) */}
          <Route 
            path="/input" 
            element={
              <ProtectedRoute>
                <InputController />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/field-confirmation" 
            element={
              <ProtectedRoute>
                <FieldConfirmationScreen />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/form-preview" 
            element={
              <ProtectedRoute>
                <FormPreviewScreen />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/voice-verification" 
            element={
              <ProtectedRoute>
                <VoiceVerificationScreen />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/human-verification" 
            element={
              <ProtectedRoute>
                <HumanVerificationScreen />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/success" 
            element={
              <ProtectedRoute>
                <SuccessScreen />
              </ProtectedRoute>
            } 
          />
          
          {/* Legacy routes (kept for backward compatibility) */}
          <Route path="/otp-verification" element={<OTPVerificationScreen />} />
          <Route path="/auth-success" element={<AuthSuccessScreen />} />
          
          {/* Catch-all redirect to welcome */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AppStateProvider>
  );
}

export default App;
