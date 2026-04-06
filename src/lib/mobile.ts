import { StatusBar } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { PushNotifications } from '@capacitor/push-notifications';
import { Preferences } from '@capacitor/preferences';
import { Keyboard } from '@capacitor/keyboard';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

// Push notification setup
export async function initPushNotifications(
  onNotification?: (data: any) => void,
  onRegistration?: (token: string) => void,
  onError?: (error: Error) => void
) {
  if (!Capacitor.isNativePlatform()) return;

  // Request permission
  const result = await PushNotifications.requestPermissions();

  if (result.receive === 'granted') {
    await PushNotifications.register();
  }

  PushNotifications.addListener('registration', (token) => {
    onRegistration?.(token.value);
  });

  PushNotifications.addListener('pushNotificationReceived', (notification) => {
    onNotification?.(notification);
  });

  PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
    onNotification?.(action.notification);
  });

  PushNotifications.addListener('registrationError', (error) => {
    onError?.(new Error(error.error || 'Push registration failed'));
  });
}

// Status bar configuration
export async function initStatusBar() {
  if (!Capacitor.isNativePlatform()) return;

  await StatusBar.setBackgroundColor({ color: '#000000' });
  await StatusBar.setStyle({ style: 'DARK' });
}

// Keyboard configuration
export async function initKeyboard() {
  if (!Capacitor.isNativePlatform()) return;

  Keyboard.setResizeMode({ mode: 'ionic' });
  Keyboard.addListener('keyboardDidShow', (info) => {
    // Handle keyboard show for form inputs
  });
  Keyboard.addListener('keyboardDidHide', () => {
    // Handle keyboard hide
  });
}

// App lifecycle
export function initAppLifecycle(
  onAppOpen?: () => void,
  onAppClose?: () => void
) {
  if (!Capacitor.isNativePlatform()) return;

  App.addListener('appStateChange', ({ isActive }) => {
    if (isActive) {
      onAppOpen?.();
    } else {
      onAppClose?.();
    }
  });
}

// Local preferences for offline cache
export async function setPreference(key: string, value: string) {
  return Preferences.set({ key, value });
}

export async function getPreference(key: string) {
  const { value } = await Preferences.get({ key });
  return value;
}

// Deep linking
export function setupDeeplinks(onDeepLink: (url: string) => void) {
  if (!Capacitor.isNativePlatform()) return;

  App.addListener('appUrlOpen', ({ url }) => {
    onDeepLink(url);
  });
}

export default function initMobile() {
  initStatusBar();
  initKeyboard();
  initAppLifecycle();
}
