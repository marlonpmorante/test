// Centralized API base URL configuration
// Priority: REACT_APP_BACKEND_URL (domain or full URL) -> REACT_APP_API_BASE_URL -> default localhost

const rawBackend = process.env.REACT_APP_BACKEND_URL || '';
const normalizedBackend = rawBackend
  ? (rawBackend.startsWith('http') ? rawBackend : `https://${rawBackend}`)
  : '';

export const API_BASE_URL = normalizedBackend
  ? `${normalizedBackend.replace(/\/$/, '')}/api`
  : (process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api');

export const apiUrl = (path) => `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
