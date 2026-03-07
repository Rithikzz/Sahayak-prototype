/**
 * Centralized API client for Sahayak kiosk.
 *
 * All JSON request bodies are encrypted with ChaCha20-Poly1305 before sending.
 * All JSON responses are decrypted automatically.
 * FormData uploads (audio, PDFs) are sent as-is — multipart binary cannot be encrypted.
 *
 * Header X-Chacha-Encrypted: 1 signals the backend to decrypt the
 * request and encrypt the response.
 */
import { encrypt, decrypt } from './crypto.js';

const BASE_URL = '/api';

const getToken = () => localStorage.getItem('sahayak_token');

async function request(method, path, body = null, isFormData = false) {
  const headers = {};
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  let reqBody = null;

  if (isFormData && body !== null) {
    // FormData: browser sets Content-Type with boundary automatically
    reqBody = body;
  } else if (body !== null) {
    headers['Content-Type'] = 'application/json';
    headers['X-Chacha-Encrypted'] = '1';
    reqBody = JSON.stringify(encrypt(body));
  } else {
    // GET or bodyless request — signal we still want encrypted response
    headers['X-Chacha-Encrypted'] = '1';
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: reqBody,
  });

  if (!response.ok) {
    let detail = `HTTP ${response.status}`;
    try {
      const ct = response.headers.get('content-type') || '';
      if (ct.includes('application/json')) {
        const errData = await response.json();
        const decoded = errData.payload ? decrypt(errData) : errData;
        const raw = decoded.detail ?? decoded.message ?? decoded.error;
        if (Array.isArray(raw)) {
          detail = raw.map(e => e.msg || e.message || JSON.stringify(e)).join('; ');
        } else if (typeof raw === 'string') {
          detail = raw;
        }
      }
    } catch (_) {}
    throw new Error(detail);
  }

  const ct = response.headers.get('content-type') || '';
  if (ct.includes('application/json')) {
    const data = await response.json();
    return data.payload ? decrypt(data) : data;
  }

  // Return raw Response for blobs (PDFs, audio)
  return response;
}

const api = {
  get:    (path)            => request('GET',    path),
  post:   (path, body)      => request('POST',   path, body),
  put:    (path, body)      => request('PUT',    path, body),
  patch:  (path, body)      => request('PATCH',  path, body),
  delete: (path)            => request('DELETE', path),
  /** Upload FormData (audio, file) — no encryption, returns raw Response */
  upload: (path, formData)  => request('POST',   path, formData, true),
};

export default api;
