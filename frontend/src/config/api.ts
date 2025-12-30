// API Gateway Configuration
export const API_CONFIG = {
  GATEWAY_URL: import.meta.env.VITE_API_GATEWAY_URL || 'http://localhost:5000/api',
  ENV: import.meta.env.VITE_ENV || 'development',
};

// All API calls now go through the API Gateway
export const API_ENDPOINTS = {
  PATIENTS: `${API_CONFIG.GATEWAY_URL}/patients`,
  APPOINTMENTS: `${API_CONFIG.GATEWAY_URL}/appointments`,
  INVOICES: `${API_CONFIG.GATEWAY_URL}/invoices`,
  NOTIFICATIONS: `${API_CONFIG.GATEWAY_URL}/notifications`,
};
