import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppState } from '../context/AppStateContext';
import { translations } from '../data/mockData';

/**
 * OTPVerificationScreen Component
 * 
 * Features:
 * - OTP input (numeric, 6 digits)
 * - Message indicating OTP sent to registered mobile
 * - Countdown timer (60 seconds)
 * - Resend OTP option (enabled after timer expires)
 * - All text in selected language
 * - On-screen numeric keypad
 * - High contrast, accessibility-friendly design
 */
const OTPVerificationScreen = () => {
  const navigate = useNavigate();
  const { 
    language, 
    otp, 
    setOtp, 
    otpTimer, 
    setOtpTimer, 
    canResendOtp, 
    setCanResendOtp,
    setAuthPassed
  } = useAppState();
  const t = translations[language];

  const [isVerifying, setIsVerifying] = useState(false);

  // Countdown timer effect
  useEffect(() => {
    if (otpTimer > 0) {
      const timer = setTimeout(() => {
        setOtpTimer(otpTimer - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResendOtp(true);
    }
  }, [otpTimer, setOtpTimer, setCanResendOtp]);

  // Handle keypad button press
  const handleKeypadPress = (digit) => {
    if (otp.length < 6) {
      const newOtp = otp + digit;
      setOtp(newOtp);
      
      // Auto-verify when 6 digits entered
      if (newOtp.length === 6) {
        handleVerify(newOtp);
      }
    }
  };

  // Handle clear/backspace
  const handleClear = () => {
    setOtp(otp.slice(0, -1));
  };

  // Handle OTP verification
  const handleVerify = (otpValue = otp) => {
    if (otpValue.length === 6) {
      setIsVerifying(true);
      
      // Simulate verification delay
      setTimeout(() => {
        setIsVerifying(false);
        setAuthPassed(true);
        // Navigate to auth success screen
        navigate('/auth-success');
      }, 2000);
    }
  };

  // Handle resend OTP
  const handleResendOtp = () => {
    if (canResendOtp) {
      setOtp('');
      setOtpTimer(60);
      setCanResendOtp(false);
    }
  };

  // Handle back navigation
  const handleBack = () => {
    setOtp('');
    setOtpTimer(60);
    setCanResendOtp(false);
    navigate('/authentication');
  };

  return (
    <div className="kiosk-screen">
      {/* Header */}
      <div className="kiosk-header">
        <div className="kiosk-logo">
          🏦 SAHAYAK BANK
        </div>
        <div className="kiosk-lang">
          {language === 'en' ? 'English' : language === 'hi' ? 'हिंदी' : 'தமிழ்'}
        </div>
      </div>

      {/* Main Content */}
      <div className="kiosk-content">
        <h1 className="kiosk-title">{t.otpVerification}</h1>
        
        {/* OTP Sent Message */}
        <div style={{
          backgroundColor: '#e6f7ff',
          border: '3px solid #0066cc',
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '32px',
          maxWidth: '600px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '28px', color: '#0066cc', lineHeight: '1.6' }}>
            📱 {t.otpSentTo}
          </div>
        </div>

        {/* OTP Input Display */}
        <div style={{
          backgroundColor: '#f8f9fa',
          border: '4px solid #040466',
          borderRadius: '16px',
          padding: '32px',
          marginBottom: '24px',
          maxWidth: '600px',
          width: '100%'
        }}>
          <div style={{ fontSize: '24px', color: '#666', marginBottom: '16px', fontWeight: '600', textAlign: 'center' }}>
            {t.enterOtp}
          </div>
          <div style={{
            fontSize: '52px',
            fontWeight: 'bold',
            color: '#040466',
            letterSpacing: '16px',
            minHeight: '80px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'monospace'
          }}>
            {otp.padEnd(6, '—').split('').join(' ')}
          </div>
        </div>

        {/* Timer and Resend */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '24px',
          marginBottom: '40px',
          flexWrap: 'wrap',
          justifyContent: 'center'
        }}>
          {otpTimer > 0 ? (
            <div style={{
              fontSize: '24px',
              color: '#666',
              backgroundColor: '#f8f9fa',
              padding: '16px 32px',
              borderRadius: '12px',
              border: '2px solid #ddd'
            }}>
              ⏱️ {t.timeRemaining}: <strong style={{ color: '#040466' }}>{otpTimer}</strong> {t.seconds}
            </div>
          ) : (
            <button
              onClick={handleResendOtp}
              className="btn btn-secondary"
              style={{
                fontSize: '24px',
                padding: '16px 32px'
              }}
            >
              🔄 {t.resendOtp}
            </button>
          )}
        </div>

        {/* Verifying Status */}
        {isVerifying && (
          <div className="status-indicator" style={{ marginBottom: '32px' }}>
            <div className="spinner"></div>
            <div className="status-message">{t.verifying}</div>
          </div>
        )}

        {/* Numeric Keypad */}
        {!isVerifying && (
          <div className="keypad-container">
            <div className="keypad-grid" style={{ gap: '16px' }}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
                <button
                  key={digit}
                  onClick={() => handleKeypadPress(digit.toString())}
                  className="btn btn-primary keypad-btn"
                  style={{
                    minWidth: '120px',
                    minHeight: '120px',
                    fontSize: '42px'
                  }}
                >
                  {digit}
                </button>
              ))}
              <button
                onClick={handleClear}
                className="btn btn-secondary keypad-btn"
                style={{
                  minWidth: '120px',
                  minHeight: '120px',
                  fontSize: '32px'
                }}
              >
                ⌫
              </button>
              <button
                onClick={() => handleKeypadPress('0')}
                className="btn btn-primary keypad-btn"
                style={{
                  minWidth: '120px',
                  minHeight: '120px',
                  fontSize: '42px'
                }}
              >
                0
              </button>
              <button
                onClick={handleClear}
                className="btn btn-outline keypad-btn"
                style={{
                  minWidth: '120px',
                  minHeight: '120px',
                  fontSize: '24px'
                }}
              >
                {t.clear}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Action Bar */}
      {!isVerifying && (
        <div className="action-bar">
          <button
            onClick={handleBack}
            className="btn btn-outline btn-large"
          >
            ← {t.back}
          </button>
        </div>
      )}
    </div>
  );
};

export default OTPVerificationScreen;
