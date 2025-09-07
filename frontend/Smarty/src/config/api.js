// API Configuration
const API_CONFIG = {
  BASE_URL: 'http://localhost:5001',
  ENDPOINTS: {
    USERS: {
      REGISTER: '/api/users/register',
      LOGIN: '/api/users/login',
      PROFILE: '/api/users/profile',
      STATS: '/api/users/stats'
    },
    HEALTH: '/api/health'
  }
};

// Helper function to build full API URLs
export const buildApiUrl = (endpoint) => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

// Export the configuration
export default API_CONFIG;