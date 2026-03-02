import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppState } from '../context/AppStateContext';
import { translations } from '../data/mockData';

/**
 * AuthenticationScreen - USER Authentication
 * 
 * This screen comes AFTER language selection and BEFORE OTP.
 * Users enter account number and 4-digit PIN.
 * 
 * Flow:
 * 1. User enters account number and PIN
 * 2. On confirm: navigate to /otp-verification
 * 3. OTP screen completes authentication
 */
const AuthenticationScreen = () => {
  const navigate = useNavigate();
  const { language, accountNumber, setAccountNumber, pin, setPin } = useAppState();
  const t = translations[language];

  const [currentField, setCurrentField] = useState('account'); // 'account' or 'pin'

  const handleKeypadPress = (digit) => {
    if (currentField === 'account') {
      if (accountNumber.length < 16) {
        setAccountNumber(accountNumber + digit);
      }
    } else {
      if (pin.length < 4) {
        setPin(pin + digit);
      }
    }
  };

  const handleClear = () => {
    if (currentField === 'account') {
      setAccountNumber(accountNumber.slice(0, -1));
    } else {
      setPin(pin.slice(0, -1));
    }
  };

  const handleFieldFocus = (field) => {
    setCurrentField(field);
  };

  const handleConfirm = () => {
    if (accountNumber.length >= 10 && pin.length === 4) {
      navigate('/otp-verification');
    }
  };

  const isConfirmEnabled = accountNumber.length >= 10 && pin.length === 4;

  return (
    <div className="kiosk-screen">
      {/* Header */}
      <div className="kiosk-header">
        <div className="kiosk-logo">
          <span style={{ fontSize: '36px' }}>🏦</span>
          <span>SAHAYAK</span>
        </div>
        <div className="kiosk-lang">
          {language === 'en' ? 'English' : language === 'hi' ? 'हिंदी' : 'தமிழ்'}
        </div>
      </div>

      {/* Main Content */}
      <div className="kiosk-content">
        <h1 className="kiosk-title">{t.authentication}</h1>
        <p className="kiosk-subtitle">{t.useKeypad}</p>

        <div style={{ width: '100%', maxWidth: '600px', marginBottom: '40px' }}>
          <div
            className={`input-field ${currentField === 'account' ? 'active' : ''}`}
            onClick={() => handleFieldFocus('account')}
            style={{
              marginBottom: '24px',
              padding: '24px',
              backgroundColor: currentField === 'account' ? '#e6e6ff' : '#f8f9fa',
              border: currentField === 'account' ? '4px solid #040466' : '3px solid #ddd',
              borderRadius: '16px',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            <div style={{ fontSize: '20px', color: '#666', marginBottom: '8px', fontWeight: '600' }}>
              {t.accountNumber}
            </div>
            <div style={{
              fontSize: '36px',
              fontWeight: 'bold',
              color: '#040466',
              letterSpacing: '2px',
              minHeight: '50px',
              display: 'flex',
              alignItems: 'center'
            }}>
              {accountNumber || '—'}
            </div>
          </div>

          <div
            className={`input-field ${currentField === 'pin' ? 'active' : ''}`}
            onClick={() => handleFieldFocus('pin')}
            style={{
              padding: '24px',
              backgroundColor: currentField === 'pin' ? '#e6e6ff' : '#f8f9fa',
              border: currentField === 'pin' ? '4px solid #040466' : '3px solid #ddd',
              borderRadius: '16px',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            <div style={{ fontSize: '20px', color: '#666', marginBottom: '8px', fontWeight: '600' }}>
              {t.pin}
            </div>
            <div style={{
              fontSize: '36px',
              fontWeight: 'bold',
              color: '#040466',
              letterSpacing: '8px',
              minHeight: '50px',
              display: 'flex',
              alignItems: 'center'
            }}>
              {pin ? '●'.repeat(pin.length) : '—'}
            </div>
          </div>
        </div>

        {/* Numeric Keypad */}
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
      </div>

      {/* Action Bar */}
      <div className="action-bar">
        <button
          onClick={() => navigate('/')}
          className="btn btn-outline btn-large"
        >
          ← {t.back}
        </button>
        <button
          onClick={handleConfirm}
          disabled={!isConfirmEnabled}
          className="btn btn-success btn-large"
          style={{ minWidth: '300px' }}
        >
          {t.confirm} →
        </button>
      </div>
    </div>
  );
};

export default AuthenticationScreen;
