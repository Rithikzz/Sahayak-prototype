import React, { createContext, useContext, useState } from 'react';

// Central state management for kiosk application
const AppStateContext = createContext();

export const useAppState = () => {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error('useAppState must be used within AppStateProvider');
  }
  return context;
};

export const AppStateProvider = ({ children }) => {
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
  
  // Mock staff PIN for authentication (in production, this would be validated server-side)
  const MOCK_STAFF_PIN = '1234';
  
  // Validate staff PIN
  const validateStaffPin = (pin) => {
    return pin === MOCK_STAFF_PIN;
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
    clearAuthState,
    resetState
  };

  return (
    <AppStateContext.Provider value={value}>
      {children}
    </AppStateContext.Provider>
  );
};
