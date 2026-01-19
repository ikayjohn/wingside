/**
 * Site-wide constants
 * Values that are used throughout the application
 */

// Site Information
export const SITE_NAME = 'Wingside';
export const SITE_TAGLINE = 'Where Flavor Takes Flight';
export const SITE_DESCRIPTION = 'Experience 20 bold wing flavors across 6 categories at Wingside. Your wings, your way.';

// URLs
export const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.wingside.ng';

// SEO
export const SEO_TITLE = 'Wingside - Best Chicken Wings in Port Harcourt';
export const SEO_DESCRIPTION = 'Order delicious chicken wings online. 20 bold flavors across 6 categories. Fast delivery in Port Harcourt, Nigeria.';
export const SEO_KEYWORDS = 'chicken wings, Port Harcourt, delivery, restaurant, food ordering, wings';

// Social Media - Default values (can be overridden by database settings)
export const SOCIAL_URLS = {
  facebook: process.env.NEXT_PUBLIC_SOCIAL_FACEBOOK || 'https://facebook.com/mywingside',
  instagram: process.env.NEXT_PUBLIC_SOCIAL_INSTAGRAM || 'https://instagram.com/mywingside',
  twitter: process.env.NEXT_PUBLIC_SOCIAL_TWITTER || 'https://x.com/mywingside',
  linkedin: process.env.NEXT_PUBLIC_SOCIAL_LINKEDIN || 'https://www.linkedin.com/company/wingside',
  youtube: process.env.NEXT_PUBLIC_SOCIAL_YOUTUBE || 'https://www.youtube.com/@mywingside',
  tiktok: process.env.NEXT_PUBLIC_SOCIAL_TIKTOK || 'https://www.tiktok.com/@mywingside',
} as const;

// Contact
export const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'reachus@wingside.ng';
export const CONTACT_PHONE = process.env.NEXT_PUBLIC_CONTACT_PHONE || '+234-809-019-1999';
export const SUPPORT_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'reachus@wingside.ng';

// Business Info
export const BUSINESS_NAME = 'Wingside';
export const BUSINESS_ADDRESS = {
  line1: '24 King Perekule Street, GRA',
  line2: '',
  city: 'Port Harcourt',
  state: 'Rivers State',
  country: 'Nigeria',
} as const;

// Currency
export const CURRENCY = '₦';
export const CURRENCY_CODE = 'NGN';

// Order Settings
export const MIN_ORDER_AMOUNT = 2000; // ₦2,000
export const FREE_DELIVERY_THRESHOLD = 10000; // ₦10,000
export const DELIVERY_RADIUS = 10; // km

// Time Settings
export const ESTIMATED_DELIVERY_TIME = 30; // minutes
export const ORDER_PREPARATION_TIME = 15; // minutes

// Pagination
export const ITEMS_PER_PAGE = 12;
export const MAX_ITEMS_PER_PAGE = 100;

// Session
export const SESSION_TIMEOUT = 60 * 60 * 24 * 7; // 1 week in seconds

// File Upload Limits
export const MAX_AVATAR_SIZE = 5 * 1024 * 1024; // 5MB
export const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB

// Allowed File Types
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
export const ALLOWED_DOCUMENT_TYPES = ['application/pdf'];

// Referral Settings
export const REFERRAL_REWARD_AMOUNT = 500; // ₦500
export const REFERRAL_MIN_ORDER_AMOUNT = 1000; // ₦1,000

// Points System
export const POINTS_PER_NAIRA = 1; // 1 point per ₦1
export const MINIMUM_REDEEM_POINTS = 1000; // Minimum points to redeem

// Loyalty Tiers
export const LOYALTY_TIERS = {
  BRONZE: { name: 'Bronze', minPoints: 0, multiplier: 1 },
  SILVER: { name: 'Silver', minPoints: 5000, multiplier: 1.05 },
  GOLD: { name: 'Gold', minPoints: 15000, multiplier: 1.1 },
  PLATINUM: { name: 'Platinum', minPoints: 30000, multiplier: 1.15 },
} as const;

// API Endpoints
export const API_ENDPOINTS = {
  SETTINGS: '/api/settings',
  CONTACT: '/api/contact',
  NEWSLETTER: '/api/newsletter/signup',
  PROMO_CODES: '/api/promo-codes/validate',
} as const;

// Routes
export const ROUTES = {
  HOME: '/',
  MENU: '/order',
  CHECKOUT: '/checkout',
  MY_ACCOUNT: '/my-account',
  ADMIN: '/admin',
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  SERVER_ERROR: 'Server error. Please try again later.',
  UNAUTHORIZED: 'You need to log in to continue.',
  FORBIDDEN: 'You don\'t have permission to do this.',
  NOT_FOUND: 'The requested resource was not found.',
  VALIDATION_ERROR: 'Please check your input and try again.',
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  ORDER_CONFIRMED: 'Your order has been confirmed!',
  PROFILE_UPDATED: 'Your profile has been updated.',
  PASSWORD_CHANGED: 'Your password has been changed.',
  LOGGED_OUT: 'You have been logged out.',
} as const;
