import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppState } from '../context/AppStateContext';
import { translations } from '../data/mockData';

/**
 * SuccessScreen - Final confirmation and optional receipt printing.
 * Shows success message, a Print Form button (if template has an original PDF),
 * and auto-resets the kiosk after 30 seconds.
 */
const SuccessScreen = () => {
  const navigate = useNavigate();
  const { language, resetState, formData, selectedFormTemplateId, formTemplates, serviceType } = useAppState();
  const t = translations[language];
  const [printLoading, setPrintLoading] = useState(false);
  const [printError, setPrintError] = useState('');

  // Determine hasPdf: formTemplates[serviceType] is now an array of templates
  const hasPdf = (() => {
    if (!serviceType || !selectedFormTemplateId) return false;
    const tplArr = formTemplates[serviceType];
    if (Array.isArray(tplArr)) {
      const tpl = tplArr.find(t => t.id === selectedFormTemplateId);
      return tpl?.has_pdf ?? false;
    }
    // Legacy single-object fallback
    return tplArr?.has_pdf ?? false;
  })();

  const handlePrint = async () => {
    if (!selectedFormTemplateId) return;
    setPrintLoading(true);
    setPrintError('');
    try {
      const response = await fetch('/api/forms/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          form_template_id: selectedFormTemplateId,
          form_data: formData,
        }),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.detail || 'PDF generation failed');
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (err) {
      setPrintError(err.message || 'Could not generate PDF');
    } finally {
      setPrintLoading(false);
    }
  };

  useEffect(() => {
    // Auto-reset after 30 seconds (extended slightly for print opportunity)
    const timer = setTimeout(() => {
      resetState();
      navigate('/');
    }, 30000);

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

        {/* Print Form button — only shown when template has an original PDF */}
        {hasPdf && (
          <div style={{ marginTop: '32px', textAlign: 'center' }}>
            <button
              onClick={handlePrint}
              disabled={printLoading}
              style={{
                padding: '20px 48px',
                fontSize: '24px',
                fontWeight: '700',
                backgroundColor: printLoading ? '#999' : '#2d6a4f',
                color: '#fff',
                border: 'none',
                borderRadius: '16px',
                cursor: printLoading ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
              }}
            >
              {printLoading ? 'Generating PDF...' : '🖨 Print Filled Form'}
            </button>
            {printError && (
              <div style={{ marginTop: '12px', color: '#c53030', fontSize: '18px' }}>{printError}</div>
            )}
          </div>
        )}

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
