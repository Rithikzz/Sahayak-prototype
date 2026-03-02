import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppState } from '../context/AppStateContext';
import { translations } from '../data/mockData';

/**
 * SuccessScreen - Final confirmation and receipt printing
 * Shows success message and auto-resets kiosk for next user
 */
const SuccessScreen = () => {
  const navigate = useNavigate();
  const { language, resetState } = useAppState();
  const t = translations[language];

  useEffect(() => {
    // Auto-reset after 8 seconds
    const timer = setTimeout(() => {
      resetState();
      navigate('/');
    }, 8000);

    return () => clearTimeout(timer);
  }, [navigate, resetState]);

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
        <div className="success-icon">✓</div>
        
        <h1 className="kiosk-title" style={{ color: 'var(--success-green)', marginTop: '30px' }}>
          {t.formApproved}
        </h1>

        <div style={{ 
          fontSize: '28px', 
          color: '#666',
          marginTop: '20px',
          marginBottom: '40px',
          textAlign: 'center'
        }}>
          {t.printing}
        </div>

        <div className="print-animation">
          <div style={{ 
            fontSize: '60px', 
            position: 'absolute', 
            top: '0', 
            left: '50%', 
            transform: 'translateX(-50%)'
          }}>
            🖨️
          </div>
          <div className="print-paper"></div>
        </div>

        <div style={{ 
          marginTop: '50px',
          fontSize: '32px',
          fontWeight: 'bold',
          color: 'var(--primary-blue)',
          textAlign: 'center'
        }}>
          {t.thankYou}
        </div>

        <div style={{ 
          marginTop: '30px',
          fontSize: '22px',
          color: '#666',
          textAlign: 'center'
        }}>
          {t.collectFromStaff}
        </div>

        <div style={{ 
          marginTop: '40px',
          fontSize: '20px',
          color: '#999',
          textAlign: 'center'
        }}>
          {t.autoResetNotice}
        </div>
      </div>
    </div>
  );
};

export default SuccessScreen;
