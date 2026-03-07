import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppState } from '../context/AppStateContext';
import { translations } from '../data/mockData';

/**
 * ServiceSelectionScreen - Enhanced Interactive Banking Form Selection
 * 
 * Optimized for users without digital knowledge:
 * - Large, colorful, interactive tiles
 * - Smooth animations and visual feedback
 * - Clear icons and simple descriptions
 * - Responsive grid layout
 * - Touch-friendly with big tap targets
 * - Hover effects and selection indicators
 * - Professional bank-grade design
 */
const ServiceSelectionScreen = () => {
  const navigate = useNavigate();
  const { language, setServiceType, setCurrentFormCategory, setFormData, setCurrentFieldIndex, formTemplates, selectServiceType } = useAppState();
  const t = translations[language];
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [hoveredTile, setHoveredTile] = useState(null);

  // 9 comprehensive banking form categories for Indian bank branches
  const services = [
    {
      key: 'accountOpeningForms',
      icon: '📋',
      title: t.accountOpeningForms || 'Account Opening Forms',
      color: '#0056b3',
      bgColor: 'rgba(0, 86, 179, 0.08)'
    },
    {
      key: 'transactionForms',
      icon: '💰',
      title: t.transactionForms || 'Transaction Forms (Deposit / Withdraw)',
      color: '#28a745',
      bgColor: 'rgba(40, 167, 69, 0.08)'
    },
    {
      key: 'loanApplicationForms',
      icon: '🏦',
      title: t.loanApplicationForms || 'Loan Application Forms',
      color: '#6610f2',
      bgColor: 'rgba(102, 16, 242, 0.08)'
    },
    {
      key: 'kycForms',
      icon: '🆔',
      title: t.kycForms || 'KYC Forms',
      color: '#fd7e14',
      bgColor: 'rgba(253, 126, 20, 0.08)'
    },
    {
      key: 'serviceRequestForms',
      icon: '📇',
      title: t.serviceRequestForms || 'Service Request Forms',
      color: '#20c997',
      bgColor: 'rgba(32, 201, 151, 0.08)'
    },
    {
      key: 'transferRemittanceForms',
      icon: '↔️',
      title: t.transferRemittanceForms || 'Transfer & Remittance Forms',
      color: '#17a2b8',
      bgColor: 'rgba(23, 162, 184, 0.08)'
    },
    {
      key: 'investmentWealthForms',
      icon: '📈',
      title: t.investmentWealthForms || 'Investment & Wealth Management',
      color: '#e83e8c',
      bgColor: 'rgba(232, 62, 140, 0.08)'
    },
    {
      key: 'enquiryDisputeForms',
      icon: '❓',
      title: t.enquiryDisputeForms || 'Enquiry & Dispute Forms',
      color: '#ffc107',
      bgColor: 'rgba(255, 193, 7, 0.08)'
    },
    {
      key: 'closureNominationForms',
      icon: '🔒',
      title: t.closureNominationForms || 'Closure & Nomination Forms',
      color: '#dc3545',
      bgColor: 'rgba(220, 53, 69, 0.08)'
    }
  ];

  const handleServiceSelect = (service) => {
    setSelectedCategory(service.key);
    selectServiceType(service.key);
    setCurrentFormCategory(service.key);
    setFormData({});
    setCurrentFieldIndex(0);
    
    // Always navigate directly to input — template picker is removed.
    // selectServiceType() already picked the most recently published template.
    setTimeout(() => {
      navigate('/input');
    }, 300);
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

      <div className="kiosk-content" style={{ padding: '30px', paddingTop: '20px' }}>
        <h1 className="kiosk-title" style={{ marginBottom: '10px', fontSize: '48px' }}>
          📋 {t.selectService || 'Select Form Category'}
        </h1>
        <p className="kiosk-subtitle" style={{ marginBottom: '40px', fontSize: '26px', color: '#666', fontWeight: '500' }}>
      
        </p>

        {/* 3x3 Grid Layout - All Services Visible */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '24px',
          width: '100%',
          maxWidth: '1400px',
          marginBottom: '30px'
        }}>
          {services.map((service, index) => (
            <div
              key={service.key}
              onClick={() => handleServiceSelect(service)}
              onMouseEnter={() => setHoveredTile(service.key)}
              onMouseLeave={() => setHoveredTile(null)}
              style={{
                backgroundColor: service.bgColor,
                border: selectedCategory === service.key ? `5px solid ${service.color}` : '3px solid #e0e0e0',
                borderRadius: '20px',
                padding: '28px 24px',
                cursor: 'pointer',
                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                gap: '14px',
                minHeight: '200px',
                boxShadow: selectedCategory === service.key 
                  ? `0 8px 24px ${service.color}50, inset 0 0 20px ${service.color}15` 
                  : hoveredTile === service.key
                  ? `0 12px 28px ${service.color}30`
                  : '0 4px 12px rgba(0, 0, 0, 0.08)',
                transform: selectedCategory === service.key 
                  ? 'scale(1.02)' 
                  : hoveredTile === service.key 
                  ? 'scale(1.04)' 
                  : 'scale(1)',
                position: 'relative',
                overflow: 'hidden',
                filter: selectedCategory === service.key ? 'brightness(1.05)' : 'brightness(1)',
                animation: `slideUp 0.5s ease-out ${index * 0.05}s both`
              }}
            >
              {/* Animated Background Glow for Selected */}
              {selectedCategory === service.key && (
                <div style={{
                  position: 'absolute',
                  top: '-50%',
                  right: '-50%',
                  width: '200%',
                  height: '200%',
                  background: `radial-gradient(circle, ${service.color}20 0%, transparent 70%)`,
                  animation: 'glow 3s ease-in-out infinite',
                  pointerEvents: 'none'
                }}></div>
              )}

              {/* Large Icon with Bounce on Selection */}
              <div style={{
                fontSize: '72px',
                lineHeight: '1',
                filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1))',
                animation: selectedCategory === service.key ? 'bounce 0.6s ease' : 'none',
                transition: 'transform 0.2s ease',
                position: 'relative',
                zIndex: 1
              }}>
                {service.icon}
              </div>

              {/* Title */}
              <div style={{
                fontSize: '22px',
                fontWeight: '700',
                color: service.color,
                lineHeight: '1.3',
                minHeight: '50px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                zIndex: 1
              }}>
                {service.title}
              </div>

              {/* Selection Checkmark with Animation */}
              {selectedCategory === service.key && (
                <div style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  width: '50px',
                  height: '50px',
                  borderRadius: '50%',
                  backgroundColor: service.color,
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '28px',
                  fontWeight: 'bold',
                  boxShadow: `0 4px 12px ${service.color}50`,
                  animation: 'popIn 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
                  zIndex: 2
                }}>
                  ✓
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="action-bar">
        <button 
          className="btn btn-secondary btn-large"
          onClick={() => navigate('/mode-selection')}
          style={{
            minHeight: '100px',
            fontSize: '28px'
          }}
        >
          ← {t.back || 'Back'}
        </button>
      </div>

      <style>{`
        @keyframes popIn {
          0% {
            transform: scale(0);
            opacity: 0;
          }
          50% {
            transform: scale(1.25);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        @keyframes bounce {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.15);
          }
        }

        @keyframes glow {
          0%, 100% {
            opacity: 0.6;
          }
          50% {
            opacity: 1;
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default ServiceSelectionScreen;
