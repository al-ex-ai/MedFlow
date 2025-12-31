// API Gateway Configuration
// In Docker mode with nginx, use relative paths so nginx can proxy
// In local dev mode, use the full localhost URL
const isDocker = import.meta.env.VITE_DOCKER === 'true';
const defaultGatewayUrl = isDocker ? '/api' : 'http://localhost:5000/api';

export const API_CONFIG = {
  GATEWAY_URL: import.meta.env.VITE_API_GATEWAY_URL || defaultGatewayUrl,
  ENV: import.meta.env.VITE_ENV || 'development',
};

// All API calls now go through the API Gateway
export const API_ENDPOINTS = {
  PATIENTS: `${API_CONFIG.GATEWAY_URL}/patients`,
  APPOINTMENTS: `${API_CONFIG.GATEWAY_URL}/appointments`,
  INVOICES: `${API_CONFIG.GATEWAY_URL}/invoices`,
  NOTIFICATIONS: `${API_CONFIG.GATEWAY_URL}/notifications`,
};
