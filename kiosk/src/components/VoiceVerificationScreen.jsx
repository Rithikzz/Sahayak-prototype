import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppState } from '../context/AppStateContext';
import { translations } from '../data/mockData';

/**
 * VoiceVerificationScreen - Final voice confirmation
 * Simulates IVR-style confirmation before human verification
 */
const VoiceVerificationScreen = () => {
  const navigate = useNavigate();
  const { 
    language, 
    formData
  } = useAppState();
  
  const t = translations[language];

  const [confirmPressed, setConfirmPressed] = useState(false);

  const handleConfirm = () => {
    setConfirmPressed(true);
    // Simulate processing delay
    setTimeout(() => {
      navigate('/human-verification');
    }, 1500);
  };

  const handleEdit = () => {
    navigate('/input');
  };

  const formatAmountVoice = (amount) => {
    const normalized = String(amount || '').replace(/[^0-9]/g, '');
    if (!normalized) {
      return t.amountInWordsFallback;
    }
    if (normalized === '5000') {
      return t.amountInWords5000;
    }
    return `${normalized} ${t.rupees}`;
  };

  const generateConfirmationText = () => {
    const nameValue = formData.fullName || formData.depositorName || formData.accountHolderName || 'Ramesh Kumar';
    const amountValue = formData.amount || '5000';
    const lines = [
      `${t.yourNameIs} ${nameValue}.`,
      `${t.amountIs} ${formatAmountVoice(amountValue)}.`,
      t.pressToConfirm
    ];

    return lines.join('\n');
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
        <h1 className="kiosk-title">{t.voiceConfirmTitle}</h1>

        <div style={{ 
          backgroundColor: '#f8f9fa', 
          padding: '40px', 
          borderRadius: '16px',
          maxWidth: '900px',
          marginBottom: '40px'
        }}>
          <div style={{ 
            fontSize: '28px', 
            lineHeight: '1.8',
            color: 'var(--text-dark)',
            marginBottom: '30px',
            whiteSpace: 'pre-line'
          }}>
            {generateConfirmationText()}
          </div>

          <div style={{ 
            backgroundColor: '#fff3cd', 
            padding: '24px', 
            borderRadius: '12px',
            fontSize: '24px',
            textAlign: 'center',
            border: '2px solid #ffc107'
          }}>
            {t.confirmIfCorrect}
            <br />
            {t.editIfChange}
          </div>
        </div>

        {confirmPressed && (
          <div className="status-indicator">
            <div className="spinner"></div>
            <div className="status-message">Processing your request...</div>
          </div>
        )}
      </div>

      {!confirmPressed && (
        <div className="action-bar">
          <button 
            className="btn btn-outline btn-large"
            onClick={handleEdit}
          >
            ✏️ {t.edit}
          </button>

          <button 
            className="btn btn-success btn-large"
            onClick={handleConfirm}
            style={{ minWidth: '350px' }}
          >
            ✓ {t.confirm}
          </button>
        </div>
      )}
    </div>
  );
};

export default VoiceVerificationScreen;
