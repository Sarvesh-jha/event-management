const browserHost =
  typeof window === 'undefined' ? 'localhost' : window.location.hostname || 'localhost';
const apiPort =
  typeof window !== 'undefined' && window.location.port === '4200' ? '5001' : '5000';

export const APP_NAME = 'Smart Campus Events';
export const API_BASE_URL = `http://${browserHost}:${apiPort}/api/v1`;
