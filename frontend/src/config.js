// Centralized API base URL configuration
// Priority:
// 1) REACT_APP_BACKEND_URL (domain or full URL)
// 2) REACT_APP_API_BASE_URL (full base URL including /api)
// 3) Runtime window.location.origin + /api (useful if served behind same domain proxy)
// 4) Fallback to localhost

const rawBackend = process.env.REACT_APP_BACKEND_URL || '';
const normalizedBackend = rawBackend
  ? (rawBackend.startsWith('http') ? rawBackend : `https://${rawBackend}`)
  : '';

const runtimeOrigin = (typeof window !== 'undefined' && window.location && window.location.origin)
  ? window.location.origin
  : '';
const runtimeHost = (typeof window !== 'undefined' && window.location && window.location.hostname)
  ? window.location.hostname
  : '';

// Map known frontend hosts to their backend API hosts
const hostToBackendDomain = {
  'rbgonzales.up.railway.app': 'https://rbgonzalez-backend-production.up.railway.app',
};
const mappedBackend = runtimeHost && hostToBackendDomain[runtimeHost]
  ? `${hostToBackendDomain[runtimeHost].replace(/\/$/, '')}/api`
  : '';

const dynamicFallback = runtimeOrigin ? `${runtimeOrigin.replace(/\/$/, '')}/api` : '';


export const API_BASE_URL = normalizedBackend
  ? `${normalizedBackend.replace(/\/$/, '')}/api`
      : (mappedBackend
      || process.env.REACT_APP_API_BASE_URL
      || dynamicFallback
      || 'http://localhost:5000/api');

export const apiUrl = (path) => `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;

// Password required to delete cart items at POS
export const DELETE_PASSWORD = process.env.REACT_APP_DELETE_PASSWORD || '1234';

if (typeof window !== 'undefined') {
  // Helps verify which base URL is in use at runtime
  // eslint-disable-next-line no-console
  console.info('[Config] API_BASE_URL =', API_BASE_URL);
}