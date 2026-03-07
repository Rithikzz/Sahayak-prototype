/**
 * API Client for Sahayak Admin Portal
 * Wraps fetch with automatic JWT token injection, ChaCha20-Poly1305
 * request/response encryption, error handling, and 401 redirect.
 */
import { encrypt, decrypt } from './crypto.js';

const BASE_URL = '/api';
const TOKEN_KEY = 'sahayak_admin_token';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token) => localStorage.setItem(TOKEN_KEY, token);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

async function request(method, path, body = null, isFormData = false) {
  const token = getToken();
  const headers = {};

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let reqBody = null;
  if (isFormData && body !== null) {
    reqBody = body;
  } else if (body !== null) {
    headers['Content-Type'] = 'application/json';
    headers['X-Chacha-Encrypted'] = '1';
    reqBody = JSON.stringify(encrypt(body));
  } else {
    headers['X-Chacha-Encrypted'] = '1';
  }

  const opts = { method, headers };
  if (reqBody !== null) opts.body = reqBody;

  const response = await fetch(`${BASE_URL}${path}`, opts);

  if (response.status === 401) {
    // Don't redirect if this IS the login request (avoids wiping error state)
    if (!path.includes('auth/login')) {
      clearToken();
      localStorage.removeItem('sahayak_user');
      window.location.href = '/login';
      return null;
    }
    // Fall through so the caller can handle the 401 (e.g. show error message)
  }

  if (!response.ok) {
    let errorDetail = `HTTP ${response.status}`;
    try {
      const errBody = await response.json();
      const decoded = errBody.payload ? decrypt(errBody) : errBody;
      const raw = decoded.detail ?? decoded.message ?? decoded.error;
      if (Array.isArray(raw)) {
        // FastAPI / Pydantic validation errors: [{loc, msg, type}, ...]
        errorDetail = raw
          .map(e => {
            if (e && typeof e.msg === 'string') return e.msg;
            if (e && typeof e.message === 'string') return e.message;
            try { return JSON.stringify(e); } catch (_) { return String(e); }
          })
          .join('; ');
      } else if (typeof raw === 'string') {
        errorDetail = raw;
      } else if (raw !== null && raw !== undefined) {
        try { errorDetail = JSON.stringify(raw); } catch (_) { errorDetail = String(raw); }
      }
    } catch (_) {}
    throw new Error(errorDetail);
  }

  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    const data = await response.json();
    return data.payload ? decrypt(data) : data;
  }
  return response.text();
}

const api = {
  get: (path) => request('GET', path),
  post: (path, body) => request('POST', path, body),
  put: (path, body) => request('PUT', path, body),
  patch: (path, body) => request('PATCH', path, body),
  delete: (path) => request('DELETE', path),
  upload: (path, formData) => request('POST', path, formData, true),
};

export default api;
