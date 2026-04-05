// Firebase Analytics and Crash Reporting
// Initialize with your Firebase project config

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAnalytics, logEvent, setUserProperties, setUserId } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || '',
};

let analytics: ReturnType<typeof getAnalytics> | null = null;
let appInitialized = false;

export function initAnalytics() {
  if (appInitialized) return;
  
  try {
    const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
    if (typeof window !== 'undefined') {
      analytics = getAnalytics(app);
    }
    appInitialized = true;
  } catch {
    // Silently skip analytics if Firebase is not configured
  }
}

export function trackEvent(eventName: string, params?: Record<string, unknown>) {
  if (!analytics) return;
  logEvent(analytics, eventName, params);
}

export function trackTournamentCreated(format: string, playerCount: number) {
  trackEvent('tournament_created', {
    format,
    player_count: playerCount,
    timestamp: new Date().toISOString(),
  });
}

export function trackMatchScored(tournamentId: string, matchId: string) {
  trackEvent('match_scored', {
    tournament_id: tournamentId,
    match_id: matchId,
  });
}

// Security: Only set non-PII user properties in analytics
export function setUser(id: string) {
  if (!analytics) return;
  setUserId(analytics, id);
  // Do NOT send email or name to analytics - GDPR/privacy risk
}

// Security: Never include stack traces or internal error details in analytics
export function reportError(error: Error, context?: Record<string, unknown>) {
  trackEvent('error_occurred', {
    error_name: error.name,
    // Only include sanitized error message - no stack traces
    error_message: error.message.substring(0, 200),
    timestamp: new Date().toISOString(),
    ...(context || {}),
  });
}

export default { initAnalytics, trackEvent, trackTournamentCreated, trackMatchScored, setUser, reportError };
