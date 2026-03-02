import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppState } from '../context/AppStateContext';
import { translations } from '../data/mockData';

/**
 * InputController - Handles data input for selected service
 * Routes to appropriate input method (keypad for amounts, voice for forms)
 */
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
    isLoadingTemplates
  } = useAppState();

  const t = translations[language];
  const template = formTemplates[serviceType];
  const fields = template?.fields || [];
  const currentField = fields[currentFieldIndex];

  const [inputValue, setInputValue] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioChunks, setAudioChunks] = useState([]);

  const isListeningRef = useRef(isListening);
  const handleVoiceStartRef = useRef(null);

  useEffect(() => {
    isListeningRef.current = isListening;
    // We bind handleVoiceStartRef to the function lower down via an effect
  });

  const effectiveInputMode = inputMode === 'assisted' ? 'voice' : inputMode;
  const isCashService = serviceType === 'deposit' || serviceType === 'withdrawal' || serviceType === 'transactionForms';
  const isAmountField = currentField?.id === 'amount' || currentField?.type === 'number';
  const useKeypad = effectiveInputMode !== 'voice' && isCashService && (isAmountField || currentField?.id === 'accountNumber' || currentField?.type === 'tel');

  useEffect(() => {
    // Pre-fill if data exists
    if (currentField && formData[currentField.id]) {
      setInputValue(formData[currentField.id]);
    } else {
      setInputValue('');
    }

    // Play TTS for the current field label, if voice mode is active
    if (currentField && effectiveInputMode === 'voice') {
      playTTS(currentField.label);
    }
  }, [currentField, formData, effectiveInputMode]);

  const playTTS = async (text) => {
    try {
      const formData = new FormData();
      formData.append('text', text);
      formData.append('lang', language);

      const response = await fetch('/api/voice/synthesize', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);

        audio.onended = () => {
          if (handleVoiceStartRef.current) {
            handleVoiceStartRef.current(true); // autoStart = true
          }
        };

        audio.play();
      }
    } catch (err) {
      console.error("TTS Error:", err);
    }
  };

  // Handle numeric keypad input (for amount fields)
  const handleKeypadPress = (value) => {
    if (value === 'clear') {
      setInputValue('');
    } else if (value === 'backspace') {
      setInputValue(prev => prev.slice(0, -1));
    } else {
      setInputValue(prev => prev + value);
    }
  };

  // Start recording audio for STT
  const handleVoiceStart = async (isAutoStart = false) => {
    if (isListeningRef.current) {
      // Stop listening manually if clicked again
      if (!isAutoStart) stopRecording();
      return;
    }

    const indexCapture = currentFieldIndex;
    const fieldCapture = currentField;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        await uploadAudioForSTT(audioBlob, indexCapture, fieldCapture);
        // Clean up tracks
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsListening(true);

      // Auto-stop after 5 seconds of recording
      setTimeout(() => {
        if (recorder.state === 'recording') {
          recorder.stop();
        }
      }, 5000);

    } catch (err) {
      console.error("Microphone access denied:", err);
      alert("Microphone access is required for voice input");
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
    setIsListening(false); // Update UI immediately to show processing/done
    setInputValue("Processing audio..."); // Temporary feedback

    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');

      const response = await fetch('/api/voice/transcribe', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        const text = data.text || '';

        let finalText = text;
        if (text.trim().length > 0) {
          setInputValue(text);
        } else {
          finalText = "[No Speech Detected]";
          setInputValue(finalText);
        }

        // Auto-proceed to the next step automatically mapping to the user request!
        setTimeout(() => {
          updateFormField(fieldCapture.id, finalText);
          if (indexCapture < fields.length - 1) {
            setCurrentFieldIndex(indexCapture + 1);
          } else {
            navigate('/field-confirmation');
          }
        }, 1500);

      } else {
        console.error("STT returned error", response.status);
        setInputValue("Transcription failed. Please try again.");
      }
    } catch (err) {
      console.error("STT request failed", err);
      setInputValue("Network error. Please try again.");
    }
  };

  const handleNext = () => {
    if (!inputValue.trim()) {
      alert('Please enter a value');
      return;
    }

    // Save current field value
    updateFormField(currentField.id, inputValue);

    // Move to next field or proceed to confirmation
    if (currentFieldIndex < fields.length - 1) {
      setCurrentFieldIndex(currentFieldIndex + 1);
      setInputValue('');
    } else {
      navigate('/field-confirmation');
    }
  };

  const handleBack = () => {
    if (currentFieldIndex > 0) {
      setCurrentFieldIndex(currentFieldIndex - 1);
    } else {
      navigate('/service-selection');
    }
  };

  if (isLoadingTemplates) {
    return <div className="kiosk-screen"><div className="kiosk-content"><div className="kiosk-title">Loading Forms...</div></div></div>;
  }

  if (!currentField) {
    return <div className="kiosk-screen"><div className="kiosk-content"><div className="kiosk-title">Loading Field...</div></div></div>;
  }

  const showVoiceInput = effectiveInputMode === 'voice';

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
        {/* Progress indicator */}
        <div className="kiosk-subtitle" style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span>Field {currentFieldIndex + 1} of {fields.length}</span>
          {effectiveInputMode === 'voice' && <span style={{ fontSize: '20px' }}>🎤</span>}
        </div>

        <h1 className="kiosk-title" style={{ fontSize: showVoiceInput ? '48px' : '36px', marginBottom: '40px' }}>
          {currentField.label}
        </h1>

        {useKeypad ? (
          // Numeric keypad for cash services
          <div className="keypad-container">
            <div className="amount-display">
              {isAmountField ? `₹ ${inputValue || '0'}` : (inputValue || '—')}
            </div>

            <div className="keypad-grid">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                <button
                  key={num}
                  className="btn btn-outline keypad-btn"
                  onClick={() => handleKeypadPress(num.toString())}
                >
                  {num}
                </button>
              ))}
              <button
                className="btn btn-secondary keypad-btn"
                onClick={() => handleKeypadPress('clear')}
              >
                C
              </button>
              <button
                className="btn btn-outline keypad-btn"
                onClick={() => handleKeypadPress('0')}
              >
                0
              </button>
              <button
                className="btn btn-secondary keypad-btn"
                onClick={() => handleKeypadPress('backspace')}
              >
                ⌫
              </button>
            </div>
          </div>
        ) : showVoiceInput ? (
          // Voice input mode - VOICE-FIRST UI
          <div className="voice-container">
            {isListening ? (
              // Listening state with animated microphone
              <div style={{ textAlign: 'center' }}>
                <div className="mic-icon" style={{
                  width: '240px',
                  height: '240px',
                  fontSize: '120px',
                  marginBottom: '30px'
                }}>
                  🎤
                </div>
                <div className="voice-text" style={{
                  color: '#dc3545',
                  fontWeight: 'bold',
                  fontSize: '32px',
                  marginBottom: '20px'
                }}>
                  {t.listening}
                </div>
                <div style={{
                  fontSize: '22px',
                  color: '#666',
                  maxWidth: '500px',
                  margin: '0 auto'
                }}>
                  Speak clearly into the microphone
                </div>
              </div>
            ) : (
              // Not listening - show prompt and captured value
              <div style={{ textAlign: 'center', width: '100%' }}>
                {/* Voice bubble with prompt */}
                {!inputValue && (
                  <div style={{
                    backgroundColor: '#e6f2ff',
                    border: '3px solid var(--primary-blue)',
                    borderRadius: '24px',
                    padding: '30px 40px',
                    marginBottom: '40px',
                    fontSize: '28px',
                    color: 'var(--primary-blue)',
                    maxWidth: '700px',
                    margin: '0 auto 40px',
                    position: 'relative'
                  }}>
                    <div style={{ fontSize: '48px', marginBottom: '10px' }}>💬</div>
                    {t.speakNow}
                    <span className="voice-ellipsis">...</span>
                    {/* Speech bubble tail */}
                    <div style={{
                      position: 'absolute',
                      bottom: '-20px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: '0',
                      height: '0',
                      borderLeft: '20px solid transparent',
                      borderRight: '20px solid transparent',
                      borderTop: '20px solid var(--primary-blue)'
                    }}></div>
                  </div>
                )}

                {/* Display captured value in large text */}
                {inputValue && (
                  <div style={{
                    backgroundColor: '#d4edda',
                    border: '4px solid #28a745',
                    padding: '40px',
                    borderRadius: '20px',
                    fontSize: '42px',
                    fontWeight: 'bold',
                    color: '#155724',
                    marginBottom: '40px',
                    maxWidth: '700px',
                    margin: '0 auto 40px',
                    boxShadow: '0 8px 24px rgba(40, 167, 69, 0.2)'
                  }}>
                    <div style={{ fontSize: '56px', marginBottom: '16px' }}>✓</div>
                    {inputValue}
                  </div>
                )}

                {/* Large microphone button */}
                <button
                  className="btn btn-primary btn-large"
                  onClick={handleVoiceStart}
                  style={{
                    minWidth: '400px',
                    minHeight: '140px',
                    fontSize: '32px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px'
                  }}
                >
                  <span style={{ fontSize: '64px' }}>🎤</span>
                  <span>{inputValue ? t.reRecord : t.speakNow}</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          // Touch input for text fields (non-voice mode)
          <div style={{ width: '100%', maxWidth: '600px' }}>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={`Enter ${currentField.label}`}
              style={{
                width: '100%',
                fontSize: '32px',
                padding: '24px',
                borderRadius: '12px',
                border: '3px solid var(--border-gray)',
                textAlign: 'center',
                marginBottom: '30px'
              }}
            />
          </div>
        )}
      </div>

      <div className="action-bar">
        <button
          className="btn btn-secondary"
          onClick={handleBack}
          disabled={isListening}
        >
          ← {t.back}
        </button>

        {inputValue && !isListening && (
          <button
            className="btn btn-success btn-large"
            onClick={handleNext}
          >
            {currentFieldIndex < fields.length - 1 ? 'Next' : t.proceed} →
          </button>
        )}
      </div>
    </div>
  );
};

export default InputController;
