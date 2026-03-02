import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';

// Central state management for kiosk application
const AppStateContext = createContext();

// ── Device ID ─────────────────────────────────────────────────────────────────
const getDeviceId = () => {
  let id = localStorage.getItem('sahayak_device_id');
  if (!id) {
    id = 'kiosk-' + Math.random().toString(36).slice(2, 10) + '-' + Date.now();
    localStorage.setItem('sahayak_device_id', id);
  }
  return id;
};

const KIOSK_VERSION = '1.0.0';

export const useAppState = () => {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error('useAppState must be used within AppStateProvider');
  }
  return context;
};

export const AppStateProvider = ({ children }) => {
  // Global App configuration data
  const [formTemplates, setFormTemplates] = useState({});
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);

  // Fetch templates from API on mount
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const response = await fetch('/api/forms/templates');
        if (response.ok) {
          const data = await response.json();
          setFormTemplates(data);
        } else {
          console.error("Failed to fetch templates from backend");
        }
      } catch (err) {
        console.error("Error connecting to backend API:", err);
      } finally {
        setIsLoadingTemplates(false);
      }
    };
    fetchTemplates();
  }, []);

  // Language selection
  const [language, setLanguage] = useState('en');

  // Account authentication data
  const [accountNumber, setAccountNumber] = useState('');
  const [pin, setPin] = useState('');

  // OTP data
  const [otp, setOtp] = useState('');
  const [otpTimer, setOtpTimer] = useState(60);
  const [canResendOtp, setCanResendOtp] = useState(false);

  // Input mode: 'voice', 'touch', 'assisted'
  const [inputMode, setInputMode] = useState(null);

  // Selected service: 'deposit', 'withdrawal', 'accountOpening', 'addressUpdate'
  const [serviceType, setServiceType] = useState(null);

  // Current form category (for new 9-category system)
  const [currentFormCategory, setCurrentFormCategory] = useState(null);

  // Form data collected from user
  const [formData, setFormData] = useState({});

  // Current field being filled (for voice/touch input)
  const [currentFieldIndex, setCurrentFieldIndex] = useState(0);

  // Verification status
  const [verificationStatus, setVerificationStatus] = useState('pending'); // 'pending', 'approved', 'rejected'

  // Staff PIN for approval
  const [staffPin, setStaffPin] = useState('');

  // Authentication state - staff must login after language selection
  const [authPassed, setAuthPassed] = useState(false);
  const [staffLoginPin, setStaffLoginPin] = useState('');

  // Token for backend requests
  const [authToken, setAuthToken] = useState(localStorage.getItem('sahayak_token') || null);
  const [staffName, setStaffName] = useState(localStorage.getItem('sahayak_staff_name') || '');

  // ── OTA & Heartbeat ─────────────────────────────────────────────────────────
  const [deviceId] = useState(getDeviceId);
  const [formsTodayCount, setFormsTodayCount] = useState(0);
  const [pendingUpdate, setPendingUpdate] = useState(null); // { version, update_name }
  const heartbeatRef = useRef(null);

  // Check for pending OTA update once on mount
  useEffect(() => {
    const checkUpdate = async () => {
      try {
        const res = await fetch(`/api/kiosk/pending-update?device_id=${encodeURIComponent(deviceId)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.has_update) setPendingUpdate(data);
        }
      } catch (_) { /* non-critical */ }
    };
    checkUpdate();
  }, [deviceId]);

  // Send heartbeat every 60 seconds while staff is logged in
  const sendHeartbeat = useCallback(async () => {
    try {
      await fetch('/api/kiosk/heartbeat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          device_id: deviceId,
          installed_version: KIOSK_VERSION,
          forms_today: formsTodayCount,
          ip_address: null,
        }),
      });
    } catch (_) { /* non-critical */ }
  }, [deviceId, formsTodayCount]);

  useEffect(() => {
    if (authPassed) {
      sendHeartbeat(); // immediate on login
      heartbeatRef.current = setInterval(sendHeartbeat, 60_000);
    } else {
      clearInterval(heartbeatRef.current);
    }
    return () => clearInterval(heartbeatRef.current);
  }, [authPassed, sendHeartbeat]);

  // Increment forms counter after each successful submission
  const incrementFormsToday = useCallback(() => {
    setFormsTodayCount(c => c + 1);
  }, []);

  // Validate staff PIN against backend API
  const validateStaffPin = async (pin) => {
    try {
      const response = await fetch('/api/auth/staff-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      });

      if (response.ok) {
        const data = await response.json();
        setAuthToken(data.access_token);
        setStaffName(data.staff_name);
        localStorage.setItem('sahayak_token', data.access_token);
        localStorage.setItem('sahayak_staff_name', data.staff_name);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  // Update a single form field
  const updateFormField = (fieldId, value) => {
    setFormData(prev => ({
      ...prev,
      [fieldId]: value
    }));
  };

  // Clear authentication state
  const clearAuthState = () => {
    setAuthPassed(false);
    setStaffLoginPin('');
    setAuthToken(null);
    setStaffName('');
    localStorage.removeItem('sahayak_token');
    localStorage.removeItem('sahayak_staff_name');
  };

  // Reset entire state (for new session)
  const resetState = () => {
    setLanguage('en'); // Reset to default language
    setAccountNumber('');
    setPin('');
    setOtp('');
    setOtpTimer(60);
    setCanResendOtp(false);
    setInputMode(null);
    setServiceType(null);
    setCurrentFormCategory(null);
    setFormData({});
    setCurrentFieldIndex(0);
    setVerificationStatus('pending');
    setStaffPin('');
    clearAuthState();
  };

  const value = {
    language,
    setLanguage,
    accountNumber,
    setAccountNumber,
    pin,
    setPin,
    otp,
    setOtp,
    otpTimer,
    setOtpTimer,
    canResendOtp,
    setCanResendOtp,
    inputMode,
    setInputMode,
    serviceType,
    setServiceType,
    currentFormCategory,
    setCurrentFormCategory,
    formData,
    setFormData,
    updateFormField,
    currentFieldIndex,
    setCurrentFieldIndex,
    verificationStatus,
    setVerificationStatus,
    staffPin,
    setStaffPin,
    authPassed,
    setAuthPassed,
    staffLoginPin,
    setStaffLoginPin,
    validateStaffPin,
    authToken,
    staffName,
    clearAuthState,
    resetState,
    formTemplates,
    isLoadingTemplates,
    // OTA / heartbeat
    deviceId,
    pendingUpdate,
    setPendingUpdate,
    formsTodayCount,
    incrementFormsToday,
  };

  return (
    <AppStateContext.Provider value={value}>
      {children}
    </AppStateContext.Provider>
  );
};
