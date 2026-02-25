import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppState } from '../context/AppStateContext';
import { translations } from '../data/mockData';

/**
 * AuthSuccessScreen Component
 * 
 * Displays success message after OTP verification
 * Auto-resets to welcome screen after 5 seconds
 */
const AuthSuccessScreen = () => {
  const navigate = useNavigate();
  const { language, resetState } = useAppState();
  const t = translations[language];

  useEffect(() => {
    // Auto-navigate to mode selection after 3 seconds
    const timer = setTimeout(() => {
      navigate('/mode-selection');
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigate]);

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
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '40px'
        }}>
          {/* Success Icon */}
          <div className="success-icon">
            ✓
          </div>

          {/* Success Message */}
          <h1 className="kiosk-title" style={{ color: '#040466', marginBottom: 0 }}>
            {t.success}
          </h1>
          
          <div style={{
            fontSize: '32px',
            color: '#666',
            textAlign: 'center',
            maxWidth: '700px',
            lineHeight: '1.5'
          }}>
            {t.authenticationSuccess}
          </div>

          {/* Welcome User */}
          <div style={{
            backgroundColor: '#e6f7ff',
            border: '3px solid #0066cc',
            borderRadius: '20px',
            padding: '32px 48px',
            fontSize: '36px',
            color: '#0066cc',
            fontWeight: 'bold'
          }}>
            🎉 {t.welcome_user}!
          </div>

          {/* Thank You Message */}
          <div style={{
            fontSize: '24px',
            color: '#999',
            textAlign: 'center',
            marginTop: '20px'
          }}>
            {t.thankYou}
          </div>

          {/* Auto-redirect message */}
          <div style={{
            fontSize: '20px',
            color: '#999',
            textAlign: 'center',
            fontStyle: 'italic'
          }}>
            {language === 'en' ? 'Proceeding to next step in 3 seconds...' : 
             language === 'hi' ? '3 सेकंड में अगले चरण में जा रहे हैं...' : 
             '3 விநாடிகளில் அடுத்த படிக்கு செல்கிறது...'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthSuccessScreen;
