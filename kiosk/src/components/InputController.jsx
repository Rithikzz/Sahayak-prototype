import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppState } from '../context/AppStateContext';
import { translations } from '../data/mockData';
import api from '../utils/apiClient';

/**
 * InputController - Handles data input for selected service
 *
 * Smart field skipping: if the customer's saved profile already contains
 * a value for the current field it is shown briefly as "auto-filled" and
 * the controller advances automatically — the user is only prompted for
 * fields that are genuinely unknown.
 *
 * STT fix: MediaRecorder now requests audio/webm;codecs=opus (or falls back
 * to the browser default) so Whisper receives a properly-encoded audio stream.
 * Recording window extended to 8 s for CPU-based transcription.
 */

// Map from form field IDs → customer profile keys
const PROFILE_FIELD_MAP = {
  fullName:          'name',
  accountHolderName: 'name',
  depositorName:     'name',
  accountNumber:     'account_number',
  phoneNumber:       'phone_number',
  email:             'email',
  emailId:           'email',
  dateOfBirth:       'date_of_birth',
  panNumber:         'pan_number',
  aadharNumber:      'aadhaar_number',
  aadhaarNumber:     'aadhaar_number',
  currentAddress:    'address',
  address:           'address',
};

/**
 * Returns true if a field should be SKIPPED entirely (not shown to user).
 *
 * Current skip rules:
 *  1. Signature fields  — will be physically signed on the paper form
 *  2. FORM 60 fields    — only needed when PAN is absent; skip if PAN is known
 *  3. Photo fields      — physical photo is affixed manually
 */
function shouldSkipField(field, customerProfile) {
  const id   = (field.id   || '').toLowerCase();
  const label = (field.label || '').toLowerCase();
  const type  = (field.type  || '').toLowerCase();

  // 1. Signature fields
  if (
    type === 'signature' ||
    id.includes('signature') ||
    label.includes('signature')
  ) return true;

  // 2. Photo fields
  if (
    type === 'photo' ||
    id.includes('photo') ||
    label.includes('photo')
  ) return true;

  // 3. FORM 60 fields — skip if customer already has PAN in profile
  const hasPan = customerProfile?.pan_number && customerProfile.pan_number.trim();
  if (hasPan) {
    if (
      id.includes('form60') ||
      id.includes('form_60') ||
      id.includes('nopan') ||
      id.includes('no_pan') ||
      id.includes('panreason') ||
      label.includes('form 60') ||
      label.includes('form-60') ||
      label.includes('reason for no pan') ||
      label.includes('in lieu of pan') ||
      label.includes('declaration in lieu')
    ) return true;
  }

  return false;
}

/** Returns the best supported MIME type for MediaRecorder audio recording */
function getSupportedAudioMime() {
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/ogg;codecs=opus',
    'audio/ogg',
  ];
  for (const mime of candidates) {
    if (MediaRecorder.isTypeSupported(mime)) return mime;
  }
  return ''; // browser default
}

const InputController = () => {
  const navigate = useNavigate();
  const {
    language,
    inputMode,
    serviceType,
    formData,
    updateFormField,
    currentFieldIndex,
    setCurrentFieldIndex,
    formTemplates,
    isLoadingTemplates,
    customerProfile,
    selectedFormTemplateId,
  } = useAppState();

  const t = translations[language];

  // Resolve template from array-per-category structure
  const templateArr = formTemplates[serviceType];
  const template = Array.isArray(templateArr)
    ? templateArr.find(t => t.id === selectedFormTemplateId) || templateArr[0]
    : templateArr;
  const fields = template?.fields || [];
  const currentField = fields[currentFieldIndex];

  const [inputValue, setInputValue] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  // After voice transcription: hold result, wait for user to confirm / repeat / back
  const [voiceConfirmPending, setVoiceConfirmPending] = useState(false);
  const [pendingField, setPendingField] = useState(null);   // field captured at record time
  const [pendingIndex, setPendingIndex] = useState(null);   // index captured at record time

  const isListeningRef = useRef(isListening);
  const handleVoiceStartRef = useRef(null);

  useEffect(() => {
    isListeningRef.current = isListening;
  });

  const effectiveInputMode = inputMode === 'assisted' ? 'voice' : inputMode;
  const isCashService =
    serviceType === 'deposit' ||
    serviceType === 'withdrawal' ||
    serviceType === 'transactionForms';
  const isAmountField =
    currentField?.id === 'amount' || currentField?.type === 'number';
  const useKeypad =
    effectiveInputMode !== 'voice' &&
    isCashService &&
    (isAmountField ||
      currentField?.id === 'accountNumber' ||
      currentField?.type === 'tel');

  // ── Determine if the current field is already known from the customer profile ──
  const profileKey = currentField ? PROFILE_FIELD_MAP[currentField.id] : null;
  const profileValue =
    profileKey && customerProfile ? (customerProfile[profileKey] || '') : '';
  const isProfileFilled = !!(profileValue && profileValue.trim());

  // ── Auto-skip fields that should never be asked (signature / photo / FORM60) ──
  useEffect(() => {
    if (!currentField) return;
    if (!shouldSkipField(currentField, customerProfile)) return;
    // Skip immediately — no user interaction needed
    if (currentFieldIndex < fields.length - 1) {
      setCurrentFieldIndex(currentFieldIndex + 1);
    } else {
      navigate('/field-confirmation');
    }
  }, [currentFieldIndex, currentField, customerProfile]); // eslint-disable-line

  // ── Auto-advance past profile-pre-filled fields ───────────────────────────
  useEffect(() => {
    if (!currentField) return;
    if (shouldSkipField(currentField, customerProfile)) return; // already handled above
    if (isProfileFilled) {
      // Ensure the value is stored in formData, then skip after a brief display
      updateFormField(currentField.id, profileValue);
      const timer = setTimeout(() => {
        if (currentFieldIndex < fields.length - 1) {
          setCurrentFieldIndex(currentFieldIndex + 1);
        } else {
          navigate('/field-confirmation');
        }
      }, 1800);
      return () => clearTimeout(timer);
    }
  }, [currentFieldIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Normal pre-fill + TTS for non-profile fields ─────────────────────────
  useEffect(() => {
    if (!currentField || isProfileFilled) return;
    setVoiceConfirmPending(false);   // reset on field change
    setPendingField(null);
    if (formData[currentField.id]) {
      setInputValue(formData[currentField.id]);
    } else {
      setInputValue('');
    }
    if (effectiveInputMode === 'voice') {
      playTTS(currentField.label);
    }
  }, [currentField]); // eslint-disable-line react-hooks/exhaustive-deps

  const playTTS = async (text) => {
    try {
      const fd = new FormData();
      fd.append('text', text);
      fd.append('lang', language);
      const response = await api.upload('/voice/synthesize', fd);
      if (response.ok) {
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        audio.onended = () => {
          if (handleVoiceStartRef.current) handleVoiceStartRef.current(true);
        };
        audio.play();
      }
    } catch (err) {
      console.error('TTS Error:', err);
    }
  };

  const handleKeypadPress = (value) => {
    if (value === 'clear') {
      setInputValue('');
    } else if (value === 'backspace') {
      setInputValue((prev) => prev.slice(0, -1));
    } else {
      setInputValue((prev) => prev + value);
    }
  };

  const handleVoiceStart = async (isAutoStart = false) => {
    if (isListeningRef.current) {
      if (!isAutoStart) stopRecording();
      return;
    }

    const indexCapture = currentFieldIndex;
    const fieldCapture = currentField;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = getSupportedAudioMime();
      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);
      const chunks = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = async () => {
        const blobType = recorder.mimeType || 'audio/webm';
        const audioBlob = new Blob(chunks, { type: blobType });
        await uploadAudioForSTT(audioBlob, indexCapture, fieldCapture);
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsListening(true);

      // 8 seconds gives Whisper on CPU enough audio to work with
      setTimeout(() => {
        if (recorder.state === 'recording') recorder.stop();
      }, 8000);
    } catch (err) {
      console.error('Microphone access denied:', err);
      alert('Microphone access is required for voice input');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
    }
    setIsListening(false);
  };

  useEffect(() => {
    handleVoiceStartRef.current = handleVoiceStart;
  }, [handleVoiceStart]);

  const uploadAudioForSTT = async (audioBlob, indexCapture, fieldCapture) => {
    setIsListening(false);
    setInputValue('Processing audio...');

    try {
      const fd = new FormData();
      fd.append('audio', audioBlob, 'recording.webm');
      // Send field context so backend can pass to Llama for clean extraction
      fd.append('field_label', fieldCapture?.label || fieldCapture?.id || '');
      fd.append('field_type',  fieldCapture?.type  || 'text');
      fd.append('language',    language || 'en');

      const response = await api.upload('/voice/transcribe', fd);

      if (response.ok) {
        const data = await response.json();
        const text = (data.text || '').trim();
        const finalText = text.length > 0 ? text : '';
        setInputValue(finalText);
        // Save context for confirm / repeat actions
        setPendingField(fieldCapture);
        setPendingIndex(indexCapture);
        setVoiceConfirmPending(true);   // show confirmation UI
      } else {
        console.error('STT returned error', response.status);
        setInputValue('Transcription failed. Please try again.');
      }
    } catch (err) {
      console.error('STT request failed', err);
      setInputValue('Network error. Please try again.');
    }
  };

  const handleNext = () => {
    if (!inputValue.trim()) {
      alert('Please enter a value');
      return;
    }
    updateFormField(currentField.id, inputValue);
    if (currentFieldIndex < fields.length - 1) {
      setCurrentFieldIndex(currentFieldIndex + 1);
      setInputValue('');
    } else {
      navigate('/field-confirmation');
    }
  };

  const handleBack = () => {
    // If in voice confirm state, just dismiss it (re-show mic button)
    if (voiceConfirmPending) {
      setVoiceConfirmPending(false);
      setInputValue('');
      return;
    }
    if (currentFieldIndex > 0) {
      setCurrentFieldIndex(currentFieldIndex - 1);
    } else {
      navigate('/service-selection');
    }
  };

  // Confirm the transcribed voice value and advance
  const handleVoiceConfirm = () => {
    if (!pendingField) return;
    updateFormField(pendingField.id, inputValue);
    setVoiceConfirmPending(false);
    setInputValue('');
    if (pendingIndex < fields.length - 1) {
      setCurrentFieldIndex(pendingIndex + 1);
    } else {
      navigate('/field-confirmation');
    }
  };

  // Discard transcription and re-record
  const handleVoiceRepeat = () => {
    setVoiceConfirmPending(false);
    setInputValue('');
    setTimeout(() => {
      if (handleVoiceStartRef.current) handleVoiceStartRef.current(true);
    }, 200);
  };

  if (isLoadingTemplates) {
    return (
      <div className="kiosk-screen">
        <div className="kiosk-content">
          <div className="kiosk-title">Loading Forms...</div>
        </div>
      </div>
    );
  }

  if (!currentField) {
    return (
      <div className="kiosk-screen">
        <div className="kiosk-content">
          <div className="kiosk-title">Loading Field...</div>
        </div>
      </div>
    );
  }

  const showVoiceInput = effectiveInputMode === 'voice';

  // ── Voice confirmation screen: transcription ready, waiting for user choice ──
  if (voiceConfirmPending) {
    const isEmpty = !inputValue || inputValue.trim() === '';
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

        <div className="kiosk-content" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '26px', color: '#6c757d', marginBottom: '12px' }}>
            Field {(pendingIndex ?? currentFieldIndex) + 1} of {fields.length}
          </div>
          <h1 className="kiosk-title" style={{ fontSize: '40px', marginBottom: '32px' }}>
            {pendingField?.label || currentField?.label}
          </h1>

          {/* Transcribed value box */}
          <div style={{
            background: isEmpty ? '#fff3cd' : 'linear-gradient(135deg,#d4edda,#c3e6cb)',
            border: `4px solid ${isEmpty ? '#ffc107' : '#28a745'}`,
            borderRadius: '24px',
            padding: '36px 48px',
            maxWidth: '700px',
            margin: '0 auto 48px',
            boxShadow: `0 8px 32px ${isEmpty ? 'rgba(255,193,7,0.2)' : 'rgba(40,167,69,0.2)'}`,
          }}>
            <div style={{ fontSize: '52px', marginBottom: '12px' }}>{isEmpty ? '⚠️' : '🎤'}</div>
            <div style={{ fontSize: '18px', fontWeight: '600', color: '#555', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>
              {isEmpty ? 'Nothing was heard' : 'I heard'}
            </div>
            <div style={{ fontSize: '44px', fontWeight: 'bold', color: isEmpty ? '#856404' : '#155724', minHeight: '56px' }}>
              {isEmpty ? '—' : inputValue}
            </div>
          </div>

          {/* 3-button row */}
          <div style={{ display: 'flex', gap: '24px', justifyContent: 'center', flexWrap: 'wrap' }}>
            {/* Back */}
            <button
              className="btn btn-secondary"
              onClick={handleBack}
              style={{ minWidth: '180px', minHeight: '100px', fontSize: '26px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}
            >
              <span style={{ fontSize: '36px' }}>←</span>
              <span>Back</span>
            </button>

            {/* Repeat */}
            <button
              className="btn btn-primary"
              onClick={handleVoiceRepeat}
              style={{ minWidth: '220px', minHeight: '100px', fontSize: '26px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', background: '#fd7e14', borderColor: '#fd7e14' }}
            >
              <span style={{ fontSize: '36px' }}>🔄</span>
              <span>Repeat</span>
            </button>

            {/* Next — only enabled if we have a value */}
            {!isEmpty && (
              <button
                className="btn btn-success btn-large"
                onClick={handleVoiceConfirm}
                style={{ minWidth: '220px', minHeight: '100px', fontSize: '26px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}
              >
                <span style={{ fontSize: '36px' }}>✅</span>
                <span>{(pendingIndex ?? currentFieldIndex) < fields.length - 1 ? 'Next' : 'Proceed'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Auto-filled screen (shown briefly while timer runs) ───────────────────
  if (isProfileFilled) {
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
        <div className="kiosk-content" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '28px', color: '#6c757d', marginBottom: '16px' }}>
            Field {currentFieldIndex + 1} of {fields.length}
          </div>
          <h1 className="kiosk-title" style={{ fontSize: '40px', marginBottom: '32px' }}>
            {currentField.label}
          </h1>
          <div
            style={{
              background: 'linear-gradient(135deg, #d4edda, #c3e6cb)',
              border: '4px solid #28a745',
              borderRadius: '24px',
              padding: '40px 48px',
              maxWidth: '680px',
              margin: '0 auto',
              boxShadow: '0 8px 32px rgba(40,167,69,0.20)',
            }}
          >
            <div style={{ fontSize: '64px', marginBottom: '12px' }}>✅</div>
            <div
              style={{
                fontSize: '18px',
                fontWeight: '600',
                color: '#155724',
                marginBottom: '12px',
                textTransform: 'uppercase',
                letterSpacing: '1px',
              }}
            >
              Auto-filled from your profile
            </div>
            <div
              style={{
                fontSize: '38px',
                fontWeight: 'bold',
                color: '#155724',
              }}
            >
              {profileValue}
            </div>
          </div>
          <div style={{ fontSize: '20px', color: '#6c757d', marginTop: '28px' }}>
            Continuing automatically...
          </div>
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

      <div className="kiosk-content">
        <div
          className="kiosk-subtitle"
          style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}
        >
          <span>Field {currentFieldIndex + 1} of {fields.length}</span>
          {effectiveInputMode === 'voice' && <span style={{ fontSize: '20px' }}>🎤</span>}
        </div>

        <h1
          className="kiosk-title"
          style={{ fontSize: showVoiceInput ? '48px' : '36px', marginBottom: '40px' }}
        >
          {currentField.label}
        </h1>

        {useKeypad ? (
          <div className="keypad-container">
            <div className="amount-display">
              {isAmountField ? `₹ ${inputValue || '0'}` : inputValue || '—'}
            </div>
            <div className="keypad-grid">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <button
                  key={num}
                  className="btn btn-outline keypad-btn"
                  onClick={() => handleKeypadPress(num.toString())}
                >
                  {num}
                </button>
              ))}
              <button className="btn btn-secondary keypad-btn" onClick={() => handleKeypadPress('clear')}>C</button>
              <button className="btn btn-outline keypad-btn" onClick={() => handleKeypadPress('0')}>0</button>
              <button className="btn btn-secondary keypad-btn" onClick={() => handleKeypadPress('backspace')}>⌫</button>
            </div>
          </div>
        ) : showVoiceInput ? (
          <div className="voice-container">
            {isListening ? (
              <div style={{ textAlign: 'center' }}>
                <div className="mic-icon" style={{ width: '240px', height: '240px', fontSize: '120px', marginBottom: '30px' }}>🎤</div>
                <div className="voice-text" style={{ color: '#dc3545', fontWeight: 'bold', fontSize: '32px', marginBottom: '20px' }}>{t.listening}</div>
                <div style={{ fontSize: '22px', color: '#666', maxWidth: '500px', margin: '0 auto' }}>Speak clearly into the microphone</div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', width: '100%' }}>
                {!inputValue && (
                  <div style={{
                    backgroundColor: '#e6f2ff', border: '3px solid var(--primary-blue)', borderRadius: '24px',
                    padding: '30px 40px', marginBottom: '40px', fontSize: '28px', color: 'var(--primary-blue)',
                    maxWidth: '700px', margin: '0 auto 40px', position: 'relative',
                  }}>
                    <div style={{ fontSize: '48px', marginBottom: '10px' }}>💬</div>
                    {t.speakNow}<span className="voice-ellipsis">...</span>
                    <div style={{
                      position: 'absolute', bottom: '-20px', left: '50%', transform: 'translateX(-50%)',
                      width: '0', height: '0', borderLeft: '20px solid transparent',
                      borderRight: '20px solid transparent', borderTop: '20px solid var(--primary-blue)',
                    }} />
                  </div>
                )}
                {inputValue && (
                  <div style={{
                    backgroundColor: '#d4edda', border: '4px solid #28a745', padding: '40px', borderRadius: '20px',
                    fontSize: '42px', fontWeight: 'bold', color: '#155724', marginBottom: '40px',
                    maxWidth: '700px', margin: '0 auto 40px', boxShadow: '0 8px 24px rgba(40,167,69,0.2)',
                  }}>
                    <div style={{ fontSize: '56px', marginBottom: '16px' }}>✓</div>
                    {inputValue}
                  </div>
                )}
                <button
                  className="btn btn-primary btn-large"
                  onClick={handleVoiceStart}
                  style={{ minWidth: '400px', minHeight: '140px', fontSize: '32px', display: 'flex', flexDirection: 'column', gap: '16px' }}
                >
                  <span style={{ fontSize: '64px' }}>🎤</span>
                  <span>{inputValue ? t.reRecord : t.speakNow}</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <div style={{ width: '100%', maxWidth: '600px' }}>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={`Enter ${currentField.label}`}
              style={{
                width: '100%', fontSize: '32px', padding: '24px', borderRadius: '12px',
                border: '3px solid var(--border-gray)', textAlign: 'center', marginBottom: '30px',
              }}
            />
          </div>
        )}
      </div>

      <div className="action-bar">
        <button className="btn btn-secondary" onClick={handleBack} disabled={isListening}>
          ← {t.back}
        </button>
        {inputValue && !isListening && (
          <button className="btn btn-success btn-large" onClick={handleNext}>
            {currentFieldIndex < fields.length - 1 ? 'Next' : t.proceed} →
          </button>
        )}
      </div>
    </div>
  );
};

export default InputController;
