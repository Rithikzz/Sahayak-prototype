import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppState } from '../context/AppStateContext';
import { translations, formTemplates } from '../data/mockData';

/**
 * FormPreviewScreen - Read-only preview of complete form
 * Allows zoom and final review before verification
 */
const FormPreviewScreen = () => {
  const navigate = useNavigate();
  const { 
    language, 
    serviceType,
    formData
  } = useAppState();
  
  const t = translations[language];
  const template = formTemplates[serviceType];
  const fields = template?.fields || [];

  const [zoom, setZoom] = useState(100);

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 20, 200));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 20, 80));
  };

  const handleProceed = () => {
    navigate('/voice-verification');
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
        <h1 className="kiosk-title">{t.preview}</h1>

        <div style={{ marginBottom: '20px', display: 'flex', gap: '16px' }}>
          <button 
            className="btn btn-outline"
            onClick={handleZoomOut}
            style={{ minHeight: '60px', fontSize: '24px' }}
          >
            🔍 −
          </button>
          <span style={{ fontSize: '24px', display: 'flex', alignItems: 'center' }}>
            {zoom}%
          </span>
          <button 
            className="btn btn-outline"
            onClick={handleZoomIn}
            style={{ minHeight: '60px', fontSize: '24px' }}
          >
            🔍 +
          </button>
        </div>

        <div 
          className="form-preview"
          style={{ fontSize: `${zoom}%` }}
        >
          {fields.map(field => (
            <div key={field.id} className="form-field">
              <span className="field-label">{field.label}:</span>
              <span className="field-value">{formData[field.id] || 'N/A'}</span>
            </div>
          ))}
        </div>

        <div style={{ 
          backgroundColor: '#d1ecf1', 
          padding: '24px', 
          borderRadius: '12px',
          marginTop: '30px',
          fontSize: '22px',
          textAlign: 'center',
          maxWidth: '800px'
        }}>
          ℹ️ Please review all information carefully. Once submitted, changes require staff approval.
        </div>
      </div>

      <div className="action-bar">
        <button 
          className="btn btn-secondary"
          onClick={() => navigate('/input')}
        >
          ← {t.edit}
        </button>

        <button 
          className="btn btn-primary btn-large"
          onClick={handleProceed}
        >
          {t.proceedToVerification} →
        </button>
      </div>
    </div>
  );
};

export default FormPreviewScreen;
