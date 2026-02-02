/**
 * Fernhill Community - Version Configuration
 * 
 * This file contains version info that can be displayed in the app
 * and used for cache busting, API versioning, etc.
 */

export const APP_VERSION = {
  version: '1.11.0',
  codename: 'Gestural Flow',
  releaseDate: '2026-01-31',
  buildTime: new Date().toISOString(),
} as const

export const APP_INFO = {
  name: 'Fernhill Community',
  shortName: 'Fernhill',
  description: "Portland's Sunday Ecstatic Dance Community",
  author: 'Structure for Growth',
  repository: 'https://github.com/structureforgrowth/fernhill-community',
} as const

// Feature flags for gradual rollout
export const FEATURES = {
  pushNotifications: true,
  accessibility: true,
  offlineMode: true,
  darkMode: true, // Always dark for this app
  analytics: true, // GoatCounter
  boundaryReports: true,
  contentModeration: true,
  musicSets: true,
  altar: true,
  boards: true,
} as const

// Environment detection
export const ENV = {
  isDev: process.env.NODE_ENV === 'development',
  isProd: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test',
} as const
