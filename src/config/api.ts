// API Configuration
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002',
  ENDPOINTS: {
    COMMUNAL_OBJECTIVES: '/communal-objectives',
    GIFT_TRIGGERS: '/gift-triggers',
    TIKTOK_LIVE_STATUS: '/tiktok-live-status',
    PURCHASE_CONSONANT: '/purchase-consonant',
    PURCHASE_HINT: '/purchase-hint',
    ADMIN_ADD_CORONAS: '/admin/add-coronas',
    DAILY_RANKING: '/daily-ranking',
    WEEKLY_RANKING: '/weekly-ranking',
    TIKTOK_CONNECT: '/tiktok/connect',
    TIKTOK_DISCONNECT: '/tiktok/disconnect',
    SET_WINNER: '/set-winner'
  }
};

// Helper function to build full URLs
export const buildApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

// Helper function for common fetch operations
export const apiRequest = async (endpoint: string, options: RequestInit = {}): Promise<Response> => {
  const url = buildApiUrl(endpoint);

  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  return fetch(url, defaultOptions);
};