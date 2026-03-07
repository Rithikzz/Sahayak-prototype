import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppState } from '../context/AppStateContext';
import { translations } from '../data/mockData';

/**
 * FormTemplatePicker — shown when a service category has multiple published
 * form templates. The user picks which specific form they need (e.g.
 * "SBI Deposit Slip" vs "NEFT Transfer Form" under Transaction Forms).
 */
const FormTemplatePicker = () => {
  const navigate = useNavigate();
  const { language, serviceType, formTemplates, selectTemplate, setFormData, setCurrentFieldIndex } = useAppState();
  const t = translations[language];
  const [selected, setSelected] = useState(null);

  // Ensure we have serviceType set
  if (!serviceType) {
    return (
      <div className="kiosk-screen" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: '#fff' }}>
          <p style={{ fontSize: '1.4rem', marginBottom: 16 }}>Loading form templates...</p>
          <button
            onClick={() => navigate('/service-selection')}
            style={{
              padding: '12px 32px',
              borderRadius: 12,
              border: 'none',
              background: '#3b82f6',
              color: '#fff',
              fontSize: '1rem',
              cursor: 'pointer',
            }}
          >
            ← Back
          </button>
        </div>
      </div>
    );
  }

  // Resolve templates for this service type
  const templateValue = formTemplates[serviceType];
  const templates = Array.isArray(templateValue) ? templateValue : [];

  const handleSelect = (tpl) => {
    setSelected(tpl.id);
    selectTemplate(tpl.id);
    setFormData({});
    setCurrentFieldIndex(0);
    setTimeout(() => navigate('/input'), 250);
  };

  if (templates.length === 0) {
    return (
      <div className="kiosk-screen" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: '#fff' }}>
          <p style={{ fontSize: '1.4rem', marginBottom: 16 }}>No form templates available for this category.</p>
          <button
            onClick={() => navigate('/service-selection')}
            style={{
              padding: '12px 32px',
              borderRadius: 12,
              border: 'none',
              background: '#3b82f6',
              color: '#fff',
              fontSize: '1rem',
              cursor: 'pointer',
            }}
          >
            ← Back
          </button>
        </div>
      </div>
    );
  }

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

      <div style={{ padding: '24px 32px', flex: 1, overflow: 'auto' }}>
        <h2 style={{ color: '#fff', fontSize: '1.5rem', fontWeight: 700, marginBottom: 8, textAlign: 'center' }}>
          {t?.selectFormTemplate || 'Select a Form'}
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.95rem', textAlign: 'center', marginBottom: 24 }}>
          {t?.multipleFormsAvailable || 'Multiple forms are available for this category. Choose one to proceed.'}
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: 16,
          maxWidth: 900,
          margin: '0 auto',
        }}>
          {templates.map((tpl) => {
            const isSelected = selected === tpl.id;
            const fieldCount = Array.isArray(tpl.fields) ? tpl.fields.length : 0;
            return (
              <button
                key={tpl.id}
                onClick={() => handleSelect(tpl)}
                style={{
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  padding: '20px 24px',
                  borderRadius: 16,
                  border: isSelected ? '3px solid #3b82f6' : '2px solid rgba(255,255,255,0.15)',
                  background: isSelected ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.06)',
                  color: '#fff',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s',
                  transform: isSelected ? 'scale(1.02)' : 'scale(1)',
                }}
              >
                {/* PDF badge */}
                {tpl.has_pdf && (
                  <span style={{
                    position: 'absolute',
                    top: 10,
                    right: 12,
                    fontSize: '0.65rem',
                    background: '#22c55e',
                    color: '#fff',
                    padding: '2px 8px',
                    borderRadius: 8,
                    fontWeight: 600,
                  }}>
                    PDF
                  </span>
                )}

                <span style={{ fontSize: '1.15rem', fontWeight: 600, marginBottom: 6 }}>
                  {tpl.name}
                </span>
                <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.55)' }}>
                  {fieldCount} field{fieldCount !== 1 ? 's' : ''}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Back button */}
      <div style={{ padding: '16px 32px', display: 'flex', justifyContent: 'center' }}>
        <button
          onClick={() => navigate('/service-selection')}
          style={{
            padding: '12px 36px',
            borderRadius: 12,
            border: '2px solid rgba(255,255,255,0.2)',
            background: 'transparent',
            color: 'rgba(255,255,255,0.8)',
            fontSize: '0.95rem',
            cursor: 'pointer',
          }}
        >
          ← {t?.back || 'Back'}
        </button>
      </div>
    </div>
  );
};

export default FormTemplatePicker;
