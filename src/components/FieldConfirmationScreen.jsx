import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppState } from '../context/AppStateContext';
import { translations, formTemplates } from '../data/mockData';

/**
 * FieldConfirmationScreen - Read-back confirmation for last entered field
 * User can confirm or re-record
 */
const FieldConfirmationScreen = () => {
  const navigate = useNavigate();
  const { 
    language, 
    serviceType,
    formData,
    currentFieldIndex,
    setCurrentFieldIndex
  } = useAppState();
  
  const t = translations[language];
  const template = formTemplates[serviceType];
  const fields = template?.fields || [];
  const lastField = fields[currentFieldIndex];
  const lastValue = formData[lastField?.id];

  const handleConfirm = () => {
    navigate('/form-preview');
  };

  const handleReRecord = () => {
    // Go back to input screen for this field
    navigate('/input');
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
        <h1 className="kiosk-title">{t.confirmDetailsTitle}</h1>

        <div className="confirmation-box">
          <div className="confirmation-text">
            <strong>{lastField?.label}:</strong>
            <br />
            <span style={{ fontSize: '42px', color: 'var(--primary-blue)', marginTop: '20px', display: 'block' }}>
              {lastValue}
            </span>
          </div>

          <div style={{ 
            backgroundColor: '#fff3cd', 
            padding: '20px', 
            borderRadius: '12px',
            marginTop: '30px',
            fontSize: '20px'
          }}>
            ℹ️ {t.confirmDetailsInfo}
          </div>
        </div>
      </div>

      <div className="action-bar">
        <button 
          className="btn btn-outline btn-large"
          onClick={handleReRecord}
        >
          ↻ {t.reRecord}
        </button>

        <button 
          className="btn btn-success btn-large"
          onClick={handleConfirm}
        >
          ✓ {t.confirm}
        </button>
      </div>
    </div>
  );
};

export default FieldConfirmationScreen;
