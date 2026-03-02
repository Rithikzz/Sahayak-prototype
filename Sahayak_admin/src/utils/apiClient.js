/**
 * API Client for Sahayak Admin Portal
 * Wraps fetch with automatic JWT token injection, error handling, and 401 redirect.
 */

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

  if (!isFormData && body !== null) {
    headers['Content-Type'] = 'application/json';
  }

  const opts = {
    method,
    headers,
  };

  if (body !== null) {
    opts.body = isFormData ? body : JSON.stringify(body);
  }

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
      errorDetail = errBody.detail || errBody.message || errorDetail;
    } catch (_) {}
    throw new Error(errorDetail);
  }

  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return response.json();
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
