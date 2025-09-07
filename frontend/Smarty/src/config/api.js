// API Configuration
const API_BASE_URL = 'http://localhost:5001';

/**
 * Build API URL with the base URL
 * @param {string} endpoint - The API endpoint
 * @returns {string} - Complete API URL
 */
export const buildApiUrl = (endpoint) => {
  // Remove leading slash if present to avoid double slashes
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  return `${API_BASE_URL}/${cleanEndpoint}`;
};

/**
 * API endpoints
 */
export const API_ENDPOINTS = {
  // User authentication
  USER_REGISTER: '/api/users/register',
  USER_LOGIN: '/api/users/login',
  USER_PROFILE: '/api/users/profile',
  
  // Admin endpoints
  ADMIN_STATS: '/api/admin/stats',
  ADMIN_USERS: '/api/admin/users'
};

export default {
  buildApiUrl,
  API_ENDPOINTS,
  API_BASE_URL
};