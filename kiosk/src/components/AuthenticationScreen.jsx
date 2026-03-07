import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppState } from '../context/AppStateContext';
import { translations } from '../data/mockData';

/**
 * AuthenticationScreen - Customer Authentication
 *
 * Users enter account number and 4-digit PIN.
 * On confirm: calls /api/auth/customer-verify, pre-fills known fields,
 * then navigates directly to /mode-selection (no OTP step needed).
 */
const AuthenticationScreen = () => {
  const navigate = useNavigate();
  const {
    language, accountNumber, setAccountNumber,
    pin, setPin, verifyCustomer, setAuthPassed,
  } = useAppState();
  const t = translations[language];

  const [currentField, setCurrentField] = useState('account'); // 'account' or 'pin'
  const [verifying, setVerifying] = useState(false);
  const [authError, setAuthError] = useState('');

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

  const handleConfirm = async () => {
    if (accountNumber.length < 10 || pin.length !== 4) return;
    setVerifying(true);
    setAuthError('');
    const result = await verifyCustomer(accountNumber, pin);
    setVerifying(false);
    if (result.success) {
      setAuthPassed(true);
      navigate('/mode-selection');
    } else {
      setAuthError(result.error || 'Authentication failed. Please check your account number and PIN.');
    }
  };

  const isConfirmEnabled = accountNumber.length >= 10 && pin.length === 4 && !verifying;

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

        {/* Demo credentials banner */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '24px',
          padding: '16px 28px',
          marginBottom: '28px',
          backgroundColor: '#fffbeb',
          border: '2px dashed #f6a623',
          borderRadius: '14px',
          maxWidth: '600px',
          width: '100%',
        }}>
          <span style={{ fontSize: '28px' }}>🧪</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '16px', fontWeight: '700', color: '#92400e', marginBottom: '4px' }}>
              Demo Credentials
            </div>
            <div style={{ fontSize: '15px', color: '#78350f', fontFamily: 'monospace' }}>
              Account: <strong>1234567890123456</strong> &nbsp;|&nbsp; PIN: <strong>1234</strong>
            </div>
          </div>
          <button
            onClick={() => {
              setAccountNumber('1234567890123456');
              setPin('1234');
            }}
            style={{
              padding: '10px 20px',
              fontSize: '16px',
              fontWeight: '700',
              backgroundColor: '#f6a623',
              color: '#fff',
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            Auto-fill
          </button>
        </div>

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

        {/* Error message */}
        {authError && (
          <div style={{
            marginBottom: '16px',
            padding: '16px 24px',
            backgroundColor: '#ffe8e8',
            border: '2px solid #e53e3e',
            borderRadius: '12px',
            color: '#c53030',
            fontSize: '18px',
            fontWeight: '600',
            maxWidth: '600px',
            width: '100%',
            textAlign: 'center',
          }}>
            {authError}
          </div>
        )}

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
          {verifying ? 'Verifying...' : `${t.confirm} →`}
        </button>
      </div>
    </div>
  );
};

export default AuthenticationScreen;
