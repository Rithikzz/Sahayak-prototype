import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppState } from '../context/AppStateContext';
import { translations } from '../data/mockData';
import api from '../utils/apiClient';

/**
 * FormPreviewScreen - Shows the actual overlaid PDF (if template has one) or
 * a plain key/value list as fallback.  Allows zoom and final review before verification.
 */
const FormPreviewScreen = () => {
  const navigate = useNavigate();
  const {
    language,
    serviceType,
    formData,
    formTemplates,
    selectedFormTemplateId,
  } = useAppState();

  const t = translations[language];

  // Resolve template from the array-per-category structure
  const templateArr = formTemplates[serviceType];
  const template = Array.isArray(templateArr)
    ? templateArr.find(t => t.id === selectedFormTemplateId) || templateArr[0]
    : templateArr;
  const fields = template?.fields || [];
  const hasPdf = template?.has_pdf && selectedFormTemplateId;

  const [zoom, setZoom] = useState(100);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState('');

  // Fetch the pre-filled PDF from the backend as soon as we know a template exists
  useEffect(() => {
    if (!hasPdf) return;
    let objectUrl = null;
    const fetchPdf = async () => {
      setPdfLoading(true);
      setPdfError('');
      try {
        const res = await api.post('/forms/generate-pdf', {
          form_template_id: selectedFormTemplateId,
          form_data: formData,
        });
        const blob = await res.blob();
        objectUrl = URL.createObjectURL(blob);
        setPdfUrl(objectUrl);
      } catch (e) {
        console.error('[FormPreview] PDF fetch error:', e);
        setPdfError(e.message || 'Could not generate PDF preview');
      } finally {
        setPdfLoading(false);
      }
    };
    fetchPdf();
    // Revoke the object URL when unmounting to avoid memory leak
    return () => { if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [hasPdf, selectedFormTemplateId, formData]);

  const handleZoomIn  = () => setZoom(prev => Math.min(prev + 20, 200));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 20, 60));
  const handleProceed = () => navigate('/voice-verification');

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

        {/* Zoom controls */}
        <div style={{ marginBottom: '16px', display: 'flex', gap: '16px', alignItems: 'center' }}>
          <button className="btn btn-outline" onClick={handleZoomOut}
            style={{ minHeight: '52px', fontSize: '22px' }}>🔍 −</button>
          <span style={{ fontSize: '22px' }}>{zoom}%</span>
          <button className="btn btn-outline" onClick={handleZoomIn}
            style={{ minHeight: '52px', fontSize: '22px' }}>🔍 +</button>
          {hasPdf && pdfUrl && (
            <a href={pdfUrl} download="preview.pdf"
              style={{ marginLeft: 'auto', fontSize: '18px', color: '#2563eb', textDecoration: 'underline' }}>
              ⬇ Download
            </a>
          )}
        </div>

        {/* ── PDF Viewer (when template has an original PDF) ── */}
        {hasPdf ? (
          pdfLoading ? (
            <div style={{ textAlign: 'center', padding: '40px', fontSize: '20px', color: '#555' }}>
              ⏳ Generating filled form preview…
            </div>
          ) : pdfError ? (
            <div>
              <div style={{ backgroundColor: '#fee2e2', padding: '16px', borderRadius: '10px',
                fontSize: '18px', color: '#dc2626', marginBottom: '16px' }}>
                ⚠️ PDF preview unavailable: {pdfError}
              </div>
              {/* Fallback: text list */}
              <div className="form-preview" style={{ fontSize: `${zoom}%` }}>
                {fields.map(field => (
                  <div key={field.id} className="form-field">
                    <span className="field-label">{field.label}:</span>
                    <span className="field-value">{formData[field.id] || 'N/A'}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : pdfUrl ? (
            <div style={{
              width: '100%',
              height: `${Math.min(600, Math.round(600 * zoom / 100))}px`,
              border: '2px solid #d1d5db',
              borderRadius: '10px',
              overflow: 'hidden',
              transition: 'height 0.2s',
            }}>
              <iframe
                src={pdfUrl + '#toolbar=0&navpanes=0'}
                title="Filled Form Preview"
                style={{ width: '100%', height: '100%', border: 'none' }}
              />
            </div>
          ) : null
        ) : (
          /* ── Plain text fallback when no PDF template ── */
          <div className="form-preview" style={{ fontSize: `${zoom}%` }}>
            {fields.map(field => (
              <div key={field.id} className="form-field">
                <span className="field-label">{field.label}:</span>
                <span className="field-value">{formData[field.id] || 'N/A'}</span>
              </div>
            ))}
          </div>
        )}

        <div style={{
          backgroundColor: '#d1ecf1',
          padding: '20px',
          borderRadius: '12px',
          marginTop: '24px',
          fontSize: '20px',
          textAlign: 'center',
          maxWidth: '800px'
        }}>
          ℹ️ Please review all information carefully. Once submitted, changes require staff approval.
        </div>
      </div>

      <div className="action-bar">
        <button className="btn btn-secondary" onClick={() => navigate('/input')}>
          ← {t.edit}
        </button>
        <button className="btn btn-primary btn-large" onClick={handleProceed}>
          {t.proceedToVerification} →
        </button>
      </div>
    </div>
  );
};

export default FormPreviewScreen;
