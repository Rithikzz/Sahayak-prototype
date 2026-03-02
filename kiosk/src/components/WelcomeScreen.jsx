import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppState } from '../context/AppStateContext';
import { translations } from '../data/mockData';

/**
 * WelcomeScreen - First screen users see
 * Allows language selection and initiates kiosk session
 */
const WelcomeScreen = () => {
  const navigate = useNavigate();
  const { language, setLanguage } = useAppState();
  const t = translations[language];

  const handleLanguageSelect = (lang) => {
    setLanguage(lang);
  };

  const handleStart = () => {
    navigate('/authentication');
  };

  return (
    <div className="kiosk-screen">
      <div className="kiosk-header" style={{ justifyContent: 'center' }}>
        <div className="kiosk-logo">
          <span style={{ fontSize: '48px' }}>🏦</span>
          <span>SAHAYAK</span>
        </div>
      </div>

      <div className="kiosk-content">
        <h1 className="kiosk-title">{t.welcome}</h1>
        
        <div className="kiosk-subtitle" style={{ marginBottom: '60px' }}>
          {t.selectLanguage}
        </div>

        <div className="option-grid" style={{ maxWidth: '900px', marginBottom: '60px' }}>
          <div 
            className={`option-tile ${language === 'en' ? 'selected' : ''}`}
            onClick={() => handleLanguageSelect('en')}
            style={{ 
              borderColor: language === 'en' ? 'var(--primary-blue)' : 'var(--border-gray)',
              backgroundColor: language === 'en' ? '#e6f2ff' : 'var(--white)'
            }}
          >
            <div className="tile-icon">🇬🇧</div>
            <div className="tile-label">English</div>
          </div>

          <div 
            className={`option-tile ${language === 'hi' ? 'selected' : ''}`}
            onClick={() => handleLanguageSelect('hi')}
            style={{ 
              borderColor: language === 'hi' ? 'var(--primary-blue)' : 'var(--border-gray)',
              backgroundColor: language === 'hi' ? '#e6f2ff' : 'var(--white)'
            }}
          >
            <div className="tile-icon">🇮🇳</div>
            <div className="tile-label">हिंदी (Hindi)</div>
          </div>

          <div 
            className={`option-tile ${language === 'ta' ? 'selected' : ''}`}
            onClick={() => handleLanguageSelect('ta')}
            style={{ 
              borderColor: language === 'ta' ? 'var(--primary-blue)' : 'var(--border-gray)',
              backgroundColor: language === 'ta' ? '#e6f2ff' : 'var(--white)'
            }}
          >
            <div className="tile-icon">🇮🇳</div>
            <div className="tile-label">தமிழ் (Tamil)</div>
          </div>
        </div>

        <button 
          className="btn btn-primary btn-large"
          onClick={handleStart}
        >
          <span>{t.touchToStart}</span>
          <span className="btn-icon">→</span>
        </button>
      </div>
    </div>
  );
};

export default WelcomeScreen;
