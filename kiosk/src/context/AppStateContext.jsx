import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import api from '../utils/apiClient';

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
        const data = await api.get('/forms/templates');
        setFormTemplates(data);
      } catch (err) {
        console.error('Error connecting to backend API:', err);
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

  // Customer profile (set after successful customer-verify)
  const [customerProfile, setCustomerProfile] = useState(null);

  // Selected form template DB id (for PDF generation)
  const [selectedFormTemplateId, setSelectedFormTemplateId] = useState(null);

  // Wrap setServiceType so we also capture the template ID from formTemplates
  // Always auto-selects the most recently published template (highest id) —
  // no template picker screen is shown.
  const selectServiceType = (type) => {
    setServiceType(type);
    const tplArr = formTemplates[type];
    if (Array.isArray(tplArr) && tplArr.length > 0) {
      // Pick the template with the highest id (most recently created/published)
      const latest = tplArr.reduce((best, t) => t.id > best.id ? t : best, tplArr[0]);
      setSelectedFormTemplateId(latest.id);
    } else if (tplArr && !Array.isArray(tplArr) && tplArr.id) {
      setSelectedFormTemplateId(tplArr.id);
    }
  };

  // Select a specific template by id (used by FormTemplatePicker)
  const selectTemplate = (templateId) => {
    setSelectedFormTemplateId(templateId);
  };

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
        const data = await api.get(`/kiosk/pending-update?device_id=${encodeURIComponent(deviceId)}`);
        if (data.has_update) setPendingUpdate(data);
      } catch (_) { /* non-critical */ }
    };
    checkUpdate();
  }, [deviceId]);

  // Send heartbeat every 60 seconds while staff is logged in
  const sendHeartbeat = useCallback(async () => {
    try {
      await api.post('/kiosk/heartbeat', {
        device_id: deviceId,
        installed_version: KIOSK_VERSION,
        forms_today: formsTodayCount,
        ip_address: null,
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
      const data = await api.post('/auth/staff-login', { pin });
      setAuthToken(data.access_token);
      setStaffName(data.staff_name);
      localStorage.setItem('sahayak_token', data.access_token);
      localStorage.setItem('sahayak_staff_name', data.staff_name);
      return true;
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

  // Pre-fill formData with known customer profile fields
  const prefillFromProfile = (profile) => {
    if (!profile) return;
    setFormData(prev => ({
      ...prev,
      // Map profile keys to canonical form field IDs
      fullName: prev.fullName || profile.name || '',
      depositorName: prev.depositorName || profile.name || '',
      accountNumber: prev.accountNumber || profile.account_number || '',
      phoneNumber: prev.phoneNumber || profile.phone_number || '',
      emailId: prev.emailId || profile.email || '',
      dateOfBirth: prev.dateOfBirth || profile.date_of_birth || '',
      panNumber: prev.panNumber || profile.pan_number || '',
      aadharNumber: prev.aadharNumber || profile.aadhaar_number || '',
      address: prev.address || profile.address || '',
    }));
  };

  // Verify customer by account number + PIN; pre-fill form data on success
  const verifyCustomer = async (acctNumber, customerPin) => {
    try {
      const profile = await api.post('/auth/customer-verify', {
        account_number: acctNumber,
        pin: customerPin,
      });
      setCustomerProfile(profile);
      prefillFromProfile(profile);
      return { success: true, profile };
    } catch (error) {
      console.error('Customer verify error:', error);
      return { success: false, error: error.message || 'Verification failed' };
    }
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
    setCustomerProfile(null);
    setSelectedFormTemplateId(null);
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
    // Customer auth
    customerProfile,
    setCustomerProfile,
    verifyCustomer,
    // Form template selection
    selectedFormTemplateId,
    selectServiceType,
    selectTemplate,
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
