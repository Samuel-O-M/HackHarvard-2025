// Application constants
export const APP_NAME = 'EchoMine — A voice-driven, screenless language mining app.';
export const APP_VERSION = '1.0.0';

export const API_ENDPOINTS = {
  USERS: '/api/users',
  REVIEWS: '/api/reviews',
  AUTH: '/api/auth',
} as const;

export const COLORS = {
  primary: '#3B82F6',
  secondary: '#6B7280',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#06B6D4',
} as const;

export const BREAKPOINTS = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

export const ROUTES = {
  HOME: '/',
  ABOUT: '/about',
  CONTACT: '/contact',
  DASHBOARD: '/dashboard',
} as const;