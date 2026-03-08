import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppState } from '../context/AppStateContext';
import { translations } from '../data/mockData';
import api from '../utils/apiClient';

/**
 * HumanVerificationScreen - Staff approval stage
 * Bank staff enters PIN to approve or reject the form
 */
const HumanVerificationScreen = () => {
  const navigate = useNavigate();
  const {
    language,
    setVerificationStatus,
    formData,
    serviceType,
    accountNumber,
    selectedFormTemplateId,
    authToken
  } = useAppState();

  const t = translations[language];
  const [pin, setPin] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePinInput = (digit) => {
    if (pin.length < 4) {
      setPin(prev => prev + digit);
    }
  };

  const handleClear = () => {
    setPin('');
  };

  const handleSubmit = async () => {
    if (pin.length !== 4) {
      alert('Please enter 4-digit PIN');
      return;
    }

    setIsProcessing(true);

    try {
      const payload = {
        service_type: serviceType || 'unknown',
        form_data: formData,
        staff_pin: pin,
        account_number: accountNumber || formData.accountNumber,
        form_template_id: selectedFormTemplateId || null,
      };

      await api.post('/forms/submit', payload);
      setVerificationStatus('approved');
      navigate('/success');
    } catch (err) {
      console.error('Submission error:', err);
      setVerificationStatus('rejected');
      alert(`Verification Failed: ${err.message || 'Invalid PIN'}`);
      setPin('');
      setIsProcessing(false);
    }
  };

  return (
    <div className="kiosk-screen">
      <div className="kiosk-header">
        <div className="kiosk-logo">
          <span style={{ fontSize: '36px' }}>🏦</span>
          <span>SAHAYAK</span>
        </div>
        <div className="kiosk-lang">
          {language === 'en' ? 'English' : language === 'hi' ? 'हिंदी' : 'தமிழ்'}
        </div>
      </div>

      <div className="kiosk-content">
        <h1 className="kiosk-title" style={{ marginBottom: '40px' }}>
          {t.staffVerificationTitle}
        </h1>

        <div className="status-indicator" style={{ marginBottom: '50px' }}>
          <div style={{ fontSize: '80px', marginBottom: '24px' }}>👨‍💼</div>
          <div className="status-message" style={{ fontSize: '28px' }}>
            {t.waitingStaff}
          </div>
        </div>

        <div style={{
          backgroundColor: '#f8f9fa',
          padding: '40px',
          borderRadius: '16px',
          maxWidth: '600px'
        }}>
          <div style={{
            fontSize: '24px',
            marginBottom: '30px',
            textAlign: 'center',
            color: '#666'
          }}>
            {t.staffPinPrompt}
          </div>

          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '20px',
            marginBottom: '30px'
          }}>
            {[0, 1, 2, 3].map(i => (
              <div
                key={i}
                style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  backgroundColor: i < pin.length ? 'var(--primary-blue)' : '#ddd',
                  border: '3px solid var(--primary-blue)'
                }}
              />
            ))}
          </div>

          <div className="keypad-grid" style={{ marginBottom: '20px' }}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
              <button
                key={num}
                className="btn btn-outline keypad-btn"
                onClick={() => handlePinInput(num.toString())}
                disabled={isProcessing || pin.length >= 4}
                style={{ fontSize: '32px' }}
              >
                {num}
              </button>
            ))}
            <button
              className="btn btn-secondary keypad-btn"
              onClick={handleClear}
              disabled={isProcessing}
            >
              Clear
            </button>
            <button
              className="btn btn-outline keypad-btn"
              onClick={() => handlePinInput('0')}
              disabled={isProcessing || pin.length >= 4}
              style={{ fontSize: '32px' }}
            >
              0
            </button>
            <button
              className="btn btn-success keypad-btn"
              onClick={handleSubmit}
              disabled={isProcessing || pin.length !== 4}
              style={{ fontSize: '24px' }}
            >
              ✓
            </button>
          </div>

          {isProcessing && (
            <div className="status-indicator" style={{ marginTop: '30px' }}>
              <div className="spinner" style={{ width: '50px', height: '50px', borderWidth: '5px' }}></div>
              <div style={{ fontSize: '20px', marginTop: '16px' }}>Verifying...</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HumanVerificationScreen;
