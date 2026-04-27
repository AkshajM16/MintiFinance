// App Configuration
export const APP_CONFIG = {
  name: 'Minti',
  description: 'AI-first budgeting with calendar intelligence',
  version: '1.0.0',
  author: 'Minti Team',
} as const;

// API Configuration
export const API_CONFIG = {
  baseUrl: import.meta.env.VITE_API_URL || '',
  timeout: 10000,
  retries: 3,
} as const;

// Google OAuth Configuration
export const GOOGLE_CONFIG = {
  clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '',
  redirectUri: typeof window !== 'undefined' ? `${window.location.origin}/google-callback` : '/google-callback',
  scope: 'https://www.googleapis.com/auth/calendar.readonly openid email profile',
} as const;

// Event Categories
export const EVENT_CATEGORIES = {
  DINING_SOCIAL: 'Dining & Social',
  TRAVEL_TRANSPORT: 'Travel & Transportation',
  SHOPPING_RETAIL: 'Shopping & Retail',
  ENTERTAINMENT_RECREATION: 'Entertainment & Recreation',
  HEALTH_MEDICAL: 'Health & Medical',
  EDUCATION_TRAINING: 'Education & Training',
  COLLEGE_CLASSES: 'College Classes',
  WORK_BUSINESS: 'Work & Business',
  PERSONAL_SOCIAL: 'Personal & Social',
  OTHER: 'Other',
} as const;

// Transaction Types
export const TRANSACTION_TYPES = {
  EXPENSE: 'EXPENSE',
  INCOME: 'INCOME',
} as const;

// Budget Periods
export const BUDGET_PERIODS = {
  DAILY: 'DAILY',
  WEEKLY: 'WEEKLY',
  MONTHLY: 'MONTHLY',
  YEARLY: 'YEARLY',
} as const;

// Category Colors
export const CATEGORY_COLORS = {
  [EVENT_CATEGORIES.DINING_SOCIAL]: 'bg-orange-500/20 text-orange-400 border-orange-500/20',
  [EVENT_CATEGORIES.TRAVEL_TRANSPORT]: 'bg-blue-500/20 text-blue-400 border-blue-500/20',
  [EVENT_CATEGORIES.SHOPPING_RETAIL]: 'bg-purple-500/20 text-purple-400 border-purple-500/20',
  [EVENT_CATEGORIES.ENTERTAINMENT_RECREATION]: 'bg-pink-500/20 text-pink-400 border-pink-500/20',
  [EVENT_CATEGORIES.HEALTH_MEDICAL]: 'bg-blue-500/20 text-blue-400 border-blue-500/20',
  [EVENT_CATEGORIES.EDUCATION_TRAINING]: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/20',
  [EVENT_CATEGORIES.COLLEGE_CLASSES]: 'bg-lime-500/20 text-lime-400 border-lime-500/20',
  [EVENT_CATEGORIES.WORK_BUSINESS]: 'bg-gray-500/20 text-gray-400 border-gray-500/20',
  [EVENT_CATEGORIES.PERSONAL_SOCIAL]: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/20',
  [EVENT_CATEGORIES.OTHER]: 'bg-slate-500/20 text-slate-400 border-slate-500/20',
} as const;

// Transaction Category Colors
export const TRANSACTION_CATEGORY_COLORS = {
  'Food & Dining': 'bg-orange-500/20 text-orange-400',
  'Transportation': 'bg-blue-500/20 text-blue-400',
  'Shopping': 'bg-purple-500/20 text-purple-400',
  'Entertainment': 'bg-pink-500/20 text-pink-400',
  'Health & Fitness': 'bg-blue-500/20 text-blue-400',
  'Travel': 'bg-yellow-500/20 text-yellow-400',
  'Education': 'bg-indigo-500/20 text-indigo-400',
  'Bills & Utilities': 'bg-red-500/20 text-red-400',
  'Income': 'bg-emerald-500/20 text-emerald-400',
  'Other': 'bg-gray-500/20 text-gray-400',
} as const;

// Local Storage Keys
export const STORAGE_KEYS = {
  MINTI_AUTH_TOKEN: 'minti_auth_token',
  MINTI_USER: 'minti_user',
  GOOGLE_ACCESS_TOKEN: 'google_access_token',
  USER_PREFERENCES: 'user_preferences',
  THEME: 'theme',
} as const;

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
} as const;

// Date Formats
export const DATE_FORMATS = {
  DISPLAY: 'MMM dd, yyyy',
  INPUT: 'yyyy-MM-dd',
  TIME: 'HH:mm',
  DATETIME: 'MMM dd, yyyy HH:mm',
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  NOT_FOUND: 'The requested resource was not found.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  SERVER_ERROR: 'Server error. Please try again later.',
  GOOGLE_AUTH_ERROR: 'Google authentication failed. Please try again.',
  CALENDAR_SYNC_ERROR: 'Failed to sync calendar. Please try again.',
  TRANSACTION_ERROR: 'Failed to process transaction. Please try again.',
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  TRANSACTION_ADDED: 'Transaction added successfully!',
  TRANSACTION_UPDATED: 'Transaction updated successfully!',
  TRANSACTION_DELETED: 'Transaction deleted successfully!',
  CALENDAR_SYNCED: 'Calendar synced successfully!',
  SETTINGS_SAVED: 'Settings saved successfully!',
} as const;

// Animation Durations
export const ANIMATION = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500,
} as const;

// Breakpoints
export const BREAKPOINTS = {
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280,
  '2XL': 1536,
} as const; 