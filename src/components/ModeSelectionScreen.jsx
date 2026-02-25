import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppState } from '../context/AppStateContext';
import { translations } from '../data/mockData';

/**
 * ModeSelectionScreen - Choose interaction mode
 * Voice + IVR (recommended), Touch Only, or Assisted Mode
 */
const ModeSelectionScreen = () => {
  const navigate = useNavigate();
  const { language, setInputMode } = useAppState();
  const t = translations[language];

  const handleModeSelect = (mode) => {
    setInputMode(mode);
    navigate('/service-selection');
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
        <h1 className="kiosk-title">{t.selectMode}</h1>

        <div className="option-grid">
          <div 
            className="option-tile"
            onClick={() => handleModeSelect('voice')}
            style={{ borderColor: '#28a745', borderWidth: '4px' }}
          >
            <div className="tile-icon" style={{ color: '#28a745' }}>🎤</div>
            <div className="tile-label">{t.voiceMode}</div>
            <div style={{ 
              backgroundColor: '#28a745', 
              color: 'white', 
              padding: '8px 16px', 
              borderRadius: '20px',
              fontSize: '18px',
              marginTop: '12px'
            }}>
              ⭐ Recommended
            </div>
          </div>

          <div 
            className="option-tile"
            onClick={() => handleModeSelect('touch')}
          >
            <div className="tile-icon">👆</div>
            <div className="tile-label">{t.touchMode}</div>
          </div>

          <div 
            className="option-tile"
            onClick={() => handleModeSelect('assisted')}
          >
            <div className="tile-icon">🤝</div>
            <div className="tile-label">{t.assistedMode}</div>
          </div>
        </div>
      </div>

      <div className="action-bar">
        <button 
          className="btn btn-secondary"
          onClick={() => navigate('/')}
        >
          ← {t.back}
        </button>
      </div>
    </div>
  );
};

export default ModeSelectionScreen;
